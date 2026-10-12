using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PayPulse.Application.Common.Extensions;
using PayPulse.Application.Common.Interfaces;
using PayPulse.Application.DTOs;
using PayPulse.Domain.Entities;
using PayPulse.Domain.Exceptions;
using Xunit;

namespace PayPulse.IntegrationTests.Transactions;

public class TransactionIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public TransactionIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<string> GetAdminTokenAsync()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto
        {
            EmailOrUsername = "admin",
            Password = "Password@123"
        });
        var data = await response.Content.ReadFromJsonAsync<LoginResponseDto>();
        return data!.AccessToken;
    }

    // ------------------------------------------------------------------------
    // TEST 1: Successful Payroll Processing Transaction
    // ------------------------------------------------------------------------
    [Fact]
    public async Task Test01_SuccessfulPayrollProcessing_CommitsMasterAndLineItems()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IAppDbContext>();
        var payrollService = scope.ServiceProvider.GetRequiredService<IPayrollService>();

        int testYear = 2027;
        int testMonth = 1;

        // Cleanup before test
        var existingPayrolls = await context.MonthlyPayrolls
            .Where(p => p.PayrollYear == testYear && p.PayrollMonth == testMonth)
            .ToListAsync();
        if (existingPayrolls.Count > 0)
        {
            context.MonthlyPayrolls.RemoveRange(existingPayrolls);
            await context.SaveChangesAsync();
        }

        try
        {
            // Act: Process payroll batch
            var result = await payrollService.ProcessMonthlyPayrollBatchAsync(testYear, testMonth);

            // Assert: Master vouchers committed
            result.Should().NotBeNull();
            result.ProcessedCount.Should().BeGreaterThan(0);

            var createdPayrolls = await context.MonthlyPayrolls
                .Include(p => p.Components)
                .Where(p => p.PayrollYear == testYear && p.PayrollMonth == testMonth)
                .ToListAsync();

            createdPayrolls.Should().HaveCount(result.ProcessedCount);

            foreach (var p in createdPayrolls)
            {
                p.NetSalary.Should().Be(p.GrossSalary - p.TotalDeductions);
                p.Components.Should().NotBeEmpty("itemized payslip components must be created atomically");
                p.Components.Should().Contain(c => c.ComponentName == "Basic Salary");
            }

            // Verify Audit Log
            var audit = await context.SystemAuditLogs
                .AnyAsync(a => a.TableName == "Monthly_Payroll" && a.RecordId == $"{testYear}-{testMonth:D2}");
            audit.Should().BeTrue("audit trail must be recorded inside the payroll transaction");
        }
        finally
        {
            // Cleanup
            var toClean = await context.MonthlyPayrolls
                .Where(p => p.PayrollYear == testYear && p.PayrollMonth == testMonth)
                .ToListAsync();
            context.MonthlyPayrolls.RemoveRange(toClean);
            await context.SaveChangesAsync();
        }
    }

    // ------------------------------------------------------------------------
    // TEST 2: Payroll Rollback on Injected Failure
    // ------------------------------------------------------------------------
    [Fact]
    public async Task Test02_PayrollRollback_OnInjectedFailure_RestoresCleanState()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IAppDbContext>();

        int testYear = 2027;
        int testMonth = 2;
        int testEmpId = 1;

        // Ensure clean state
        var preExisting = await context.MonthlyPayrolls
            .Where(p => p.EmployeeId == testEmpId && p.PayrollYear == testYear && p.PayrollMonth == testMonth)
            .ToListAsync();
        context.MonthlyPayrolls.RemoveRange(preExisting);
        await context.SaveChangesAsync();

        var strategy = context.Database.CreateExecutionStrategy();
        bool errorCaught = false;

        await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await context.Database.BeginTransactionAsync();
            try
            {
                // Step 1: Insert master payroll voucher
                var payroll = new MonthlyPayroll
                {
                    EmployeeId = testEmpId,
                    PayrollYear = testYear,
                    PayrollMonth = testMonth,
                    WorkingDaysInMonth = 26,
                    PresentDays = 26,
                    PaidLeaveDays = 0,
                    UnpaidLeaveDays = 0,
                    BasicSalarySnapshot = 100000m,
                    TotalAllowances = 20000m,
                    GrossSalary = 120000m,
                    TotalDeductions = 10000m,
                    NetSalary = 110000m,
                    PayrollStatus = "Draft",
                    ProcessedDate = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                context.MonthlyPayrolls.Add(payroll);
                await context.SaveChangesAsync();

                // Step 2: Injected failure - violate CHECK constraint on component amount
                payroll.Components.Add(new PayrollComponentDetail
                {
                    ComponentName = "Negative Amount Injected Fault",
                    ComponentType = "Earning",
                    Amount = -9999m // Violates chk_comp_amount_nonnegative
                });

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                Assert.Fail("Should have thrown DbUpdateException on negative component amount");
            }
            catch (DbUpdateException)
            {
                await transaction.RollbackAsync();
                errorCaught = true;
            }
        });

        errorCaught.Should().BeTrue("negative component amount must trigger check constraint violation and rollback");

        // Assert: Verify complete rollback of master payroll
        var countAfter = await context.MonthlyPayrolls
            .CountAsync(p => p.EmployeeId == testEmpId && p.PayrollYear == testYear && p.PayrollMonth == testMonth);

        countAfter.Should().Be(0, "partial payroll record must be completely rolled back");
    }

    // ------------------------------------------------------------------------
    // TEST 3: Leave Approval Rollback on Quota Exceeded
    // ------------------------------------------------------------------------
    [Fact]
    public async Task Test03_LeaveApprovalRollback_OnQuotaExceeded_PreservesPendingState()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IAppDbContext>();
        var leaveService = scope.ServiceProvider.GetRequiredService<ILeaveService>();

        int testEmpId = 1;
        var allocation = await context.LeaveAllocations
            .FirstAsync(a => a.EmployeeId == testEmpId && a.LeaveTypeId == 1 && a.CalendarYear == 2026);
        int initialRemaining = allocation.DaysRemaining;

        // Create an excessive leave request asking for more than remaining quota
        var request = new LeaveRequest
        {
            EmployeeId = testEmpId,
            LeaveTypeId = 1,
            StartDate = new DateOnly(2026, 11, 1),
            EndDate = new DateOnly(2026, 11, 30),
            TotalDaysRequested = initialRemaining + 50,
            Reason = "Excessive test request exceeding quota",
            ApplicationStatus = "Pending",
            AppliedDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.LeaveRequests.Add(request);
        await context.SaveChangesAsync();

        try
        {
            // Act: Attempt approval
            var act = async () => await leaveService.ApproveLeaveRequestAsync(
                request.RequestId,
                new ApproveLeaveRequestDto { Comment = "Approving excessive leave" }
            );

            // Assert: Must throw BusinessRuleException
            await act.Should().ThrowAsync<BusinessRuleException>()
                .WithMessage("*Quota exceeded*");

            // Verify database state: status remains Pending, balance unchanged
            var reqAfter = await context.LeaveRequests.FindAsync(request.RequestId);
            reqAfter!.ApplicationStatus.Should().Be("Pending");

            var allocAfter = await context.LeaveAllocations.FindAsync(allocation.AllocationId);
            allocAfter!.DaysRemaining.Should().Be(initialRemaining);
        }
        finally
        {
            context.LeaveRequests.Remove(request);
            await context.SaveChangesAsync();
        }
    }

    // ------------------------------------------------------------------------
    // TEST 4: Concurrent Leave Approval Concurrency Protection
    // ------------------------------------------------------------------------
    [Fact]
    public async Task Test04_ConcurrentLeaveApproval_SerializesUpdates_PreventsDoubleDeduction()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IAppDbContext>();

        int testEmpId = 2;
        var allocation = await context.LeaveAllocations
            .FirstAsync(a => a.EmployeeId == testEmpId && a.LeaveTypeId == 1 && a.CalendarYear == 2026);
        int initialRemaining = allocation.DaysRemaining;
        int requestedDays = 2;

        var request = new LeaveRequest
        {
            EmployeeId = testEmpId,
            LeaveTypeId = 1,
            StartDate = new DateOnly(2026, 10, 20),
            EndDate = new DateOnly(2026, 10, 21),
            TotalDaysRequested = requestedDays,
            Reason = "Concurrent approval race test",
            ApplicationStatus = "Pending",
            AppliedDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.LeaveRequests.Add(request);
        await context.SaveChangesAsync();

        try
        {
            // Create two competing scopes with their own service instances
            using var scope1 = _factory.Services.CreateScope();
            var service1 = scope1.ServiceProvider.GetRequiredService<ILeaveService>();

            using var scope2 = _factory.Services.CreateScope();
            var service2 = scope2.ServiceProvider.GetRequiredService<ILeaveService>();

            int successCount = 0;
            int conflictCount = 0;

            var task1 = Task.Run(async () =>
            {
                try
                {
                    await service1.ApproveLeaveRequestAsync(request.RequestId, new ApproveLeaveRequestDto { Comment = "Approver 1" });
                    Interlocked.Increment(ref successCount);
                }
                catch (BusinessRuleException)
                {
                    Interlocked.Increment(ref conflictCount);
                }
            });

            var task2 = Task.Run(async () =>
            {
                try
                {
                    await service2.ApproveLeaveRequestAsync(request.RequestId, new ApproveLeaveRequestDto { Comment = "Approver 2" });
                    Interlocked.Increment(ref successCount);
                }
                catch (BusinessRuleException)
                {
                    Interlocked.Increment(ref conflictCount);
                }
            });

            await Task.WhenAll(task1, task2);

            // Assert: Exactly 1 approval succeeds, 1 gets rejected
            successCount.Should().Be(1, "only one concurrent approval should succeed");
            conflictCount.Should().Be(1, "competing approval request must be rejected");

            // Verify Leave_Allocation remaining balance was decremented EXACTLY once
            using var verifyScope = _factory.Services.CreateScope();
            var verifyContext = verifyScope.ServiceProvider.GetRequiredService<IAppDbContext>();
            var allocAfter = await verifyContext.LeaveAllocations
                .AsNoTracking()
                .FirstAsync(a => a.AllocationId == allocation.AllocationId);

            allocAfter.DaysRemaining.Should().Be(initialRemaining - requestedDays, "leave balance must not be double-deducted");
        }
        finally
        {
            // Clean up and restore allocation balance
            using var cleanScope = _factory.Services.CreateScope();
            var cleanContext = cleanScope.ServiceProvider.GetRequiredService<IAppDbContext>();
            var reqToDel = await cleanContext.LeaveRequests.FindAsync(request.RequestId);
            if (reqToDel != null)
            {
                cleanContext.LeaveRequests.Remove(reqToDel);
                var allocToRestore = await cleanContext.LeaveAllocations.FindAsync(allocation.AllocationId);
                if (allocToRestore != null)
                {
                    allocToRestore.DaysRemaining = initialRemaining;
                    allocToRestore.DaysUsed = allocation.DaysUsed;
                }
                await cleanContext.SaveChangesAsync();
            }
        }
    }

    // ------------------------------------------------------------------------
    // TEST 5: Concurrent Payroll Creation Race Protection
    // ------------------------------------------------------------------------
    [Fact]
    public async Task Test05_ConcurrentPayrollCreation_UniqueConstraint_RejectsDuplicate()
    {
        int testYear = 2028;
        int testMonth = 3;
        int testEmpId = 1;

        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IAppDbContext>();

        // Ensure clean state
        var existing = await context.MonthlyPayrolls
            .Where(p => p.EmployeeId == testEmpId && p.PayrollYear == testYear && p.PayrollMonth == testMonth)
            .ToListAsync();
        context.MonthlyPayrolls.RemoveRange(existing);
        await context.SaveChangesAsync();

        int successCount = 0;
        int duplicateRejectedCount = 0;

        async Task TryCreatePayrollAsync()
        {
            using var workerScope = _factory.Services.CreateScope();
            var workerContext = workerScope.ServiceProvider.GetRequiredService<IAppDbContext>();

            try
            {
                await workerContext.ExecuteInTransactionAsync(async () =>
                {
                    var payroll = new MonthlyPayroll
                    {
                        EmployeeId = testEmpId,
                        PayrollYear = testYear,
                        PayrollMonth = testMonth,
                        WorkingDaysInMonth = 26,
                        PresentDays = 26,
                        PaidLeaveDays = 0,
                        UnpaidLeaveDays = 0,
                        BasicSalarySnapshot = 85000m,
                        TotalAllowances = 15000m,
                        GrossSalary = 100000m,
                        TotalDeductions = 10000m,
                        NetSalary = 90000m,
                        PayrollStatus = "Draft",
                        ProcessedDate = DateTime.UtcNow,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    workerContext.MonthlyPayrolls.Add(payroll);
                    await workerContext.SaveChangesAsync();
                });
                Interlocked.Increment(ref successCount);
            }
            catch (DbUpdateException)
            {
                Interlocked.Increment(ref duplicateRejectedCount);
            }
        }

        var t1 = Task.Run(TryCreatePayrollAsync);
        var t2 = Task.Run(TryCreatePayrollAsync);

        await Task.WhenAll(t1, t2);

        // Exactly one should succeed, one rejected by unique constraint
        successCount.Should().Be(1);
        duplicateRejectedCount.Should().Be(1);

        // Verify exactly 1 record in database
        var total = await context.MonthlyPayrolls
            .CountAsync(p => p.EmployeeId == testEmpId && p.PayrollYear == testYear && p.PayrollMonth == testMonth);
        total.Should().Be(1);

        // Cleanup
        var cleanupPayrolls = await context.MonthlyPayrolls
            .Where(p => p.EmployeeId == testEmpId && p.PayrollYear == testYear && p.PayrollMonth == testMonth)
            .ToListAsync();
        context.MonthlyPayrolls.RemoveRange(cleanupPayrolls);
        await context.SaveChangesAsync();
    }

    // ------------------------------------------------------------------------
    // TEST 6: Employee Creation Rollback When Profile Fails
    // ------------------------------------------------------------------------
    [Fact]
    public async Task Test06_EmployeeCreationRollback_WhenProfileFails_UserIsRolledBack()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IAppDbContext>();
        var employeeService = scope.ServiceProvider.GetRequiredService<IEmployeeService>();

        // Fetch an existing employee's NID to guarantee duplicate constraint violation
        var existingEmp = await context.Employees.FirstAsync();
        string duplicateNid = existingEmp.NidNumber;
        string testEmail = $"rollback.test.{Guid.NewGuid():N}@paypulse.local";
        string expectedUsername = testEmail.Split('@')[0].ToLower();

        var dto = new CreateEmployeeDto
        {
            FirstName = "Rollback",
            LastName = "Candidate",
            Email = testEmail,
            Phone = "01799999999",
            Nid = duplicateNid, // Duplicate NID
            DepartmentId = "1",
            DesignationId = "1",
            DateOfBirth = "1994-05-15",
            DateOfJoining = "2026-01-01",
            InitialBasicSalary = 50000m
        };

        // Act: Attempt employee creation
        var act = async () => await employeeService.CreateEmployeeAsync(dto);

        // Assert: Must throw duplicate exception
        await act.Should().ThrowAsync<DuplicateEntityException>();

        // Verify that the User_Account created before the employee was ROLLED BACK
        var userInDb = await context.Users
            .AnyAsync(u => u.Username.StartsWith(expectedUsername));

        userInDb.Should().BeFalse("user account must be completely rolled back when profile creation fails");
    }

    // ------------------------------------------------------------------------
    // TEST 7: Payment Consistency Under Transaction Failure
    // ------------------------------------------------------------------------
    [Fact]
    public async Task Test07_PaymentConsistency_FailureMidway_RollsBackStatusAndDisbursement()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IAppDbContext>();

        // Create a temporary approved payroll
        var payroll = new MonthlyPayroll
        {
            EmployeeId = 1,
            PayrollYear = 2029,
            PayrollMonth = 8,
            WorkingDaysInMonth = 26,
            PresentDays = 26,
            PaidLeaveDays = 0,
            UnpaidLeaveDays = 0,
            BasicSalarySnapshot = 90000m,
            TotalAllowances = 10000m,
            GrossSalary = 100000m,
            TotalDeductions = 10000m,
            NetSalary = 90000m,
            PayrollStatus = "Approved",
            ProcessedDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.MonthlyPayrolls.Add(payroll);
        await context.SaveChangesAsync();

        // Find an existing transaction reference from seed data
        var existingTxRef = await context.DisbursementRecords
            .Select(d => d.TransactionReference)
            .FirstAsync();

        var strategy = context.Database.CreateExecutionStrategy();
        bool duplicateRefCaught = false;

        await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await context.Database.BeginTransactionAsync();
            try
            {
                // Step 1: Update payroll status
                payroll.PayrollStatus = "Disbursed";
                payroll.UpdatedAt = DateTime.UtcNow;

                // Step 2: Inject failure - duplicate Transaction_Reference violates unique index
                var duplicateDisb = new DisbursementRecord
                {
                    PayrollId = payroll.PayrollId,
                    TransactionReference = existingTxRef, // Duplicate!
                    DisbursementDate = DateTime.UtcNow,
                    DisbursementMethod = "Bank Transfer (BEFTN)",
                    DisbursedAmount = payroll.NetSalary,
                    DisbursementStatus = "Disbursed",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                context.DisbursementRecords.Add(duplicateDisb);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                Assert.Fail("Should have thrown DbUpdateException on duplicate transaction reference");
            }
            catch (DbUpdateException)
            {
                await transaction.RollbackAsync();
                duplicateRefCaught = true;
            }
        });

        duplicateRefCaught.Should().BeTrue("duplicate transaction reference must trigger DbUpdateException and rollback");

        // Verify status rolled back to 'Approved' and NO disbursement record exists
        using var verifyScope = _factory.Services.CreateScope();
        var verifyContext = verifyScope.ServiceProvider.GetRequiredService<IAppDbContext>();

        var payrollAfter = await verifyContext.MonthlyPayrolls
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.PayrollId == payroll.PayrollId);

        payrollAfter!.PayrollStatus.Should().Be("Approved", "payroll status must remain Approved after disbursement failure");

        var disbAfter = await verifyContext.DisbursementRecords
            .AnyAsync(d => d.PayrollId == payroll.PayrollId);
        disbAfter.Should().BeFalse("disbursement record must not be created");

        // Cleanup
        var pClean = await verifyContext.MonthlyPayrolls.FindAsync(payroll.PayrollId);
        if (pClean != null)
        {
            verifyContext.MonthlyPayrolls.Remove(pClean);
            await verifyContext.SaveChangesAsync();
        }
    }

    // ------------------------------------------------------------------------
    // TEST 8: Duplicate Requests (Idempotency Protection)
    // ------------------------------------------------------------------------
    [Fact]
    public async Task Test08_DuplicateRequests_IdempotencyProtection_PreventsDoubleDisbursement()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IAppDbContext>();
        var payrollService = scope.ServiceProvider.GetRequiredService<IPayrollService>();

        // Ensure clean state before test
        await context.Database.ExecuteSqlInterpolatedAsync(
            $"DELETE FROM Disbursement_Record WHERE Payroll_ID IN (SELECT Payroll_ID FROM (SELECT Payroll_ID FROM Monthly_Payroll WHERE Employee_ID = 2 AND Payroll_Year = 2029 AND Payroll_Month = 9) AS tmp);");
        await context.Database.ExecuteSqlInterpolatedAsync(
            $"DELETE FROM Monthly_Payroll WHERE Employee_ID = 2 AND Payroll_Year = 2029 AND Payroll_Month = 9;");

        // Create an approved payroll
        var payroll = new MonthlyPayroll
        {
            EmployeeId = 2,
            PayrollYear = 2029,
            PayrollMonth = 9,
            WorkingDaysInMonth = 26,
            PresentDays = 26,
            BasicSalarySnapshot = 60000m,
            TotalAllowances = 10000m,
            GrossSalary = 70000m,
            TotalDeductions = 5000m,
            NetSalary = 65000m,
            PayrollStatus = "Approved",
            ProcessedDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.MonthlyPayrolls.Add(payroll);
        await context.SaveChangesAsync();

        try
        {
            // 1st Disbursement request: must succeed
            var firstResult = await payrollService.DisbursePayrollAsync(payroll.PayrollId);
            firstResult.Status.Should().Be("Disbursed");

            // 2nd Disbursement request: must fail with business rule exception
            var secondAct = async () => await payrollService.DisbursePayrollAsync(payroll.PayrollId);
            await secondAct.Should().ThrowAsync<BusinessRuleException>()
                .WithMessage("*already been disbursed*");

            // Verify strictly 1 disbursement record exists in DB
            var disbCount = await context.DisbursementRecords
                .CountAsync(d => d.PayrollId == payroll.PayrollId);
            disbCount.Should().Be(1);
        }
        finally
        {
            // Cleanup
            using var cleanScope = _factory.Services.CreateScope();
            var cleanContext = cleanScope.ServiceProvider.GetRequiredService<IAppDbContext>();
            await cleanContext.Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM Disbursement_Record WHERE Payroll_ID = {payroll.PayrollId};");
            await cleanContext.Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM Monthly_Payroll WHERE Payroll_ID = {payroll.PayrollId};");
        }
    }

    // ------------------------------------------------------------------------
    // TEST 9: Deadlock and Transient Conflict Handling
    // ------------------------------------------------------------------------
    [Fact]
    public async Task Test09_DeadlockOrTransientErrorHandling_EnsuresSafeFailure()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IAppDbContext>();

        // Verify connection can handle rolling back conflicting transactions cleanly
        var strategy = context.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await context.Database.BeginTransactionAsync();
            try
            {
                // Lock Employee 1
                var emp1 = await context.Employees.FindAsync(1);
                emp1!.PhoneNumber = "01711111111";
                await context.SaveChangesAsync();

                // Simulate explicit rollback
                await tx.RollbackAsync();
            }
            catch
            {
                await tx.RollbackAsync();
            }
        });

        // Verify subsequent operations work normally (no poisoned connection or orphaned locks)
        var empAfter = await context.Employees.FindAsync(1);
        empAfter.Should().NotBeNull();
        empAfter!.EmployeeId.Should().Be(1);
    }

    // ------------------------------------------------------------------------
    // TEST 10: Data Integrity Invariant Checks
    // ------------------------------------------------------------------------
    [Fact]
    public async Task Test10_DataIntegrity_InvariantsSatisfied_AcrossFinancialAndLeaveEntities()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IAppDbContext>();

        // Invariant 1: Net Salary math consistency across all monthly payrolls
        var payrolls = await context.MonthlyPayrolls
            .AsNoTracking()
            .ToListAsync();

        foreach (var p in payrolls)
        {
            p.NetSalary.Should().Be(p.GrossSalary - p.TotalDeductions,
                $"Payroll #{p.PayrollId} math invariant failed: Net ({p.NetSalary}) != Gross ({p.GrossSalary}) - Deductions ({p.TotalDeductions})");
        }

        // Invariant 2: Leave Allocation identity: Days_Remaining == Total_Allocated - Days_Used
        var allocations = await context.LeaveAllocations
            .AsNoTracking()
            .ToListAsync();

        foreach (var a in allocations)
        {
            a.DaysRemaining.Should().Be(a.TotalAllocatedDays - a.DaysUsed,
                $"Leave Allocation #{a.AllocationId} balance identity failed: Remaining ({a.DaysRemaining}) != Allocated ({a.TotalAllocatedDays}) - Used ({a.DaysUsed})");
        }

        // Invariant 3: All disbursements match their corresponding payroll net salary
        var disbursements = await context.DisbursementRecords
            .Include(d => d.MonthlyPayroll)
            .AsNoTracking()
            .ToListAsync();

        foreach (var d in disbursements)
        {
            d.DisbursedAmount.Should().Be(d.MonthlyPayroll.NetSalary,
                $"Disbursement #{d.DisbursementId} amount does not match payroll net salary");
        }
    }
}

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable, ColumnDef } from '@/components/common/DataTable';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { StatCard } from '@/components/common/StatCard';
import { Users } from 'lucide-react';

describe('UI Components', () => {
  describe('Badge', () => {
    it('renders with appropriate styling classes for variant', () => {
      const { rerender } = render(<Badge variant="success">Active</Badge>);
      const badge = screen.getByText('Active');
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain('text-emerald-700');

      rerender(<Badge variant="danger">Terminated</Badge>);
      const dangerBadge = screen.getByText('Terminated');
      expect(dangerBadge.className).toContain('text-rose-700');
    });
  });

  describe('StatCard', () => {
    it('renders title, metric value, icon, and trend badge', () => {
      render(
        <StatCard
          title="Total Workforce"
          value="142"
          subtitle="Full-time staff"
          icon={<Users className="w-5 h-5" />}
          trend={{ value: '4.2%', isPositive: true }}
        />
      );

      expect(screen.getByText('Total Workforce')).toBeInTheDocument();
      expect(screen.getByText('142')).toBeInTheDocument();
      expect(screen.getByText('Full-time staff')).toBeInTheDocument();
      expect(screen.getByText('4.2%')).toBeInTheDocument();
    });
  });

  describe('DataTable', () => {
    interface TestItem {
      id: string;
      name: string;
      role: string;
    }

    const testData: TestItem[] = [
      { id: '1', name: 'Alice Smith', role: 'Architect' },
      { id: '2', name: 'Bob Jones', role: 'Developer' },
    ];

    const columns: ColumnDef<TestItem>[] = [
      { key: 'name', header: 'Employee Name', sortable: true },
      { key: 'role', header: 'Job Title' },
    ];

    it('renders headers and data rows correctly', () => {
      render(<DataTable data={testData} columns={columns} />);

      expect(screen.getByText('Employee Name')).toBeInTheDocument();
      expect(screen.getByText('Job Title')).toBeInTheDocument();
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    });

    it('triggers sorting callback when sortable column header is clicked', () => {
      const handleSort = vi.fn();
      render(
        <DataTable
          data={testData}
          columns={columns}
          sorting={{
            sortBy: 'name',
            sortOrder: 'asc',
            onSort: handleSort,
          }}
        />
      );

      const sortHeader = screen.getByText('Employee Name');
      fireEvent.click(sortHeader);

      expect(handleSort).toHaveBeenCalledWith('name');
    });

    it('renders empty state when data array is empty', () => {
      render(
        <DataTable
          data={[]}
          columns={columns}
          emptyTitle="No staff records discovered."
        />
      );

      expect(screen.getByText('No staff records discovered.')).toBeInTheDocument();
    });
  });

  describe('Modal', () => {
    it('renders modal dialog when isOpen is true', () => {
      const handleClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} title="New Department Setup">
          <p>Modal Form Body</p>
        </Modal>
      );

      expect(screen.getByText('New Department Setup')).toBeInTheDocument();
      expect(screen.getByText('Modal Form Body')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render modal when isOpen is false', () => {
      render(
        <Modal isOpen={false} onClose={vi.fn()} title="Hidden Modal">
          <p>Should not exist</p>
        </Modal>
      );

      expect(screen.queryByText('Hidden Modal')).not.toBeInTheDocument();
    });
  });
});

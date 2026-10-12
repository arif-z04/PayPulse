namespace PayPulse.Domain.Exceptions;

public class DomainException : Exception
{
    public DomainException(string message) : base(message) { }
    public DomainException(string message, Exception innerException) : base(message, innerException) { }
}

public class NotFoundException : DomainException
{
    public NotFoundException(string entityName, object key)
        : base($"{entityName} with key '{key}' was not found.") { }

    public NotFoundException(string message) : base(message) { }
}

public class BusinessRuleException : DomainException
{
    public string? ErrorCode { get; }

    public BusinessRuleException(string message, string? errorCode = null) : base(message)
    {
        ErrorCode = errorCode;
    }
}

public class DuplicateEntityException : DomainException
{
    public DuplicateEntityException(string message) : base(message) { }
}

public class UnauthorizedException : DomainException
{
    public UnauthorizedException(string message = "Authentication failed or token is invalid.") : base(message) { }
}

public class ForbiddenException : DomainException
{
    public ForbiddenException(string message = "You do not have permission to perform this action.") : base(message) { }
}

class AppError(Exception):
    """Base class for application-specific errors."""
    def __init__(self, message, status_code=500):
        super().__init__(message)
        self.status_code = status_code
        self.message = message

    def to_dict(self):
        return {"error": self.message}

class ServiceError(AppError):
    """Custom exception for external service failures."""
    def __init__(self, service_name, underlying_error):
        message = f"Error connecting to {service_name}: {underlying_error}"
        super().__init__(message, status_code=503) # 503 Service Unavailable
        self.service_name = service_name

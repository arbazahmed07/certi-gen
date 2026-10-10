from fastapi import status


class AppError(Exception):
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST, code: str = "BAD_REQUEST"):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code


class JobNotFoundError(AppError):
    def __init__(self, job_id: str):
        super().__init__(
            message=f"Generation job '{job_id}' was not found.",
            status_code=status.HTTP_404_NOT_FOUND,
            code="JOB_NOT_FOUND"
        )


class CertificateNotFoundError(AppError):
    def __init__(self, certificate_id: str):
        super().__init__(
            message=f"Certificate '{certificate_id}' was not found.",
            status_code=status.HTTP_404_NOT_FOUND,
            code="CERTIFICATE_NOT_FOUND"
        )


class InvalidJobStateError(AppError):
    def __init__(self, current_status: str, action: str):
        super().__init__(
            message=f"Cannot perform '{action}' on job in status '{current_status}'.",
            status_code=status.HTTP_409_CONFLICT,
            code="INVALID_STATE"
        )

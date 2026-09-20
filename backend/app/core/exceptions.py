from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

def setup_exception_handlers(app: FastAPI):
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={
                "error": "Validation Error",
                "details": str(exc),
                "status_code": 422
            }
        )

    @app.exception_handler(FileNotFoundError)
    async def file_not_found_exception_handler(request: Request, exc: FileNotFoundError):
        return JSONResponse(
            status_code=500,
            content={
                "error": "Resource not found",
                "status_code": 500
            }
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "status_code": 500
            }
        )

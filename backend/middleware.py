"""
Production middleware for Loom Framework.
Includes rate limiting, security headers, and request logging.
"""

import time
from fastapi import Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Callable
import logging

logger = logging.getLogger("loom.middleware")


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"

        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log all requests with timing information."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()

        # Log request
        logger.info(
            f"Request: {request.method} {request.url.path} - "
            f"Client: {request.client.host if request.client else 'unknown'}"
        )

        try:
            response = await call_next(request)
            process_time = time.time() - start_time

            # Log response
            logger.info(
                f"Response: {request.method} {request.url.path} - "
                f"Status: {response.status_code} - "
                f"Duration: {process_time:.3f}s"
            )

            response.headers["X-Process-Time"] = str(process_time)
            return response

        except Exception as exc:
            process_time = time.time() - start_time
            logger.error(
                f"Error: {request.method} {request.url.path} - "
                f"Error: {str(exc)} - "
                f"Duration: {process_time:.3f}s"
            )
            raise


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple in-memory rate limiting.
    For production, use Redis-based rate limiting.
    """

    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.requests: dict = {}

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip rate limiting for health checks
        if request.url.path == "/health":
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        current_time = int(time.time())
        window_start = current_time - 60

        # Clean old entries and count current window requests
        self.requests = {
            k: v for k, v in self.requests.items()
            if v["timestamp"] > window_start
        }

        key = f"{client_ip}:{current_time // 60}"
        if key in self.requests:
            self.requests[key]["count"] += 1
        else:
            self.requests[key] = {"timestamp": current_time, "count": 1}

        if self.requests[key]["count"] > self.requests_per_minute:
            from fastapi import HTTPException
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            raise HTTPException(status_code=429, detail="Rate limit exceeded")

        return await call_next(request)

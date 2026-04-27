"""
Structured logging configuration for Loom Framework.
Replaces print statements with proper structured logging.
"""

import logging
import sys
from typing import Any


def setup_logging(level: str = "INFO", json_format: bool = False) -> logging.Logger:
    """
    Configure structured logging for production.

    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR)
        json_format: If True, output JSON formatted logs for log aggregation
    """
    logger = logging.getLogger("loom")
    logger.setLevel(getattr(logging, level.upper()))

    # Remove existing handlers to avoid duplicates
    logger.handlers = []

    handler = logging.StreamHandler(sys.stdout)

    if json_format:
        # JSON format for production log aggregation
        formatter = logging.Formatter(
            '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "logger": "%(name)s", "message": "%(message)s", "module": "%(module)s"}'
        )
    else:
        # Human-readable format for development
        formatter = logging.Formatter(
            "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
        )

    handler.setFormatter(formatter)
    logger.addHandler(handler)

    # Suppress noisy third-party logs
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)

    return logger


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance with the specified name."""
    return logging.getLogger(f"loom.{name}")

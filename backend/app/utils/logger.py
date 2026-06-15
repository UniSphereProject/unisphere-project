from __future__ import annotations

import logging
import sys
from typing import Optional


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """Create and configure a logger with a standard format.

    Args:
        name: Optional logger name. Defaults to root-level for app.

    Returns:
        logging.Logger: Configured logger instance.
    """
    logger = logging.getLogger(name if name else "app")
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            fmt="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.propagate = False
    return logger

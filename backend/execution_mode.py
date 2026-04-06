"""
execution_mode.py — Loom Core

Single source of truth for personal vs. organization execution mode.

Set the mode via environment variable:
    LOOM_WORKSPACE_TYPE=personal        (default) fast iteration, debug panel on
    LOOM_WORKSPACE_TYPE=organization    strict RBAC, audit enforced, debug panel off

Usage:
    from execution_mode import is_org_mode, get_mode_config

    if is_org_mode():
        # enforce strict behaviour
    else:
        # allow fast/loose behaviour
"""

from settings import get_settings


def is_org_mode() -> bool:
    """Return True when running as an organization (strict) deployment."""
    return get_settings().is_org_mode


def is_personal_mode() -> bool:
    """Return True when running as a personal (fast) deployment."""
    return not is_org_mode()


def get_mode_config() -> dict:
    """
    Return a flat config dict describing active feature flags for the current mode.

    Organization mode enforces all guardrails.
    Personal mode relaxes constraints for developer speed.
    """
    org = is_org_mode()
    return {
        "strict_rbac": org,          # Deny on any missing permission vs. warn-only
        "audit_required": org,       # AuditLog writes are mandatory
        "blueprint_lock": org,       # Blueprint hot-reload disabled in org mode
        "debug_panel": not org,      # /debug/* endpoints only in personal mode
    }


def assert_org_mode(feature_name: str = "This feature"):
    """Raise RuntimeError if not in organization mode."""
    if not is_org_mode():
        raise RuntimeError(
            f"{feature_name} requires LOOM_WORKSPACE_TYPE=organization. "
            "Current mode: personal."
        )


def assert_personal_mode(feature_name: str = "This feature"):
    """Raise RuntimeError if not in personal mode (e.g. debug endpoints)."""
    if not is_personal_mode():
        raise RuntimeError(
            f"{feature_name} is only available in personal mode. "
            "Current mode: organization."
        )

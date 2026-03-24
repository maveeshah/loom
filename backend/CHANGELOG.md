# Changelog

All notable changes to the `loom-core` framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), 
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0b1] - Initial Beta Release

### Added
- Phase 1: Explicit `personal` vs `organization` execution modes.
- Phase 1: Isolated domain models from core framework `models.py`.
- Phase 2: `pyproject.toml` for `pip install loom-core` support.

### Changed
- Domain blueprints now belong in consuming project repos (`blueprints_project/`).
- Only `User` and `Role` remain as core-owned blueprints.

### Removed
- Multi-tenant runtime assumption (`workspace_id`, `tenant_id` removed from core expectations).

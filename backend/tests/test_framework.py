import os
import pytest
from fastapi.testclient import TestClient
from settings import Settings
from main import create_app


# Fake blueprints for testing
@pytest.fixture
def mock_settings(tmp_path):
    # Create dummy blueprint directories
    core_dir = tmp_path / "core_blueprints"
    core_dir.mkdir()
    tenant_dir = tmp_path / "tenant_blueprints"
    tenant_dir.mkdir()

    # Create fake blueprint
    patient_bp = """
name: Patient
slug: patient
permission_namespace: patient
table_name: patients
ui:
  show_in_sidebar: true
fields:
  - name: name
    type: String
"""
    (core_dir / "patient.yaml").write_text(patient_bp)

    tenant_bp = """
name: Invoice
slug: invoice
permission_namespace: billing
table_name: invoices
ui:
  show_in_sidebar: true
fields:
  - name: amount
    type: Float
"""
    (tenant_dir / "invoice.yaml").write_text(tenant_bp)

    class TestSettings(Settings):
        blueprint_paths: list[str] = [str(core_dir), str(tenant_dir)]
        database_url: str = "sqlite:///:memory:"
        api_prefix: str = "/api/v1"
        jwt_secret: str = "test-secret"

    return TestSettings()


def test_app_factory_and_blueprint_loader(mock_settings):
    app = create_app(mock_settings)
    assert app.title == "Loom API"

    # We can't easily test /modules without a DB and Auth token in this simple setup
    # but we can test that the blueprint loader successfully found our mocks
    from main import load_blueprints

    bps = load_blueprints(mock_settings)

    assert len(bps) == 2
    slugs = [bp.get("slug") for bp in bps]
    assert "patient" in slugs
    assert "invoice" in slugs


def test_load_blueprint_registry(mock_settings):
    import main
    from main import load_blueprint_registry

    # Save original state and clear it
    original_registry = main.blueprint_registry.copy()
    main.blueprint_registry.clear()

    try:
        load_blueprint_registry(mock_settings)

        assert len(main.blueprint_registry) == 2

        # Test exact content of the registry
        assert "patient" in main.blueprint_registry
        assert main.blueprint_registry["patient"]["name"] == "Patient"
        assert main.blueprint_registry["patient"]["permission_namespace"] == "patient"
        assert main.blueprint_registry["patient"]["table_name"] == "patients"

        assert "invoice" in main.blueprint_registry
        assert main.blueprint_registry["invoice"]["name"] == "Invoice"
        assert main.blueprint_registry["invoice"]["permission_namespace"] == "billing"
        assert main.blueprint_registry["invoice"]["table_name"] == "invoices"
    finally:
        # Restore original state
        main.blueprint_registry.clear()
        main.blueprint_registry.update(original_registry)


@pytest.mark.asyncio
async def test_plugin_registry():
    from plugin_registry import PluginRegistry, PluginManifest, HookRegistry

    registry = PluginRegistry()
    manifest = PluginManifest(name="test_plugin")
    registry.register_plugin(manifest)

    assert "test_plugin" in registry.plugins

    # Test hooks
    data = {"value": 1}

    async def my_hook(record, *args, **kwargs):
        record["value"] = 2

    registry.hooks.register("patient", "before_create", my_hook)
    await registry.hooks.execute("patient", "before_create", data)

    assert data["value"] == 2

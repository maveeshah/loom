import json
import os
import argparse
import sys

# Example placeholder: To make this fully functional, wire this to litellm, gemini 
# or openai client, and pass the prompt to it with JSON mode enabled.
# The expected response is a JSON dictionary that we write to {slug}.yaml.

def parse_args():
    parser = argparse.ArgumentParser(description="Natural Language to Blueprint Agent")
    parser.add_argument("prompt", type=str, help="Describe the module you want to generate")
    parser.add_argument("--dry-run", action="store_true", help="Print the YAML without saving")
    return parser.parse_args()

def generate_blueprint(prompt: str):
    """
    Sends the prompt to an LLM and returns the structured dictionary for the Blueprint.
    (This is an agentic stub that demonstrates the architecture)
    """
    print(f"🤖 Agent is analyzing your prompt: '{prompt}'...")
    
    # In a real deployed environment:
    # client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
    # response = client.models.generate_content(...)
    
    # Simulating LLM extraction to show the agentic approach:
    slug = prompt.lower().split()[0][:15] if prompt else "demo"
    mock_blueprint = {
        "name": slug.title(),
        "slug": slug,
        "module": "Custom",
        "description": f"Auto-generated module for: {prompt}",
        "ui": {
            "show_in_sidebar": True,
            "icon": "box",
            "default_view": "summary"
        },
        "fields": [
            {"name": "title", "type": "String", "required": True},
            {"name": "is_active", "type": "Boolean", "default": True},
        ],
        "views": [
            {"name": "Summary", "type": "summary", "id": "summary"},
            {"name": "History", "type": "history", "id": "history"}
        ]
    }
    return mock_blueprint

def save_blueprint(bp: dict, dry_run: bool = False):
    import yaml
    
    slug = bp.get("slug", "unknown").lower()
    yaml_str = yaml.dump(bp, sort_keys=False, default_flow_style=False)
    
    if dry_run:
        print("\n=== GENERATED BLUEPRINT ===")
        print(yaml_str)
        return

    filepath = os.path.join("blueprints", f"{slug}.yaml")
    
    # Don't accidentally overwrite
    if os.path.exists(filepath):
        print(f"❌ Blueprint {filepath} already exists! Use a different name.")
        sys.exit(1)

    os.makedirs("blueprints", exist_ok=True)
    with open(filepath, "w") as f:
        f.write(yaml_str)
        
    print(f"✅ Generated blueprint saved to: {filepath}")
    print(f"   => Run './make_migrations.sh' to apply it to your database!")

if __name__ == "__main__":
    args = parse_args()
    bp_data = generate_blueprint(args.prompt)
    save_blueprint(bp_data, dry_run=args.dry_run)

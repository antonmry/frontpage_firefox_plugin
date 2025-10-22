# Agent Notes

- Relocated the project Dockerfile into `.devcontainer/Dockerfile` so GitHub Codespaces can pick it up automatically.
- Added `.devcontainer/devcontainer.json` pointing to the Dockerfile, sets remote user `app`, and recommends necessary VS Code extensions.
- Dropped the Rust Analyzer recommendation per project requirements; keep the list lean to essentials.
- Remember to mirror any environment dependency updates in both the Dockerfile and devcontainer definition.

# Agent Notes

- Relocated the project Dockerfile into `.devcontainer/Dockerfile` so GitHub Codespaces can pick it up automatically.
- Added `.devcontainer/devcontainer.json` pointing to the Dockerfile, sets remote user `app`, and recommends VS Code extensions.
- Remember to mirror any environment dependency updates in both the Dockerfile and devcontainer definition.

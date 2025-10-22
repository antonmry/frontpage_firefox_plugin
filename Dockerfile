FROM fedora:40

# Install system packages required for Rust builds and Node-based Codex CLI
RUN dnf install -y \
        curl \
        ca-certificates \
        make \
        gcc \
        pkg-config \
        openssl-devel \
        git \
        nodejs \
        npm \
    && dnf clean all

# Install OpenAI Codex CLI from npm registry
RUN npm install -g @openai/codex

# Create a non-root user to run the CLI by default
RUN useradd --create-home --shell /bin/bash app
USER app
WORKDIR /home/app

CMD ["codex", "--help"]

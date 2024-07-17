# Use the Debian Bookworm image for ARM64
FROM arm64v8/debian:bookworm

# Update and install necessary packages including a desktop environment and audio support
RUN apt-get update && apt-get install -y \
    build-essential \
    ca-certificates \
    curl \
    wget \
    git \
    vim \
    gnupg \
    xz-utils \
    mpg123 \
    ffmpeg \
    git-all \
    dbus-user-session \
    dbus-x11 \
    xfce4 \
    xfce4-goodies \
    xorg \
    pipewire \
    pipewire-audio-client-libraries \
    pipewire-alsa \
    pipewire-pulse \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Update CA certificates
RUN update-ca-certificates

# Add NodeSource repository and install Node.js 18 and npm
RUN mkdir -p /usr/share/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource.gpg.key --insecure | gpg --dearmor -o /usr/share/keyrings/nodesource-archive-keyring.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/nodesource-archive-keyring.gpg] https://deb.nodesource.com/node_18.x bookworm main" > /etc/apt/sources.list.d/nodesource.list && \
    echo "deb-src [signed-by=/usr/share/keyrings/nodesource-archive-keyring.gpg] https://deb.nodesource.com/node_18.x bookworm main" >> /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && \
    apt-get install -y nodejs npm && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Configure PipeWire
RUN useradd -m -s /bin/bash user && \
    echo "user ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers && \
    mkdir -p /home/user/.config/pipewire && \
    chown -R user:user /home/user/.config

# Set the default command to run bash
CMD ["bash"]

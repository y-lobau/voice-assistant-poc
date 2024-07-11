#!/bin/bash

if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  echo "installing speech-recorder on mac..."
  npm install speech-recorder --no-save
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux (assuming this is your Raspberry Pi)
  echo "installing speech-recorder on rpi..."
  # cd /path/to/your/local/speech-recorder
  # npm link
  # cd /path/to/your/project
  # npm link speech-recorder
  npm uninstall speech-recorder
  npm install packages/speech-recorder/prebuilds/speech-recorder-v2.1.0-napi-v6-linux-arm64.tar.gz --no-save
else
  echo "Unsupported OS: $OSTYPE"
  exit 1
fi

# Speech Recorder

[Github](https://github.com/serenadeai/speech-recorder)

## Building SpeechRecorder for arm64

Building speech-recorder from source:

```bash
  ./setup.sh arm64 # setup dependencies

  # Copy unzipped https://github.com/microsoft/onnxruntime/releases/download/v# # 1.18.1/onnxruntime-linux-aarch64-1.18.1.tgz to speech-recorder/lib/3rd_part# y/onnxruntime

  # Replace in speech-recorder/lib/CMakeLists.txt : libonnxruntime.so.1.10.0 ->
  # -> libonnxruntime.so.1.18.1
  # Same replace in binding.gyp

  ./build.sh arm64 # building package
  npm pack # assemble package artefact

```

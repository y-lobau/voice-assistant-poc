import { SpeechRecorder, devices } from "speech-recorder";
import { IConsole } from "../../../core/interfaces/IConsole";

export class VoiceRecorder {
  private recorder: SpeechRecorder;

  constructor(
    private console: IConsole,
    private frameLength: number,
    private cardName: string,
    private framesOfSilence: number,
    private onAudioData: ({ speaking, speech, probability, audio }) => void,
    private onVoiceEnded: () => void
  ) {
    const deviceIndex = this.getCaptureDeviceIndexByName(this.cardName);
    this.console.info(`Using device index: ${deviceIndex}`);

    try {
      this.recorder = new SpeechRecorder({
        sampleRate: 16000,
        samplesPerFrame: this.frameLength,
        consecutiveFramesForSilence: this.framesOfSilence,
        device: deviceIndex,
        onChunkStart: () => {
          // console.debug("Voice started");
          // this.silence.setVoiceDetected();
        },
        onAudio: (data) => {
          this.onAudioData(data);
        },
        onChunkEnd: () => {
          this.onVoiceEnded();
        },
      });
    } catch (err) {
      this.console.errorStr(`Error creating recorder: ${err}`);
    }
  }

  private getCaptureDeviceIndexByName(deviceName): number {
    const devicesList = devices();
    console.debug("devices: ", devicesList);

    const device = devicesList.find((device) =>
      device.name.includes(deviceName)
    );
    if (device) {
      return device.id;
    } else {
      this.console.errorStr(
        `Device "${deviceName}" not found. Using default index -1.`
      );
      return -1;
    }
  }

  public start(): void {
    this.recorder.start();
  }

  public stop(): void {
    this.recorder.stop();
  }
}

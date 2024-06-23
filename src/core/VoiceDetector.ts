import { ISilence } from "./interfaces/ISilence";

export class VoiceDetector {
  private silenceStart: number | null = null;
  private silenceStartTimeout = 4000;
  private silenceEndTimeout = 1000;

  public voiceDetected: Boolean = false;

  constructor(private silence: ISilence) {}

  public silenceThresholdReached(
    audioFrame: Int16Array,
    reject
  ): Promise<Boolean> {
    const silence = this.silence.detected(audioFrame);
    if (silence) {
      if (this.isSilenceTimedOut()) {
        console.debug("Silence timed out");
        return Promise.resolve(true);
      }
      if (!this.silenceStart) this.setSilenceStarted();
    } else this.setVoiceDetected();
    return Promise.resolve(false);
  }

  private setSilenceStarted(): void {
    console.debug("Silence started");
    this.silenceStart = Date.now();
  }

  private isSilenceTimedOut(): boolean {
    if (!this.silenceStart) return false;
    const timeout = this.voiceDetected
      ? this.silenceEndTimeout
      : this.silenceStartTimeout;
    return Date.now() - this.silenceStart > timeout;
  }

  public setVoiceDetected(): void {
    console.debug("Voice detected");
    this.voiceDetected = true;
    this.silenceStart = null;
  }

  public reset(): void {
    console.debug("Voice detector reset");
    this.voiceDetected = false;
    this.silenceStart = null;
  }
}

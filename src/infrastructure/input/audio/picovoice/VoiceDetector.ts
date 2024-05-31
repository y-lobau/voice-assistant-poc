import { Cobra } from "@picovoice/cobra-node";

export class VoiceDetector {
  private silenceStart: number | null = null;
  private silenceStartTimeout = 4000;
  private silenceEndTimeout = 1000;
  private cobra;
  public voiceDetected: Boolean = false;

  constructor(private probabilityThreshold: number, apiKey: string) {
    this.cobra = new Cobra(apiKey);
  }

  public silenceThresholdReached(audioFrame: Int16Array): Boolean {
    const voiceProbability = this.cobra.process(audioFrame);
    const silence = voiceProbability < this.probabilityThreshold;
    if (silence) {
      if (this.isSilenceTimedOut()) {
        console.debug("Silence timed out");
        return true;
      }
      if (!this.silenceStart) this.setSilenceStarted();
    } else this.setVoiceDetected();
    return false;
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

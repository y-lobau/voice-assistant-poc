import { Cobra } from "@picovoice/cobra-node";

export class VoiceDetector {
  private silenceStart: number | null = null;
  private silenceTimeout = 2000;
  private cobra;
  public voiceDetected: Boolean = false;

  constructor(private probabilityThreshold: number, apiKey: string) {
    this.cobra = new Cobra(apiKey);
  }

  public silenceThresholdReached(audioFrame: Int16Array): Boolean {
    const voiceProbability = this.cobra.process(audioFrame);

    console.log(`Voice probability: ${voiceProbability}`);

    const silence = voiceProbability < this.probabilityThreshold;
    if (silence) {
      if (this.isSilenceTimedOut()) return true;
      if (!this.silenceStart) this.setSilenceStarted();
    } else this.setVoiceDetected();
    return false;
  }

  private setSilenceStarted(): void {
    this.silenceStart = Date.now();
  }

  private isSilenceTimedOut(): boolean {
    if (!this.silenceStart) return false;
    return Date.now() - this.silenceStart > this.silenceTimeout;
  }

  public setVoiceDetected(): void {
    this.voiceDetected = true;
    this.silenceStart = null;
  }

  public reset(): void {
    this.voiceDetected = false;
    this.silenceStart = null;
  }
}

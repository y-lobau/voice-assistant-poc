export class Silence {
  private silenceStart: number | null = null;
  private silenceStartTimeout = 4000;
  private silenceEndTimeout = 1000;
  public voiceInSessionDetected: Boolean = false;

  public isTimedOut(): boolean {
    if (!this.silenceStart) return false;
    const timeout = this.voiceInSessionDetected
      ? this.silenceEndTimeout
      : this.silenceStartTimeout;
    return Date.now() - this.silenceStart > timeout;
  }

  public setVoiceDetected(): void {
    console.debug("Setting voiceInSessionDetected = true.");
    this.voiceInSessionDetected = true;
    this.silenceStart = null;
  }

  public setStarted(): void {
    // Don't override the start time if it's already set.
    // Timeout must be reset by calling either setVoiceDetected or reset
    if (this.silenceStart) return;
    console.debug("Silence started");
    this.silenceStart = Date.now();
  }

  public reset(): void {
    console.debug("Voice detector reset");
    this.voiceInSessionDetected = false;
    this.silenceStart = null;
  }
}

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
    this.voiceInSessionDetected = true;
    this.silenceStart = null;
  }

  public setStarted(): void {
    console.debug("Silence started");
    this.silenceStart = Date.now();
  }

  public setOrContinue(): void {
    if (this.silenceStart) return;
    this.setStarted();
  }

  public reset(): void {
    console.debug("Resetting silence");
    this.voiceInSessionDetected = false;
    this.silenceStart = null;
  }
}

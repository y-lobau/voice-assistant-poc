export class Silence {
  private silenceStart: number | null = null;
  private silenceTimeout = 2000;

  public setStarted(): void {
    this.silenceStart = Date.now();
  }

  public isStarted(): boolean {
    return this.silenceStart !== null;
  }

  public reset(): void {
    this.silenceStart = null;
  }

  public isTimedOut(): boolean {
    return Date.now() - this.silenceStart > this.silenceTimeout;
  }
}

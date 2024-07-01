export class Silence {
  private volumeSum = 0;
  private volumeCount = 0;
  private averageVolume = 0;
  public silenceThresholdMultiplier = 1.5;
  private silenceThreshold = 0;
  private silenceStart: number | null = null;
  private silenceTimeout = 2000;

  constructor(private console) {}

  public setStarted(): void {
    this.silenceStart = Date.now();
  }

  public isStarted(): boolean {
    return this.silenceStart !== null;
  }

  public resetStarted(): void {
    this.silenceStart = null;
  }

  public isTimedOut(): boolean {
    return Date.now() - this.silenceStart > this.silenceTimeout;
  }

  public volume(data: Buffer | Int16Array): number {
    const volume = this.calculateVolume(data);
    this.console.debug(`Volume: ${volume}`);

    // Update the running average volume
    this.volumeSum += volume;
    this.volumeCount++;
    this.averageVolume = this.volumeSum / this.volumeCount;

    // Dynamically adjust the silence threshold based on the running average
    this.silenceThreshold =
      this.averageVolume * this.silenceThresholdMultiplier;
    return volume;
  }

  public isSilence(volume: number): boolean {
    return volume < this.silenceThreshold;
  }

  public reset(): void {
    this.volumeSum = 0;
    this.volumeCount = 0;
    this.averageVolume = 0;
    this.silenceThreshold = 0;
  }

  private calculateVolume(data: Int16Array | Buffer): number {
    let sum = 0;
    for (let i = 0; i < data.length; i += 2) {
      let sample = data[i];
      sum += sample * sample;
    }
    return Math.sqrt(sum / (data.length / 2));
  }
}

import { IDateNow } from "./interfaces/IDateNow";

export class SpeechRound {
  static new(): SpeechRound {
    return new SpeechRound(
      { now: () => Date.now() },
      0,
      null,
      null,
      500,
      4000,
      1000
    );
  }

  constructor(
    private date: IDateNow,
    private speechLength: number,
    private speechStart: number | null,
    private silenceStart: number | null,
    private minSpeechLength: number, //ms
    private silenceLongTimeout,
    private silenceShortTimeout
  ) {}

  get silenceTimeout(): number {
    // If speech is detected, use short timeout, otherwise use long timeout
    return this.speechLength > 0
      ? this.silenceShortTimeout
      : this.silenceLongTimeout;
  }

  get isSilenceTimedOut(): boolean {
    return (
      this.silenceStart != null &&
      this.date.now() - this.silenceStart > this.silenceTimeout
    );
  }

  get speechDetected(): boolean {
    return this.speechLength > this.minSpeechLength;
  }

  get speechLengthMs(): number {
    return this.speechLength;
  }

  speaking(audio: Int16Array) {
    this.silenceStart = null;

    if (!this.speechStart) {
      this.speechStart = this.date.now();
      console.debug(`Speaking...`);
    }
  }

  silence() {
    if (this.silenceStart !== null) return;

    this.silenceStart = this.date.now();
    this.speechLength +=
      this.speechStart !== null ? this.date.now() - this.speechStart : 0;
    this.speechStart = null;

    console.debug(`Silence started`);
  }
}

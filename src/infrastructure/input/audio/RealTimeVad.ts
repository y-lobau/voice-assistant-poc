import { NonRealTimeVADOptions } from "@ricky0123/vad-node";
import vad from "@ricky0123/vad-node";
import { EventEmitter } from "events";

export interface RealTimeVADOptions extends NonRealTimeVADOptions {
  sampleRate: number;
  minBufferDuration: number;
  maxBufferDuration: number;
  overlapDuration: number;
  silenceThreshold: number;
}

export interface SpeechSegmentStart {
  start: number;
}

export interface SpeechSegmentData {
  audio: Float32Array | Buffer;
  start: number;
  end: number;
}

export interface SpeechSegmentEnd {
  end: number;
}

export class RealTimeVad extends EventEmitter {
  private sampleRate: number;
  private minBufferSize: number;
  private maxBufferSize: number;
  private overlapDuration: number;
  private audioBuffer: Float32Array;
  private vadInstance: vad.NonRealTimeVAD | null;
  private currentTime: number;
  private options: Partial<RealTimeVADOptions>;

  constructor(options: Partial<RealTimeVADOptions> = {}) {
    super();
    this.sampleRate = options.sampleRate || 16000;
    this.minBufferSize = this.sampleRate * (options.minBufferDuration || 1);
    this.maxBufferSize = this.sampleRate * (options.maxBufferDuration || 5);
    this.overlapDuration = options.overlapDuration || 0.1;
    this.audioBuffer = new Float32Array(0);
    this.vadInstance = null;
    this.currentTime = 0;
    this.options = options;
  }

  static async new(
    options: Partial<RealTimeVADOptions> = {}
  ): Promise<RealTimeVad> {
    const instance = new RealTimeVad(options);
    await instance.init();
    return instance;
  }

  async init(): Promise<void> {
    this.vadInstance = await vad.NonRealTimeVAD.new(this.options);
  }

  async processAudio(audioChunk: Float32Array | Buffer): Promise<boolean> {
    let newAudioData: Float32Array;
    if (audioChunk instanceof Float32Array) {
      newAudioData = audioChunk;
    } else if (audioChunk instanceof Buffer) {
      newAudioData = new Float32Array(audioChunk.length / 2);
      for (let i = 0; i < audioChunk.length; i += 2) {
        newAudioData[i / 2] = audioChunk.readInt16LE(i) / 32768;
      }
    } else {
      throw new Error(
        "Unsupported audio format. Please provide Float32Array or Buffer."
      );
    }

    this.audioBuffer = Float32Array.from([
      ...this.audioBuffer,
      ...newAudioData,
    ]);
    this.currentTime += newAudioData.length / this.sampleRate;

    if (this.audioBuffer.length > this.maxBufferSize) {
      this.audioBuffer = this.audioBuffer.slice(-this.maxBufferSize);
    }

    let hasSpeech = false;

    if (this.audioBuffer.length >= this.minBufferSize) {
      if (!this.vadInstance) {
        await this.init();
      }

      try {
        const vadResult = await this.vadInstance!.run(
          this.audioBuffer,
          this.sampleRate
        );

        hasSpeech =
          vadResult &&
          typeof vadResult[Symbol.asyncIterator] === "function" &&
          !(await vadResult.next()).done;

        const overlapSize = Math.floor(this.overlapDuration * this.sampleRate);
        this.audioBuffer = this.audioBuffer.slice(-overlapSize);
      } catch (error) {
        this.emit("error", error);
      }
    }
    return hasSpeech;
  }
}

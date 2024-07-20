import RealTimeVAD from "../../../../packages/RealTimeVad";

export class VAD {
  private vadInstance: RealTimeVAD;

  constructor() {
    const options = {
      sampleRate: 16000, // Sample rate of input audio
      minBufferDuration: 1, // minimum audio buffer to store
      maxBufferDuration: 5, // maximum audio buffer to store
      overlapDuration: 0.1, // how much of the previous buffer exists in the new buffer
      silenceThreshold: 0.5, // threshold for ignoring pauses in speech
    };

    this.vadInstance = new RealTimeVAD(options);
    this.vadInstance.init();
    this.vadInstance.on("start", ({ start }) => {
      // speech segment start
    });
    this.vadInstance.on("data", ({ audio, start, end }) => {
      // speech segment data
      // start & end here are provided by @ricky0123/vad, this is NOT the same as emitted start & end
    });
    this.vadInstance.on("end", ({ end }) => {
      // speech segment end
    });
  }

  public processAudio(audio: Int16Array | Buffer) {
    this.vadInstance.processAudio(new Float32Array(audio));
  }

  public on(event: "start" | "data" | "end", listener: (data: any) => void) {
    this.vadInstance.on(event, listener);
  }
}

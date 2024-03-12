import { Transform, TransformCallback, TransformOptions } from "stream";

export class FrameSplitter extends Transform {
  private frameSize: number;
  private buffer: Buffer;

  constructor(frameSize: number, options?: TransformOptions) {
    super(options);
    this.frameSize = frameSize;
    this.buffer = Buffer.alloc(0);
  }

  _transform(
    chunk: Buffer,
    encoding: BufferEncoding,
    callback: TransformCallback
  ): void {
    this.buffer = Buffer.concat([this.buffer, chunk]);

    while (this.buffer.length >= this.frameSize) {
      const frame = this.buffer.slice(0, this.frameSize);
      this.buffer = this.buffer.slice(this.frameSize);
      this.push(frame);
    }

    callback();
  }

  _flush(callback: TransformCallback): void {
    if (this.buffer.length > 0) {
      this.push(this.buffer); // Push any remaining data when the stream ends
    }
    callback();
  }
}

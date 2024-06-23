import { IConsole } from "../../../core/interfaces/IConsole";
import { VAD } from "node-vad";
import { ISilence } from "../../../core/interfaces/ISilence";

// https://github.com/snirpo/node-vad
export class NodeVADDetector implements ISilence {
  private vad: VAD;

  constructor(private console: IConsole) {
    this.vad = new VAD(VAD.Mode.NORMAL);
  }
  detected(audioFrame: Int16Array): Promise<boolean> {
    return this.vad
      .processAudio(audioFrame, 16000)
      .then((res) => {
        switch (res) {
          case VAD.Event.ERROR:
            throw Error(
              "Unspecified error while processing audio with node-vad"
            );
          case VAD.Event.NOISE:
            this.console.debug("noise detected");
            return false;
          case VAD.Event.SILENCE:
            this.console.debug("silence detected");
            return true;
          case VAD.Event.VOICE:
            console.log("VOICE");
            return false;
        }
      })
      .catch(this.console.error);
  }
}

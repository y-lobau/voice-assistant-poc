import { Omnibus } from "@hypersphere/omnibus";
import { Events } from "../../core/interfaces/Events";
import { IVisualFeedback } from "../../core/interfaces/IVisualFeedback";

export class FeedbackManager {
  public static init(
    eventBus: Omnibus<Events>,
    visualisation: IVisualFeedback
  ) {
    eventBus.on("processingInputStarted", () => {
      console.debug("event: processingInputStarted");
      visualisation.thinking();
    });
    eventBus.on("processingInputFinished", () => {
      console.debug("event: processingInputStarted:false");
      visualisation.thinking(false);
    });
    eventBus.on("voiceInputStarted", () => {
      console.debug("event: voiceInputStarted");
      visualisation.listening();
    });
    eventBus.on("voiceInputFinished", () => {
      console.debug("event: voiceInputStarted:false");
      visualisation.listening(false);
    });
    eventBus.on("voiceRecordingFinished", () => {});
    eventBus.on("talkingStarted", () => {
      console.debug("event: talkingStarted");
      visualisation.talking();
    });
    eventBus.on("talkingFinished", () => {
      console.debug("event: talkingStarted:false");
      visualisation.talking(false);
    });
    eventBus.on("voiceStandbyStarted", () => {
      console.debug("event: voiceStandbyStarted");
      visualisation.standby();
    });
  }
}

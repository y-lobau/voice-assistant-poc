import { IVisualFeedback } from "../../core/interfaces/IVisualFeedback";

export class NoVisualization implements IVisualFeedback {
  constructor() {}

  initializing(start: boolean = true) {}
  listening(start: boolean = true) {}
  talking(start: boolean = true) {}
  thinking(start: boolean = true) {}
  standby(start: boolean = true) {}
}

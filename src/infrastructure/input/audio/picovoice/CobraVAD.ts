import { Cobra } from "@picovoice/cobra-node";
import { ISilence } from "../../../../core/interfaces/ISilence";

export class CobraVAD implements ISilence {
  private cobra;
  constructor(apiKey: string, private probabilityThreshold: number = 0.8) {
    this.cobra = new Cobra(apiKey);
  }
  public detected(audioFrame: Int16Array): Promise<boolean> {
    const voiceProbability = this.cobra.process(audioFrame);
    return Promise.resolve(voiceProbability < this.probabilityThreshold);
  }
}

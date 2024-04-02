import { SkillFunction } from "../models/SkillFunction.js";
import { ISkill } from "../interfaces/ISkill.js";
import { AudioPlayer } from "../../infrastructure/output/AudioPlayer.js";

export class PlayTestAudioSkill implements ISkill {
  functions: SkillFunction[];
  public onFinished: (skill: ISkill) => void;

  constructor(private player: AudioPlayer) {
    this.functions = [
      new SkillFunction(
        "playTestFile",
        "выкарыстоўвай гэту функцыю для праігрывання тэставага файла",
        {},
        this.play
      ),
    ];
  }

  public onVoiceInterrupted(): void {
    this.player.stop();
  }

  public continue(): void {
    this.play();
  }

  private play(): void {
    this.player.playUrl(
      "https://library.knizhnyvoz.com/books/65e986c87ead03e15985d14f/chapter-3bb30091-87c8-41cd-9be6-ef5b3bf79842.mp3",
      () => this.onPlayFinished()
    );
  }

  private onPlayFinished(): void {
    this.onFinished(this);
  }

  cleanup(): void {
    this.player.stop();
  }
}

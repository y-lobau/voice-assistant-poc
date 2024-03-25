export interface IAI {
  voiceToText(filePath: string): Promise<string>;
  textToVoice(text: string): Promise<Buffer>;
}

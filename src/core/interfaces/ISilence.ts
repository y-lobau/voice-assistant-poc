export interface ISilence {
  detected(audioFrame: Int16Array): Promise<boolean>;
}

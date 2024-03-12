export interface IOutput {
  output(message: string): Promise<void>;
  error(ex: Error): Promise<void>;
}

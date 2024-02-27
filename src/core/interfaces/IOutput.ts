export interface IOutput {
  output(message: string): void;
  error(ex: Error): void;
}

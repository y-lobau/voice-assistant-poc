export interface IOutput {
  output(message: string): Promise<void>;
  error(ex: Error, obj?: any): Promise<void>;
}

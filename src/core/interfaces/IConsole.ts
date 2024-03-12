export interface IConsole {
  info(message: string): void;
  errorStr(message: string): void;
  error(ex: Error);
  debug(message: string): void;
  setLoading(text: string): void;
  stopLoading(): void;
}

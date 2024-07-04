export interface IConsole {
  info(message: string, obj?: any): void;
  errorStr(message: string, obj?: any): void;
  error(ex: Error, obj?: any | undefined);
  debug(message: string, obj?: any): void;
  setLoading(text: string): void;
  stopLoading(): void;
}

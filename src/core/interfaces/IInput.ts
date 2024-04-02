export interface IInput {
  input(options: any | null): Promise<string>;
  cleanup?(): void;
}

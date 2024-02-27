export interface IInput {
  input(): Promise<string>;
  cleanup?(): void;
}

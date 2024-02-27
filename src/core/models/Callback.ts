export class Callback {
  functionName: string;
  args: any[];

  constructor(functionName: string, args: any[]) {
    this.functionName = functionName;
    this.args = args;
  }
}

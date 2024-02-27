export class SkillFunction {
  constructor(
    public name: string,
    public description: string,
    public parameters: any,
    public func: Function
  ) {}
}

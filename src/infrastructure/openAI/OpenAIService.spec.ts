import { expect } from "chai";
import { OpenAIService } from "./OpenAIService";
import { ConsoleOutput } from "../output/ConsoleOutput";

describe("sendCompletions()", function () {
  const model = "gpt-4o-mini";
  const console = new ConsoleOutput();

  it("should return numbers as words", async function () {
    const messages = [{ role: "user", content: "1 + 1" }];
    const service = new OpenAIService(model, console);

    const response = await service.sendCompletions(messages, []);

    expect(response.content).to.contain("two");
  });
});

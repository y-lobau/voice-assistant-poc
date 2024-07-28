import { expect } from "chai";
import { OpenAIService } from "../../../src/infrastructure/openAI/OpenAIService";
import { ConsoleOutput } from "../../../src/infrastructure/output/ConsoleOutput";

describe("sendCompletions()", function () {
  const model = "gpt-4o-mini";
  const console = new ConsoleOutput();

  it("should return numbers as words", async function () {
    const messages = [
      { role: "user", content: "Напішы тэкст: 1 яблык + 1 яблык = 2 яблыкі" },
    ];
    const service = new OpenAIService(model, console);

    const response1 = await service.sendCompletions(messages, []);
    const content1 = response1.content.toLowerCase();

    // Adjust these expectations based on the actual service output
    expect(content1).to.include("яблык");
    expect(content1).to.not.include("1");
    expect(content1).to.not.include("2");
  });
});

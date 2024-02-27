import { KnizhnyVozSkill } from "./core/skills/KnizhnyVozSkill.js";
import { ConsoleInput } from "./infrastructure/input/ConsoleInput.js";
import { ConsoleOutput } from "./infrastructure/output/ConsoleOutput.js";
import { SkillBox } from "./core/skills/SkillBox.js";
import { Conversation } from "./core/Conversation.js";
import { OpenAIService } from "./infrastructure/OpenAIService.js";
import { MessageGenerator } from "./fine-tuning/MessageGenerator.js";
import VoiceOutput from "./infrastructure/output/VoiceOutput.js";
import { VoiceInput } from "./infrastructure/input/VoiceInput.js";

const gpt4Model = "gpt-4-0125-preview";
const gpt3Model = "gpt-3.5-turbo-1106";
const gpt3ModelFT = "ft:gpt-3.5-turbo-1106:personal::8vR4QnIi";

const skill = new KnizhnyVozSkill();
const skills = new SkillBox([skill]);
const aiService = new OpenAIService(gpt3ModelFT, skills);

const consoleOutput = new ConsoleOutput();
const consoleInput = new ConsoleInput();
const voiceInput = new VoiceInput(aiService.openai, consoleOutput);
const voiceOutput = new VoiceOutput(aiService.openai, consoleOutput);

process.on("exit", (code) => {
  skills.cleanup();
  voiceInput.cleanup();
});

var text = await voiceInput.input();
consoleOutput.info("Done voice recording: " + text);
// text = await new VoiceInput(aiService.openai, consoleOutput).input();
// consoleOutput.info(text);

// function run() {
//   new Conversation(voiceInput, consoleOutput, aiService, skills, consoleOutput)
//     .start()
//     .catch((error) => {
//       consoleOutput.error(error);
//       run();
//     });
// }

// run();
// await skill.loadAndPopulateAllBooks();

// (async () => {
//   const skill = new KnizhnyVozSkill(); // Ensure this object is correctly initialized
//   const generator = new MessageGenerator(skill);
//   await generator.init();
//   await generator.generateMessages();
// })()
//   .then(() => {
//     console.log("Messages generated successfully!");
//   })
//   .catch(console.error);

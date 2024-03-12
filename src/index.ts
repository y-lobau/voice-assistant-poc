import dotenv from "dotenv";

import { KnizhnyVozSkill } from "./core/skills/KnizhnyVozSkill.js";
import { ConsoleInput } from "./infrastructure/input/ConsoleInput.js";
import { ConsoleOutput } from "./infrastructure/output/ConsoleOutput.js";
import { SkillBox } from "./core/skills/SkillBox.js";
import { Conversation } from "./core/Conversation.js";
import { OpenAIService } from "./infrastructure/OpenAIService.js";
import { MessageGenerator } from "./fine-tuning/MessageGenerator.js";
import VoiceOutput from "./infrastructure/output/VoiceOutput.js";
import { VoiceInput } from "./infrastructure/input/VoiceInput.js";
import { ConsoleVisualization } from "./infrastructure/visualisation/ConsoleVisualization.js";
import { TimeSkill } from "./core/skills/TimeSkill.js";
import { NoVisualization } from "./infrastructure/visualisation/NoVisualization.js";

dotenv.config();

const gpt4Model = "gpt-4-0125-preview";
const gpt3Model = "gpt-3.5-turbo-1106";
const gpt3ModelFT = "ft:gpt-3.5-turbo-1106:personal::8vR4QnIi";

const consoleOutput = new ConsoleOutput();
const consoleInput = new ConsoleInput();

const skills = new SkillBox([
  new KnizhnyVozSkill(),
  new TimeSkill(consoleOutput),
]);
const aiService = new OpenAIService(gpt4Model, skills, consoleOutput);

const consoleVisualization = new ConsoleVisualization(consoleOutput);
const noVisualisation = new NoVisualization();

const voiceInput = new VoiceInput(
  aiService.openai,
  consoleOutput,
  consoleVisualization,
  process.env.PICOVOICE_API_KEY
);
const voiceOutput = new VoiceOutput(
  aiService.openai,
  consoleOutput,
  consoleVisualization
);

process.on("exit", (code) => {
  skills.cleanup();
  voiceInput.cleanup();
});

function run() {
  return new Conversation(
    consoleInput,
    consoleOutput,
    aiService,
    skills,
    consoleOutput,
    noVisualisation
  ).start();
}

await run();

consoleOutput.debug("Ending the program");
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

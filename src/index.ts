import dotenv from "dotenv";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { KnizhnyVozSkill } from "./core/skills/KnizhnyVozSkill.js";
import { ConsoleInput } from "./infrastructure/input/ConsoleInput.js";
import { ConsoleOutput } from "./infrastructure/output/ConsoleOutput.js";
import { SkillBox } from "./core/skills/SkillBox.js";
import { Conversation } from "./core/Conversation.js";
import { OpenAIService } from "./infrastructure/OpenAIService.js";
import VoiceOutput from "./infrastructure/output/VoiceOutput.js";
import { VoiceInput } from "./infrastructure/input/VoiceInput.js";
import { ConsoleVisualization } from "./infrastructure/visualisation/ConsoleVisualization.js";
import { TimeSkill } from "./core/skills/TimeSkill.js";
import { NoVisualization } from "./infrastructure/visualisation/NoVisualization.js";

dotenv.config();

// Initialize shared components
const consoleOutput = new ConsoleOutput();
const skills = new SkillBox([
  new KnizhnyVozSkill(),
  new TimeSkill(consoleOutput),
]);
const gpt4Model = "gpt-4-0125-preview";
const aiService = new OpenAIService(gpt4Model, skills, consoleOutput);

// Define profiles
const profiles = {
  console: {
    input: "ConsoleInput",
    output: "ConsoleOutput",
    visualization: "NoVisualization",
  },
  voice: {
    input: "VoiceInput",
    output: "VoiceOutput",
    visualization: "ConsoleVisualization",
  },
  "console-voice": {
    input: "ConsoleInput",
    output: "VoiceOutput",
    visualization: "NoVisualization",
  },
};

// Parse CLI arguments for profile selection
const argv = yargs(hideBin(process.argv)).option("profile", {
  describe: "Predefined profile for the application mode",
  choices: ["console", "voice", "console-voice"],
  demandOption: true, // Require profile selection
}).argv;

// Select profile based on CLI argument
const selectedProfile = profiles[argv.profile];

// Visualization configuration
const visualization =
  selectedProfile.visualization === "NoVisualization"
    ? new NoVisualization()
    : new ConsoleVisualization(consoleOutput);

// Input and Output configuration using a factory approach
const componentFactory = {
  ConsoleInput: () => new ConsoleInput(),
  VoiceInput: () =>
    new VoiceInput(
      aiService.openai,
      consoleOutput,
      visualization,
      process.env.PICOVOICE_API_KEY
    ),
  ConsoleOutput: () => consoleOutput,
  VoiceOutput: () =>
    new VoiceOutput(aiService.openai, consoleOutput, visualization),
};

const input = componentFactory[selectedProfile.input]();
const output = componentFactory[selectedProfile.output]();

async function run() {
  return new Conversation(
    input,
    output,
    aiService,
    skills,
    consoleOutput,
    visualization
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

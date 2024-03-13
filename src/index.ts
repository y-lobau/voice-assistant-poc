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
import { AudioPlayer } from "./infrastructure/output/AudioPlayer.js";
import { DeviceVisualization } from "./infrastructure/visualisation/DeviceVisualization.js";

dotenv.config();

const gpt4Model = "gpt-4-0125-preview";
const gpt3Model = "gpt-3.5-turbo-1106";
const gpt3ModelFT = "ft:gpt-3.5-turbo-1106:personal::8vR4QnIi";

const consoleOutput = new ConsoleOutput();
const aiService = new OpenAIService(gpt4Model, consoleOutput);
const audioPlayer = new AudioPlayer(consoleOutput);

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
  "device-console": {
    input: "ConsoleInput",
    output: "ConsoleOutput",
    visualization: "DeviceVisualization",
  },
};

function getVisualization(visualizationName) {
  switch (visualizationName) {
    case "ConsoleVisualization":
      return new ConsoleVisualization(consoleOutput);
    case "NoVisualization":
      return new NoVisualization();
    case "DeviceVisualization":
      return new DeviceVisualization(consoleOutput);
    default:
      return new NoVisualization();
  }
}

// Parse CLI arguments for profile selection
const argv = yargs(hideBin(process.argv)).option("profile", {
  describe: "Predefined profile for the application mode",
  choices: ["console", "voice", "console-voice", "device-console"],
  demandOption: true, // Require profile selection
}).argv;

// Select profile based on CLI argument
const selectedProfile = profiles[argv.profile];

// Visualization configuration
const visualization = getVisualization(selectedProfile.visualization);

// Input and Output configuration using a factory approach
const componentFactory = {
  ConsoleInput: () => new ConsoleInput(),
  VoiceInput: () =>
    new VoiceInput(
      aiService,
      consoleOutput,
      visualization,
      process.env.PICOVOICE_API_KEY
    ),
  ConsoleOutput: () => consoleOutput,
  VoiceOutput: () =>
    new VoiceOutput(aiService, consoleOutput, visualization, audioPlayer),
};

const input = componentFactory[selectedProfile.input]();
const output = componentFactory[selectedProfile.output]();

const skills = new SkillBox([new KnizhnyVozSkill(), new TimeSkill(output)]);

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

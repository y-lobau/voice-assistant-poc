import dotenv from "dotenv";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { KnizhnyVozSkill } from "./core/skills/KnizhnyVozSkill";
import { TimeSkill } from "./core/skills/TimeSkill";
import { PlayTestAudioSkill } from "./core/skills/PlayTestAudioSkill";
import { BaradzedSkill } from "./core/skills/Baradzed";

import { ConsoleInput } from "./infrastructure/input/ConsoleInput";
import { ConsoleOutput } from "./infrastructure/output/ConsoleOutput";
import { SkillBox } from "./core/skills/SkillBox";
import { Conversation } from "./core/Conversation";
import { OpenAIService } from "./infrastructure/openAI/OpenAIService";
import VoiceOutput from "./infrastructure/output/VoiceOutput";
import { VoiceInput } from "./infrastructure/input/VoiceInput";
import { ConsoleVisualization } from "./infrastructure/visualisation/ConsoleVisualization";
import { NoVisualization } from "./infrastructure/visualisation/NoVisualization";
import { AudioPlayer } from "./infrastructure/output/AudioPlayer";
import { SimpleMessageDialog } from "./infrastructure/openAI/SimpleMessageDialog";
import { AssistantDialog } from "./infrastructure/openAI/AssistantDialog";
import { Omnibus } from "@hypersphere/omnibus";
import { Events } from "./core/interfaces/Events";
import { BlinktController } from "./infrastructure/visualisation/BlinktController";
import { FeedbackManager } from "./infrastructure/visualisation/FeedbackManager";

// import { ButtonHandler } from "./infrastructure/input/button";

dotenv.config();

const gpt4Model = "gpt-4o";
const gpt3Model = "gpt-3.5-turbo-1106";

const consoleOutput = new ConsoleOutput();
const aiService = new OpenAIService(gpt4Model, consoleOutput);
const audioPlayer = new AudioPlayer(consoleOutput);
let voiceInput: VoiceInput;

const eventBus = new Omnibus<Events>();

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
    visualization: "DeviceVisualization",
  },
  "voice-dev": {
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
  "device-console-voice": {
    input: "ConsoleInput",
    output: "VoiceOutput",
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
      return new BlinktController();
    default:
      return new NoVisualization();
  }
}

// Parse CLI arguments for profile selection
const { profile } = await yargs(hideBin(process.argv)).option("profile", {
  describe: "Predefined profile for the application mode",
  choices: Object.keys(profiles),
  demandOption: true, // Require profile selection
}).argv;

// Select profile based on CLI argument
const selectedProfile = profiles[profile];

// Visualization configuration
const visualization = getVisualization(selectedProfile.visualization);
visualization.initializing();

// Input and Output configuration using a factory approach
const componentFactory = {
  ConsoleInput: () => new ConsoleInput(),
  VoiceInput: () =>
    (voiceInput = new VoiceInput(
      aiService,
      consoleOutput,
      process.env.PICOVOICE_API_KEY,
      eventBus
    )),
  ConsoleOutput: () => consoleOutput,
  VoiceOutput: () =>
    new VoiceOutput(aiService, consoleOutput, audioPlayer, eventBus),
};

// ButtonHandler.init(eventBus);

const simpleMessageHandler = new SimpleMessageDialog(aiService);

// const assistantDialog = new AssistantDialog(consoleOutput, aiService);
let cleanedUp = false;
const input = componentFactory[selectedProfile.input]();
const output = componentFactory[selectedProfile.output]();

const skills = [
  // new KnizhnyVozSkill(audioPlayer),
  // new TimeSkill(output),
  // new PlayTestAudioSkill(audioPlayer),
  new BaradzedSkill(audioPlayer),
];
const skillBox = new SkillBox(skills, eventBus);
FeedbackManager.init(eventBus, visualization);

const conversation = new Conversation(
  input,
  output,
  simpleMessageHandler,
  new SkillBox(skills, eventBus),
  consoleOutput,
  eventBus
);

process.on("exit", cleanup);
process.on("SIGINT", cleanup);

// Catch unhandled exceptions
process.on("uncaughtException", (error) => {
  console.error("Unhandled Exception:", error);
  process.exit(1); // Exit with a failure code
});

// Catch unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1); // Exit with a failure code
});

// Start the conversation
try {
  await conversation.init();
  visualization.initializing(false);
  await conversation.start().catch(console.error);
} catch (e) {
  console.error(e);
}

function cleanup(code) {
  if (code > 0) console.error("Exiting with code", code);

  if (cleanedUp) return;
  cleanedUp = true;

  console.log("cleaning up");
  skillBox.cleanup();
  if (voiceInput) voiceInput.cleanup();

  process.exit();
}

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

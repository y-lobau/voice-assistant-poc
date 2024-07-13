import dotenv from "dotenv";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { KnizhnyVozSkill } from "./core/skills/KnizhnyVozSkill.js";
import { ConsoleInput } from "./infrastructure/input/ConsoleInput.js";
import { ConsoleOutput } from "./infrastructure/output/ConsoleOutput.js";
import { SkillBox } from "./core/skills/SkillBox.js";
import { Conversation } from "./core/Conversation.js";
import { OpenAIService } from "./infrastructure/openAI/OpenAIService.js";
import VoiceOutput from "./infrastructure/output/VoiceOutput.js";
import { VoiceInput } from "./infrastructure/input/VoiceInput.js";
import { ConsoleVisualization } from "./infrastructure/visualisation/ConsoleVisualization.js";
import { TimeSkill } from "./core/skills/TimeSkill.js";
import { NoVisualization } from "./infrastructure/visualisation/NoVisualization.js";
import { AudioPlayer } from "./infrastructure/output/AudioPlayer.js";
import { SimpleMessageDialog } from "./infrastructure/openAI/SimpleMessageDialog.js";
import { AssistantDialog } from "./infrastructure/openAI/AssistantDialog.js";
import { Omnibus } from "@hypersphere/omnibus";
import { Events } from "./core/interfaces/Events.js";
import { BlinktController } from "./infrastructure/visualisation/BlinktController.js";
import { PlayTestAudioSkill } from "./core/skills/PlayTestAudioSkill.js";
import { FeedbackManager } from "./infrastructure/visualisation/FeedbackManager.js";
import { BaradzedSkill } from "./core/skills/Baradzed.js";
import { VoiceRecorder } from "./infrastructure/input/audio/VoiceRecorder.js";
import { AudioWorker } from "./infrastructure/input/audio/AudioWorker.js";
// import { ButtonHandler } from "./infrastructure/input/button.js";

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
const argv = yargs(hideBin(process.argv)).option("profile", {
  describe: "Predefined profile for the application mode",
  choices: Object.keys(profiles),
  demandOption: true, // Require profile selection
}).argv;

// Select profile based on CLI argument
const selectedProfile = profiles[argv.profile];

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

const simpleMessageHandler = new SimpleMessageDialog(
  gpt4Model,
  aiService,
  consoleOutput
);

const assistantDialog = new AssistantDialog(consoleOutput, aiService);
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

async function run() {
  audioPlayer.playUrl("https://download.samplelib.com/mp3/sample-3s.mp3");

  await voiceInput.input({ immediateReplyPossible: true });
  await voiceInput.input({ immediateReplyPossible: true });
}

await run();

// Start the conversation
try {
  // await conversation.init();
  // visualization.initializing(false);
  // await conversation.start().catch(console.error);
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

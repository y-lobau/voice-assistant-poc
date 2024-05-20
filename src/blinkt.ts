const { BlinktController } = require("./BlinktController");

// Instantiate the BlinktController
const blinktController = new BlinktController();

// Get the command-line arguments
const args = process.argv.slice(2);

// Ensure there are enough arguments
if (args.length < 2) {
  console.error("Usage: node visualize.js <visualizationStep> <on|off>");
  process.exit(1);
}

// Parse the arguments
const visualizationStep = args[0].toLowerCase();
const action = args[1].toLowerCase() === "on";

// Define a mapping from the command to the BlinktController methods
const actionsMap = {
  initializing: blinktController.initializing,
  listening: blinktController.listening,
  talking: blinktController.talking,
  thinking: blinktController.thinking,
  waiting: blinktController.waiting,
};

// Check if the visualization step is valid
if (!actionsMap.hasOwnProperty(visualizationStep)) {
  console.error(`Invalid visualization step: ${visualizationStep}`);
  process.exit(1);
}

// Call the appropriate method with the action
actionsMap[visualizationStep].call(blinktController, action);

console.log(
  `Visualization step ${visualizationStep} turned ${action ? "on" : "off"}.`
);

import { BlinktController } from "./infrastructure/visualisation/BlinktController.js";

const visualisation = new BlinktController();

visualisation.initializing(true);
setTimeout(() => {
  visualisation.initializing(false);
}, 10000);

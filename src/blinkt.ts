import { BlinktController } from "./infrastructure/visualisation/BlinktController";

const visualisation = new BlinktController();

visualisation.initializing(true);
setTimeout(() => {
  visualisation.initializing(false);
}, 10000);

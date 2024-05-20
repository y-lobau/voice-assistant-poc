export interface IVisualFeedback {
  // Initializing the application
  initializing();
  initializing(start: boolean);
  // The user input started and the app is listening
  listening();
  listening(start: boolean);
  // The app is responding to the user input
  talking(start: boolean);
  talking();
  // The app processing user input
  thinking();
  thinking(start: boolean);
  // The app waits for the user input
  standby();
  standby(start: boolean);
}

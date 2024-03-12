export interface IVisualFeedback {
  initializing();
  initializing(start: boolean);
  listening();
  listening(start: boolean);
  talking(start: boolean);
  talking();
  thinking();
  thinking(start: boolean);
  waiting();
  waiting(start: boolean);
}

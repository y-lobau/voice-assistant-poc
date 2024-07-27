import { ALEXA } from './hotwords/alexa.js';
import { BUMBLEBEE } from './hotwords/bumblebee.js';
import { COMPUTER } from './hotwords/computer.js';
import { GRASSHOPPER } from './hotwords/grasshopper.js';
import { HEY_EDISON } from './hotwords/hey_edison.js';
import { HEY_GOOGLE } from './hotwords/hey_google.js';
import { HEY_SIRI } from './hotwords/hey_siri.js';
import { JARVIS } from './hotwords/jarvis.js';
import { OK_GOOGLE } from './hotwords/ok_google.js';
import { PORCUPINE } from './hotwords/porcupine.js';
import { TERMINATOR } from './hotwords/terminator.js';

export enum BuiltInKeyword {
  Alexa = 'Alexa',
  Bumblebee = 'Bumblebee',
  Computer = 'Computer',
  Grasshopper = 'Grasshopper',
  HeyEdison = 'Hey Edison',
  HeyGoogle = 'Hey Google',
  HeySiri = 'Hey Siri',
  Jarvis = 'Jarvis',
  OkayGoogle = 'Okay Google',
  Porcupine = 'Porcupine',
  Terminator = 'Terminator',
}

export const BUILT_IN_KEYWORD_BYTES = new Map<BuiltInKeyword, Uint8Array>();
BUILT_IN_KEYWORD_BYTES.set(BuiltInKeyword.Alexa, ALEXA);
BUILT_IN_KEYWORD_BYTES.set(BuiltInKeyword.Bumblebee, BUMBLEBEE);
BUILT_IN_KEYWORD_BYTES.set(BuiltInKeyword.Computer, COMPUTER);
BUILT_IN_KEYWORD_BYTES.set(BuiltInKeyword.Grasshopper, GRASSHOPPER);
BUILT_IN_KEYWORD_BYTES.set(BuiltInKeyword.HeyEdison, HEY_EDISON);
BUILT_IN_KEYWORD_BYTES.set(BuiltInKeyword.HeyGoogle, HEY_GOOGLE);
BUILT_IN_KEYWORD_BYTES.set(BuiltInKeyword.HeySiri, HEY_SIRI);
BUILT_IN_KEYWORD_BYTES.set(BuiltInKeyword.Jarvis, JARVIS);
BUILT_IN_KEYWORD_BYTES.set(BuiltInKeyword.OkayGoogle, OK_GOOGLE);
BUILT_IN_KEYWORD_BYTES.set(BuiltInKeyword.Porcupine, PORCUPINE);
BUILT_IN_KEYWORD_BYTES.set(BuiltInKeyword.Terminator, TERMINATOR);


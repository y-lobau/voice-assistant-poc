import { expect } from "chai";
import * as sinon from "sinon";

import { SpeechRound } from "../../src/core/SpeechRound";

describe("SpeechRound Tests", function () {
  let speechRound: SpeechRound;
  let dateNow: number;
  let dateNowProvider = { now: () => dateNow };

  function timePassed(from: number, millis: number): number {
    return (dateNow = from + millis);
  }

  function speek(lengthMs: number, time: number = Date.now()) {
    dateNow = time;
    speechRound.speaking(new Int16Array());
    timePassed(time, lengthMs);
    speechRound.silence();
    return time + lengthMs;
  }

  beforeEach(function () {
    // speechRound = new SpeechRound(0, null, null, 500, 4000, 1000);
  });

  afterEach(function () {
    dateNow = 0;
  });

  it("should not detect speech if there was no speech", function () {
    speechRound = SpeechRound.new();
    expect(speechRound.speechDetected).to.be.false, "Speech detected";
  });

  it("should not detect speech if speech length was < min threshold", function () {
    // arrange
    const thresholdMs = 500;
    speechRound = new SpeechRound(
      dateNowProvider,
      0,
      null,
      null,
      thresholdMs,
      4000,
      1000
    );

    // act
    speek(200);

    // assert
    expect(speechRound.speechDetected).to.be.false;
  });

  it("should have speech length = 0 if there was no speech", function () {
    speechRound = SpeechRound.new();
    expect(speechRound.speechLengthMs).to.equal(0, "Speech length");
  });

  it("should detect speech if speech length was >= min threshold", function () {
    // arrange
    const thresholdMs = 500;
    speechRound = new SpeechRound(
      dateNowProvider,
      0,
      null,
      null,
      thresholdMs,
      4000,
      1000
    );

    // act
    speek(600);

    // assert
    expect(speechRound.speechDetected).to.be.true;
  });

  it("should have correct speech length if speech was detected", function () {
    // arrange
    const thresholdMs = 500;
    speechRound = new SpeechRound(
      dateNowProvider,
      0,
      null,
      null,
      thresholdMs,
      4000,
      1000
    );
    let now = Date.now();

    // act
    now = speek(600, now);
    now = timePassed(now, 300);
    speek(600, now);

    // assert
    expect(speechRound.speechLengthMs).to.equal(1200);
  });

  it("should timeout in long timeout interval if no speech detected", function () {});
  it("should timeout in long timeout interval if speech detected < min threshold", function () {});
  it("should timeout in short timeout interval if speech detected >= min threshold", function () {});
});

// import https from "https";
// import prism from "prism-media";

// async function loadSpeaker() {
//   const { default: Speaker } = await import('sdl-speaker');
//   return new Speaker({
//     channels: 2,
//     bitDepth: 16,
//     sampleRate: 44100,
//   });
// }

// const speaker = await loadSpeaker();

// export class SimplePlayer {
//   decoder;
//   speaker;
//   isPlaying;
//   stream;

//   constructor() {
//     this.decoder = new prism.FFmpeg({
//       args: [
//         "-analyzeduration",
//         "0",
//         "-loglevel",
//         "0",
//         "-f",
//         "s16le",
//         "-ar",
//         "44100",
//         "-ac",
//         "2",
//       ],
//     });
    
//     this.speaker = speaker;
//     this.isPlaying = false;
//   }

//   play(url) {
//     if (this.isPlaying) {
//       console.log("Already playing");
//       return;
//     }
//     this.stream = https.get(url, (response) => {
//       this.isPlaying = true;
//       response.pipe(this.decoder).pipe(this.speaker);
//     });

//     this.speaker.on("close", () => {
//       this.isPlaying = false;
//       console.log("Playback finished");
//     });
//   }

//   pause() {
//     if (!this.isPlaying) {
//       console.log("Nothing is playing");
//       return;
//     }
//     this.decoder.unpipe(this.speaker);
//     this.isPlaying = false;
//     console.log("Paused");
//   }

//   resume() {
//     if (this.isPlaying) {
//       console.log("Already playing");
//       return;
//     }
//     this.decoder.pipe(this.speaker);
//     this.isPlaying = true;
//     console.log("Resumed");
//   }

//   stop() {
//     if (!this.isPlaying) {
//       console.log("Nothing is playing");
//       return;
//     }
//     this.stream.destroy(); // Stops downloading the stream
//     this.decoder.unpipe(this.speaker);
//     this.speaker.end(); // Close the speaker and clean up
//     this.isPlaying = false;
//     console.log("Stopped");
//   }
// }

// // Usage
// const player = new SimplePlayer();
// const url = "https://example.com/path/to/audio.mp3"; // Replace with your HTTPS URL

// // Example commands:
// player.play(url);

// // Later, to pause, resume, or stop:
// // player.pause();
// // player.resume();
// // player.stop();

// test.js
var Speaker = require('audio-speaker/stream');
var Generator = require('audio-generator/stream');

Generator(function (time) {
	//panned unisson effect
	var τ = Math.PI * 2;
	return [Math.sin(τ * time * 441), Math.sin(τ * time * 439)];
})
.pipe(Speaker({
	//PCM input format defaults, optional.
	//channels: 2,
	//sampleRate: 44100,
	//byteOrder: 'LE',
	//bitDepth: 16,
	//signed: true,
	//float: false,
	//interleaved: true,
}));
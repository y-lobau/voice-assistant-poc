import { EventEmitter } from "events";

import { PorcupineModule as PorcupineModuleUntyped} from "./pv_porcupine.js";
import { BuiltInKeyword, BUILT_IN_KEYWORD_BYTES } from "./built_in_keywords.js";

type thenType = (PorcupineModule) => any;

interface PorcupineModule {
  then: (thenType) => PorcupineModule;
  HEAPU8: Uint8Array;
  _malloc: (size: number) => number;
  _free: (ptr: number) => void;
}

export class Porcupine {
  /**
   * Binding for wake word detection object. It initializes the JS binding for WebAssembly module and exposes
   * a factory method for creating new instances of wake word engine.
   */

  private static _initWasm = null;
  private static _releaseWasm = null;
  private static _processWasm = null;
  private static _sampleRate = null;
  private static _frameLength = null;
  private static _version = null;

  public static loader = new EventEmitter();

  private static _porcupineModule: PorcupineModule = PorcupineModuleUntyped() as unknown as PorcupineModule;

  private readonly _handleWasm: number;
  private readonly _pcmWasmPointer: number;

  static {
    Porcupine._porcupineModule.then((Module) => {
      Porcupine._initWasm = Module.cwrap("pv_porcupine_wasm_init", "number", [
        "number",
        "number",
        "number",
        "number",
      ]);
      Porcupine._releaseWasm = Module.cwrap("pv_porcupine_wasm_delete", [
        "number",
      ]);
      Porcupine._processWasm = Module.cwrap(
        "pv_porcupine_wasm_process",
        "number",
        ["number", "number"]
      );
      Porcupine._sampleRate = Module.cwrap(
        "pv_wasm_sample_rate",
        "number",
        []
      )();
      Porcupine._frameLength = Module.cwrap(
        "pv_porcupine_wasm_frame_length",
        "number",
        []
      )();
      Porcupine._version = Module.cwrap(
        "pv_porcupine_wasm_version",
        "string",
        []
      )();

      Porcupine.loader.emit("ready");
    });
  }

  /**
   * Flag indicating if 'PorcupineModule' is loaded. .create() can only be called after loading is finished.
   */
  public static isLoaded(): boolean {
    return Porcupine._initWasm != null;
  }

  private constructor(handleWasm: number, pcmWasmPointer: number) {
    this._handleWasm = handleWasm;
    this._pcmWasmPointer = pcmWasmPointer;
  }

  /**
   * Creates an instance of wake word detection engine (aka porcupine). Can be called only after .isLoaded()
   * returns true.
   * @param {Array} Array of keyword IDs. A keyword ID is the signature for a given phrase to be detected. Each
   * keyword ID should be stored as UInt8Array.
   * @param {Float32Array} Detection sensitivity. A higher sensitivity reduces miss rate at the cost of higher
   * false alarm rate. Sensitivity is a number within [0, 1].
   * @returns An instance of wake word detection engine.
   */
  public static create(
    keywords: BuiltInKeyword[],
    sensitivities: number[]
  ): Porcupine {
    if (keywords === null || keywords === undefined || keywords.length === 0) {
        throw new Error(
          `keywordPaths are null/undefined/empty (${keywords})`
        );
      }
  
      if (
        sensitivities === null ||
        sensitivities === undefined ||
        sensitivities.length === 0
      ) {
        throw new Error(
          `sensitivities are null/undefined/empty (${sensitivities})`
        );
      }
  
      for (const sensitivity of sensitivities) {
        if (sensitivity < 0 || sensitivity > 1 || isNaN(sensitivity)) {
          throw new RangeError(
            `Sensitivity value in 'sensitivities' not in range [0,1]: ${sensitivity}`
          );
        }
      }
  
      if (!Array.isArray(keywords)) {
        throw new Error(`Keywords is not an array: ${keywords}`);
      }
  
      if (keywords.length !== sensitivities.length) {
        throw new Error(
          `Number of keywords (${keywords.length}) does not match number of sensitivities (${sensitivities.length})`
        );
      }

    const keywordIDs = keywords.map((keyword) => BUILT_IN_KEYWORD_BYTES.get(keyword));
    const sensitivitiesArray = new Float32Array(sensitivities)

    const keywordIDSizes = Int32Array.from(
      keywordIDs.map((keywordID) => keywordID.byteLength)
    );

    const keywordIDSizesPointer = Porcupine._porcupineModule._malloc(
      keywordIDSizes.byteLength
    );
    const keywordIDSizesBuffer = new Uint8Array(
      Porcupine._porcupineModule.HEAPU8.buffer,
      keywordIDSizesPointer,
      keywordIDSizes.byteLength
    );
    keywordIDSizesBuffer.set(new Uint8Array(keywordIDSizes.buffer));

    const keywordIDPointers = Uint32Array.from(
      keywordIDs.map((keywordID) => {
        const heapPointer = Porcupine._porcupineModule._malloc(
          keywordID.byteLength
        );
        const heapBuffer = new Uint8Array(
          Porcupine._porcupineModule.HEAPU8.buffer,
          heapPointer,
          keywordID.byteLength
        );
        heapBuffer.set(keywordID);
        return heapPointer;
      })
    );

    const keywordIDPointersPointer = Porcupine._porcupineModule._malloc(
      keywordIDPointers.byteLength
    );
    const keywordIDPointersBuffer = new Uint8Array(
      Porcupine._porcupineModule.HEAPU8.buffer,
      keywordIDPointersPointer,
      keywordIDPointers.byteLength
    );
    keywordIDPointersBuffer.set(new Uint8Array(keywordIDPointers.buffer));

    const sensitivitiesPointer = Porcupine._porcupineModule._malloc(
      sensitivitiesArray.byteLength
    );
    const sensitivitiesBuffer = new Uint8Array(
      Porcupine._porcupineModule.HEAPU8.buffer,
      sensitivitiesPointer,
      sensitivitiesArray.byteLength
    );
    sensitivitiesBuffer.set(new Uint8Array(sensitivitiesArray.buffer));

    const handleWasm = Porcupine._initWasm(
      keywordIDs.length,
      keywordIDSizesPointer,
      keywordIDPointersPointer,
      sensitivitiesPointer
    );
    if (handleWasm === 0) {
      throw new Error("failed to initialize porcupine.");
    }

    const pcmWasmPointer = Porcupine._porcupineModule._malloc(
      Porcupine._frameLength * 2
    );

    return new Porcupine(handleWasm, pcmWasmPointer);
  }

  public release(): void {
    /**
     * Releases resources acquired by WebAssembly module.
     */

    Porcupine._releaseWasm(this._handleWasm);
    Porcupine._porcupineModule._free(this._pcmWasmPointer);
  }

  public process(pcmInt16Array: Int16Array): number {
    /**
     * Processes a frame of audio. The required sample rate can be retrieved from .sampleRate and the length of
     * frame (number of samples within frame) can be retrieved from .frameLength.
     * @param {Int16Array} A frame of audio with properties described above.
     * @returns {Number} Index of detected keyword (phrase). When no keyword is detected it returns -1.
     */

    const pcmWasmBuffer = new Uint8Array(
      Porcupine._porcupineModule.HEAPU8.buffer,
      this._pcmWasmPointer,
      pcmInt16Array.byteLength
    );
    pcmWasmBuffer.set(new Uint8Array(pcmInt16Array.buffer));

    const keyword_index = Porcupine._processWasm(
      this._handleWasm,
      this._pcmWasmPointer
    );
    if (keyword_index === -2) {
      throw new Error("porcupine failed to process audio");
    }

    return keyword_index;
  }

  public sampleRate: number = Porcupine._sampleRate;
  public frameLength: number = Porcupine._frameLength;
  public version: string = Porcupine._version;
}

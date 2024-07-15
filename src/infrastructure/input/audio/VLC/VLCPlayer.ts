import * as VLC from "vlc-client";
import { spawn, ChildProcess } from "child_process";
import { IConsole } from "../../../../core/interfaces/IConsole";
import { VlcStatus } from "vlc-client/dist/Types";

export class VLCPlayer {
  private vlc: VLC.Client;
  private vlcProcess: ChildProcess | null = null;
  private statusChecker: NodeJS.Timeout | null = null;
  private state: string | undefined;
  private resolver: () => void = () => {};
  private rejector: (error: Error) => void = () => {};

  constructor(private console: IConsole) {
    this.vlc = new VLC.Client({
      ip: "localhost",
      port: 8080,
      password: "1234",
    });

    this.init().catch((error) => {
      console.errorStr("Failed to initialize VLCPlayer:", error);
    });
  }

  private async startVLCProcess(): Promise<void> {
    this.vlcProcess = spawn("vlc", [
      "--intf",
      "dummy",
      "--extraintf",
      "http",
      "--http-password",
      "1234",
    ]);

    this.vlcProcess.stderr?.on("data", (data) => {
      this.console.errorStr(`VLC stderr: ${data}`);
    });

    this.vlcProcess.stdout?.on("data", (data) => {
      this.console.debug(`VLC stdout: ${data}`);
    });

    this.vlcProcess.on("error", (err) => {
      console.error("Error starting VLC process:", err);
    });

    this.vlcProcess.on("exit", (code, signal) => {
      console.log(`VLC process exited with code ${code} and signal ${signal}`);
      this.cleanup();
    });

    await this.waitForVLCReady();
  }

  private async waitForVLCReady(): Promise<void> {
    const maxAttempts = 20; // 10 seconds
    let attempt = 0;

    while (attempt < maxAttempts) {
      try {
        await this.vlc.status();
        return;
      } catch (error) {
        console.log(
          `VLC not ready, retrying in 500ms... Attempt ${
            attempt + 1
          }/${maxAttempts}`
        );
        await new Promise((resolve) => setTimeout(resolve, 500));
        attempt++;
      }
    }

    throw new Error("Timeout waiting for VLC to be ready");
  }

  public async init(): Promise<void> {
    await this.startVLCProcess();

    this.statusChecker = setInterval(async () => {
      try {
        const status = await this.vlc.status();
        if (this.state && status.state !== this.state) {
          if (status.state === "stopped") {
            this.onExit();
          }
        }
        // console.debug("VLC status:", status.state);
        this.state = status.state;
      } catch (error) {
        this.console.errorStr("Error fetching VLC status:", error);
        this.rejector(error);
      }
    }, 200);
  }

  public cleanup(): void {
    if (this.vlcProcess) {
      this.vlcProcess.kill();
      this.vlcProcess = null;
    }

    if (this.statusChecker) {
      clearInterval(this.statusChecker);
      this.statusChecker = null;
    }
  }

  public onExit(): void {
    this.cleanup();
    this.resolver();
  }

  public playUrl(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.resolver = resolve;
      this.rejector = reject;
      this.vlc.playFile(url);
    });
  }
}

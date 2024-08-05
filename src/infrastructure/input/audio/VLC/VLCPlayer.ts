import * as VLC from "vlc-client";
import { spawn, ChildProcess, exec } from "child_process";
import { IConsole } from "../../../../core/interfaces/IConsole";
import ps from "ps-node";

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
  }

  public async init(): Promise<void> {
    await this.startVLCProcess();
  }

  private async startVLCProcess(): Promise<void> {
    const existingPid = await this.findVLCProcess();
    if (existingPid) {
      this.killOldVLC(existingPid);
    }

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
    });
    await this.waitForVLCReady();
  }

  private async findVLCProcess(): Promise<number | null> {
    return new Promise<number | null>((resolve, reject) => {
      ps.lookup({ command: "vlc" }, (err, resultList) => {
        if (err) {
          this.console.errorStr("Error checking for VLC process:", err);
          resolve(null); // Handle errors gracefully
        } else if (resultList.length > 0) {
          this.console.debug(
            `Found vlc process with PID: ${resultList[0].pid}`
          );
          resolve(resultList[0].pid); // Return the PID of the first matching VLC process
        } else {
          this.console.debug("No VLC process found");
          resolve(null); // No VLC process found
        }
      });
    });
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

  private onAudioStopped(): void {
    this.stopCheckingStatus();
    this.resolver();
  }

  private subscribeToVLCStatus(): void {
    this.statusChecker = setInterval(async () => {
      try {
        const status = await this.vlc.status();
        if (this.state && status.state !== this.state) {
          if (status.state === "stopped") {
            this.onAudioStopped();
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

  public killOldVLC(existingPid: number): void {
    this.console.info(`Killing existing VLC process with PID ${existingPid}`);
    exec(`kill ${existingPid}`, (err) => {
      if (err) {
        this.console.errorStr("Error killing old VLC process:", err);
      }
    });
  }

  public async stopCheckingStatus(): Promise<void> {
    if (this.statusChecker) {
      clearInterval(this.statusChecker);
      this.statusChecker = null;
    }
  }

  public async playUrl(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.resolver = resolve;
      this.rejector = reject;

      return this.vlc.playFile(url).then(() => {
        this.subscribeToVLCStatus();
      });
    });
  }

  public cleanup(): void {
    this.console.info("Cleaning up VLC player");
    if (this.vlcProcess) {
      this.vlcProcess.kill();
      this.vlcProcess = null;
    }
    if (this.statusChecker) {
      clearInterval(this.statusChecker);
      this.statusChecker = null;
    }
  }
}

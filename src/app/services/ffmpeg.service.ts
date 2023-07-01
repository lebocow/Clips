import { Injectable } from '@angular/core';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

const SCREENSHOT_SECONDS = [1, 2, 3];

@Injectable({
  providedIn: 'root',
})
export class FfmpegService {
  isReady = false;
  private ffmpeg;

  constructor() {
    this.ffmpeg = createFFmpeg({ log: true });
  }

  async init(): Promise<void> {
    if (!this.isReady) {
      await this.ffmpeg.load();
      this.isReady = true;
    }
  }

  private generateCommands(fileName: string): string[] {
    const commands: string[] = [];
    SCREENSHOT_SECONDS.forEach((second) => {
      commands.push(
        '-i',
        fileName,
        '-ss',
        `00:00:0${second}`,
        '-frames:v',
        '1',
        '-filter:v',
        'scale=510:-1',
        `output_0${second}.png`
      );
    });
    return commands;
  }

  private createScreenshotUrls(): string[] {
    const screenshots: string[] = [];
    SCREENSHOT_SECONDS.forEach((second) => {
      const screenshotFile = this.ffmpeg.FS(
        'readFile',
        `output_0${second}.png`
      );
      const screenshotBlob = new Blob([screenshotFile.buffer], {
        type: 'image/png',
      });

      const screenshotUrl = URL.createObjectURL(screenshotBlob);
      screenshots.push(screenshotUrl);
    });

    return screenshots;
  }

  async getScreenshots(file: File): Promise<string[]> {
    try {
      const data = await fetchFile(file);
      this.ffmpeg.FS('writeFile', file.name, data);
      await this.ffmpeg.run(...this.generateCommands(file.name));
      return this.createScreenshotUrls();
    } catch (error) {
      console.error('Failed to generate screenshots:', error);
      return [];
    }
  }

  async blobFromUrl(url: string) {
    const response = await fetch(url);
    const blob = await response.blob();
    return blob;
  }
}

import { Component, NgZone, OnDestroy, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Timestamp } from '@angular/fire/firestore';
import {
  Storage,
  StorageError,
  StorageReference,
  UploadTask,
  UploadTaskSnapshot,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from '@angular/fire/storage';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  forkJoin,
  map,
  scan,
} from 'rxjs';
import IClip from 'src/app/models/clip.model';
import { ClipsService } from 'src/app/services/clips.service';
import { FfmpegService } from 'src/app/services/ffmpeg.service';

import { v4 as uuid } from 'uuid';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css'],
})
export class UploadComponent implements OnDestroy {
  private storage: Storage = inject(Storage);
  private ngZone = inject(NgZone);
  private auth = inject(Auth);
  private clipService = inject(ClipsService);
  private router = inject(Router);
  public ffmpegService = inject(FfmpegService);

  private uploadTaskProgress$ = new BehaviorSubject<number>(0);
  private screenshotUploadTaskProgress$ = new BehaviorSubject<number>(0);
  public percentage$: Observable<number>;

  isDragover = false;
  file: File | null = null;
  isStoring: boolean = false;
  showPercentage = false;
  showAlert = false;
  alertMsg = 'Please wait! Your file is being uploaded';
  alertColor = 'blue';
  inSubmission = false;
  clipUploadTask?: UploadTask;
  screenshotUploadTask?: UploadTask;
  screenshots: string[] = [];
  selectedScreenshot = '';

  title = new FormControl('', {
    validators: [Validators.required, Validators.minLength(3)],
    nonNullable: true,
  });

  uploadForm = new FormGroup({
    title: this.title,
  });

  constructor() {
    this.ffmpegService.init();
    this.percentage$ = combineLatest([
      this.uploadTaskProgress$,
      this.screenshotUploadTaskProgress$,
    ]).pipe(
      map(([uploadProg, screenshotProg]) => (uploadProg + screenshotProg) / 2)
    );
  }

  ngOnDestroy(): void {
    this.cancelUploadProcess();
  }

  selectScreenshot(screenshot: string) {
    this.selectedScreenshot = screenshot;
  }

  async storeFile($event: Event) {
    this.isStoring = true;
    this.isDragover = false;

    const dragEvent = $event as DragEvent;
    const htmlInput = $event.target as HTMLInputElement;
    const tempFile =
      dragEvent.dataTransfer?.files.item(0) ?? htmlInput.files?.item(0) ?? null;

    if (!tempFile || tempFile.type !== 'video/mp4') {
      return;
    }

    this.screenshots = await this.ffmpegService.getScreenshots(tempFile);

    this.selectedScreenshot = this.screenshots[0];

    this.file = tempFile;

    this.title.setValue(this.file.name.replace(/\.[^/.]+$/, ''));
    this.isStoring = false;
  }

  async uploadFile() {
    if (!this.file) {
      console.log('No file selected for upload.');
      return;
    }

    this.uploadForm.disable();

    this.startUploadProcess();

    const clipFileName = uuid();
    const clipPath = `clips/${clipFileName}.mp4`;
    const screenshotPath = `screenshots/${clipFileName}.png`;

    const screenshotBlob = await this.ffmpegService.blobFromUrl(
      this.selectedScreenshot
    );

    const storageClipRef = ref(this.storage, clipPath);
    const storageScreenshotRef = ref(this.storage, screenshotPath);

    this.clipUploadTask = uploadBytesResumable(storageClipRef, this.file);

    this.clipUploadTask.on('state_changed', {
      next: (snapshot) => {
        this.ngZone.run(() => {
          const percentage = snapshot.bytesTransferred / snapshot.totalBytes;
          console.log(percentage);
          this.uploadTaskProgress$.next(percentage);
        });
      },
      error: (error) => this.onUploadError(error),
      complete: () =>
        this.onUploadComplete(
          storageClipRef,
          storageScreenshotRef,
          clipFileName
        ),
    });

    this.screenshotUploadTask = uploadBytesResumable(
      storageScreenshotRef,
      screenshotBlob
    );

    this.screenshotUploadTask.on('state_changed', {
      next: (snapshot) => {
        const percentage = snapshot.bytesTransferred / snapshot.totalBytes;
        this.screenshotUploadTaskProgress$.next(percentage);
      },
    });
  }

  private startUploadProcess() {
    this.showAlert = true;
    this.inSubmission = true;
    this.showPercentage = true;
  }

  private cancelUploadProcess() {
    this.clipUploadTask?.cancel();
  }

  private onUploadError(error: StorageError) {
    this.ngZone.run(() => {
      console.error(error);
      this.uploadForm.enable();
      this.alertMsg = 'Upload failed! Please try again later';
      this.alertColor = 'red';
      this.inSubmission = true;
      this.showPercentage = false;
    });
  }

  private onUploadComplete(
    storageClipRef: StorageReference,
    storageScreenshotRef: StorageReference,
    clipFileName: string
  ) {
    this.ngZone.run(async () => {
      const clipUrl = await getDownloadURL(storageClipRef);
      const screenshotUrl = await getDownloadURL(storageScreenshotRef);

      const clip: IClip = {
        uid: this.auth.currentUser?.uid as string,
        displayName: this.auth.currentUser?.displayName as string,
        title: this.title.value,
        fileName: `${clipFileName}.mp4`,
        screenshotFileName: `${clipFileName}.png`,
        url: clipUrl,
        screenshotUrl: screenshotUrl,
        timestamp: Timestamp.now(),
      };

      const clipDocRef = await this.clipService.createClip(clip);

      this.alertMsg = 'Succes! Your file has been uploaded!';
      this.alertColor = 'green';
      this.showPercentage = false;
      this.inSubmission = false;

      setTimeout(() => {
        this.router.navigate(['clip', clipDocRef.id]);
      }, 1000);
    });
  }
}

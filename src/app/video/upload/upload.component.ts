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
import IClip from 'src/app/models/clip.model';
import { ClipsService } from 'src/app/services/clips.service';

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

  isDragover = false;
  file: File | null = null;
  percentage = 0;
  showPercentage = false;
  showAlert = false;
  alertMsg = 'Please wait! Your file is being uploaded';
  alertColor = 'blue';
  inSubmission = false;
  uploadTask?: UploadTask;

  title = new FormControl('', {
    validators: [Validators.required, Validators.minLength(3)],
    nonNullable: true,
  });

  uploadForm = new FormGroup({
    title: this.title,
  });

  ngOnDestroy(): void {
    this.cancelUploadProcess();
  }

  storeFile($event: Event) {
    this.isDragover = false;

    const dragEvent = $event as DragEvent;
    const htmlInput = $event.target as HTMLInputElement;
    this.file =
      dragEvent.dataTransfer?.files.item(0) ?? htmlInput.files?.item(0) ?? null;

    if (!this.file || this.file.type !== 'video/mp4') return;
    this.title.setValue(this.file.name.replace(/\.[^/.]+$/, ''));
  }

  uploadFile() {
    if (!this.file) {
      console.log('No file selected for upload.');
      return;
    }
    this.uploadForm.disable();

    this.startUploadProcess();

    const clipFileName = uuid();
    const clipPath = `clips/${clipFileName}.mp4`;

    // Set the correct storage ref path
    const storageRef = ref(this.storage, clipPath);

    this.uploadTask = uploadBytesResumable(storageRef, this.file);

    this.uploadTask.on('state_changed', {
      next: (snapshot) => this.onUploadProgress(snapshot),
      error: (error) => this.onUploadError(error),
      complete: () => this.onUploadComplete(storageRef, clipFileName),
    });
  }

  private startUploadProcess() {
    this.showAlert = true;
    this.inSubmission = true;
    this.showPercentage = true;
  }

  private cancelUploadProcess() {
    this.uploadTask?.cancel();
  }

  private onUploadProgress(snapshot: UploadTaskSnapshot) {
    this.ngZone.run(() => {
      this.percentage = snapshot.bytesTransferred / snapshot.totalBytes;
    });
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

  private onUploadComplete(storageRef: StorageReference, clipFileName: string) {
    this.ngZone.run(async () => {
      const url = await getDownloadURL(storageRef);
      const clip: IClip = {
        uid: this.auth.currentUser?.uid as string,
        displayName: this.auth.currentUser?.displayName as string,
        title: this.title.value,
        fileName: `${clipFileName}.mp4`,
        url,
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

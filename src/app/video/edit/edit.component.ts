import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import IClip from 'src/app/models/clip.model';
import { ClipsService } from 'src/app/services/clips.service';
import { ModalService } from 'src/app/services/modal.service';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.css'],
})
export class EditComponent implements OnInit, OnDestroy, OnChanges {
  @Input() activeClip: IClip | null = null;
  @Output() update = new EventEmitter();

  private modal = inject(ModalService);
  private clipService = inject(ClipsService);

  showAlert = false;
  alertMsg = 'Please wait! Your file is being modified';
  alertColor = 'blue';
  inSubmission = false;

  clipID = new FormControl('', { nonNullable: true });
  title = new FormControl('', {
    validators: [Validators.required, Validators.minLength(3)],
    nonNullable: true,
  });

  editForm = new FormGroup({
    title: this.title,
    id: this.clipID,
  });

  ngOnInit(): void {
    this.modal.register('editClip');
  }

  ngOnDestroy(): void {
    this.modal.unregister('editClip');
  }

  ngOnChanges(): void {
    if (!this.activeClip) return;
    this.clipID.setValue(this.activeClip.docID as string);
    this.title.setValue(this.activeClip.title);

    this.inSubmission = false;
    this.showAlert = false;
  }

  async submit(): Promise<void> {
    if (!this.activeClip) return;

    this.startEditProcess();
    this.editForm.disable();

    try {
      await this.clipService.updateClipTitle(
        this.clipID.value,
        this.title.value
      );
      this.title.setValue(this.title.value);
    } catch (error) {
      this.onEditError(error);
      return;
    }

    this.onEditComplete();
  }

  private startEditProcess(): void {
    this.inSubmission = true;
    this.showAlert = true;
    this.alertMsg = 'Please wait! Your file is being modified';
    this.alertColor = 'blue';
  }

  private onEditError(error: any): void {
    console.error(error);

    this.inSubmission = true;
    this.editForm.enable();
    this.alertMsg = 'Edit failed! Please try again later';
    this.alertColor = 'red';
  }

  private onEditComplete(): void {
    if (!this.activeClip) return;

    this.activeClip.title = this.title.value;
    this.update.emit(this.activeClip);

    this.inSubmission = false;
    this.editForm.enable();
    this.alertMsg = 'Succes! Your file has been edited!';
    this.alertColor = 'green';
  }
}

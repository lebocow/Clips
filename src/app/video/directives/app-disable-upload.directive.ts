import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[app-disable-upload]',
})
export class DisableUploadDirective {
  @Input('appDisableUpload') isStoring: boolean = false;
  @Input('inputRef') inputRef!: HTMLInputElement;

  @HostListener('drop', ['$event'])
  @HostListener('click', ['$event'])
  handleEvent(event: MouseEvent) {
    if (this.isStoring) {
      event.preventDefault();
      event.stopPropagation();
      this.inputRef.onclick = (event) => {
        event.stopPropagation();
        event.preventDefault();
      };
    }
  }
}

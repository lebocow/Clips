import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'safeURL',
})
export class SafeURLPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(value: string) {
    return this.sanitizer.bypassSecurityTrustUrl(value);
  }
}

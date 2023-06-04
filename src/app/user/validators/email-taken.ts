import { Injectable, inject } from '@angular/core';
import {
  AbstractControl,
  AsyncValidator,
  ValidationErrors,
} from '@angular/forms';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { Auth, fetchSignInMethodsForEmail } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class EmailTaken implements AsyncValidator {
  private auth = inject(Auth);

  validate = (
    control: AbstractControl
  ): Observable<ValidationErrors | null> => {
    return from(fetchSignInMethodsForEmail(this.auth, control.value)).pipe(
      map((response) => (response.length ? { emailTaken: true } : null))
    );
  };
}

// Promise version
//   validate = (control: AbstractControl): Promise<ValidationErrors | null> => {
//     return fetchSignInMethodsForEmail(this.auth, control.value).then(
//       (response) => (response.length ? { emailTaken: true } : null)
//     );
//   };

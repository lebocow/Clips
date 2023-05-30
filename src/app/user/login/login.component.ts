import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import IUser from 'src/app/models/user.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  isSubmitting: boolean = false;
  shouldShowAlert: boolean = false;
  alertMessage: string = 'Please wait to log in!';
  alertColor: string = 'blue';

  credentials: IUser = {
    email: '',
    password: '',
  };

  constructor(private auth: AuthService) {}

  async login() {
    this.shouldShowAlert = true;
    this.isSubmitting = true;

    try {
      await this.auth.loginUser(this.credentials);
    } catch (error) {
      console.error(error);

      this.alertMessage = this.getErrorMessage();
      this.alertColor = 'red';
      this.isSubmitting = false;

      return;
    }

    this.alertMessage = 'Success! You are logged in!';
    this.alertColor = 'green';
  }

  private getErrorMessage(): string {
    return 'Something is wrong! Check again your email and password!';
  }
}

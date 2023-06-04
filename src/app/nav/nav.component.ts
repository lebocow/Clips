import { Component, inject } from '@angular/core';
import { ModalService } from '../services/modal.service';

import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css'],
})
export class NavComponent {
  public modal: ModalService = inject(ModalService);
  public auth: AuthService = inject(AuthService);

  toggleModal($event: Event) {
    $event.preventDefault();
    this.modal.toggleModal('auth');
  }
}

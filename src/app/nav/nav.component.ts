import { Component, inject } from '@angular/core';
import { ModalService } from '../services/modal.service';

import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css'],
})
export class NavComponent {
  public modal: ModalService = inject(ModalService);
  public auth = inject(AuthService);

  constructor() {}

  toggleModal($event: Event) {
    $event.preventDefault();
    this.modal.toggleModal('auth');
  }
}

import { Injectable } from '@angular/core';

interface IModal {
  id: string;
  visible: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  public modals: Map<string, IModal> = new Map();

  isModalOpen(id: string): boolean {
    return this.modals.get(id)?.visible ?? false;
  }

  toggleModal(id: string) {
    const modal = this.modals.get(id);
    modal && (modal.visible = !modal.visible);
  }

  register(id: string) {
    this.modals.set(id, {
      id,
      visible: false,
    });
  }

  unregister(id: string) {
    this.modals.delete(id);
  }
}

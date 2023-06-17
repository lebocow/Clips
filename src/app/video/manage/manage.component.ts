import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import IClip from 'src/app/models/clip.model';
import { ClipsService } from 'src/app/services/clips.service';
import { ModalService } from 'src/app/services/modal.service';

@Component({
  selector: 'app-manage',
  templateUrl: './manage.component.html',
  styleUrls: ['./manage.component.css'],
})
export class ManageComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private clipService = inject(ClipsService);
  private modal = inject(ModalService);

  clips: IClip[] = [];
  activeClip: IClip | null = null;

  sort$: BehaviorSubject<string> = new BehaviorSubject('1');

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const sortParam = params.get('sort');
      this.sort$.next(sortParam === '2' ? '2' : '1');
    });
    this.clipService.getUserClips(this.sort$).subscribe((clips) => {
      this.clips = clips;
    });
  }

  sort(event: Event) {
    const { value } = event.target as HTMLSelectElement;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        sort: value,
      },
    });
  }

  trackByFn(index: number, item: IClip): any {
    return item.docID;
  }

  openModal($event: Event, clip: IClip) {
    $event.preventDefault();

    this.activeClip = clip;
    this.modal.toggleModal('editClip');
  }

  update($event: IClip) {
    this.clips.forEach((element, index) => {
      if (element.docID === $event.docID) {
        this.clips[index].title = $event.title;
      }
    });
  }

  async deleteClip($event: Event, clip: IClip) {
    $event.preventDefault();
    try {
      await this.clipService.deleteClip(clip);
      this.clips = this.clips.filter((element) => {
        return element.docID !== clip.docID;
      });
    } catch (error) {
      console.error(error);
    }
  }
}

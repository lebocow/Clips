import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { map } from 'rxjs';

@Component({
  selector: 'app-clip',
  templateUrl: './clip.component.html',
  styleUrls: ['./clip.component.css'],
})
export class ClipComponent implements OnInit {
  id = '';

  public route = inject(ActivatedRoute);

  ngOnInit(): void {
    // this.id = this.route.snapshot.params['id'];
    this.route.params.subscribe((params: Params) => {
      this.id = params['id'];
    });
  }
}

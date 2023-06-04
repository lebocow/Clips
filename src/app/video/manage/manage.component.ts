import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-manage',
  templateUrl: './manage.component.html',
  styleUrls: ['./manage.component.css'],
})
export class ManageComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  videoOrder = '1';

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const sortParam = params.get('sort');
      this.videoOrder = sortParam === '2' ? '2' : '1';
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

  // sort(event: Event) {
  //   const { value } = event.target as HTMLSelectElement;

  //   this.router.navigateByUrl(`/manage?sort=${value}`);
  // }
}

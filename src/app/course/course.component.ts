import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { Course } from "../model/course";
import { CoursesService } from "../services/courses.service";
import { debounceTime, distinctUntilChanged, startWith, tap, delay, catchError, finalize } from 'rxjs/operators';
import { merge, fromEvent, Observable, of, throwError, Subscription } from "rxjs";
import { Lesson } from '../model/lesson';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { SelectionModel } from '@angular/cdk/collections';


@Component({
  selector: 'course',
  templateUrl: './course.component.html',
  styleUrls: ['./course.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class CourseComponent implements OnInit, AfterViewInit, OnDestroy {

  course: Course;

  lessons: Lesson[] = [];

  isLoading = false;

  displayedColumns = [
    "select", "seqNo", "description", "duration", "expand"
  ];

  dataSource = new MatTableDataSource<Lesson | null>(this.lessons);

  lessonSubscription$: Subscription;

  sortSubscription$: Subscription;

  materialTableEvents$: Subscription;

  selection = new SelectionModel<Lesson>(true, []);


  @ViewChild(MatPaginator) paginator: MatPaginator;

  @ViewChild(MatSort) sort: MatSort;

  expandedLesson: Lesson | null = null;

  expandedRow: Lesson;

  constructor(private route: ActivatedRoute,
    private coursesService: CoursesService) {

  }

  ngOnInit() {

    this.course = this.route.snapshot.data["course"];
    this.loadLessonsPage();

  }

  onToggleLesson(lesson: Lesson): void {
    if (lesson == this.expandedLesson) {
      this.expandedLesson = null;
    } else {
      this.expandedLesson = lesson;
    }
  }

  onLessonToggledOnCheckbox(lesson: Lesson) {
    this.selection.toggle(lesson);
    console.log(this.selection.selected);
  }

  isAllSelected() {
    return this.selection.selected?.length === this.lessons?.length
  }

  toggleAllCheckbox() {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.selection.select(...this.lessons);
    }
  }

  loadLessonsPage(): void {
    this.isLoading = true;
    this.lessonSubscription$ = this.coursesService.findLessons(this.course.id, this.sort?.direction ?? "asc", this.paginator?.pageIndex ?? 0, this.paginator?.pageSize ?? 5, this.sort?.active ?? "seqNo").pipe(
      tap(lessons => {
        console.log(lessons);
        this.lessons = lessons;
      }),
      catchError(err => {
        console.log(err);
        return throwError(err);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe();
  }

  ngAfterViewInit() {
    this.sortSubscription$ = this.sort.sortChange.subscribe(() => this.paginator.pageIndex = 0)
    this.materialTableEvents$ = merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        tap(() => {
          this.loadLessonsPage();
          this.selection.clear();
        })
      ).subscribe();
  }

  ngOnDestroy(): void {
    if (this.lessonSubscription$) {
      this.lessonSubscription$.unsubscribe();
    }
    if (this.sortSubscription$) {
      this.sortSubscription$.unsubscribe();
    }
    if (this.materialTableEvents$) {
      this.materialTableEvents$.unsubscribe();
    }

  }

}

import { HttpClient } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  OnInit,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Component({
  standalone: true,
  selector: 'app-alternate',
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <input type="text" formControlName="name" />
      <select formControlName="likesSignals">
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>
      <textarea
        formControlName="explanation"
        placeholder="explain yourself..."
      ></textarea>
      <button type="submit">Submit</button>
    </form>
  `,
  imports: [ReactiveFormsModule],
})
export default class AlternateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);

  formDataLoaded$ = of({ name: 'Josh' }).pipe(delay(2000));

  form = this.fb.nonNullable.group({
    name: [''],
    likesSignals: ['yes'],
    explanation: [{ value: '', disabled: true }],
  });

  status = signal<'loading' | 'loaded' | 'submitting' | 'success' | 'error'>(
    'loading'
  );

  constructor() {
    effect(() => {
      console.log(this.status());
    });
  }

  ngOnInit() {
    this.form.disable();

    this.formDataLoaded$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        this.form.patchValue(data);
        this.status.set('loaded');
        this.form.enable();
      });

    this.form.controls.likesSignals.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((likesSignals) => {
        if (likesSignals === 'no') {
          this.form.controls.explanation.addValidators(Validators.required);
        } else {
          this.form.controls.explanation.removeValidators(Validators.required);
        }

        this.form.controls.explanation.updateValueAndValidity({
          emitEvent: false,
        });
      });
  }

  submit() {
    this.status.set('submitting');
    this.http
      .post('someapi', this.form.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.status.set('success'),
        error: () => this.status.set('error'),
      });
  }
}

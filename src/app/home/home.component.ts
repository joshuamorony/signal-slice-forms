import { HttpClient } from '@angular/common/http';
import { Component, effect, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { signalSlice } from 'ngxtension/signal-slice';
import { Observable, of } from 'rxjs';
import {
  catchError,
  delay,
  map,
  startWith,
  switchMap,
  tap,
} from 'rxjs/operators';
import { formValues } from '../shared/utils/signal-forms';

@Component({
  standalone: true,
  selector: 'app-home',
  template: `
    <form [formGroup]="form" (ngSubmit)="formState.submit()">
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
export default class HomeComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  formDataLoaded$ = of({ name: 'Josh' }).pipe(delay(2000));

  form = this.fb.nonNullable.group({
    name: [''],
    likesSignals: ['yes'],
    explanation: [{ value: '', disabled: true }],
  });

  initialFormState = {
    ...this.form.getRawValue(),
    status: 'loading' as
      | 'loading'
      | 'loaded'
      | 'submitting'
      | 'success'
      | 'error',
  };

  formState = signalSlice({
    initialState: this.initialFormState,
    sources: [
      formValues(this.form),
      this.formDataLoaded$.pipe(
        tap((data) => this.form.patchValue(data)),
        map(() => ({ status: 'loaded' as const }))
      ),
    ],
    actionSources: {
      submit: (_, action$: Observable<void>) =>
        action$.pipe(
          switchMap(() =>
            this.http.post('someapi', this.form.getRawValue()).pipe(
              map(() => ({ status: 'success' as const })),
              catchError(() => of({ status: 'error' as const })),
              startWith({ status: 'submitting' as const })
            )
          )
        ),
    },
    effects: (state) => ({
      init: () => {
        this.form.disable({ emitEvent: false });
      },
      enableAfterLoad: () => {
        const status = state.status();
        if (status === 'loaded') {
          this.form.enable({ emitEvent: false });
        }
      },
      requireExplanation: () => {
        const likesSignals = state.likesSignals();
        if (likesSignals === 'no') {
          this.form.controls.explanation.addValidators(Validators.required);
        } else {
          this.form.controls.explanation.removeValidators(Validators.required);
        }

        this.form.controls.explanation.updateValueAndValidity({
          emitEvent: false,
        });
      },
    }),
  });

  constructor() {
    effect(() => {
      console.log(this.formState());
    });
  }
}

import { FormGroup } from '@angular/forms';
import { map } from 'rxjs/operators';

export function formValues(form: FormGroup) {
  return form.valueChanges.pipe(map(() => form.getRawValue()));
}

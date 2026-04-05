import { Directive, HostListener, Optional } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appLowercase]',
  standalone: true,
})
export class LowercaseDirective {
  constructor(@Optional() private ngControl: NgControl) {}

  @HostListener('input', ['$event.target'])
  onInput(input: HTMLInputElement): void {
    const lower = input.value.toLowerCase();
    if (input.value !== lower) {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      if (this.ngControl?.control) {
        this.ngControl.control.setValue(lower);
      } else {
        input.value = lower;
      }
      input.setSelectionRange(start, end);
    }
  }
}

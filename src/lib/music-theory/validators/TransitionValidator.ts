import type { Validator, ValidationResult, ValidationContext } from '../types';

export class TransitionValidator implements Validator {
  name = 'TransitionValidator';

  validate(context: ValidationContext): ValidationResult {
    throw new Error('Not implemented');
  }
}

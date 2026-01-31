import type { Validator, ValidationResult, ValidationContext } from '../types';

export class ScaleValidator implements Validator {
  name = 'ScaleValidator';

  validate(context: ValidationContext): ValidationResult {
    throw new Error('Not implemented');
  }
}

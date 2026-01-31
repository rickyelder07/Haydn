import type { Validator, ValidationContext, PipelineResult, GenreRules } from '../types';
import { ScaleValidator } from './ScaleValidator';
import { TransitionValidator } from './TransitionValidator';
import { GenreValidator } from './GenreValidator';

export class ValidationPipeline {
  private validators: Validator[] = [];

  /**
   * Add a validator to the pipeline (chainable)
   */
  addValidator(validator: Validator): this {
    this.validators.push(validator);
    return this;
  }

  /**
   * Run all validators and collect errors/warnings
   * Does NOT short-circuit - runs all validators regardless of failures
   */
  validate(context: ValidationContext): PipelineResult {
    const errors: PipelineResult['errors'] = [];
    const warnings: PipelineResult['warnings'] = [];

    // Run all validators
    for (const validator of this.validators) {
      const result = validator.validate(context);

      if (!result.ok) {
        // Separate errors from warnings based on severity
        for (const error of result.errors) {
          if (error.severity === 'error') {
            errors.push(error);
          } else if (error.severity === 'warning') {
            warnings.push(error);
          }
        }
      }
    }

    return {
      valid: errors.length === 0, // valid if no error-severity issues
      errors,
      warnings,
    };
  }
}

/**
 * Factory function to create a default validation pipeline
 * @param genreRules Optional genre rules for GenreValidator
 * @returns Configured ValidationPipeline
 */
export function createDefaultPipeline(genreRules?: GenreRules): ValidationPipeline {
  const pipeline = new ValidationPipeline();

  // Add core validators
  pipeline.addValidator(new ScaleValidator());
  pipeline.addValidator(new TransitionValidator());

  // Add genre validator if rules provided
  if (genreRules) {
    pipeline.addValidator(new GenreValidator(genreRules));
  }

  return pipeline;
}

import { PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodSchema } from 'zod';
import { fromZodError } from 'zod-validation-error';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body' && metadata.type !== 'query') {
      return value;
    }

    const result = this.schema.safeParse(value);
    
    if (!result.success) {
      const error = fromZodError(result.error as any);
      throw new BadRequestException(error.message);
    }
    
    return result.data;
  }
}

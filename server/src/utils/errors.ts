import { z } from 'zod';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function formatZodError(error: z.ZodError): string {
  return error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
}

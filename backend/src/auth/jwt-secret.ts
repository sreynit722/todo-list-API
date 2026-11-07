import { ConfigService } from '@nestjs/config';

export function getJwtSecret(config: ConfigService): string {
  const secret = config.get<string>('JWT_SECRET');
  const isProduction = config.get<string>('NODE_ENV') === 'production';
  const localComposeSecret =
    'local-development-only-secret-do-not-use-in-production';
  if (
    isProduction &&
    (!secret ||
      Buffer.byteLength(secret, 'utf8') < 32 ||
      secret === localComposeSecret)
  ) {
    throw new Error(
      'JWT_SECRET must be a unique secret of at least 32 characters in production',
    );
  }
  if (secret) return secret;
  // Development only. Never use this value on a real server.
  return 'dev-only-secret-change-me';
}

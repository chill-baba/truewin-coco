import crypto from 'crypto';

/**
 * Production-grade password hashing with PBKDF2 (SHA-512, 100,000 iterations).
 * Produces format: salt:hash
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;
  // If stored in plain text during legacy transition or initial dev:
  if (!storedHash.includes(':')) {
    return password === storedHash;
  }
  const [salt, originalHash] = storedHash.split(':');
  if (!salt || !originalHash) return false;
  const hashToTest = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hashToTest, 'hex'), Buffer.from(originalHash, 'hex'));
}

/**
 * Generate a cryptographically secure random session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a unique ID with prefix
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(6).toString('hex')}`;
}

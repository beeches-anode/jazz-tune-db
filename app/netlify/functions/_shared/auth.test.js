import { describe, it, expect } from 'vitest';
import { signToken, verifyToken } from './auth';

const SECRET = 'a'.repeat(64);

describe('signToken / verifyToken', () => {
  it('signs and verifies a token', () => {
    const token = signToken({ exp: Date.now() + 1000 }, SECRET);
    const payload = verifyToken(token, SECRET);
    expect(payload).toBeTruthy();
  });

  it('rejects an expired token', () => {
    const token = signToken({ exp: Date.now() - 1000 }, SECRET);
    expect(verifyToken(token, SECRET)).toBe(null);
  });

  it('rejects a tampered token', () => {
    const token = signToken({ exp: Date.now() + 1000 }, SECRET);
    const tampered = token.slice(0, -2) + 'aa';
    expect(verifyToken(tampered, SECRET)).toBe(null);
  });

  it('rejects with wrong secret', () => {
    const token = signToken({ exp: Date.now() + 1000 }, SECRET);
    expect(verifyToken(token, 'b'.repeat(64))).toBe(null);
  });
});

import { describe, expect, it } from 'vitest';
import { KERNEL_VERSION } from '../src/index.js';

describe('KERNEL_VERSION', () => {
  it('現行 package version と同じ値を公開する', () => {
    expect(KERNEL_VERSION).toBe('0.11.0');
  });
});

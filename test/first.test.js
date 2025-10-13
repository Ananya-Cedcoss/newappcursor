/* eslint-env jest */
describe('addition', () => {
  it('adds numbers correctly', () => {
    expect(1 + 2).toBe(3);
  });
});

// test/app.test.js
import { sum } from '../src/utils.js';

test('adds numbers', () => {
  expect(sum(2, 3)).toBe(5);
});
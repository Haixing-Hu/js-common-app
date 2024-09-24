////////////////////////////////////////////////////////////////////////////////
//
//    Copyright (c) 2022 - 2024.
//    Haixing Hu, Qubit Co. Ltd.
//
//    All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////
import { convert } from '../../src/impl/utils';

describe('convert', () => {
  it('should convert string "true" to boolean true', () => {
    expect(convert('true')).toBe(true);
  });

  it('should convert string "false" to boolean false', () => {
    expect(convert('false')).toBe(false);
  });

  it('should convert string "123" to integer 123', () => {
    expect(convert('123')).toBe(123);
  });

  it('should convert string "123.45" to float 123.45', () => {
    expect(convert('123.45')).toBe(123.45);
  });

  it('should return the original string if it cannot be converted', () => {
    expect(convert('hello')).toBe('hello');
  });

  it('should return the original value if it is not a string', () => {
    expect(convert(123)).toBe(123);
    expect(convert(true)).toBe(true);
    expect(convert({ key: 'value' })).toEqual({ key: 'value' });
  });

  it('should handle empty string correctly', () => {
    expect(convert('')).toBe('');
  });

  it('should handle string with spaces correctly', () => {
    expect(convert('  true  ')).toBe(true);
    expect(convert('  123  ')).toBe(123);
    expect(convert('  123.45  ')).toBe(123.45);
    expect(convert('  hello  ')).toBe('  hello  ');
  });

  it('should handle string with mixed case correctly', () => {
    expect(convert('TrUe')).toBe(true);
    expect(convert('FaLsE')).toBe(false);
  });
});

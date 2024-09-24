////////////////////////////////////////////////////////////////////////////////
//
//    Copyright (c) 2022 - 2024.
//    Haixing Hu, Qubit Co. Ltd.
//
//    All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////
import { Cookie } from '../../src';

/**
 * Unit tests for the Cookie class.
 *
 * @author Haixing Hu
 */
describe('Cookie', () => {
  beforeEach(() => {
    // Clear cookies before each test
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0].trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    });
  });

  it('should set and get a string value correctly', () => {
    const name = 'testKey';
    const value = 'testValue';
    Cookie.set(name, value);
    expect(Cookie.get(name)).toBe(value);
  });

  it('should set and get an object value correctly', () => {
    const name = 'testKey';
    const value = { key: 'value' };
    Cookie.set(name, value);
    expect(Cookie.get(name)).toEqual(value);
  });

  it('should set and get an object with bigint field correctly', () => {
    const name = 'testKey';
    const value = { key: 'value', value: 9007199254740993n };
    Cookie.set(name, value);
    expect(Cookie.get(name)).toEqual(value);
  });

  it('should return undefined for non-existent key', () => {
    const name = 'nonExistentKey';
    expect(Cookie.get(name)).toBeUndefined();
  });

  it('should remove a key correctly', () => {
    const name = 'testKey';
    const value = 'testValue';
    Cookie.set(name, value);
    expect(Cookie.get(name)).toBe(value);
    Cookie.remove(name);
    expect(Cookie.get(name)).toBeUndefined();
  });

  it('should check existence of a key correctly', () => {
    const name = 'testKey';
    Cookie.set(name, 'value');
    expect(Cookie.has(name)).toBe(true);
    Cookie.remove(name);
    expect(Cookie.has(name)).toBe(false);
  });

  it('should handle attributes correctly when setting a value', () => {
    const name = 'testKey';
    const value = 'testValue';
    const attributes = { expires: 7, path: '/' };
    Cookie.set(name, value, attributes);
    expect(document.cookie).toContain(`${name}=${encodeURIComponent(JSON.stringify(value))}`);
  });

  it('should handle attributes correctly when removing a value', () => {
    const name = 'testKey';
    const attributes = { path: '/' };
    Cookie.set(name, 'testValue', attributes);
    Cookie.remove(name, attributes);
    expect(Cookie.get(name)).toBeUndefined();
  });

  it('should not set a cookie when value is undefined', () => {
    const name = 'testKey';
    const value = undefined;
    Cookie.set(name, value);
    expect(Cookie.get(name)).toBeUndefined();
  });
});

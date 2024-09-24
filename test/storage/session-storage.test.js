////////////////////////////////////////////////////////////////////////////////
//
//    Copyright (c) 2022 - 2024.
//    Haixing Hu, Qubit Co. Ltd.
//
//    All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////
import { SessionStorage } from '../../src';

/**
 * Unit tests for the SessionStorage class.
 *
 * @author Haixing Hu
 */
describe('SessionStorage', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('should set and get a string value correctly', () => {
    const name = 'testKey';
    const value = 'testValue';
    SessionStorage.set(name, value);
    expect(SessionStorage.get(name)).toBe(value);
  });

  it('should set and get an object value correctly', () => {
    const name = 'testKey';
    const value = { key: 'value' };
    SessionStorage.set(name, value);
    expect(SessionStorage.get(name)).toEqual(value);
  });

  it('should set and get an object with bigint field correctly', () => {
    const name = 'testKey';
    const value = { key: 'value', value: 9007199254740993n };
    SessionStorage.set(name, value);
    expect(SessionStorage.get(name)).toEqual(value);
  });

  it('should return undefined for non-existent key', () => {
    const name = 'nonExistentKey';
    expect(SessionStorage.get(name)).toBeUndefined();
  });

  it('should remove a key correctly', () => {
    const name = 'testKey';
    SessionStorage.set(name, 'testValue');
    SessionStorage.remove(name);
    expect(SessionStorage.get(name)).toBeUndefined();
  });

  it('should check existence of a key correctly', () => {
    const name = 'testKey';
    SessionStorage.set(name, 'value');
    expect(SessionStorage.has(name)).toBe(true);

    SessionStorage.remove(name);
    expect(SessionStorage.has(name)).toBe(false);
  });

  it('should not set a value when value is undefined', () => {
    const name = 'testKey';
    const value = undefined;
    SessionStorage.set(name, value);
  });
});

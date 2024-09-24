////////////////////////////////////////////////////////////////////////////////
//
//    Copyright (c) 2022 - 2024.
//    Haixing Hu, Qubit Co. Ltd.
//
//    All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////
import { LocalStorage } from '../../src';

/**
 * Unit tests for the LocalStorage class.
 *
 * @author Haixing Hu
 */
describe('LocalStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('should set and get a string value correctly', () => {
    const name = 'testKey';
    const value = 'testValue';
    LocalStorage.set(name, value);
    expect(LocalStorage.get(name)).toBe(value);
  });

  it('should set and get an object value correctly', () => {
    const name = 'testKey';
    const value = { key: 'value' };
    LocalStorage.set(name, value);
    expect(LocalStorage.get(name)).toEqual(value);
  });

  it('should set and get an object with bigint field correctly', () => {
    const name = 'testKey';
    const value = { key: 'value', value: 9007199254740993n };
    LocalStorage.set(name, value);
    expect(LocalStorage.get(name)).toEqual(value);
  });

  it('should return undefined for non-existent key', () => {
    const name = 'nonExistentKey';
    expect(LocalStorage.get(name)).toBeUndefined();
  });

  it('should remove a key correctly', () => {
    const name = 'testKey';
    LocalStorage.set(name, 'testValue');
    LocalStorage.remove(name);
    expect(LocalStorage.get(name)).toBeUndefined();
  });

  it('should check existence of a key correctly', () => {
    const name = 'testKey';
    LocalStorage.set(name, 'value');
    expect(LocalStorage.has(name)).toBe(true);

    LocalStorage.remove(name);
    expect(LocalStorage.has(name)).toBe(false);
  });

  it('should not set a value when value is undefined', () => {
    const name = 'testKey';
    const value = undefined;
    LocalStorage.set(name, value);
  });
});

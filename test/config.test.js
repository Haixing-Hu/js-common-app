////////////////////////////////////////////////////////////////////////////////
//
//    Copyright (c) 2022 - 2024.
//    Haixing Hu, Qubit Co. Ltd.
//
//    All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////
import { config } from '../src';

beforeEach(() => {
  config.clear();
});

describe('config.merge()', () => {
  test('能正确合并基本键值对', () => {
    config.merge({ key1: 'value1', key2: 123 });
    expect(config.get('key1')).toBe('value1');
    expect(config.get('key2')).toBe(123);
    expect(config.key1).toBe('value1');
    expect(config.key2).toBe(123);
  });

  test('能正确合并嵌套对象并访问嵌套内的值', () => {
    config.merge({ nested: { key: 'nestedValue' } });
    expect(config.get('nested.key')).toBe('nestedValue');
    expect(config.nested.key).toBe('nestedValue');
  });

  test('合并的对象包含现有键时应正确覆盖原有值', () => {
    config.set('key', 'initialValue');
    config.merge({ key: 'newValue' });
    expect(config.get('key')).toBe('newValue');
    expect(config.key).toBe('newValue');
  });

  test('合并新配置时，未被提及的现有配置项应保留', () => {
    config.set('existingKey', 'existingValue');
    config.merge({ newKey: 'newValue' });
    expect(config.get('existingKey')).toBe('existingValue');
    expect(config.get('newKey')).toBe('newValue');
    expect(config.existingKey).toBe('existingValue');
    expect(config.newKey).toBe('newValue');
  });
});

describe('config.get()', () => {
  test('获取不存在的键应返回undefined', () => {
    expect(config.get('nonexistentKey')).toBeUndefined();
    expect(config.nonexistentKey).toBeUndefined();
  });
  test('获取不存在的父路径键应返回undefined', () => {
    config.set('nested', { exists: 'yes' });
    expect(config.get('nonExistParent.doesNotExist')).toBeUndefined();
    expect(config.nonExistParent?.doesNotExist).toBeUndefined();
  });
  test('获取嵌套路径不存在的键应返回undefined', () => {
    config.set('nested', { exists: 'yes' });
    expect(config.get('nested.doesNotExist')).toBeUndefined();
    expect(config.nested?.doesNotExist).toBeUndefined();
  });
  test('能够正确获取设置的字符串值', () => {
    config.set('stringKey', 'stringValue');
    expect(config.get('stringKey')).toBe('stringValue');
    expect(config.stringKey).toBe('stringValue');
  });
  test('能够正确获取设置的数字值', () => {
    config.set('numberKey', 123);
    expect(config.get('numberKey')).toBe(123);
    expect(config.numberKey).toBe(123);
  });
  test('能够正确获取设置的布尔值', () => {
    config.set('booleanKey', true);
    expect(config.get('booleanKey')).toBe(true);
    expect(config.booleanKey).toBe(true);
  });
  test('能够通过点分路径获取嵌套对象内的值', () => {
    config.set('nested.object', { key: 'nestedValue' });
    expect(config.get('nested.object.key')).toBe('nestedValue');
    expect(config.get('nested')).toEqual({
      object: {
        key: 'nestedValue',
      },
    });
    expect(config.nested.object.key).toBe('nestedValue');
    expect(config.nested).toEqual({
      object: {
        key: 'nestedValue',
      },
    });
  });
  test('能够通过包含数组索引的路径获取数组内的值', () => {
    config.set('array', ['value0', 'value1', 'value2']);
    expect(config.get('array[1]')).toBe('value1');
    expect(config.array[1]).toBe('value1');
  });
  test('能够通过包含数组索引的路径获取嵌套对象内数组内的值', () => {
    config.set('nested', { array: ['value0', 'value1', 'value2'] });
    expect(config.get('nested.array[1]')).toBe('value1');
  });
  test('能够通过包含数组索引的路径获取嵌套对象内数组内的对象的属性值', () => {
    config.set('nested', {
      array: [
        { name: 'name0', value: 'value0' },
        { name: 'name1', value: 'value1' },
        { name: 'name2', value: 'value2' },
      ],
    });
    expect(config.get('nested.array[1].name')).toBe('name1');
    expect(config.nested.array[1].name).toBe('name1');
  });

  test('获取存在的键时返回正确的值', () => {
    config.set('existing_key', 'value');
    expect(config.get('existing_key')).toBe('value');
  });

  test('获取不存在的键时返回默认值', () => {
    expect(config.get('nonexistent_key', 'defaultValue')).toBe('defaultValue');
  });

  test('获取存在的键时忽略默认值', () => {
    config.set('existing_key', 'value');
    expect(config.get('existing_key', 'defaultValue')).toBe('value');
  });

  test('获取值为null的键时返回默认值', () => {
    config.set('null_key', null);
    expect(config.get('null_key', 'defaultValue')).toBe('defaultValue');
  });

  test('获取值为undefined的键时返回默认值', () => {
    config.set('undefined_key', undefined);
    expect(config.get('undefined_key', 'defaultValue')).toBe('defaultValue');
  });
});

describe('config.set()', () => {
  test('能够设置基本类型的值', () => {
    config.set('stringKey', 'stringValue');
    config.set('numberKey', 123);
    config.set('booleanKey', true);
    expect(config.get('stringKey')).toBe('stringValue');
    expect(config.get('numberKey')).toBe(123);
    expect(config.get('booleanKey')).toBe(true);
  });

  test('能够设置对象，并正确获取对象内的值', () => {
    const objectValue = { key: 'value' };
    config.set('objectKey', objectValue);
    expect(config.get('objectKey')).toEqual(objectValue);
    expect(config.get('objectKey.key')).toBe('value');
    expect(config.objectKey).toEqual(objectValue);
    expect(config.objectKey.key).toBe('value');
  });

  test('能够设置数组，并通过索引正确获取数组内的值', () => {
    const arrayValue = ['value0', 'value1'];
    config.set('arrayKey', arrayValue);
    expect(config.get('arrayKey')).toEqual(arrayValue);
    expect(config.get('arrayKey[1]')).toBe('value1');
    expect(config.arrayKey).toEqual(arrayValue);
    expect(config.arrayKey[1]).toBe('value1');
  });

  test('覆盖已存在的值', () => {
    config.set('key', 'initialValue');
    config.set('key', 'newValue');
    expect(config.get('key')).toBe('newValue');
    expect(config.key).toBe('newValue');
  });

  test('使用点分路径设置嵌套对象的值', () => {
    config.set('nested.key', 'nestedValue');
    expect(config.get('nested.key')).toBe('nestedValue');
    expect(config.get('nested')).toEqual({ key: 'nestedValue' });
    expect(config.nested.key).toBe('nestedValue');
    expect(config.nested).toEqual({ key: 'nestedValue' });
  });

  test('使用点分路径在数组内部设置值', () => {
    config.set('array', [{}, { key: 'initialValue' }]);
    config.set('array[1].key', 'newValue');
    expect(config.get('array[1].key')).toBe('newValue');
    expect(config.array[1].key).toBe('newValue');
  });
});

describe('config.has()', () => {
  test('能正确判断简单键值对是否存在', () => {
    config.set('simpleKey', 'value');
    expect(config.has('simpleKey')).toBe(true);
  });

  test('能正确判断嵌套对象内的键是否存在', () => {
    config.set('nested', { key: 'value' });
    expect(config.has('nested.key')).toBe(true);
  });

  test('能正确判断数组内的元素是否存在', () => {
    config.set('array', ['value0', 'value1']);
    // 判断数组本身是否存在
    expect(config.has('array')).toBe(true);
    // 判断数组特定索引的元素是否存在
    expect(config.has('array[0]')).toBe(true);
    expect(config.has('array[1]')).toBe(true);
  });

  test('对不存在的键返回false', () => {
    expect(config.has('nonexistentKey')).toBe(false);
    // 对于嵌套路径，如果任一部分不存在，也应该返回false
    expect(config.has('nested.nonexistentKey')).toBe(false);
    expect(config.has('array[999]')).toBe(false);
  });
});

describe('config.remove()', () => {
  test('能正确删除简单键值对', () => {
    config.set('key', 'value');
    expect(config.has('key')).toBe(true);
    config.remove('key');
    expect(config.has('key')).toBe(false);
  });

  test('能正确删除嵌套对象内的键，并验证父对象仍然存在', () => {
    config.set('nested', { key: 'value', anotherKey: 'anotherValue' });
    config.remove('nested.key');
    expect(config.has('nested.key')).toBe(false);
    // 确保父对象和其他键仍然存在
    expect(config.has('nested')).toBe(true);
    expect(config.get('nested.anotherKey')).toBe('anotherValue');
  });

  test('能正确删除整个嵌套对象', () => {
    config.set('nested', { key: 'value' });
    config.remove('nested');
    expect(config.has('nested')).toBe(false);
  });

  test('删除数组内的元素', () => {
    config.set('array', ['value0', 'value1', 'value2']);
    config.remove('array[1]');
    // 因为 delete 操作不会改变数组其他元素的索引，仍然可以访问其它元素
    expect(config.get('array[0]')).toBe('value0');
    expect(config.get('array[1]')).toBe('value2'); // 注意，删除后索引会变化，这里应调整测试逻辑
  });

  test('删除数组内的元素，数组索引位于路径的末尾', () => {
    config.set('nested.array', [1, 2, 3]);
    expect(config.get('nested.array[1]')).toBe(2);
    config.remove('nested.array[1]');
    // 验证数组元素被正确删除并且数组其他元素位置正确调整
    expect(config.get('nested.array')).toEqual([1, 3]);
  });

  test('尝试删除不存在的键', () => {
    // 确保尝试删除一个不存在的键不会抛出错误
    expect(() => config.remove('nonexistentKey')).not.toThrow();
    expect(() => config.remove('nested.nonexistentKey')).not.toThrow();
    // 尝试删除不存在的数组索引
    expect(() => config.remove('nested.array[999]')).not.toThrow();
  });
});

describe('Config.mergeEnv', () => {
  test('环境变量的键名转换', () => {
    config.mergeEnv({
      'PREFIX_SOME_KEY': 'value',
    });
    expect(config.get('prefix_some_key')).toBe('value');
  });
  test('环境变量的值转换', () => {
    config.mergeEnv({
      'PREFIX_BOOL_TRUE': 'true',
      'PREFIX_BOOL_FALSE': 'false',
      'PREFIX_NUMBER_INT': '123',
      'PREFIX_NUMBER_FLOAT': '123.45',
      'PREFIX_STRING': 'stringValue',
    });
    expect(config.get('prefix_bool_true')).toBe(true);
    expect(config.get('prefix_bool_false')).toBe(false);
    expect(config.get('prefix_number_int')).toBe(123);
    expect(config.get('prefix_number_float')).toBe(123.45);
    expect(config.get('prefix_string')).toBe('stringValue');
  });
  test('覆盖现有配置', () => {
    config.set('existing_key', 'initialValue');
    config.mergeEnv({
      'EXISTING_KEY': 'newValue',
    });
    expect(config.get('existing_key')).toBe('newValue');
  });
  test('合并多个环境变量', () => {
    config.mergeEnv({
      'PREFIX_FIRST_KEY': 'firstValue',
      'PREFIX_SECOND_KEY': 'true',
      'PREFIX_THIRD_KEY': '123',
      'PREFIX_FOURTH_KEY': '123.45',
    });
    expect(config.get('prefix_first_key')).toBe('firstValue');
    expect(config.get('prefix_second_key')).toBe(true);
    expect(config.get('prefix_third_key')).toBe(123);
    expect(config.get('prefix_fourth_key')).toBe(123.45);
  });
  test('合并多个带前缀的环境变量', () => {
    config.mergeEnv({
      'process.env.PREFIX_FIRST_KEY': 'firstValue',
      'process.env.PREFIX_SECOND_KEY': 'true',
      'process.env.PREFIX_THIRD_KEY': '123',
      'process.env.PREFIX_FOURTH_KEY': '123.45',
    }, 'process.env.');
    expect(config.get('prefix_first_key')).toBe('firstValue');
    expect(config.get('prefix_second_key')).toBe(true);
    expect(config.get('prefix_third_key')).toBe(123);
    expect(config.get('prefix_fourth_key')).toBe(123.45);
  });
});

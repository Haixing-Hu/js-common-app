////////////////////////////////////////////////////////////////////////////////
//
//    Copyright (c) 2022 - 2024.
//    Haixing Hu, Qubit Co. Ltd.
//
//    All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////
import clone from '@haixing_hu/clone';
import { getProperty, setProperty, hasProperty } from '@haixing_hu/common-util';
import { UPPER_UNDERSCORE, LOWER_UNDERSCORE } from '@haixing_hu/naming-style';
import { convert } from './impl/utils';

/**
 * 此类的对象用于存储系统全局的配置信息。
 *
 * @author 胡海星
 */
class Config {
  /**
   * 检测指定键的配置是否存在。
   *
   * @param {string} keyPath
   *     指定的键的路径，可以是`'a.b.c'`或`'a.b[1].c'`这样的形式。
   * @return {boolean}
   *     如果存在则返回`true`，否则返回`false`。
   */
  has(keyPath) {
    return hasProperty(this, keyPath);
  }

  /**
   * 获取指定键的配置信息。
   *
   * @param {string} keyPath
   *     指定的键的路径，可以是`'a.b.c'`或`'a.b[1].c'`这样的形式。
   * @param {any} defaultValue
   *     如果指定的键不存在或为`null`, `undefined`，则返回此默认值。此参数默认值为`undefined`。
   * @return {any}
   *     返回指定键的配置信息；如果不存在则返回`undefined`。
   */
  get(keyPath, defaultValue = undefined) {
    const result = getProperty(this, keyPath);
    return result ?? defaultValue;
  }

  /**
   * 设置指定键的配置信息。
   *
   * @param {string} keyPath
   *     指定的键的路径，可以是`'a.b.c'`或`'a.b[1].c'`这样的形式。
   * @param {any} value
   *     指定的键对应的配置信息。
   */
  set(keyPath, value) {
    setProperty(this, keyPath, clone(value));
  }

  /**
   * 删除指定键的配置信息。
   *
   * @param {string} keyPath
   *     指定的键的路径，可以是`'a.b.c'`或`'a.b[1].c'`和`'a.b[1].c.d[2]'`这样的形式。
   */
  remove(keyPath) {
    let parent;
    let key;
    const arrayIndexMatch = keyPath.match(/(.+)\[(\d+)]$/);
    if (arrayIndexMatch) {
      // 如果路径以数组索引结束
      parent = getProperty(this, arrayIndexMatch[1]);
      key = parseInt(arrayIndexMatch[2], 10);
    } else {
      // 不以数组索引结束的情况，采用原来的逻辑
      const i = keyPath.lastIndexOf('.');
      if (i >= 0) {
        parent = getProperty(this, keyPath.substring(0, i));
        key = keyPath.substring(i + 1);
      } else {
        parent = this;
        key = keyPath;
      }
    }
    if (Array.isArray(parent)) {
      parent.splice(key, 1);
    } else if (parent && typeof parent === 'object') {
      delete parent[key];
    }
  }

  /**
   * 清空所有配置信息。
   */
  clear() {
    for (const key of Object.keys(this)) {
      delete this[key];
    }
  }

  /**
   * 合并指定的配置信息。
   *
   * 此方法将参数`cfg`中的所有属性合并到当前配置信息中，如果`cfg`中有嵌套对象，则会递归合并。
   * 例如：
   * ```
   * config.clear();
   * config.merge({
   *   a: 1,
   *   b: {
   *     c: 2,
   *     d: 3
   *   }
   * });
   * ```
   * 此时，`config`对象中的配置信息为：
   * ```
   * {
   *   a: 1,
   *   b: {
   *     c: 2,
   *     d: 3
   *   }
   * }
   * ```
   *
   * @param {object} cfg
   *     指定的配置信息。
   * @see mergeEnv
   */
  merge(cfg) {
    for (const [key, value] of Object.entries(cfg)) {
      this.set(key, value);
    }
  }

  /**
   * 合并指定的环境变量。
   *
   * 此方法和`merge`方法的区别在于，此方法会将环境变量中定义的变量名转换为小写+下划线形式，
   * 存储在配置信息中。
   *
   * 使用例子：
   * ```
   * config.mergeEnv(process.env);
   * // or if you use vite
   * config.mergeEnv(import.meta.env, 'VITE_');
   * ```
   *
   * @param {object} env
   *     指定的环境变量对象，通常是`process.env`，或`import.meta.env`。
   * @param {string} removePrefix
   *     需要删除的环境变量的前缀，如果不需要删除，则可以不指定。默认值为空字符串。
   * @see merge
   */
  mergeEnv(env, removePrefix = '') {
    for (const [key, value] of Object.entries(env)) {
      let theKey = key;
      if (removePrefix && key.startsWith(removePrefix)) {
        theKey = key.substring(removePrefix.length);
      }
      theKey = UPPER_UNDERSCORE.to(LOWER_UNDERSCORE, theKey);
      const theValue = convert(value);
      this.set(theKey, theValue);
    }
  }
}

/**
 * 全局的配置信息对象。
 *
 * @type {Config}
 */
const config = new Config();

export default config;

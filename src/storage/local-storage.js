////////////////////////////////////////////////////////////////////////////////
//
//    Copyright (c) 2022 - 2024.
//    Haixing Hu, Qubit Co. Ltd.
//
//    All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////
import Json from '@haixing_hu/json';

/**
 * 提供一个简单的接口来操作浏览器的 local storage。
 *
 * 此接口通过JSON支持对任意对象进行序列化和反序列化，以便于存储和读取。
 *
 * @type {object}
 * @namespace
 * @author 胡海星
 */
const LocalStorage = {
  /**
   * 将一个指定的键值存入 local storage 。
   *
   * @param {string} name
   *     指定的键名。
   * @param {any} value
   *     指定的键值。
   */
  set(name, value) {
    if (value !== undefined) {
      const data = Json.stringify(value);
      window.localStorage.setItem(name, data);
    }
  },

  /**
   * 从 local storage 中获取一个指定的键值。
   *
   * @param {string} name
   *     指定的键名。
   * @return {any}
   *     返回指定的键值，其类型和存入时类型一致；如果不存在则返回`undefined`。
   */
  get(name) {
    const result = window.localStorage.getItem(name);
    if (result === undefined || result === null) {
      return undefined;
    } else {
      return Json.parse(result);
    }
  },

  /**
   * 从 local storage 中删除一个指定的键值。
   *
   * @param {string} name
   *     指定的键名。
   */
  remove(name) {
    window.localStorage.removeItem(name);
  },

  /**
   * 检测 local storage 中是否存在指定的键值。
   *
   * @param {string} name
   *     指定的键名。
   * @return {boolean}
   *     如果存在则返回`true`，否则返回`false`。
   */
  has(name) {
    const result = window.localStorage.getItem(name);
    return result !== null && result !== undefined;
  },
};

export default LocalStorage;

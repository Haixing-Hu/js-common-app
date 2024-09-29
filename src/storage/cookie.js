////////////////////////////////////////////////////////////////////////////////
//
//    Copyright (c) 2022 - 2024.
//    Haixing Hu, Qubit Co. Ltd.
//
//    All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////
import CookieEngine from 'js-cookie';
import Json from '@haixing_hu/json';

/**
 * 提供一个简单的接口来操作浏览器的 Cookie。
 *
 * 此接口通过JSON支持对任意对象进行序列化和反序列化，以便于存储和读取。
 *
 * @type {object}
 * @namespace
 * @author 胡海星
 */
const Cookie = {
  /**
   * 将一个指定的键值存入 Cookie 。
   *
   * @param {string} name
   *     指定的键名。
   * @param {any} value
   *     指定的键值。
   * @param {object} attributes
   *     可选的 Cookie 的属性。支持以下属性：
   *     - `expires: Number` Cookie 的有效期，单位为天。
   *     - `path: string` Cookie 的路径。
   *     - `domain: string` Cookie 的域名。
   *     - `secure: boolean` 是否只在HTTPS连接中有效。
   *     - `sameSite: 'strict' | 'lax' | 'none'` Cookie 的 SameSite 属性。
   */
  set(name, value, attributes = undefined) {
    if (value !== undefined) {
      const data = Json.stringify(value);
      CookieEngine.set(name, data, attributes);
    }
  },

  /**
   * 从 Cookie 中获取一个指定的键值。
   *
   * @param {string} name
   *     指定的键名。
   * @return {any}
   *     返回指定的键值，其类型和存入时类型一致；如果不存在则返回`undefined`。
   */
  get(name) {
    const result = CookieEngine.get(name);
    if (result === undefined || result === null) {
      return undefined;
    } else {
      return Json.parse(result);
    }
  },

  /**
   * 从 Cookie 中删除一个指定的键值。
   *
   * @param {string} name
   *     指定的键名。
   * @param {object} attributes
   *     可选的 Cookie 的属性。支持以下属性：
   *     - `path: string` Cookie 的路径。
   *     - `domain: string` Cookie 的域名。
   *     - `secure: boolean` 是否只在HTTPS连接中有效。
   *     - `sameSite: 'strict' | 'lax' | 'none'` Cookie 的 SameSite 属性。
   *     注意：删除 Cookie 时，attributes 的属性必须和存入时的属性一致。
   */
  remove(name, attributes = undefined) {
    CookieEngine.remove(name, attributes);
  },

  /**
   * 检测指定的键值是否存在于 Cookie 中。
   *
   * @param {string} name
   *     指定的键名。
   * @return {boolean}
   *     如果存在则返回`true`，否则返回`false`。
   */
  has(name) {
    const result = CookieEngine.get(name);
    return (result !== null) && (result !== undefined);
  },
};

export default Cookie;

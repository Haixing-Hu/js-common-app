////////////////////////////////////////////////////////////////////////////////
//
//    Copyright (c) 2022 - 2024.
//    Haixing Hu, Qubit Co. Ltd.
//
//    All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////
import Cookie from './storage/cookie';
import LocalStorage from './storage/local-storage';
import config from './config';

/**
 * 默认的访问令牌的过期时间（天数）。
 *
 * @type {number}
 * @private
 */
const DEFAULT_ACCESS_TOKEN_EXPIRES_DAYS = 1000;

/**
 * 表示 `AuthStorage` 实例是否正在内部构造中。
 *
 * 许多其他语言包括将构造函数标记为私有的功能，这可以防止类在类外部被实例化，使得用户只能使用静态工
 * 厂方法创建实例，或者根本无法创建实例。JavaScript 没有此机制，但可以通过使用私有静态标志来实现。
 *
 * @type {boolean}
 * @private
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_class_fields#simulating_private_constructors
 */
let __isInternalConstructing = false;

/**
 * `AuthStorage` 的单例对象。
 *
 * @type {AuthStorage|null}
 * @private
 */
let __singleton = null;

/**
 * 记录当前应用的唯一代码，这是为了区分不同应用的存储数据。
 *
 * @type {string}
 * @private
 */
let __appCode = null;

let KEY_USER_ID = 'user_id';

let KEY_USERNAME = 'username';

let KEY_NICKNAME = 'nickname';

let KEY_PASSWORD = 'password';

let KEY_SAVE_LOGIN = 'save_login';

let KEY_NAME = 'name';

let KEY_GENDER = 'gender';

let KEY_MOBILE = 'mobile';

let KEY_AVATAR = 'avatar';

let KEY_PRIVILEGES = 'privileges';

let KEY_ROLES = 'roles';

let KEY_ACCESS_TOKEN = 'token';

/**
 * 提供用户认证信息的本地化存储功能。
 *
 * 根据相关建议，我们在 Cookie 而非 localStorage 中存储 Access Token，
 * 但 username, password 等数据可以存储在本地的 localStorage 中。
 *
 * @author 胡海星
 */
class AuthStorage {
  /**
   * 设置当前应用的唯一代码。
   *
   * @param {string} appCode
   *     当前应用的唯一代码。
   */
  static setAppCode(appCode) {
    if (!appCode) {
      throw new Error('The appCode is required.');
    }
    if (__appCode !== null) {
      throw new Error('The appCode has already been set.');
    }
    __appCode = appCode;
    __isInternalConstructing = true;
    __singleton = new AuthStorage(appCode);
    __isInternalConstructing = false;
  }

  /**
   * 清除当前应用的唯一代码。
   */
  static unsetAppCode() {
    __appCode = null;
    __singleton = null;
  }

  /**
   * 获取 `AuthStorage` 的单例对象。
   *
   * **注意：** 在调用此方法之前，必须先调用 `AuthStorage.setAppCode()` 方法设置应用代码。
   *
   * @return {AuthStorage}
   *     `AuthStorage` 的单例对象。
   */
  static getInstance() {
    if (__singleton === null) {
      throw new Error('The appCode has not been set. You must call `AuthStorage.setAppCode()` first.');
    }
    return __singleton;
  }

  /**
   * 创建一个新的 AuthStorage 对象。
   *
   * @param {string} appCode
   *     应用代码。
   */
  constructor(appCode) {
    if (!__isInternalConstructing) {
      throw new Error('The `AuthStorage` instance can only be get by the static method `AuthStorage.getInstance()`.');
    }
    KEY_USER_ID = `${appCode}.user_id`;
    KEY_USERNAME = `${appCode}.username`;
    KEY_NICKNAME = `${appCode}.nickname`;
    KEY_PASSWORD = `${appCode}.password`;
    KEY_SAVE_LOGIN = `${appCode}.save_login`;
    KEY_NAME = `${appCode}.name`;
    KEY_GENDER = `${appCode}.gender`;
    KEY_MOBILE = `${appCode}.mobile`;
    KEY_AVATAR = `${appCode}.avatar`;
    KEY_PRIVILEGES = `${appCode}.privileges`;
    KEY_ROLES = `${appCode}.roles`;
    KEY_ACCESS_TOKEN = `${appCode}.token`;
  }

  loadUserId() {
    return LocalStorage.get(KEY_USER_ID);
  }

  storeUserId(id) {
    LocalStorage.set(KEY_USER_ID, id);
  }

  removeUserId() {
    LocalStorage.remove(KEY_USER_ID);
  }

  loadUsername() {
    return LocalStorage.get(KEY_USERNAME);
  }

  storeUsername(username) {
    LocalStorage.set(KEY_USERNAME, username);
  }

  removeUsername() {
    LocalStorage.remove(KEY_USERNAME);
  }

  loadPassword() {
    return LocalStorage.get(KEY_PASSWORD);
  }

  storePassword(password) {
    LocalStorage.set(KEY_PASSWORD, password);
  }

  removePassword() {
    LocalStorage.remove(KEY_PASSWORD);
  }

  loadSaveLogin() {
    return LocalStorage.get(KEY_SAVE_LOGIN);
  }

  storeSaveLogin(saveLogin) {
    LocalStorage.set(KEY_SAVE_LOGIN, saveLogin);
  }

  removeSaveLogin() {
    LocalStorage.remove(KEY_SAVE_LOGIN);
  }

  loadNickname() {
    return LocalStorage.get(KEY_NICKNAME);
  }

  storeNickname(nickname) {
    LocalStorage.set(KEY_NICKNAME, nickname);
  }

  removeNickname() {
    LocalStorage.remove(KEY_NICKNAME);
  }

  loadName() {
    return LocalStorage.get(KEY_NAME);
  }

  storeName(name) {
    LocalStorage.set(KEY_NAME, name);
  }

  removeName() {
    LocalStorage.remove(KEY_NAME);
  }

  loadGender() {
    return LocalStorage.get(KEY_GENDER);
  }

  storeGender(gender) {
    LocalStorage.set(KEY_GENDER, gender);
  }

  removeGender() {
    LocalStorage.remove(KEY_GENDER);
  }

  loadMobile() {
    return LocalStorage.get(KEY_MOBILE);
  }

  storeMobile(mobile) {
    LocalStorage.set(KEY_MOBILE, mobile);
  }

  removeMobile() {
    LocalStorage.remove(KEY_MOBILE);
  }

  loadAvatar() {
    return LocalStorage.get(KEY_AVATAR);
  }

  storeAvatar(avatar) {
    LocalStorage.set(KEY_AVATAR, avatar);
  }

  removeAvatar() {
    LocalStorage.remove(KEY_AVATAR);
  }

  /**
   * 加载访问令牌。
   *
   * @returns {object}
   *     加载的访问令牌。
   */
  loadToken() {
    return Cookie.get(KEY_ACCESS_TOKEN);
  }

  /**
   * 将访问令牌存储到本地存储中。
   *
   * 访问令牌是一个包含以下属性的对象：
   * - `value: string`: 令牌值
   * - `createTime: string`: 令牌的创建时间，以UTC时间戳的字符串形式表示。
   * - `maxAge: number`: 用户头像地址
   * - `name: string`: 用户姓名
   * - `gender: string｜Gender`: 用户性别
   * - `mobile: string`: 用户手机号码
   *
   * @param {object} token
   *     访问令牌对象。
   */
  storeToken(token) {
    const expiresDays = config.get('access_token_expires_days', DEFAULT_ACCESS_TOKEN_EXPIRES_DAYS);
    Cookie.set(KEY_ACCESS_TOKEN, token, {
      expires: expiresDays,
    });
  }

  /**
   * 从本地存储中清除访问令牌。
   */
  removeToken() {
    Cookie.remove(KEY_ACCESS_TOKEN);
  }

  /**
   * 检查是否存在访问令牌的值。
   *
   * @return {boolean}
   *     如果存在则返回`true`，否则返回`false`。
   */
  hasTokenValue() {
    const token = Cookie.get(KEY_ACCESS_TOKEN);
    const value = token?.value;
    return (value !== undefined) && (value !== null) && (value !== '');
  }

  /**
   * 加载访问令牌的值。
   *
   * @returns {string}
   *     加载的访问令牌的值。
   */
  loadTokenValue() {
    const token = Cookie.get(KEY_ACCESS_TOKEN);
    return token?.value;
  }

  /**
   * 将用户权限列表存储到本地存储中。
   *
   * 用户权限列表是一个包含权限名称的字符串数组。
   *
   * @param {null|array<string>} privileges
   *     用户权限列表。
   */
  storePrivileges(privileges) {
    LocalStorage.set(KEY_PRIVILEGES, privileges);
  }

  /**
   * 从本地存储中载入用户权限列表。
   *
   * 用户权限列表是一个包含权限名称的字符串数组。
   *
   * @return {array<string>}
   *     用户权限列表；若不存在则返回一个空数组。
   */
  loadPrivileges() {
    return LocalStorage.get(KEY_PRIVILEGES);
  }

  /**
   * 从本地存储中清除用户权限列表。
   */
  removePrivileges() {
    LocalStorage.remove(KEY_PRIVILEGES);
  }

  /**
   * 将用户角色列表存储到本地存储中。
   *
   * 用户角色列表是一个包含角色名称的字符串数组。
   *
   * @param {null|array<string>} roles
   *     用户角色列表。
   */
  storeRoles(roles) {
    LocalStorage.set(KEY_ROLES, roles);
  }

  /**
   * 从本地存储中载入用户角色列表。
   *
   * 用户角色列表是一个包含角色名称的字符串数组。
   *
   * @return {array<string>}
   *     用户角色列表；若不存在则返回一个空数组。
   */
  loadRoles() {
    return LocalStorage.get(KEY_ROLES);
  }

  /**
   * 从本地存储中清除用户角色列表。
   */
  removeRoles() {
    LocalStorage.remove(KEY_ROLES);
  }

  /**
   * 将用户信息存储到本地存储中。
   *
   * 用户信息是一个包含以下属性的对象：
   * - `id: string|bigint|number`: 用户ID
   * - `username: string`: 用户名
   * - `nickname: string`: 用户昵称
   * - `avatar: string`: 用户头像地址
   * - `name: string`: 用户姓名
   * - `gender: string｜Gender`: 用户性别
   * - `mobile: string`: 用户手机号码
   *
   * @param {object} user
   *     用户信息。
   */
  storeUserInfo(user) {
    if (user) {
      this.storeUserId(user.id);
      this.storeUsername(user.username);
      this.storeNickname(user.nickname);
      this.storeAvatar(user.avatar);
      this.storeName(user.name);
      this.storeGender(user.gender);
      this.storeMobile(user.mobile);
    }
  }

  /**
   * 从本地存储中载入用户信息。
   *
   * 用户信息是一个包含以下属性的对象：
   * - `id: string|bigint|number`: 用户ID
   * - `username: string`: 用户名
   * - `nickname: string`: 用户昵称
   * - `avatar: string`: 用户头像地址
   * - `name: string`: 用户姓名
   * - `gender: string｜Gender`: 用户性别
   * - `mobile: string`: 用户手机号码
   *
   * @return {object}
   *     用户信息对象。
   */
  loadUserInfo() {
    return {
      id: this.loadUserId(),
      username: this.loadUsername(),
      nickname: this.loadNickname(),
      avatar: this.loadAvatar(),
      name: this.loadName(),
      gender: this.loadGender(),
      mobile: this.loadMobile(),
    };
  }

  /**
   * 从本地存储中清除用户信息。
   */
  removeUserInfo() {
    this.removeUserId();
    this.removeUsername();
    this.removeNickname();
    this.removeAvatar();
    this.removeName();
    this.removeGender();
    this.removeMobile();
  }

  /**
   * 将用户登录信息存储到本地存储中。
   *
   * 用户登录信息是一个包含以下属性的对象：
   * - `user: object`: 用户信息对象。
   * - `token: object`: 访问令牌对象。
   * - `privileges: array<string>`: 用户权限列表。
   * - `roles: array<string>`: 用户角色列表。
   *
   * @param {object} response
   *     用户登录信息。
   */
  storeLoginResponse(response) {
    if (response) {
      this.storeUserInfo(response.user);
      this.storeToken(response.token);
      this.storePrivileges(response.privileges);
      this.storeRoles(response.roles);
    }
  }

  /**
   * 从本地存储中获取用户登录信息。
   *
   * 用户登录信息是一个包含以下属性的对象：
   * - `user: object`: 用户信息对象。
   * - `token: object`: 访问令牌对象。
   * - `privileges: array<string>`: 用户权限列表。
   * - `roles: array<string>`: 用户角色列表。
   *
   * @returns {object}
   *     从本地存储中获取的用户登录信息。
   */
  loadLoginResponse() {
    return {
      user: this.loadUserInfo(),
      token: this.loadToken(),
      privileges: this.loadPrivileges(),
      roles: this.loadRoles(),
    };
  }

  /**
   * 从本地存储中清除用户登录信息。
   */
  removeLoginResponse() {
    this.removeUserInfo();
    this.removeToken();
    this.removePrivileges();
    this.removeRoles();
  }
}

export default AuthStorage;

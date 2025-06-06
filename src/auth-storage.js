////////////////////////////////////////////////////////////////////////////////
//
//    Copyright (c) 2022 - 2024.
//    Haixing Hu, Qubit Co. Ltd.
//
//    All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////
import config from '@qubit-ltd/config';
import { Cookie, LocalStorage } from '@qubit-ltd/storage';
import { Log } from '@qubit-ltd/logging';

/**
 * 默认的访问令牌的过期时间（天数）。
 *
 * @type {number}
 * @private
 */
const DEFAULT_ACCESS_TOKEN_EXPIRES_DAYS = 1000;

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
   * 创建一个新的 AuthStorage 对象。
   *
   * @param {string} appCode
   *     当前应用程序的代码，用于设置`Cookies`、`LocalStorage`和`SessionStorage`中存储
   *     的数据项的键值前缀。
   */
  constructor(appCode) {
    if (!appCode) {
      throw new Error('The `AuthStorage` instance must be constructed with a `appCode`.');
    }
    this.appCode = appCode;
    this.KEY_USER_ID = `${appCode}.user_id`;
    this.KEY_USERNAME = `${appCode}.username`;
    this.KEY_NICKNAME = `${appCode}.nickname`;
    this.KEY_PASSWORD = `${appCode}.password`;
    this.KEY_SAVE_LOGIN = `${appCode}.save_login`;
    this.KEY_NAME = `${appCode}.name`;
    this.KEY_GENDER = `${appCode}.gender`;
    this.KEY_MOBILE = `${appCode}.mobile`;
    this.KEY_AVATAR = `${appCode}.avatar`;
    this.KEY_PRIVILEGES = `${appCode}.privileges`;
    this.KEY_ROLES = `${appCode}.roles`;
    this.KEY_ACCESS_TOKEN = `${appCode}.token`;
    this.KEY_ORGANIZATION = `${appCode}.organization`;
  }

  @Log
  loadUserId() {
    return LocalStorage.get(this.KEY_USER_ID);
  }

  @Log
  storeUserId(id) {
    LocalStorage.set(this.KEY_USER_ID, id);
  }

  @Log
  removeUserId() {
    LocalStorage.remove(this.KEY_USER_ID);
  }

  @Log
  loadUsername() {
    return LocalStorage.get(this.KEY_USERNAME);
  }

  @Log
  storeUsername(username) {
    LocalStorage.set(this.KEY_USERNAME, username);
  }

  @Log
  removeUsername() {
    LocalStorage.remove(this.KEY_USERNAME);
  }

  @Log
  loadPassword() {
    return LocalStorage.get(this.KEY_PASSWORD);
  }

  @Log
  storePassword(password) {
    LocalStorage.set(this.KEY_PASSWORD, password);
  }

  @Log
  removePassword() {
    LocalStorage.remove(this.KEY_PASSWORD);
  }

  @Log
  loadSaveLogin() {
    return LocalStorage.get(this.KEY_SAVE_LOGIN);
  }

  @Log
  storeSaveLogin(saveLogin) {
    LocalStorage.set(this.KEY_SAVE_LOGIN, saveLogin);
  }

  @Log
  removeSaveLogin() {
    LocalStorage.remove(this.KEY_SAVE_LOGIN);
  }

  @Log
  loadNickname() {
    return LocalStorage.get(this.KEY_NICKNAME);
  }

  @Log
  storeNickname(nickname) {
    LocalStorage.set(this.KEY_NICKNAME, nickname);
  }

  @Log
  removeNickname() {
    LocalStorage.remove(this.KEY_NICKNAME);
  }

  @Log
  loadName() {
    return LocalStorage.get(this.KEY_NAME);
  }

  @Log
  storeName(name) {
    LocalStorage.set(this.KEY_NAME, name);
  }

  @Log
  removeName() {
    LocalStorage.remove(this.KEY_NAME);
  }

  @Log
  loadGender() {
    return LocalStorage.get(this.KEY_GENDER);
  }

  @Log
  storeGender(gender) {
    LocalStorage.set(this.KEY_GENDER, gender);
  }

  @Log
  removeGender() {
    LocalStorage.remove(this.KEY_GENDER);
  }

  @Log
  loadMobile() {
    return LocalStorage.get(this.KEY_MOBILE);
  }

  @Log
  storeMobile(mobile) {
    LocalStorage.set(this.KEY_MOBILE, mobile);
  }

  @Log
  removeMobile() {
    LocalStorage.remove(this.KEY_MOBILE);
  }

  @Log
  loadAvatar() {
    return LocalStorage.get(this.KEY_AVATAR);
  }

  @Log
  storeAvatar(avatar) {
    LocalStorage.set(this.KEY_AVATAR, avatar);
  }

  @Log
  removeAvatar() {
    LocalStorage.remove(this.KEY_AVATAR);
  }

  @Log
  loadOrganization() {
    return LocalStorage.get(this.KEY_ORGANIZATION);
  }

  @Log
  storeOrganization(organization) {
    LocalStorage.set(this.KEY_ORGANIZATION, organization);
  }

  @Log
  removeOrganization() {
    LocalStorage.remove(this.KEY_ORGANIZATION);
  }

  /**
   * 加载访问令牌。
   *
   * @returns {object}
   *     加载的访问令牌。
   */
  @Log
  loadToken() {
    return Cookie.get(this.KEY_ACCESS_TOKEN);
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
  @Log
  storeToken(token) {
    const expiresDays = config.get('cookie.expires_days.access_token', DEFAULT_ACCESS_TOKEN_EXPIRES_DAYS);
    Cookie.set(this.KEY_ACCESS_TOKEN, token, {
      expires: expiresDays,
    });
  }

  /**
   * 从本地存储中清除访问令牌。
   */
  @Log
  removeToken() {
    Cookie.remove(this.KEY_ACCESS_TOKEN);
  }

  /**
   * 检查是否存在访问令牌的值。
   *
   * @return {boolean}
   *     如果存在则返回`true`，否则返回`false`。
   */
  @Log
  hasTokenValue() {
    const token = Cookie.get(this.KEY_ACCESS_TOKEN);
    const value = token?.value;
    return (value !== undefined) && (value !== null) && (value !== '');
  }

  /**
   * 加载访问令牌的值。
   *
   * @returns {string}
   *     加载的访问令牌的值。
   */
  @Log
  loadTokenValue() {
    const token = Cookie.get(this.KEY_ACCESS_TOKEN);
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
  @Log
  storePrivileges(privileges) {
    LocalStorage.set(this.KEY_PRIVILEGES, privileges);
  }

  /**
   * 从本地存储中载入用户权限列表。
   *
   * 用户权限列表是一个包含权限名称的字符串数组。
   *
   * @return {array<string>}
   *     用户权限列表；若不存在则返回一个空数组。
   */
  @Log
  loadPrivileges() {
    return LocalStorage.get(this.KEY_PRIVILEGES);
  }

  /**
   * 从本地存储中清除用户权限列表。
   */
  @Log
  removePrivileges() {
    LocalStorage.remove(this.KEY_PRIVILEGES);
  }

  /**
   * 将用户角色列表存储到本地存储中。
   *
   * 用户角色列表是一个包含角色名称的字符串数组。
   *
   * @param {null|array<string>} roles
   *     用户角色列表。
   */
  @Log
  storeRoles(roles) {
    LocalStorage.set(this.KEY_ROLES, roles);
  }

  /**
   * 从本地存储中载入用户角色列表。
   *
   * 用户角色列表是一个包含角色名称的字符串数组。
   *
   * @return {array<string>}
   *     用户角色列表；若不存在则返回一个空数组。
   */
  @Log
  loadRoles() {
    return LocalStorage.get(this.KEY_ROLES);
  }

  /**
   * 从本地存储中清除用户角色列表。
   */
  @Log
  removeRoles() {
    LocalStorage.remove(this.KEY_ROLES);
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
  @Log
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
  @Log
  loadUserInfo() {
    return {
      id: this.loadUserId(),
      username: this.loadUsername(),
      nickname: this.loadNickname(),
      avatar: this.loadAvatar(),
      name: this.loadName(),
      gender: this.loadGender(),
      mobile: this.loadMobile(),
      organization: this.loadOrganization(),
    };
  }

  /**
   * 从本地存储中清除用户信息。
   */
  @Log
  removeUserInfo() {
    this.removeUserId();
    this.removeUsername();
    this.removeNickname();
    this.removeAvatar();
    this.removeName();
    this.removeGender();
    this.removeMobile();
    this.removeOrganization();
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
  @Log
  storeLoginResponse(response) {
    if (response) {
      this.storeUserInfo(response.user);
      this.storeToken(response.token);
      this.storePrivileges(response.privileges);
      this.storeRoles(response.roles);
      this.storeOrganization(response.organization);
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
  @Log
  loadLoginResponse() {
    return {
      user: this.loadUserInfo(),
      token: this.loadToken(),
      privileges: this.loadPrivileges(),
      roles: this.loadRoles(),
      organization: this.loadOrganization(),
    };
  }

  /**
   * 从本地存储中清除用户登录信息。
   */
  @Log
  removeLoginResponse() {
    this.removeUserInfo();
    this.removePassword();
    this.removeToken();
    this.removePrivileges();
    this.removeRoles();
    this.removeOrganization();
  }
}

export default AuthStorage;

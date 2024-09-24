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
  KEY_USER_ID = 'user_id';

  KEY_USERNAME = 'username';

  KEY_NICKNAME = 'nickname';

  KEY_PASSWORD = 'password';

  KEY_SAVE_LOGIN = 'save_login';

  KEY_NAME = 'name';

  KEY_GENDER = 'gender';

  KEY_MOBILE = 'mobile';

  KEY_AVATAR = 'avatar';

  KEY_PRIVILEGES = 'privileges';

  KEY_ROLES = 'roles';

  KEY_ACCESS_TOKEN_VALUE = 'token.value';

  KEY_ACCESS_TOKEN_CREATE_TIME = 'token.create_time';

  KEY_ACCESS_TOKEN_MAX_AGE = 'token.max_age';

  KEY_ACCESS_TOKEN_PREVIOUS_VALUE = 'token.previous_value';

  ACCESS_TOKEN_EXPIRES_DAYS = DEFAULT_ACCESS_TOKEN_EXPIRES_DAYS;

  /**
   * 创建一个新的 AuthStorage 对象。
   *
   * @param {string} appCode
   *     应用代码。
   * @param {number} accessTokenExpiresDays
   *     访问令牌的有效期，单位为天。
   */
  constructor(appCode, accessTokenExpiresDays = DEFAULT_ACCESS_TOKEN_EXPIRES_DAYS) {
    if (!appCode) {
      throw new Error('The appCode is required.');
    }
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
    this.KEY_ACCESS_TOKEN_VALUE = `${appCode}.token.value`;
    this.KEY_ACCESS_TOKEN_CREATE_TIME = `${appCode}.token.create_time`;
    this.KEY_ACCESS_TOKEN_MAX_AGE = `${appCode}.token.max_age`;
    this.KEY_ACCESS_TOKEN_PREVIOUS_VALUE = `${appCode}.token.previous_value`;
    this.ACCESS_TOKEN_EXPIRES_DAYS = accessTokenExpiresDays ?? DEFAULT_ACCESS_TOKEN_EXPIRES_DAYS;
  }

  loadUserId() {
    return LocalStorage.get(this.KEY_USER_ID);
  }

  storeUserId(id) {
    LocalStorage.set(this.KEY_USER_ID, id);
  }

  removeUserId() {
    LocalStorage.remove(this.KEY_USER_ID);
  }

  loadUsername() {
    return LocalStorage.get(this.KEY_USERNAME);
  }

  storeUsername(username) {
    LocalStorage.set(this.KEY_USERNAME, username);
  }

  removeUsername() {
    LocalStorage.remove(this.KEY_USERNAME);
  }

  loadPassword() {
    return LocalStorage.get(this.KEY_PASSWORD);
  }

  storePassword(password) {
    LocalStorage.set(this.KEY_PASSWORD, password);
  }

  removePassword() {
    LocalStorage.remove(this.KEY_PASSWORD);
  }

  loadSaveLogin() {
    return LocalStorage.get(this.KEY_SAVE_LOGIN);
  }

  storeSaveLogin(saveLogin) {
    LocalStorage.set(this.KEY_SAVE_LOGIN, saveLogin);
  }

  removeSaveLogin() {
    LocalStorage.remove(this.KEY_SAVE_LOGIN);
  }

  loadNickname() {
    return LocalStorage.get(this.KEY_NICKNAME);
  }

  storeNickname(nickname) {
    LocalStorage.set(this.KEY_NICKNAME, nickname);
  }

  removeNickname() {
    LocalStorage.remove(this.KEY_NICKNAME);
  }

  loadName() {
    return LocalStorage.get(this.KEY_NAME);
  }

  storeName(name) {
    LocalStorage.set(this.KEY_NAME, name);
  }

  removeName() {
    LocalStorage.remove(this.KEY_NAME);
  }

  loadGender() {
    return LocalStorage.get(this.KEY_GENDER);
  }

  storeGender(gender) {
    LocalStorage.set(this.KEY_GENDER, gender);
  }

  removeGender() {
    LocalStorage.remove(this.KEY_GENDER);
  }

  loadMobile() {
    return LocalStorage.get(this.KEY_MOBILE);
  }

  storeMobile(mobile) {
    LocalStorage.set(this.KEY_MOBILE, mobile);
  }

  removeMobile() {
    LocalStorage.remove(this.KEY_MOBILE);
  }

  loadAvatar() {
    return LocalStorage.get(this.KEY_AVATAR);
  }

  storeAvatar(avatar) {
    LocalStorage.set(this.KEY_AVATAR, avatar);
  }

  removeAvatar() {
    LocalStorage.remove(this.KEY_AVATAR);
  }

  /**
   * 加载访问令牌。
   *
   * @returns {object}
   *     加载的访问令牌。
   */
  loadToken() {
    return {
      value: Cookie.get(this.KEY_ACCESS_TOKEN_VALUE),
      createTime: Cookie.get(this.KEY_ACCESS_TOKEN_CREATE_TIME),
      maxAge: Cookie.get(this.KEY_ACCESS_TOKEN_MAX_AGE),
      previousValue: Cookie.get(this.KEY_ACCESS_TOKEN_PREVIOUS_VALUE),
    };
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
    Cookie.set(this.KEY_ACCESS_TOKEN_VALUE, token?.value, {
      expires: this.ACCESS_TOKEN_EXPIRES_DAYS,
    });
    Cookie.set(this.KEY_ACCESS_TOKEN_CREATE_TIME, token?.createTime, {
      expires: this.ACCESS_TOKEN_EXPIRES_DAYS,
    });
    Cookie.set(this.KEY_ACCESS_TOKEN_MAX_AGE, token?.maxAge, {
      expires: this.ACCESS_TOKEN_EXPIRES_DAYS,
    });
    Cookie.set(this.KEY_ACCESS_TOKEN_PREVIOUS_VALUE, token?.previousValue, {
      expires: this.ACCESS_TOKEN_EXPIRES_DAYS,
    });
  }

  /**
   * 从本地存储中清除访问令牌。
   */
  removeToken() {
    Cookie.remove(this.KEY_ACCESS_TOKEN_VALUE);
    Cookie.remove(this.KEY_ACCESS_TOKEN_CREATE_TIME);
    Cookie.remove(this.KEY_ACCESS_TOKEN_MAX_AGE);
    Cookie.remove(this.KEY_ACCESS_TOKEN_PREVIOUS_VALUE);
  }

  /**
   * 检查是否存在访问令牌的值。
   *
   * @return {boolean}
   *     如果存在则返回`true`，否则返回`false`。
   */
  hasTokenValue() {
    return Cookie.has(this.KEY_ACCESS_TOKEN_VALUE);
  }

  /**
   * 加载访问令牌的值。
   *
   * @returns {string}
   *     加载的访问令牌的值。
   */
  loadTokenValue() {
    return Cookie.get(this.KEY_ACCESS_TOKEN_VALUE);
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
  loadPrivileges() {
    return LocalStorage.get(this.KEY_PRIVILEGES);
  }

  /**
   * 从本地存储中清除用户权限列表。
   */
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
  loadRoles() {
    return LocalStorage.get(this.KEY_ROLES);
  }

  /**
   * 从本地存储中清除用户角色列表。
   */
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

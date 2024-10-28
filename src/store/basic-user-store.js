////////////////////////////////////////////////////////////////////////////////
//
//    Copyright (c) 2022 - 2024.
//    Haixing Hu, Qubit Co. Ltd.
//
//    All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////
import Logger from '@haixing_hu/logging';
import config from '@haixing_hu/config';
import { RawField } from '@haixing_hu/pinia-decorator';
import AuthStorage from '../auth-storage';
import {
  ensureUserExist,
  refreshAvatar,
  loadTokenFromAuthStorage,
} from './impl/basic-user-store-impl';

const logger = Logger.getLogger('store.user');

/**
 * 管理用户登录状态的 Pinia Store 类的基类。
 *
 * @author 胡海星
 */
class BasicUserStore {
  /**
   * 用于处理登录认证的API对象。
   *
   * @type {object}
   */
  @RawField
  _api = null;

  /**
   * 当前应用程序的代码，用于设置`Cookies`、`LocalStorage`和`SessionStorage`中存储
   * 的数据项的键值前缀。
   *
   * @type {string}
   */
  @RawField
  _appCode = '';

  /**
   * 用于存储用户认证信息的存储对象。
   *
   * @type {AuthStorage}
   */
  @RawField
  _authStorage = null;

  /**
   * 当前用户信息。
   *
   * 用户信息包括：
   * - `id`: 用户ID；
   * - `username`: 用户名；
   * - `nickname`: 用户昵称；
   * - `avatar`: 用户头像；
   * - `name`: 用户姓名；
   * - `gender`: 用户性别；
   * - `mobile`: 用户手机号码。
   *
   * @type {object}
   */
  user = null;

  /**
   * 当前用户的密码。
   *
   * @type {string}
   */
  password = '';

  /**
   * 当前用户是否需要保存登录信息。
   *
   * @type {boolean}
   */
  saveLogin = false;

  /**
   * 用户Open ID所属的社交网络。
   *
   * @type {string}
   */
  socialNetwork = null;

  /**
   * 用户Open ID所属的社交网络上的APP ID。
   *
   * @type {string}
   */
  appId = null;

  /**
   * 用户Open ID。
   *
   * @type {string}
   */
  openId = null;

  /**
   * 当前用户的Access Token。
   *
   * @type {object}
   */
  token = null;

  /**
   * 当前用户的权限。
   *
   * @type {array<string>}
   */
  privileges = [];

  /**
   * 当前用户的角色。
   *
   * @type {array<string>}
   */
  roles = [];

  /**
   * 构造一个新的`BasicUserStore`对象。
   *
   * 该函数需要一个用于处理登录认证的API对象。此API对象需要提供以下接口：
   * - `loginByUsername(username, password)`: 使用用户名和密码登录；
   * - `loginByMobile(mobile, verifyCode)`: 使用手机号码和验证码登录；
   * - `loginByOpenId(socialNetwork, appId, openId)`: 使用Open ID登录；
   * - `bindOpenId(socialNetwork, appId, openId)`: 绑定Open ID；
   * - `logout()`: 登出；
   * - `getLoginInfo()`: 获取登录用户的信息；
   * - `sendBySms(mobile, type)`: 发送短信验证码；
   * - `checkToken(userId, tokenValue)`: 检查用户的Token的值是否合法。
   *
   * @param {object} api
   *     用于处理登录认证的API对象。
   * @param {string} appCode
   *     当前应用程序的代码，用于设置`Cookies`、`LocalStorage`和`SessionStorage`中存储
   *     的数据项的键值前缀。
   */
  constructor(api, appCode) {
    if (!api) {
      throw new Error('The API object is required.');
    }
    if (!appCode) {
      throw new Error('The `appCode` is required.');
    }
    this._api = api;
    this._appCode = appCode;
    this._authStorage = new AuthStorage(appCode);
    this.user = this._authStorage.loadUserInfo() ?? null;
    this.password = this._authStorage.loadPassword() ?? '';
    this.saveLogin = this._authStorage.loadSaveLogin() ?? false;
    this.socialNetwork = config.get('social_network') ?? null;
    this.appId = config.get('social_network_app_id') ?? null;
    this.token = this._authStorage.loadToken() ?? null;
    this.privileges = this._authStorage.loadPrivileges() ?? [];
    this.roles = this._authStorage.loadRoles() ?? [];
  }

  /**
   * 用于存储用户认证信息的存储对象。
   *
   * @return {AuthStorage}
   *     用于存储用户认证信息的存储对象。
   */
  get authStorage() {
    return this._authStorage;
  }

  /**
   * 当前用户是否已经登录。
   *
   * @return {boolean}
   *     如果当前用户已经登录，则返回`true`；否则返回`false`。
   */
  get loggedIn() {
    return !!this.token?.value;
  }

  /**
   * 重置状态。
   */
  resetState() {
    this.$reset();
    logger.debug('state was reset to:', this.$state);
  }

  /**
   * 设置用户基本信息。
   *
   * @param {object} user
   *     用户基本信息。
   */
  setUserInfo(user) {
    this.user = { ...user };
    if (this.saveLogin) {
      this._authStorage.storeUserInfo(this.user);
    }
  }

  /**
   * 设置用户ID。
   *
   * @param {number|bigint|string} userId
   *     用户ID。
   */
  setUserId(userId) {
    const user = ensureUserExist(this);
    user.id = userId;
    if (this.saveLogin) {
      this._authStorage.storeUserId(userId);
    } else {
      this._authStorage.removeUserId();
    }
  }

  /**
   * 设置用户名。
   *
   * @param {string} username
   *     用户名。
   */
  setUsername(username) {
    const user = ensureUserExist(this);
    user.username = username;
    if (this.saveLogin) {
      this._authStorage.storeUsername(username);
    } else {
      this._authStorage.removeUsername();
    }
  }

  /**
   * 设置用户密码。
   *
   * @param {string} password
   *     用户密码。
   */
  setPassword(password) {
    this.password = password;
    if (this.saveLogin) {
      this._authStorage.storePassword(password);
    } else {
      this._authStorage.removePassword();
    }
  }

  /**
   * 设置用户手机号码。
   *
   * @param {string} mobile
   *     用户手机号码。
   */
  setMobile(mobile) {
    const user = ensureUserExist(this);
    user.mobile = mobile;
    if (this.saveLogin) {
      this._authStorage.storeMobile(mobile);
    } else {
      this._authStorage.removeMobile();
    }
  }

  /**
   * 设置用户头像。
   *
   * @param {string} avatar
   *     用户头像。
   */
  setAvatar(avatar) {
    const user = ensureUserExist(this);
    user.avatar = avatar ?? '';
    this._authStorage.storeAvatar(avatar);
  }

  /**
   * 设置用户是否保存登录信息。
   *
   * @param {boolean} saveLogin
   *     用户是否保存登录信息。
   */
  setSaveLogin(saveLogin) {
    this.saveLogin = saveLogin;
    this._authStorage.storeSaveLogin(saveLogin);
  }

  /**
   * 设置用户的登录令牌。
   *
   * @param {object} token
   *     用户的登录令牌。
   */
  setToken(token) {
    this.token = { ...token };
    if (this.saveLogin) {
      this._authStorage.storeToken(token);
    } else {
      this._authStorage.removeToken();
    }
  }

  /**
   * 移除用户的登录令牌。
   */
  removeToken() {
    logger.debug('Remove user access token.');
    this.token = null;
    this._authStorage.removeToken();
  }

  /**
   * 重置用户的Token值。
   *
   * 此函数将删除用户的Token值，并重置用户的状态。
   */
  resetToken() {
    logger.debug('Reset user access token.');
    this.removeToken();  // must remove  token  first
    this.resetState();
  }

  /**
   * 设置用户的权限列表。
   *
   * @param {array<string>} privileges
   *     用户的权限列表。
   */
  setPrivileges(privileges) {
    this.privileges = privileges ?? [];
    this._authStorage.storePrivileges(this.privileges);
  }

  /**
   * 设置用户的角色列表。
   *
   * @param {array<string>} roles
   *     用户的角色列表。
   */
  setRoles(roles) {
    this.roles = roles ?? [];
    this._authStorage.storeRoles(this.roles);
  }

  /**
   * 设置用户的Open ID。
   *
   * @param {string} socialNetwork
   *     Open ID 所属社交网络。
   * @param {string} appId
   *     Open ID 所属社交网络上的APP ID。
   * @param {string} openId
   *     Open ID。
   */
  setOpenId(socialNetwork, appId, openId) {
    this.socialNetwork = socialNetwork;
    this.appId = appId;
    this.openId = openId;
  }

  /**
   * 设置用户登录后服务器返回的响应数据。
   *
   * 响应数据包括用户基本信息、Token、权限列表和角色列表。
   *
   * @param {object} response
   *     用户登录后服务器返回的响应数据。
   */
  setLoginResponse(response) {
    logger.debug('Set the login response:', response);
    this.setUserInfo(response.user);
    this.setToken(response.token);
    this.setPrivileges(response.privileges);
    this.setRoles(response.roles);
    refreshAvatar(this);
  }

  /**
   * 尝试获取用户的Token值。
   *
   * @returns {Promise<object|null>}
   *     如果成功获取用户的Token值，则返回该值；否则返回`null`。
   */
  async loadToken() {
    logger.debug('Getting the user token...');
    if (await loadTokenFromAuthStorage(this)) {
      logger.debug('The user token value is:', this.token.value);
      await this.refreshLoginInfo();
      return this.token;
    } else {
      return null;
    }
  }

  loginByUsername(username, password, saveLogin) {
    logger.debug('Login: username = %s, saveLogin = %s', username, saveLogin);
    this.setSaveLogin(saveLogin);
    this.setUsername(username);
    this.setPassword(password);
    this.removeToken();           // 注意调用login API时必须先清除已保存的Access Token
    return this.api.loginByUsername(username, password).then((response) => {
      logger.debug('Successfully logged in with:', response);
      this.setLoginResponse(response);
      return response;
    });
  }

  loginByMobile(mobile, verifyCode, saveLogin) {
    logger.debug('Login: mobile = %s, verifyCode = %s, saveLogin = %s', mobile, verifyCode, saveLogin);
    this.setSaveLogin(saveLogin);
    this.setMobile(mobile);
    this.removeToken();           // 注意调用login API时必须先清除已保存的Access Token
    return this.api.loginByMobile(mobile, verifyCode).then((response) => {
      logger.debug('Successfully logged in with:', response);
      this.setLoginResponse(response);
      return response;
    });
  }

  loginByOpenId(socialNetwork, appId, openId) {
    logger.debug('Login: socialNetwork = %s, appId = %s, openId = %s', socialNetwork, appId, openId);
    this.removeToken();           // 注意调用login API时必须先清除已保存的Access Token
    return this.api.loginByOpenId(socialNetwork, appId, openId).then((response) => {
      logger.debug('Successfully logged in with:', response);
      this.setOpenId(socialNetwork, appId, openId);
      this.setLoginResponse(response);
      return response;
    });
  }

  bindOpenId() {
    logger.debug('Bind the Open ID for the current user: socialNetwork = %s, '
      + 'appId = %s, openId = %s', this.socialNetwork, this.appId, this.openId);
    return this.api.bindOpenId(this.socialNetwork, this.appId, this.openId).then(() => {
      logger.debug('Successfully bind the Open ID for the current user.');
    });
  }

  logout() {
    logger.debug('Logout.');
    return this.api.logout().then(() => {
      this.removeToken(); // must remove  token  first
      this.resetState();
    });
  }

  refreshLoginInfo() {
    logger.debug('Loading the user information for the current user.');
    return this.api.getLoginInfo().then((response) => {
      logger.debug('Successfully get the login information of the current user:', response);
      this.setLoginResponse(response);
      return response;
    });
  }

  /**
   * 发送登录验证码。
   *
   * @param {string} mobile
   *     登录用户的手机号码。
   */
  sendLoginVerifyCode(mobile) {
    logger.debug('Sending login verify code to %s.', mobile);
    return this.api.sendBySms(mobile, 'LOGIN').then(() => {
      logger.info('Successfully sent the login verify code to:', mobile);
    });
  }
}

export default BasicUserStore;

////////////////////////////////////////////////////////////////////////////////
//
//    Copyright (c) 2022 - 2024.
//    Haixing Hu, Qubit Co. Ltd.
//
//    All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////
import { Logger, Log } from '@haixing_hu/logging';
import { RawField } from '@haixing_hu/pinia-decorator';
import { confirm } from '@haixing_hu/common-ui';
import config from '@haixing_hu/config';
import AuthStorage from '../auth-storage';
import http from '../http';
import { DEFAULT_LOGIN_PAGE } from '../impl/http-impl';

const logger = Logger.getLogger('store.user');

/**
 * 管理用户登录状态的 Pinia Store 类的基类。
 *
 * @author 胡海星
 */
class BasicUserStore {
  /**
   * 用于处理用户登录认证的API对象。
   *
   * 此对象必须有以下接口：
   *
   * - `loginByUsername(username, password)`: 使用用户名和密码登录；
   * - `loginByMobile(mobile, verifyCode)`: 使用手机号码和验证码登录；
   * - `loginByOpenId(socialNetwork, appId, openId)`: 使用Open ID登录；
   * - `bindOpenId(socialNetwork, appId, openId)`: 绑定Open ID；
   * - `logout()`: 登出；
   * - `getLoginInfo()`: 获取登录用户的信息；
   * - `checkToken(userId, tokenValue)`: 检查用户的Token的值是否合法。
   *
   * @type {object}
   */
  @RawField
  _userAuthenticateApi = null;

  /**
   * 用于处理发送验证码的API对象。
   *
   * 此对象必须有一个`sendBySms(mobile, scene)`方法，用于发送短信验证码。
   *
   * @type {object}
   */
  @RawField
  _verifyCodeApi = null;

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
   * 该函数需要一个用于处理登录认证的API对象和一个用于发送验证码的API对象。
   *
   * @param {object} userAuthenticateApi
   *     用于处理用户登录认证的API对象。此API对象需要提供以下接口：
   *     - `loginByUsername(username, password)`: 使用用户名和密码登录；
   *     - `loginByMobile(mobile, verifyCode)`: 使用手机号码和验证码登录；
   *     - `loginByOpenId(socialNetwork, appId, openId)`: 使用Open ID登录；
   *     - `bindOpenId(socialNetwork, appId, openId)`: 绑定Open ID；
   *     - `logout()`: 登出；
   *     - `getLoginInfo()`: 获取登录用户的信息；
   *     - `checkToken(userId, tokenValue)`: 检查用户的Token的值是否合法。
   * @param {object} verifyCodeApi
   *     用于处理发送验证码的API对象。
   *     - `sendBySms(mobile, scene)`：发送短信验证码。
   * @param {string} appCode
   *     当前应用程序的代码，用于设置`Cookies`、`LocalStorage`和`SessionStorage`中存储
   *     的数据项的键值前缀。
   */
  constructor(userAuthenticateApi, verifyCodeApi, appCode) {
    if (!userAuthenticateApi) {
      throw new Error('The API object for authenticating users is required.');
    }
    if (!verifyCodeApi) {
      throw new Error('The API object for sending verify code is required.');
    }
    if (!appCode) {
      throw new Error('The app code is required.');
    }
    this._userAuthenticateApi = userAuthenticateApi;
    this._verifyCodeApi = verifyCodeApi;
    this._appCode = appCode;
    this._authStorage = new AuthStorage(appCode);
    this.user = this._authStorage.loadUserInfo() ?? null;
    this.password = this._authStorage.loadPassword() ?? '';
    this.saveLogin = this._authStorage.loadSaveLogin() ?? false;
    this.socialNetwork = config.get('social_network', null);
    this.appId = config.get('social_network_app_id', null);
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
   * 确保当前用户信息对象存在。
   *
   * @return {object}
   *     当前用户信息对象。
   */
  @Log
  ensureUserExist() {
    if (!this.user) {
      this.user = {
        id: null,
        username: '',
        nickname: '',
        avatar: '',
        name: '',
        gender: '',
        mobile: '',
      };
    }
    return this.user;
  }

  /**
   * 重置状态。
   */
  @Log
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
  @Log
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
  @Log
  setUserId(userId) {
    const user = this.ensureUserExist();
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
  @Log
  setUsername(username) {
    const user = this.ensureUserExist();
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
  @Log
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
  @Log
  setMobile(mobile) {
    const user = this.ensureUserExist();
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
  @Log
  setAvatar(avatar) {
    const user = this.ensureUserExist();
    user.avatar = avatar ?? '';
    this._authStorage.storeAvatar(avatar);
  }

  /**
   * 设置用户是否保存登录信息。
   *
   * @param {boolean} saveLogin
   *     用户是否保存登录信息。
   */
  @Log
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
  @Log
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
  @Log
  removeToken() {
    this.token = null;
    this._authStorage.removeToken();
  }

  /**
   * 重置用户的Token值。
   *
   * 此函数将删除用户的Token值，并重置用户的状态。
   */
  @Log
  resetToken() {
    this.removeToken();  // must remove  token  first
    this.resetState();
  }

  /**
   * 设置用户的权限列表。
   *
   * @param {array<string>} privileges
   *     用户的权限列表。
   */
  @Log
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
  @Log
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
  @Log
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
  @Log
  setLoginResponse(response) {
    logger.debug('Set the login response:', response);
    this.setUserInfo(response.user);
    this.setToken(response.token);
    this.setPrivileges(response.privileges);
    this.setRoles(response.roles);
    this.refreshAvatar();
  }

  /**
   * 刷新用户的头像。
   */
  @Log
  refreshAvatar() {
    const user = this.ensureUserExist();
    if (!user.avatar && user.gender) {
      switch (user.gender) {
        case 'MALE':
          this.setAvatar(config.get('default_avatar_male', ''));
          break;
        case 'FEMALE':
          this.setAvatar(config.get('default_avatar_female', ''));
          break;
        default:
          this.setAvatar('');
          break;
      }
    }
  }

  /**
   * 合并用户信息。
   *
   * @param {object} info
   *     待合并的用户信息。
   */
  @Log
  mergeUserInfo(info) {
    const user = this.ensureUserExist();
    if (!user.username && info.username) {
      user.username = info.username;
    }
    if (!user.name && info.name) {
      user.name = info.name;
    }
    if (!user.nickname && info.nickname) {
      user.nickname = info.nickname;
    }
    if (!user.gender && info.gender) {
      user.gender = info.gender;
    }
    if (!user.avatar && info.avatar) {
      user.avatar = info.avatar;
    }
    if (!user.mobile && info.mobile) {
      user.mobile = info.mobile;
    }
    this.refreshAvatar();
    if (this.saveLogin) {
      this._authStorage.storeUserInfo(user);
    }
  }

  /**
   * 尝试获取用户的Token值。
   *
   * @returns {Promise<object|null>}
   *     如果成功获取用户的Token值，则返回该值；否则返回`null`。
   */
  @Log
  async loadToken() {
    if ((await this.loadTokenFromDevice())
        || (await this.loadTokenFromAuthStorage())) {
      logger.info('The user token value is:', this.token.value);
      await this.refreshLoginInfo();
      return this.token;
    } else {
      return null;
    }
  }

  /**
   * 从本地存储中获取当前绑定用户的登录信息。
   *
   * @return {Promise<boolean>}
   *     如果成功获取用户的登录信息，则保存userId和token并返回`true`；否则返回`false`。
   */
  async loadTokenFromAuthStorage() {
    const user = this._authStorage.loadUserInfo();
    if (user?.username) {       // 如果有用户信息，则保存用户信息，以便于后继登录自动填写用户名和手机号码
      logger.debug('Found user information in the local storage:', user);
      this.setUserInfo(user);
    }
    const password = this._authStorage.loadPassword();
    if (password) {             // 如果有密码，则保存密码，以便于后继登录自动填写密码
      logger.debug('Found password in the local storage:', password);
      this.setPassword(password);
    }
    const saveLogin = this._authStorage.loadSaveLogin();
    if (saveLogin) {  // 如果有保存登录信息，则保存保存登录信息标志
      logger.debug('Found save login information in the local storage:', saveLogin);
      this.setSaveLogin(saveLogin);
    }
    const token = this._authStorage.loadToken();
    if (user?.id && token?.value) {
      logger.debug('Successfully load access token from the local storage:', token);
      if (await this.isTokenValid(user.id, token.value)) {
        this.setUserId(user.id);
        this.setToken(token);
        return true;
      } else {
        logger.info('The access token is invalid or expired, remove it:', token);
        this._authStorage.removeLoginResponse();
        return false;
      }
    } else {
      logger.error('No access token found in local storage.');
      return false;
    }
  }

  /**
   * 从底层设备的存储中获取当前绑定用户的登录信息。
   *
   * **注意：** 此方法的默认实现总是返回`false`。派生类可以重写此方法以实现从设备获取用户登录
   * 信息的业务逻辑。
   *
   * @return {Promise<boolean>}
   *     如果成功获取用户的登录信息，则保存userId和token并返回`true`；否则返回`false`。
   */
  async loadTokenFromDevice() {
    return false;
  }

  /**
   * 使用用户名和密码登录。
   *
   * @param {string} username
   *     用户名。
   * @param {string} password
   *     密码。
   * @param {boolean} saveLogin
   *     是否保存登录信息。
   * @return {Promise<LoginResponse|ErrorInfo>}
   *     此 HTTP 请求的 Promise，若操作成功，解析成功并返回一个`LoginResponse`对象，包含
   *     了指定用户的登录信息；若操作失败，解析失败并返回一个`ErrorInfo`对象。
   */
  @Log
  loginByUsername(username, password, saveLogin) {
    this.setSaveLogin(saveLogin);
    this.setUsername(username);
    this.setPassword(password);
    this.removeToken();           // 注意调用login API时必须先清除已保存的Access Token
    return this._userAuthenticateApi.loginByUsername(username, password).then((response) => {
      logger.debug('Successfully logged in with:', response);
      this.setLoginResponse(response);
      return response;
    });
  }

  /**
   * 使用手机号码和验证码登录。
   *
   * @param {string} mobile
   *     手机号码。
   * @param {string} verifyCode
   *     该手机收到的验证码。
   * @param {boolean} saveLogin
   *     是否保存登录信息。
   * @return {Promise<LoginResponse|ErrorInfo>}
   *     此 HTTP 请求的 Promise，若操作成功，解析成功并返回一个`LoginResponse`对象，包含
   *     了指定用户的登录信息；若操作失败，解析失败并返回一个`ErrorInfo`对象。
   */
  @Log
  loginByMobile(mobile, verifyCode, saveLogin) {
    this.setSaveLogin(saveLogin);
    this.setMobile(mobile);
    this.removeToken();           // 注意调用login API时必须先清除已保存的Access Token
    return this._userAuthenticateApi.loginByMobile(mobile, verifyCode).then((response) => {
      logger.debug('Successfully logged in with:', response);
      this.setLoginResponse(response);
      return response;
    });
  }

  /**
   * 使用社交网络的Open ID登录。
   *
   * @param {SocialNetwork} socialNetwork
   *     指定的社交网络枚举名称。
   * @param {string} appId
   *     该社交网络下的APP（公众号）的ID。
   * @param {string} openId
   *     用户在该社交网络指定的APP（公众号）下的Open ID。
   * @return {Promise<LoginResponse|ErrorInfo>}
   *     此 HTTP 请求的 Promise，若操作成功，解析成功并返回一个`LoginResponse`对象，包含
   *     了指定用户的登录信息；若操作失败，解析失败并返回一个`ErrorInfo`对象。
   */
  @Log
  loginByOpenId(socialNetwork, appId, openId) {
    this.removeToken();           // 注意调用login API时必须先清除已保存的Access Token
    return this._userAuthenticateApi.loginByOpenId(socialNetwork, appId, openId).then((response) => {
      logger.debug('Successfully logged in with:', response);
      this.setOpenId(socialNetwork, appId, openId);
      this.setLoginResponse(response);
      return response;
    });
  }

  /**
   * 将当前登录用户的账号绑定到指定的Open ID。
   *
   * @param {SocialNetwork} socialNetwork
   *     指定的社交网络枚举名称。
   * @param {string} appId
   *     该社交网络下的APP（公众号）的ID。
   * @param {string} openId
   *     用户在该社交网络指定的APP（公众号）下的Open ID。
   * @return
   *     此 HTTP 请求的 Promise。若操作成功，解析成功且没有返回值；若操作失败，解析失败并
   *     返回一个`ErrorInfo`对象。
   */
  @Log
  bindOpenId(socialNetwork, appId, openId) {
    return this._userAuthenticateApi.bindOpenId(socialNetwork, appId, openId).then(() => {
      logger.debug('Successfully bind the Open ID for the current user.');
      this.setOpenId(socialNetwork, appId, openId);
    });
  }

  /**
   * 用户注销登录。
   *
   * @return {Promise<void|ErrorInfo>}
   *     此 HTTP 请求的 Promise；若操作成功，解析成功且没有返回值；若操作失败，解析失败并返
   *     回一个`ErrorInfo`对象。
   */
  @Log
  logout() {
    return this._userAuthenticateApi.logout().then(() => {
      this.removeToken(); // must remove  token  first
      this.resetState();
    });
  }

  /**
   * 刷新当前已登录用户的登录信息。
   *
   * @return {Promise<LoginResponse|ErrorInfo>}
   *     此 HTTP 请求的 Promise，若操作成功，解析成功并返回一个`LoginResponse`对象，包含
   *     了指定用户的登录信息；若操作失败，解析失败并返回一个`ErrorInfo`对象。
   */
  @Log
  refreshLoginInfo() {
    return this._userAuthenticateApi.getLoginInfo().then((response) => {
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
  @Log
  sendLoginVerifyCode(mobile) {
    return this._verifyCodeApi.sendBySms(mobile, 'LOGIN').then(() => {
      logger.info('Successfully sent the login verify code to:', mobile);
    });
  }

  /**
   * 检查指定的 Token 的值对于指定的用户是否依然合法。
   *
   * @param {string} userId
   *     用户的ID。
   * @param {string} tokenValue
   *     Token的值。
   * @returns {Promise<boolean|ErrorInfo>}
   *     此 HTTP 请求的 Promise，若操作成功，解析成功，如果Token的值对于指定的用户依然合法，
   *     则返回`true`；否则返回`false`；若操作失败，解析失败并返回一个`ErrorInfo`对象。
   */
  @Log
  async isTokenValid(userId, tokenValue) {
    try {
      logger.info('Checking the whether token value for the user %s is valid:', userId, tokenValue);
      const token = await this._userAuthenticateApi.checkToken(userId, tokenValue);
      const valid = !!token;
      logger.info('The validity of the token value is:', valid);
      return valid;
    } catch (error) {
      logger.info('The token value is invalid:', error);
      return false;
    }
  }

  /**
   * 对于未登录用户，显示提示框提示其重新登录。
   */
  @Log
  confirmLogin() {
    return confirm.info(
      '是否重新登录',
      '您尚未登录或者已经登出，请选择重新登录，或者选择放弃停留在本页面',
      '重新登录',
      '放弃',
    ).then(() => {
      this.resetToken();
      logger.info('Redirect to user login page ...');
      // FIXME: 这里重复用了代码，是否需要抽象出一个公共方法？参见 http-impl.js
      const router = http.getRouter();
      if (typeof router?.push !== 'function') {
        throw new Error('`http.getRouter`方法的返回值不是一个`VueRouter`对象，无法调用`push`方法');
      }
      const loginPage = config.get('login_page', DEFAULT_LOGIN_PAGE);
      logger.info('Redirect to user login page:', loginPage);
      return router.push({ name: loginPage });
    });
  }
}

export default BasicUserStore;

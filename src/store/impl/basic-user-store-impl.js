////////////////////////////////////////////////////////////////////////////////
//
//    Copyright (c) 2022 - 2024.
//    Haixing Hu, Qubit Co. Ltd.
//
//    All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////
import { Logger } from '@haixing_hu/logging';
import config from '../../config';
import AuthStorage from '../../auth-storage';

const logger = Logger.getLogger('store.user');

export function ensureUserExist(store) {
  if (!store.user) {
    store.user = {
      id: null,
      username: '',
      nickname: '',
      avatar: '',
      name: '',
      gender: '',
      mobile: '',
    };
  }
  return store.user;
}

export function refreshAvatar(store) {
  const user = ensureUserExist(store);
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

export function mergeUserInfo(store, info, authStorage) {
  const user = ensureUserExist(store);
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
  refreshAvatar(store);
  if (this.saveLogin) {
    authStorage.storeUserInfo(user);
  }
}

/**
 * 检查指定的 Token 的值对于指定的用户是否依然合法。
 *
 * @param {object} store
 *     用户信息的 Pinia store.
 * @param {string} userId
 *     用户的ID。
 * @param {string} tokenValue
 *     Token的值。
 * @returns {Promise<boolean>}
 *     如果Token的值对于指定的用户依然合法，则返回`true`；否则返回`false`。
 * @private
 */
async function isTokenValid(store, userId, tokenValue) {
  try {
    logger.info('Validating the token of the user:', userId, tokenValue);
    const token = await store.api.checkToken(userId, tokenValue);
    const valid = !!token;
    logger.info('The validity of the token value is:', valid);
    return valid;
  } catch (error) {
    logger.info('The token value is invalid.');
    return false;
  }
}

/**
 * 从本地存储中获取保存的用户登录信息。
 *
 * @param {object} store
 *     用户信息存储对象。
 * @returns {Promise<boolean>}
 *     如果成功获取用户的登录信息，则保存userId和token并返回`true`；否则返回`false`。
 */
export async function loadTokenFromAuthStorage(store) {
  const authStorage = AuthStorage.getInstance();
  const user = authStorage.loadUserInfo();
  if (user?.username) {       // 如果有用户信息，则保存用户信息，以便于后继登录自动填写用户名和手机号码
    logger.info('Found user information in the local storage:', user);
    store.setUserInfo(user);
  }
  const password = authStorage.loadPassword();
  if (password) {   // 如果有密码，则保存密码，以便于后继登录自动填写密码
    logger.info('Found password in the local storage:', password);
    store.setPassword(password);
  }
  const saveLogin = authStorage.loadSaveLogin();
  if (saveLogin) {  // 如果有保存登录信息，则保存保存登录信息标志
    logger.info('Found save login information in the local storage:', saveLogin);
    store.setSaveLogin(saveLogin);
  }
  const token = authStorage.loadToken();
  if (user?.id && token?.value) {
    logger.info('Successfully load access token from the local storage:', token);
    if (await isTokenValid(store, user.id, token.value)) {
      store.setUserId(user.id);
      store.setToken(token);
      return true;
    } else {
      logger.info('The access token is invalid or expired, remove it:', token);
      authStorage.removeLoginResponse();
      return false;
    }
  } else {
    logger.error('No access token found in local storage.');
    return false;
  }
}

////////////////////////////////////////////////////////////////////////////////
//
//    Copyright (c) 2022 - 2024.
//    Haixing Hu, Qubit Co. Ltd.
//
//    All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////
import Cookies from 'js-cookie';
import { AuthStorage } from '../src';

const APP_CODE = 'auto-storage-test';

// Mock localStorage
const mockLocalStorage = (() => {
  console.log('Mock localStorage');
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value?.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

// 必须使用 Object.defineProperty 来修改 window.localStorage；直接赋值无效
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// mock js-cookie
jest.mock('js-cookie', () => {
  let store = {};
  return {
    __esModule: true,     // 这个很重要，它告诉 ES 模块系统这是一个模块对象
    default: {
      get: jest.fn((key) => store[key] || null),
      set: jest.fn((key, value) => {
        store[key] = value?.toString();
      }),
      remove: jest.fn((key) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        store = {};
      }),
    },
  };
});


const authStorage = new AuthStorage(APP_CODE);

describe('Test AuthStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('storeUserId(), loadUserId(), removeUserId(), user ID is string', () => {
    const userId = '123';
    authStorage.storeUserId(userId);
    expect(localStorage.setItem).toHaveBeenCalledWith(`${APP_CODE}.user_id`, '"123"');
    expect(authStorage.loadUserId()).toBe(userId);
    authStorage.removeUserId();
    expect(localStorage.removeItem).toHaveBeenCalledWith(`${APP_CODE}.user_id`);
    expect(authStorage.loadUserId()).toBeUndefined();
  });

  test('storeUserId(), loadUserId(), removeUserId(), user ID is number', () => {
    const userId = 123;
    expect(authStorage.loadUserId()).toBeUndefined();
    authStorage.storeUserId(userId);
    expect(localStorage.setItem).toHaveBeenCalledWith(`${APP_CODE}.user_id`, '123');
    expect(authStorage.loadUserId()).toBe(userId);
    authStorage.removeUserId();
    expect(localStorage.removeItem).toHaveBeenCalledWith(`${APP_CODE}.user_id`);
    expect(authStorage.loadUserId()).toBeUndefined();
  });

  test('storeUserId(), loadUserId(), removeUserId(), user ID is small bigint', () => {
    const userId = 123n;
    expect(authStorage.loadUserId()).toBeUndefined();
    authStorage.storeUserId(userId);
    expect(localStorage.setItem).toHaveBeenCalledWith(`${APP_CODE}.user_id`, '123');
    expect(authStorage.loadUserId()).toBe(123);
    authStorage.removeUserId();
    expect(localStorage.removeItem).toHaveBeenCalledWith(`${APP_CODE}.user_id`);
    expect(authStorage.loadUserId()).toBeUndefined();
  });

  test('storeUserId(), loadUserId(), removeUserId(), user ID is large bigint', () => {
    const userId = 12345678901234567890n;
    expect(authStorage.loadUserId()).toBeUndefined();
    authStorage.storeUserId(userId);
    expect(localStorage.setItem).toHaveBeenCalledWith(`${APP_CODE}.user_id`,
      '12345678901234567890');
    expect(authStorage.loadUserId()).toBe(12345678901234567890n);
    authStorage.removeUserId();
    expect(localStorage.removeItem).toHaveBeenCalledWith(`${APP_CODE}.user_id`);
    expect(authStorage.loadUserId()).toBeUndefined();
  });

  test('storeUsername(), loadUsername(), removeUsername()', () => {
    const username = 'admin';
    expect(authStorage.loadUsername()).toBeUndefined();
    authStorage.storeUsername(username);
    expect(localStorage.setItem).toHaveBeenCalledWith(`${APP_CODE}.username`, `"${username}"`);
    expect(authStorage.loadUsername()).toBe(username);
    authStorage.removeUsername();
    expect(localStorage.removeItem).toHaveBeenCalledWith(`${APP_CODE}.username`);
    expect(authStorage.loadUsername()).toBeUndefined();
  });

  test('storePassword(), loadPassword(), removePassword()', () => {
    const password = 'testPassword';
    expect(authStorage.loadPassword()).toBeUndefined();
    authStorage.storePassword(password);
    expect(localStorage.setItem).toHaveBeenCalledWith(`${APP_CODE}.password`, `"${password}"`);
    expect(authStorage.loadPassword()).toBe(password);
    authStorage.removePassword();
    expect(localStorage.removeItem).toHaveBeenCalledWith(`${APP_CODE}.password`);
    expect(authStorage.loadPassword()).toBeUndefined();
  });

  test('storeSaveLogin(), loadSaveLogin(), removeSaveLogin()', () => {
    expect(authStorage.loadSaveLogin()).toBeUndefined();
    authStorage.storeSaveLogin(true);
    expect(localStorage.setItem).toHaveBeenCalledWith(`${APP_CODE}.save_login`, 'true');
    expect(authStorage.loadSaveLogin()).toBe(true);
    authStorage.removeSaveLogin();
    expect(localStorage.removeItem).toHaveBeenCalledWith(`${APP_CODE}.save_login`);
    expect(authStorage.loadSaveLogin()).toBeUndefined();
  });

  test('storeNickname(), loadNickname(), removeNickname()', () => {
    const nickname = 'admin';
    authStorage.storeNickname(nickname);
    expect(localStorage.setItem).toHaveBeenCalledWith(`${APP_CODE}.nickname`, `"${nickname}"`);
    expect(authStorage.loadNickname()).toBe(nickname);
    authStorage.removeNickname();
    expect(localStorage.removeItem).toHaveBeenCalledWith(`${APP_CODE}.nickname`);
    expect(authStorage.loadNickname()).toBeUndefined();
  });

  test('storeName(), loadName(), removeName()', () => {
    const name = 'John Doe';
    authStorage.storeName(name);
    expect(localStorage.setItem).toHaveBeenCalledWith(`${APP_CODE}.name`, `"${name}"`);
    expect(authStorage.loadName()).toBe(name);
    authStorage.removeName();
    expect(localStorage.removeItem).toHaveBeenCalledWith(`${APP_CODE}.name`);
    expect(authStorage.loadName()).toBeUndefined();
  });

  test('storeGender(), loadGender(), removeGender()', () => {
    const gender = 'MALE';
    authStorage.storeGender(gender);
    expect(localStorage.setItem).toHaveBeenCalledWith(`${APP_CODE}.gender`, `"${gender}"`);
    expect(authStorage.loadGender()).toBe(gender);
    authStorage.removeGender();
    expect(localStorage.removeItem).toHaveBeenCalledWith(`${APP_CODE}.gender`);
    expect(authStorage.loadGender()).toBeUndefined();
  });

  test('storeMobile(), loadMobile(), removeMobile()', () => {
    const mobile = '1234567';
    authStorage.storeMobile(mobile);
    expect(localStorage.setItem).toHaveBeenCalledWith(`${APP_CODE}.mobile`, `"${mobile}"`);
    expect(authStorage.loadMobile()).toBe(mobile);
    authStorage.removeMobile();
    expect(localStorage.removeItem).toHaveBeenCalledWith(`${APP_CODE}.mobile`);
    expect(authStorage.loadMobile()).toBeUndefined();
  });

  test('storeAvatar(), loadAvatar(), removeAvatar()', () => {
    const avatar = 'avatar.png';
    authStorage.storeAvatar(avatar);
    expect(localStorage.setItem).toHaveBeenCalledWith(`${APP_CODE}.avatar`, `"${avatar}"`);
    expect(authStorage.loadAvatar()).toBe(avatar);
    authStorage.removeAvatar();
    expect(localStorage.removeItem).toHaveBeenCalledWith(`${APP_CODE}.avatar`);
    expect(authStorage.loadAvatar()).toBeUndefined();
  });

  test('storeToken(), loadToken(), removeToken()', () => {
    const token = {
      value: 'token-value',
      createTime: '2020-01-01T00:00:00Z',
      maxAge: '3600',
      previousValue: 'previous-token-value',
    };
    // 设置 Cookies.get 的模拟实现
    authStorage.storeToken(token);
    expect(Cookies.set).toHaveBeenCalledTimes(4); // 因为你保存了四个值
    const loadedToken = authStorage.loadToken();
    expect(loadedToken).toEqual(token);
    authStorage.removeToken();
    expect(Cookies.remove).toHaveBeenCalledTimes(4); // 因为你保存了四个值
    expect(authStorage.loadToken()).toEqual({
      value: undefined,
      createTime: undefined,
      maxAge: undefined,
      previousValue: undefined,
    });
  });

  test('hasTokenValue()', () => {
    const token = {
      value: 'token-value',
      createTime: '2020-01-01T00:00:00Z',
      maxAge: '3600',
      previousValue: 'previous-token-value',
    };
    // 设置 Cookies.get 的模拟实现
    authStorage.storeToken(token);
    expect(Cookies.set).toHaveBeenCalledTimes(4); // 因为你保存了四个值
    expect(authStorage.hasTokenValue()).toEqual(true);
    authStorage.removeToken();
    expect(Cookies.remove).toHaveBeenCalledTimes(4); // 因为你保存了四个值
    expect(authStorage.hasTokenValue()).toBe(false);
  });

  test('loadTokenValue()', () => {
    const token = {
      value: 'token-value',
      createTime: '2020-01-01T00:00:00Z',
      maxAge: '3600',
      previousValue: 'previous-token-value',
    };
    // 设置 Cookies.get 的模拟实现
    authStorage.storeToken(token);
    expect(Cookies.set).toHaveBeenCalledTimes(4); // 因为你保存了四个值
    let value = authStorage.loadTokenValue();
    expect(value).toBe('token-value');
    authStorage.removeToken();
    expect(Cookies.remove).toHaveBeenCalledTimes(4); // 因为你保存了四个值
    value = authStorage.loadTokenValue();
    expect(value).toBe(undefined);
  });

  test('storePrivileges(), loadPrivileges(), removePrivileges()', () => {
    const privileges = ['READ_USER', 'MODIFY_USER'];
    authStorage.storePrivileges(privileges);
    expect(localStorage.setItem).toHaveBeenCalledWith(`${APP_CODE}.privileges`, '["READ_USER","MODIFY_USER"]');
    expect(authStorage.loadPrivileges()).toEqual(privileges);
    authStorage.removePrivileges();
    expect(localStorage.removeItem).toHaveBeenCalledWith(`${APP_CODE}.privileges`);
    expect(authStorage.loadPrivileges()).toBeUndefined();
  });

  test('storeRoles(), loadRoles(), removeRoles()', () => {
    const roles = ['USER', 'ADMIN'];
    authStorage.storeRoles(roles);
    expect(localStorage.setItem).toHaveBeenCalledWith(`${APP_CODE}.roles`, '["USER","ADMIN"]');
    expect(authStorage.loadRoles()).toEqual(roles);
    authStorage.removeRoles();
    expect(localStorage.removeItem).toHaveBeenCalledWith(`${APP_CODE}.roles`);
    expect(authStorage.loadRoles()).toBeUndefined();
  });

  test('storeRoles(), loadRoles(), removeRoles(), empty roles', () => {
    const roles = [];
    authStorage.storeRoles(roles);
    expect(localStorage.setItem).toHaveBeenCalledWith(`${APP_CODE}.roles`, '[]');
    expect(authStorage.loadRoles()).toEqual(roles);
    authStorage.removeRoles();
    expect(localStorage.removeItem).toHaveBeenCalledWith(`${APP_CODE}.roles`);
    expect(authStorage.loadRoles()).toBeUndefined();
  });

  test('storeRoles(), loadRoles(), removeRoles(), null roles', () => {
    const roles = null;
    authStorage.storeRoles(roles);
    expect(localStorage.setItem).toHaveBeenCalledWith(`${APP_CODE}.roles`, 'null');
    expect(authStorage.loadRoles()).toBeNull();
    authStorage.removeRoles();
    expect(localStorage.removeItem).toHaveBeenCalledWith(`${APP_CODE}.roles`);
    expect(authStorage.loadRoles()).toBeUndefined();
  });

  test('storeUserInfo(), loadUserInfo(), removeUserInfo()', () => {
    const userInfo = {
      id: 9007199254740993n,
      username: 'user1',
      nickname: 'bill',
      avatar: 'avatar.png',
      name: 'Bill Gates',
      gender: 'MALE',
      mobile: '1234567',
    };
    authStorage.storeUserInfo(userInfo);
    expect(localStorage.setItem).toHaveBeenCalledTimes(7);
    const loaded = authStorage.loadUserInfo();
    expect(loaded).toEqual(userInfo);
    authStorage.removeUserInfo();
    expect(localStorage.removeItem).toHaveBeenCalledTimes(7);
    expect(authStorage.loadUserInfo()).toEqual({
      value: undefined,
      createTime: undefined,
      maxAge: undefined,
      previousValue: undefined,
    });
  });

  test('storeUserInfo() with a null argument', () => {
    authStorage.storeUserInfo(null);
    expect(localStorage.setItem).toHaveBeenCalledTimes(0);
    const loaded = authStorage.loadUserInfo();
    expect(loaded).toEqual({
      value: undefined,
      createTime: undefined,
      maxAge: undefined,
      previousValue: undefined,
    });
  });

  test('storeLoginResponse(), loadLoginResponse(), removeLoginResponse()', () => {
    const loginResponse = {
      user: { id: '123', username: 'user1' },
      token: {
        value: 'token123',
        createTime: '2021-01-01T00:00:00Z',
        maxAge: '3600',
        previousValue: 'token122',
      },
      privileges: ['admin', 'user'],
      roles: ['role1', 'role2'],
    };
    authStorage.storeLoginResponse(loginResponse);
    const loaded = authStorage.loadLoginResponse();

    // 对于复杂对象，可以逐个字段验证，或者使用对象深度比较
    expect(loaded.user.id).toBe(loginResponse.user.id);
    expect(loaded.token.value).toBe(loginResponse.token.value);
    expect(loaded.privileges).toEqual(loginResponse.privileges);
    expect(loaded.roles).toEqual(loginResponse.roles);

    authStorage.removeLoginResponse();
    expect(Cookies.remove).toHaveBeenCalledTimes(4); // 因为你保存了四个值
    expect(authStorage.loadLoginResponse()).toEqual({
      user: {
        id: undefined,
        username: undefined,
        nickname: undefined,
        avatar: undefined,
        name: undefined,
        gender: undefined,
        mobile: undefined,
      },
      token: {
        value: undefined,
        createTime: undefined,
        maxAge: undefined,
        previousValue: undefined,
      },
      privileges: undefined,
      roles: undefined,
    });
  });

  test('storeLoginResponse() with null)', () => {
    authStorage.storeLoginResponse(null);
    const loaded = authStorage.loadLoginResponse();
    expect(loaded).toEqual({
      user: {
        id: undefined,
        username: undefined,
        nickname: undefined,
        avatar: undefined,
        name: undefined,
        gender: undefined,
        mobile: undefined,
      },
      token: {
        value: undefined,
        createTime: undefined,
        maxAge: undefined,
        previousValue: undefined,
      },
      privileges: undefined,
      roles: undefined,
    });
  });

  test('should throw error if no "appCode" is provided to the constructor', () => {
    expect(() => new AuthStorage())
      .toThrowError('The appCode is required.');
  });

  test('should use specified accessTokenExpiresDays', () => {
    const auth = new AuthStorage(APP_CODE, 1);
    expect(auth.ACCESS_TOKEN_EXPIRES_DAYS).toBe(1);
  });

  test('should use default accessTokenExpiresDays', () => {
    const auth = new AuthStorage(APP_CODE);
    expect(auth.ACCESS_TOKEN_EXPIRES_DAYS).toBe(1000);
  });

  test('should use default accessTokenExpiresDays, if provide an undefined accessTokenExpiresDays', () => {
    const auth = new AuthStorage(APP_CODE, undefined);
    expect(auth.ACCESS_TOKEN_EXPIRES_DAYS).toBe(1000);
  });

  test('should use default accessTokenExpiresDays, if provide a null accessTokenExpiresDays', () => {
    const auth = new AuthStorage(APP_CODE, null);
    expect(auth.ACCESS_TOKEN_EXPIRES_DAYS).toBe(1000);
  });
});

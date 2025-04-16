////////////////////////////////////////////////////////////////////////////////
//
//    Copyright (c) 2022 - 2024.
//    Haixing Hu, Qubit Co. Ltd.
//
//    All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////
import { Logger, Log } from '@qubit-ltd/logging';
import { confirm } from '@qubit-ltd/common-ui';
import config from '@qubit-ltd/config';
import AuthStorage from '../../src/auth-storage';
import BasicUserStore from '../../src/store/basic-user-store';
import http from '../../src/http';

// 模拟 Logger
jest.mock('@qubit-ltd/logging', () => {
  const mockDebug = jest.fn();
  const mockInfo = jest.fn();
  const mockError = jest.fn();
  
  return {
    Logger: {
      getLogger: jest.fn(() => ({
        debug: mockDebug,
        info: mockInfo,
        error: mockError,
      })),
    },
    Log: jest.fn((target, key, descriptor) => descriptor),
  };
});

// 模拟 confirm
jest.mock('@qubit-ltd/common-ui', () => ({
  confirm: {
    info: jest.fn(() => Promise.resolve()),
  },
}));

// 模拟 config
jest.mock('@qubit-ltd/config', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockImplementation((key, defaultValue) => {
      const configMap = {
        'social_network': 'WECHAT',
        'social_network_app_id': 'appid123',
        'default_avatar_male': 'male-avatar.png',
        'default_avatar_female': 'female-avatar.png',
        'login_page': 'custom-login-page',
      };
      return configMap[key] || defaultValue;
    }),
  },
}));

// 模拟 AuthStorage
jest.mock('../../src/auth-storage', () => {
  return jest.fn().mockImplementation(() => ({
    loadUserInfo: jest.fn(),
    loadPassword: jest.fn(),
    loadSaveLogin: jest.fn(),
    loadToken: jest.fn(),
    loadPrivileges: jest.fn(),
    loadRoles: jest.fn(),
    loadOrganization: jest.fn(),
    storeUserInfo: jest.fn(),
    storeUserId: jest.fn(),
    removeUserId: jest.fn(),
    storeUsername: jest.fn(),
    removeUsername: jest.fn(),
    storePassword: jest.fn(),
    removePassword: jest.fn(),
    storeMobile: jest.fn(),
    removeMobile: jest.fn(),
    storeAvatar: jest.fn(),
    storeSaveLogin: jest.fn(),
    storeToken: jest.fn(),
    removeToken: jest.fn(),
    storePrivileges: jest.fn(),
    storeRoles: jest.fn(),
    storeOrganization: jest.fn(),
    removeOrganization: jest.fn(),
    removeLoginResponse: jest.fn(),
  }));
});

// 模拟 http
jest.mock('../../src/http', () => ({
  __esModule: true,
  default: {
    getRouter: jest.fn(),
  },
}));

const APP_CODE = 'test-app';
const mockUserAuthenticateApi = {
  loginByUsername: jest.fn(),
  loginByMobile: jest.fn(),
  loginByOpenId: jest.fn(),
  bindOpenId: jest.fn(),
  logout: jest.fn(),
  getLoginInfo: jest.fn(),
  checkToken: jest.fn(),
};
const mockVerifyCodeApi = {
  sendBySms: jest.fn(),
};

describe('BasicUserStore', () => {
  let userStore;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // 重置模拟函数的返回值
    AuthStorage.mockClear();
    mockUserAuthenticateApi.loginByUsername.mockReset();
    mockUserAuthenticateApi.loginByMobile.mockReset();
    mockUserAuthenticateApi.loginByOpenId.mockReset();
    mockUserAuthenticateApi.bindOpenId.mockReset();
    mockUserAuthenticateApi.logout.mockReset();
    mockUserAuthenticateApi.getLoginInfo.mockReset();
    mockUserAuthenticateApi.checkToken.mockReset();
    mockVerifyCodeApi.sendBySms.mockReset();
    
    // 初始化 store
    userStore = new BasicUserStore(mockUserAuthenticateApi, mockVerifyCodeApi, APP_CODE);
    
    // 模拟 Pinia Store 的 $reset 方法，因为在测试环境中这个方法不存在
    userStore.$reset = jest.fn();
    userStore.$state = {}; // 模拟 $state 属性
  });
  
  describe('构造函数', () => {
    test('应该正确初始化所有字段', () => {
      expect(userStore._userAuthenticateApi).toBe(mockUserAuthenticateApi);
      expect(userStore._verifyCodeApi).toBe(mockVerifyCodeApi);
      expect(userStore._appCode).toBe(APP_CODE);
      expect(userStore._authStorage).toBeDefined();
      expect(AuthStorage).toHaveBeenCalledWith(APP_CODE);
    });
    
    test('应该从 authStorage 中加载数据', () => {
      expect(userStore._authStorage.loadUserInfo).toHaveBeenCalled();
      expect(userStore._authStorage.loadPassword).toHaveBeenCalled();
      expect(userStore._authStorage.loadSaveLogin).toHaveBeenCalled();
      expect(userStore._authStorage.loadToken).toHaveBeenCalled();
      expect(userStore._authStorage.loadPrivileges).toHaveBeenCalled();
      expect(userStore._authStorage.loadRoles).toHaveBeenCalled();
      expect(userStore._authStorage.loadOrganization).toHaveBeenCalled();
    });
    
    test('缺少参数时应该抛出错误', () => {
      expect(() => new BasicUserStore(null, mockVerifyCodeApi, APP_CODE))
        .toThrow('The API object for authenticating users is required.');
      expect(() => new BasicUserStore(mockUserAuthenticateApi, null, APP_CODE))
        .toThrow('The API object for sending verify code is required.');
      expect(() => new BasicUserStore(mockUserAuthenticateApi, mockVerifyCodeApi, null))
        .toThrow('The app code is required.');
    });
    
    test('应该从 config 中读取社交网络设置', () => {
      expect(config.get).toHaveBeenCalledWith('social_network', null);
      expect(config.get).toHaveBeenCalledWith('social_network_app_id', null);
      expect(userStore.socialNetwork).toBe('WECHAT');
      expect(userStore.appId).toBe('appid123');
    });
  });
  
  describe('getter 方法', () => {
    test('authStorage getter 应该返回 _authStorage', () => {
      expect(userStore.authStorage).toBe(userStore._authStorage);
    });
    
    test('loggedIn getter 应该检查 token 值是否存在', () => {
      userStore.token = null;
      expect(userStore.loggedIn).toBe(false);
      
      userStore.token = {};
      expect(userStore.loggedIn).toBe(false);
      
      userStore.token = { value: '' };
      expect(userStore.loggedIn).toBe(false);
      
      userStore.token = { value: 'token123' };
      expect(userStore.loggedIn).toBe(true);
    });
  });
  
  describe('ensureUserExist()', () => {
    test('用户不存在时应该创建新用户对象', () => {
      userStore.user = null;
      const user = userStore.ensureUserExist();
      
      expect(user).toEqual({
        id: null,
        username: '',
        nickname: '',
        avatar: '',
        name: '',
        gender: '',
        mobile: '',
      });
      expect(userStore.user).toBe(user);
    });
    
    test('用户已存在时应该返回现有用户对象', () => {
      const existingUser = { id: 'user1' };
      userStore.user = existingUser;
      const result = userStore.ensureUserExist();
      
      expect(result).toBe(existingUser);
    });
  });
  
  describe('resetState()', () => {
    test('应该重置状态并清空组织信息', () => {
      // 设置初始状态
      userStore.user = { id: '123' };
      userStore.token = { value: 'token123' };
      userStore.organization = { id: 'org1' };
      
      // 调用方法
      userStore.resetState();
      
      // 验证
      expect(userStore.$reset).toHaveBeenCalled();
      expect(userStore.organization).toBeNull();
    });
  });
  
  // 用户信息设置相关方法测试
  describe('用户信息设置方法', () => {
    describe('setUserInfo()', () => {
      test('应该设置用户信息并在 saveLogin 为 true 时保存', () => {
        const user = { id: '123', username: 'testuser' };
        
        // 测试 saveLogin = false
        userStore.saveLogin = false;
        userStore.setUserInfo(user);
        expect(userStore.user).toEqual(user);
        expect(userStore._authStorage.storeUserInfo).not.toHaveBeenCalled();
        
        // 测试 saveLogin = true
        userStore.saveLogin = true;
        userStore.setUserInfo(user);
        expect(userStore.user).toEqual(user);
        expect(userStore._authStorage.storeUserInfo).toHaveBeenCalledWith(user);
      });
    });
    
    describe('setUserId()', () => {
      test('应该设置用户ID并在 saveLogin 为 true 时保存', () => {
        const userId = '123';
        userStore.user = { id: 'old-id' };
        
        // 测试 saveLogin = false
        userStore.saveLogin = false;
        userStore.setUserId(userId);
        expect(userStore.user.id).toBe(userId);
        expect(userStore._authStorage.storeUserId).not.toHaveBeenCalled();
        expect(userStore._authStorage.removeUserId).toHaveBeenCalled();
        
        // 重置 mock
        userStore._authStorage.removeUserId.mockClear();
        
        // 测试 saveLogin = true
        userStore.saveLogin = true;
        userStore.setUserId(userId);
        expect(userStore.user.id).toBe(userId);
        expect(userStore._authStorage.storeUserId).toHaveBeenCalledWith(userId);
        expect(userStore._authStorage.removeUserId).not.toHaveBeenCalled();
      });
      
      test('当用户不存在时应该创建用户', () => {
        userStore.user = null;
        userStore.setUserId('123');
        expect(userStore.user).toBeDefined();
        expect(userStore.user.id).toBe('123');
      });
    });
    
    describe('setUsername()', () => {
      test('应该设置用户名并在 saveLogin 为 true 时保存', () => {
        const username = 'testuser';
        userStore.user = { username: 'old-username' };
        
        // 测试 saveLogin = false
        userStore.saveLogin = false;
        userStore.setUsername(username);
        expect(userStore.user.username).toBe(username);
        expect(userStore._authStorage.storeUsername).not.toHaveBeenCalled();
        expect(userStore._authStorage.removeUsername).toHaveBeenCalled();
        
        // 重置 mock
        userStore._authStorage.removeUsername.mockClear();
        
        // 测试 saveLogin = true
        userStore.saveLogin = true;
        userStore.setUsername(username);
        expect(userStore.user.username).toBe(username);
        expect(userStore._authStorage.storeUsername).toHaveBeenCalledWith(username);
        expect(userStore._authStorage.removeUsername).not.toHaveBeenCalled();
      });
    });
    
    describe('setPassword()', () => {
      test('应该设置密码并在 saveLogin 为 true 时保存', () => {
        const password = 'password123';
        
        // 测试 saveLogin = false
        userStore.saveLogin = false;
        userStore.setPassword(password);
        expect(userStore.password).toBe(password);
        expect(userStore._authStorage.storePassword).not.toHaveBeenCalled();
        expect(userStore._authStorage.removePassword).toHaveBeenCalled();
        
        // 重置 mock
        userStore._authStorage.removePassword.mockClear();
        
        // 测试 saveLogin = true
        userStore.saveLogin = true;
        userStore.setPassword(password);
        expect(userStore.password).toBe(password);
        expect(userStore._authStorage.storePassword).toHaveBeenCalledWith(password);
        expect(userStore._authStorage.removePassword).not.toHaveBeenCalled();
      });
    });
    
    describe('setMobile()', () => {
      test('应该设置手机号并在 saveLogin 为 true 时保存', () => {
        const mobile = '13800138000';
        userStore.user = { mobile: 'old-mobile' };
        
        // 测试 saveLogin = false
        userStore.saveLogin = false;
        userStore.setMobile(mobile);
        expect(userStore.user.mobile).toBe(mobile);
        expect(userStore._authStorage.storeMobile).not.toHaveBeenCalled();
        expect(userStore._authStorage.removeMobile).toHaveBeenCalled();
        
        // 重置 mock
        userStore._authStorage.removeMobile.mockClear();
        
        // 测试 saveLogin = true
        userStore.saveLogin = true;
        userStore.setMobile(mobile);
        expect(userStore.user.mobile).toBe(mobile);
        expect(userStore._authStorage.storeMobile).toHaveBeenCalledWith(mobile);
        expect(userStore._authStorage.removeMobile).not.toHaveBeenCalled();
      });
    });
    
    describe('setAvatar()', () => {
      test('应该设置头像并总是保存到存储中', () => {
        const avatar = 'avatar.png';
        userStore.user = { avatar: 'old-avatar.png' };
        
        userStore.setAvatar(avatar);
        expect(userStore.user.avatar).toBe(avatar);
        expect(userStore._authStorage.storeAvatar).toHaveBeenCalledWith(avatar);
        
        // 测试 avatar 为 null 的情况
        userStore.setAvatar(null);
        expect(userStore.user.avatar).toBe('');
        expect(userStore._authStorage.storeAvatar).toHaveBeenCalledWith(null);
      });
    });
    
    describe('setSaveLogin()', () => {
      test('应该设置 saveLogin 标志并保存到存储中', () => {
        userStore.setSaveLogin(true);
        expect(userStore.saveLogin).toBe(true);
        expect(userStore._authStorage.storeSaveLogin).toHaveBeenCalledWith(true);
        
        userStore.setSaveLogin(false);
        expect(userStore.saveLogin).toBe(false);
        expect(userStore._authStorage.storeSaveLogin).toHaveBeenCalledWith(false);
      });
    });
    
    describe('setToken()', () => {
      test('应该设置 token 并在 saveLogin 为 true 时保存', () => {
        const token = { value: 'token123' };
        
        // 测试 saveLogin = false
        userStore.saveLogin = false;
        userStore.setToken(token);
        expect(userStore.token).toEqual(token);
        expect(userStore._authStorage.storeToken).not.toHaveBeenCalled();
        expect(userStore._authStorage.removeToken).toHaveBeenCalled();
        
        // 重置 mock
        userStore._authStorage.removeToken.mockClear();
        
        // 测试 saveLogin = true
        userStore.saveLogin = true;
        userStore.setToken(token);
        expect(userStore.token).toEqual(token);
        expect(userStore._authStorage.storeToken).toHaveBeenCalledWith(token);
        expect(userStore._authStorage.removeToken).not.toHaveBeenCalled();
      });
    });
    
    describe('removeToken()', () => {
      test('应该移除 token 并从存储中清除', () => {
        userStore.token = { value: 'token123' };
        userStore.removeToken();
        expect(userStore.token).toBeNull();
        expect(userStore._authStorage.removeToken).toHaveBeenCalled();
      });
    });
    
    describe('resetToken()', () => {
      test('应该移除 token 并重置状态', () => {
        // 准备 spy
        const removeTokenSpy = jest.spyOn(userStore, 'removeToken');
        const resetStateSpy = jest.spyOn(userStore, 'resetState');
        
        // 调用方法
        userStore.resetToken();
        
        // 验证
        expect(removeTokenSpy).toHaveBeenCalled();
        expect(resetStateSpy).toHaveBeenCalled();
      });
    });
  });
  
  // 权限相关方法测试
  describe('权限相关方法', () => {
    describe('setPrivileges()', () => {
      test('应该设置权限列表并保存到存储中', () => {
        const privileges = ['admin', 'user'];
        userStore.setPrivileges(privileges);
        expect(userStore.privileges).toEqual(privileges);
        expect(userStore._authStorage.storePrivileges).toHaveBeenCalledWith(privileges);
        
        // 测试 privileges 为 null 的情况
        userStore.setPrivileges(null);
        expect(userStore.privileges).toEqual([]);
        expect(userStore._authStorage.storePrivileges).toHaveBeenCalledWith([]);
      });
    });
    
    describe('setRoles()', () => {
      test('应该设置角色列表并保存到存储中', () => {
        const roles = ['admin', 'manager'];
        userStore.setRoles(roles);
        expect(userStore.roles).toEqual(roles);
        expect(userStore._authStorage.storeRoles).toHaveBeenCalledWith(roles);
        
        // 测试 roles 为 null 的情况
        userStore.setRoles(null);
        expect(userStore.roles).toEqual([]);
        expect(userStore._authStorage.storeRoles).toHaveBeenCalledWith([]);
      });
    });
    
    describe('setOpenId()', () => {
      test('应该设置 OpenID 相关信息', () => {
        const socialNetwork = 'WECHAT';
        const appId = 'wx123456';
        const openId = 'openid123';
        
        userStore.setOpenId(socialNetwork, appId, openId);
        expect(userStore.socialNetwork).toBe(socialNetwork);
        expect(userStore.appId).toBe(appId);
        expect(userStore.openId).toBe(openId);
      });
    });
    
    describe('setOrganization()', () => {
      test('应该设置组织信息并在 saveLogin 为 true 时保存', () => {
        const organization = { id: 'org1', name: '测试组织' };
        
        // 测试 saveLogin = false
        userStore.saveLogin = false;
        userStore.setOrganization(organization);
        expect(userStore.organization).toEqual(organization);
        expect(userStore._authStorage.storeOrganization).not.toHaveBeenCalled();
        expect(userStore._authStorage.removeOrganization).toHaveBeenCalled();
        
        // 重置 mock
        userStore._authStorage.removeOrganization.mockClear();
        
        // 测试 saveLogin = true
        userStore.saveLogin = true;
        userStore.setOrganization(organization);
        expect(userStore.organization).toEqual(organization);
        expect(userStore._authStorage.storeOrganization).toHaveBeenCalledWith(organization);
        expect(userStore._authStorage.removeOrganization).not.toHaveBeenCalled();
      });
    });
  });
  
  // 登录相关方法测试
  describe('登录相关方法', () => {
    describe('setLoginResponse()', () => {
      test('应该设置登录响应中的所有相关信息', () => {
        // 准备模拟响应数据
        const response = {
          user: { id: 'user1', username: 'testuser' },
          token: { value: 'token123' },
          privileges: ['read', 'write'],
          roles: ['user'],
          organization: { id: 'org1' },
        };
        
        // 准备 spy
        const setUserInfoSpy = jest.spyOn(userStore, 'setUserInfo');
        const setTokenSpy = jest.spyOn(userStore, 'setToken');
        const setPrivilegesSpy = jest.spyOn(userStore, 'setPrivileges');
        const setRolesSpy = jest.spyOn(userStore, 'setRoles');
        const setOrganizationSpy = jest.spyOn(userStore, 'setOrganization');
        const refreshAvatarSpy = jest.spyOn(userStore, 'refreshAvatar');
        
        // 调用方法
        userStore.setLoginResponse(response);
        
        // 验证
        expect(setUserInfoSpy).toHaveBeenCalledWith(response.user);
        expect(setTokenSpy).toHaveBeenCalledWith(response.token);
        expect(setPrivilegesSpy).toHaveBeenCalledWith(response.privileges);
        expect(setRolesSpy).toHaveBeenCalledWith(response.roles);
        expect(setOrganizationSpy).toHaveBeenCalledWith(response.organization);
        expect(refreshAvatarSpy).toHaveBeenCalled();
      });
    });
    
    describe('refreshAvatar()', () => {
      test('应该在用户没有头像但有性别时设置默认头像', () => {
        // 准备 spy
        const setAvatarSpy = jest.spyOn(userStore, 'setAvatar');
        
        // 测试男性默认头像
        userStore.user = { avatar: '', gender: 'MALE' };
        userStore.refreshAvatar();
        expect(setAvatarSpy).toHaveBeenCalledWith('male-avatar.png');
        
        // 测试女性默认头像
        setAvatarSpy.mockClear();
        userStore.user = { avatar: '', gender: 'FEMALE' };
        userStore.refreshAvatar();
        expect(setAvatarSpy).toHaveBeenCalledWith('female-avatar.png');
        
        // 测试未知性别
        setAvatarSpy.mockClear();
        userStore.user = { avatar: '', gender: 'OTHER' };
        userStore.refreshAvatar();
        expect(setAvatarSpy).toHaveBeenCalledWith('');
        
        // 测试已有头像的情况
        setAvatarSpy.mockClear();
        userStore.user = { avatar: 'existing.png', gender: 'MALE' };
        userStore.refreshAvatar();
        expect(setAvatarSpy).not.toHaveBeenCalled();
        
        // 测试没有性别的情况
        setAvatarSpy.mockClear();
        userStore.user = { avatar: '', gender: '' };
        userStore.refreshAvatar();
        expect(setAvatarSpy).not.toHaveBeenCalled();
      });
      
      test('当用户为 null 时应该创建用户对象', () => {
        userStore.user = null;
        userStore.refreshAvatar();
        expect(userStore.user).toBeDefined();
      });
    });
    
    describe('mergeUserInfo()', () => {
      test('应该合并用户信息，只在字段为空时覆盖', () => {
        // 准备初始用户数据
        userStore.user = {
          username: '',      // 空，会被覆盖
          name: 'Old Name',  // 非空，不会被覆盖
          nickname: '',      // 空，会被覆盖
          gender: '',        // 空，会被覆盖
          avatar: 'old.png', // 非空，不会被覆盖
          mobile: '',        // 空，会被覆盖
        };
        
        // 准备新用户数据
        const newInfo = {
          username: 'newuser',
          name: 'New Name',
          nickname: 'Nick',
          gender: 'MALE',
          avatar: 'new.png',
          mobile: '13800138000',
        };
        
        // 准备 spy
        const refreshAvatarSpy = jest.spyOn(userStore, 'refreshAvatar');
        
        // 调用方法
        userStore.mergeUserInfo(newInfo);
        
        // 验证结果
        expect(userStore.user.username).toBe('newuser');   // 原来为空，被覆盖
        expect(userStore.user.name).toBe('Old Name');      // 原来非空，未被覆盖
        expect(userStore.user.nickname).toBe('Nick');      // 原来为空，被覆盖
        expect(userStore.user.gender).toBe('MALE');        // 原来为空，被覆盖
        expect(userStore.user.avatar).toBe('old.png');     // 原来非空，未被覆盖
        expect(userStore.user.mobile).toBe('13800138000'); // 原来为空，被覆盖
        
        // 验证其他操作
        expect(refreshAvatarSpy).toHaveBeenCalled();
        expect(userStore._authStorage.storeUserInfo).not.toHaveBeenCalled(); // saveLogin = false
        
        // 测试 saveLogin = true 的情况
        refreshAvatarSpy.mockClear();
        userStore.saveLogin = true;
        userStore.mergeUserInfo(newInfo);
        expect(userStore._authStorage.storeUserInfo).toHaveBeenCalledWith(userStore.user);
      });
      
      test('应该覆盖所有的空用户信息字段', () => {
        // 准备所有字段都为空的用户数据
        userStore.user = {
          username: '',
          name: '',
          nickname: '',
          gender: '',
          avatar: '',
          mobile: '',
        };
        
        // 准备新用户数据 - 包含所有字段
        const newInfo = {
          username: 'newuser',
          name: 'Full Name',
          nickname: 'Nick',
          gender: 'MALE',
          avatar: 'new.png',
          mobile: '13800138000',
        };
        
        // 调用方法
        userStore.mergeUserInfo(newInfo);
        
        // 验证所有字段都被正确覆盖
        expect(userStore.user.username).toBe('newuser');
        expect(userStore.user.name).toBe('Full Name');
        expect(userStore.user.nickname).toBe('Nick');
        expect(userStore.user.gender).toBe('MALE');
        expect(userStore.user.avatar).toBe('new.png');
        expect(userStore.user.mobile).toBe('13800138000');
      });
    });
  });
  
  // Token 加载与 API 调用测试
  describe('Token 加载与 API 调用', () => {
    describe('loadToken()', () => {
      test('应该尝试从设备和存储中加载 token', async () => {
        // 准备 spy
        const loadTokenFromDeviceSpy = jest.spyOn(userStore, 'loadTokenFromDevice').mockResolvedValueOnce(false);
        const loadTokenFromAuthStorageSpy = jest.spyOn(userStore, 'loadTokenFromAuthStorage').mockResolvedValueOnce(true);
        const refreshLoginInfoSpy = jest.spyOn(userStore, 'refreshLoginInfo').mockResolvedValueOnce({});
        
        // 设置 token
        userStore.token = { value: 'token123' };
        
        // 调用方法
        const result = await userStore.loadToken();
        
        // 验证
        expect(loadTokenFromDeviceSpy).toHaveBeenCalled();
        expect(loadTokenFromAuthStorageSpy).toHaveBeenCalled();
        expect(refreshLoginInfoSpy).toHaveBeenCalled();
        expect(result).toEqual({ value: 'token123' });
        
        // 测试两种加载方式都失败的情况
        loadTokenFromDeviceSpy.mockResolvedValueOnce(false);
        loadTokenFromAuthStorageSpy.mockResolvedValueOnce(false);
        
        const failResult = await userStore.loadToken();
        expect(failResult).toBeNull();
      });
    });
    
    describe('loadTokenFromAuthStorage()', () => {
      test('应该尝试从存储中加载 token 和用户信息', async () => {
        // 设置 mock 函数返回值
        userStore._authStorage.loadUserInfo.mockReturnValue({ id: 'user1', username: 'testuser' });
        userStore._authStorage.loadPassword.mockReturnValue('password123');
        userStore._authStorage.loadSaveLogin.mockReturnValue(true);
        userStore._authStorage.loadToken.mockReturnValue({ value: 'token123' });
        
        // 准备 spy
        const setUserInfoSpy = jest.spyOn(userStore, 'setUserInfo');
        const setPasswordSpy = jest.spyOn(userStore, 'setPassword');
        const setSaveLoginSpy = jest.spyOn(userStore, 'setSaveLogin');
        const isTokenValidSpy = jest.spyOn(userStore, 'isTokenValid').mockResolvedValueOnce(true);
        const setUserIdSpy = jest.spyOn(userStore, 'setUserId');
        const setTokenSpy = jest.spyOn(userStore, 'setToken');
        
        // 调用方法
        const result = await userStore.loadTokenFromAuthStorage();
        
        // 验证
        expect(userStore._authStorage.loadUserInfo).toHaveBeenCalled();
        expect(userStore._authStorage.loadPassword).toHaveBeenCalled();
        expect(userStore._authStorage.loadSaveLogin).toHaveBeenCalled();
        expect(userStore._authStorage.loadToken).toHaveBeenCalled();
        
        expect(setUserInfoSpy).toHaveBeenCalledWith({ id: 'user1', username: 'testuser' });
        expect(setPasswordSpy).toHaveBeenCalledWith('password123');
        expect(setSaveLoginSpy).toHaveBeenCalledWith(true);
        expect(isTokenValidSpy).toHaveBeenCalledWith('user1', { value: 'token123' });
        expect(setUserIdSpy).toHaveBeenCalledWith('user1');
        expect(setTokenSpy).toHaveBeenCalledWith({ value: 'token123' });
        expect(result).toBe(true);
        
        // 测试 token 无效的情况
        setUserInfoSpy.mockClear();
        isTokenValidSpy.mockResolvedValueOnce(false);
        
        const failResult = await userStore.loadTokenFromAuthStorage();
        expect(userStore._authStorage.removeLoginResponse).toHaveBeenCalled();
        expect(failResult).toBe(false);
        
        // 测试没有 token 的情况
        userStore._authStorage.loadToken.mockReturnValueOnce(null);
        
        const noTokenResult = await userStore.loadTokenFromAuthStorage();
        expect(noTokenResult).toBe(false);
      });
      
      test('应该处理各种边界情况', async () => {
        // 重置所有 mock
        jest.clearAllMocks();
        
        // 测试没有用户信息的情况
        userStore._authStorage.loadUserInfo.mockReturnValue(null);
        userStore._authStorage.loadPassword.mockReturnValue(null);
        userStore._authStorage.loadSaveLogin.mockReturnValue(null);
        userStore._authStorage.loadToken.mockReturnValue(null);
        
        const setUserInfoSpy = jest.spyOn(userStore, 'setUserInfo');
        const setPasswordSpy = jest.spyOn(userStore, 'setPassword');
        const setSaveLoginSpy = jest.spyOn(userStore, 'setSaveLogin');
        
        await userStore.loadTokenFromAuthStorage();
        
        expect(setUserInfoSpy).not.toHaveBeenCalled();
        expect(setPasswordSpy).not.toHaveBeenCalled();
        expect(setSaveLoginSpy).not.toHaveBeenCalled();
        
        // 测试有用户信息但没有用户名的情况
        userStore._authStorage.loadUserInfo.mockReturnValue({ id: 'user1' });
        await userStore.loadTokenFromAuthStorage();
        expect(setUserInfoSpy).not.toHaveBeenCalled();
        
        // 测试有用户 ID 和 token 但 token 没有 value 的情况
        userStore._authStorage.loadUserInfo.mockReturnValue({ id: 'user1', username: 'testuser' });
        userStore._authStorage.loadToken.mockReturnValue({});
        await userStore.loadTokenFromAuthStorage();
        const isTokenValidSpy = jest.spyOn(userStore, 'isTokenValid');
        expect(isTokenValidSpy).not.toHaveBeenCalled();
      });
    });
    
    describe('loadTokenFromDevice()', () => {
      test('默认实现应该总是返回 false', async () => {
        const result = await userStore.loadTokenFromDevice();
        expect(result).toBe(false);
      });
    });
    
    describe('loginByUsername()', () => {
      test('应该使用用户名和密码调用登录 API', async () => {
        // 准备参数
        const username = 'testuser';
        const password = 'password123';
        const saveLogin = true;
        
        // 准备 mock 响应
        const mockResponse = {
          user: { id: 'user1', username },
          token: { value: 'token123' },
        };
        mockUserAuthenticateApi.loginByUsername.mockResolvedValueOnce(mockResponse);
        
        // 准备 spy
        const setSaveLoginSpy = jest.spyOn(userStore, 'setSaveLogin');
        const setUsernameSpy = jest.spyOn(userStore, 'setUsername');
        const setPasswordSpy = jest.spyOn(userStore, 'setPassword');
        const removeTokenSpy = jest.spyOn(userStore, 'removeToken');
        const setLoginResponseSpy = jest.spyOn(userStore, 'setLoginResponse');
        
        // 调用方法
        const result = await userStore.loginByUsername(username, password, saveLogin);
        
        // 验证
        expect(setSaveLoginSpy).toHaveBeenCalledWith(saveLogin);
        expect(setUsernameSpy).toHaveBeenCalledWith(username);
        expect(setPasswordSpy).toHaveBeenCalledWith(password);
        expect(removeTokenSpy).toHaveBeenCalled();
        expect(mockUserAuthenticateApi.loginByUsername).toHaveBeenCalledWith(username, password);
        expect(setLoginResponseSpy).toHaveBeenCalledWith(mockResponse);
        expect(result).toBe(mockResponse);
      });
    });
    
    describe('loginByMobile()', () => {
      test('应该使用手机号和验证码调用登录 API', async () => {
        // 准备参数
        const mobile = '13800138000';
        const verifyCode = '123456';
        const saveLogin = true;
        
        // 准备 mock 响应
        const mockResponse = {
          user: { id: 'user1', mobile },
          token: { value: 'token123' },
        };
        mockUserAuthenticateApi.loginByMobile.mockResolvedValueOnce(mockResponse);
        
        // 准备 spy
        const setSaveLoginSpy = jest.spyOn(userStore, 'setSaveLogin');
        const setMobileSpy = jest.spyOn(userStore, 'setMobile');
        const removeTokenSpy = jest.spyOn(userStore, 'removeToken');
        const setLoginResponseSpy = jest.spyOn(userStore, 'setLoginResponse');
        
        // 调用方法
        const result = await userStore.loginByMobile(mobile, verifyCode, saveLogin);
        
        // 验证
        expect(setSaveLoginSpy).toHaveBeenCalledWith(saveLogin);
        expect(setMobileSpy).toHaveBeenCalledWith(mobile);
        expect(removeTokenSpy).toHaveBeenCalled();
        expect(mockUserAuthenticateApi.loginByMobile).toHaveBeenCalledWith(mobile, verifyCode);
        expect(setLoginResponseSpy).toHaveBeenCalledWith(mockResponse);
        expect(result).toBe(mockResponse);
      });
    });
    
    describe('loginByOpenId()', () => {
      test('应该使用 OpenID 调用登录 API', async () => {
        // 准备参数
        const socialNetwork = 'WECHAT';
        const appId = 'wx123456';
        const openId = 'openid123';
        
        // 准备 mock 响应
        const mockResponse = {
          user: { id: 'user1' },
          token: { value: 'token123' },
        };
        mockUserAuthenticateApi.loginByOpenId.mockResolvedValueOnce(mockResponse);
        
        // 准备 spy
        const removeTokenSpy = jest.spyOn(userStore, 'removeToken');
        const setOpenIdSpy = jest.spyOn(userStore, 'setOpenId');
        const setLoginResponseSpy = jest.spyOn(userStore, 'setLoginResponse');
        
        // 调用方法
        const result = await userStore.loginByOpenId(socialNetwork, appId, openId);
        
        // 验证
        expect(removeTokenSpy).toHaveBeenCalled();
        expect(mockUserAuthenticateApi.loginByOpenId).toHaveBeenCalledWith(socialNetwork, appId, openId);
        expect(setOpenIdSpy).toHaveBeenCalledWith(socialNetwork, appId, openId);
        expect(setLoginResponseSpy).toHaveBeenCalledWith(mockResponse);
        expect(result).toBe(mockResponse);
      });
    });
    
    describe('bindOpenId()', () => {
      test('应该调用绑定 OpenID 的 API', async () => {
        // 准备参数
        const socialNetwork = 'WECHAT';
        const appId = 'wx123456';
        const openId = 'openid123';
        
        // 准备 mock
        mockUserAuthenticateApi.bindOpenId.mockResolvedValueOnce();
        
        // 准备 spy
        const setOpenIdSpy = jest.spyOn(userStore, 'setOpenId');
        
        // 调用方法
        await userStore.bindOpenId(socialNetwork, appId, openId);
        
        // 验证
        expect(mockUserAuthenticateApi.bindOpenId).toHaveBeenCalledWith(socialNetwork, appId, openId);
        expect(setOpenIdSpy).toHaveBeenCalledWith(socialNetwork, appId, openId);
      });
    });
  });
  
  // 其余 API 调用和工具方法测试
  describe('其余 API 调用和工具方法', () => {
    describe('logout()', () => {
      test('应该调用登出 API 并重置状态', async () => {
        // 准备 mock
        mockUserAuthenticateApi.logout.mockResolvedValueOnce();
        
        // 准备 spy
        const removeTokenSpy = jest.spyOn(userStore, 'removeToken');
        const resetStateSpy = jest.spyOn(userStore, 'resetState');
        
        // 调用方法
        await userStore.logout();
        
        // 验证
        expect(mockUserAuthenticateApi.logout).toHaveBeenCalled();
        expect(removeTokenSpy).toHaveBeenCalled();
        expect(resetStateSpy).toHaveBeenCalled();
      });
    });
    
    describe('refreshLoginInfo()', () => {
      test('应该调用获取登录信息 API 并设置返回值', async () => {
        // 准备 mock 响应
        const mockResponse = {
          user: { id: 'user1' },
          token: { value: 'token123' },
        };
        mockUserAuthenticateApi.getLoginInfo.mockResolvedValueOnce(mockResponse);
        
        // 准备 spy
        const setLoginResponseSpy = jest.spyOn(userStore, 'setLoginResponse');
        
        // 调用方法
        const result = await userStore.refreshLoginInfo();
        
        // 验证
        expect(mockUserAuthenticateApi.getLoginInfo).toHaveBeenCalled();
        expect(setLoginResponseSpy).toHaveBeenCalledWith(mockResponse);
        expect(result).toBe(mockResponse);
      });
    });
    
    describe('sendLoginVerifyCode()', () => {
      test('应该调用发送验证码 API', async () => {
        // 准备参数
        const mobile = '13800138000';
        
        // 准备 mock
        mockVerifyCodeApi.sendBySms.mockResolvedValueOnce();
        
        // 调用方法
        await userStore.sendLoginVerifyCode(mobile);
        
        // 验证
        expect(mockVerifyCodeApi.sendBySms).toHaveBeenCalledWith(mobile, 'LOGIN');
      });
    });
    
    describe('isTokenValid()', () => {
      test('应该调用检查 token 有效性的 API 并返回结果', async () => {
        // 准备参数
        const userId = 'user1';
        const token = { value: 'token123' };
        
        // 测试 token 有效
        mockUserAuthenticateApi.checkToken.mockResolvedValueOnce({ value: 'token123' });
        
        // 调用方法
        const result = await userStore.isTokenValid(userId, token);
        
        // 验证
        expect(mockUserAuthenticateApi.checkToken).toHaveBeenCalledWith(userId, token);
        expect(result).toBe(true);
        
        // 测试 token 无效（返回空）
        mockUserAuthenticateApi.checkToken.mockResolvedValueOnce(null);
        
        const invalidResult = await userStore.isTokenValid(userId, token);
        expect(invalidResult).toBe(false);
        
        // 测试 API 调用抛出异常
        mockUserAuthenticateApi.checkToken.mockRejectedValueOnce(new Error('Invalid token'));
        
        const errorResult = await userStore.isTokenValid(userId, token);
        expect(errorResult).toBe(false);
      });
    });
    
    describe('confirmLogin()', () => {
      test('用户确认后应该重置 token 并重定向到登录页面', async () => {
        // 准备 mock - 用户点击"重新登录"，Promise 被 resolve，没有参数
        confirm.info.mockImplementationOnce(() => Promise.resolve());
        
        // 模拟 router
        const mockRouter = { push: jest.fn() };
        http.getRouter.mockReturnValue(mockRouter);
        
        // 准备 spy
        const resetTokenSpy = jest.spyOn(userStore, 'resetToken');
        
        // 调用方法
        await userStore.confirmLogin();
        
        // 验证
        expect(confirm.info).toHaveBeenCalledWith(
          '是否重新登录',
          '您尚未登录或者已经登出，请选择重新登录，或者选择放弃停留在本页面',
          '重新登录',
          '放弃',
        );
        expect(resetTokenSpy).toHaveBeenCalled();
        expect(http.getRouter).toHaveBeenCalled();
        expect(mockRouter.push).toHaveBeenCalledWith({ name: 'custom-login-page' });
        
        // 测试没有 router 的情况
        resetTokenSpy.mockClear();
        confirm.info.mockImplementationOnce(() => Promise.resolve());
        http.getRouter.mockReturnValueOnce({});
        
        await expect(userStore.confirmLogin()).rejects.toThrow();
      });
      
      test('用户取消后不应该执行任何操作', async () => {
        // 模拟用户点击"放弃"按钮，使 Promise 被 reject
        confirm.info.mockImplementationOnce(() => Promise.reject());
        
        // 准备 spy
        const resetTokenSpy = jest.spyOn(userStore, 'resetToken');
        const httpGetRouterSpy = jest.spyOn(http, 'getRouter');
        
        try {
          // 调用方法 - 注意：这会导致一个被 reject 的 Promise
          await userStore.confirmLogin();
        } catch (error) {
          // 忽略 Promise reject 导致的错误
        }
        
        // 验证 - Promise 被 reject 后，不应调用后续操作
        expect(resetTokenSpy).not.toHaveBeenCalled();
        expect(httpGetRouterSpy).not.toHaveBeenCalled();
      });
    });
  });
}); 
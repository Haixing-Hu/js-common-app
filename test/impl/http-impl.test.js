////////////////////////////////////////////////////////////////////////////////
//
//    Copyright (c) 2022 - 2024.
//    Haixing Hu, Qubit Co. Ltd.
//
//    All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////
import Json from '@haixing_hu/json';
import { loading, alert, confirm } from '@haixing_hu/common-ui';
import { config, http } from '../../src';
import {
  DEFAULT_HTTP_HEADER_CONTENT_TYPE,
  DEFAULT_HTTP_HEADER_ACCEPT,
  DEFAULT_APP_TOKEN_NAME,
  DEFAULT_ACCESS_TOKEN_NAME,
  DEFAULT_LOGIN_PAGE,
  DEFAULT_HTTP_TIMEOUT,
  httpImpl,
} from '../../src/impl/http-impl';
import HttpImplState from './http-impl-state';

const state = new HttpImplState();

beforeEach(() => {
  state.reset();
  jest.clearAllMocks();
});

/**
 * Test the `fixRequestHeader` function.
 */
describe('fixRequestHeader', () => {
  it('should return the input config', () => {
    const cfg = { data: {} };
    const result = httpImpl.fixRequestHeader(http, cfg);
    expect(result).toBe(cfg);
  });

  it('should set default Content-Type correctly', () => {
    const cfg = { headers: {} };
    httpImpl.fixRequestHeader(http, cfg);
    expect(cfg.headers['Content-Type']).toBe(DEFAULT_HTTP_HEADER_CONTENT_TYPE);
  });

  it('should set specified Content-Type correctly', () => {
    const cfg = { headers: {} };
    config.set('http_header_content_type', 'customContentType');
    httpImpl.fixRequestHeader(http, cfg);
    expect(cfg.headers['Content-Type']).toBe('customContentType');
  });

  it('should set default Accept headers correctly', () => {
    const cfg = { headers: {} };
    httpImpl.fixRequestHeader(http, cfg);
    expect(cfg.headers['Accept']).toBe(DEFAULT_HTTP_HEADER_ACCEPT);
  });

  it('should set specified Accept headers correctly', () => {
    const cfg = { headers: {} };
    config.set('http_header_accept', 'customAccept');
    httpImpl.fixRequestHeader(http, cfg);
    expect(cfg.headers['Accept']).toBe('customAccept');
  });

  it('should add App Token to headers if configured, use default App Token header name', () => {
    const cfg = { headers: {} };
    httpImpl.fixRequestHeader(http, cfg);
    expect(cfg.headers[DEFAULT_APP_TOKEN_NAME]).toBe('TestAppToken');
  });

  it('should add App Token to headers if configured, use customized App Token header name', () => {
    const cfg = { headers: {} };
    config.set('app_token_name', 'Customized-App-Token');
    config.set('app_token_value', 'CustomizedAppToken');
    httpImpl.fixRequestHeader(http, cfg);
    expect(cfg.headers['Customized-App-Token']).toBe('CustomizedAppToken');
  });

  it('should not add App Token to headers if not configured, use default App Token header name', () => {
    const cfg = { headers: {} };
    config.remove('app_token_value');
    httpImpl.fixRequestHeader(http, cfg);
    expect(cfg.headers[DEFAULT_APP_TOKEN_NAME]).toBeUndefined();
  });

  it('should not add App Token to headers if not configured, use customized App Token header name', () => {
    const cfg = { headers: {} };
    config.set('app_token_name', 'Customized-App-Token');
    config.remove('app_token_value');
    httpImpl.fixRequestHeader(http, cfg);
    expect(cfg.headers['Customized-App-Token']).toBeUndefined();
  });

  it('should add Access Token to headers if available, use default Access Token header name', () => {
    const cfg = { headers: {} };
    httpImpl.fixRequestHeader(http, cfg);
    expect(cfg.headers[DEFAULT_ACCESS_TOKEN_NAME]).toBe(state.accessToken.value);
  });

  it('should add Access Token to headers if available, use customized Access Token header name', () => {
    const cfg = { headers: {} };
    config.set('access_token_name', 'Customized-Access-Token');
    httpImpl.fixRequestHeader(http, cfg);
    expect(cfg.headers['Customized-Access-Token']).toBe(state.accessToken.value);
  });

  it('should not add Access Token to headers if not available, use default Access Token header name', () => {
    const cfg = { headers: {} };
    state.accessToken.value = '';
    httpImpl.fixRequestHeader(http, cfg);
    expect(cfg.headers[DEFAULT_ACCESS_TOKEN_NAME]).toBeUndefined();
  });

  it('should not add Access Token to headers if not available, use customized Access Token header name', () => {
    const cfg = { headers: {} };
    state.accessToken.value = '';
    config.set('access_token_name', 'Customized-Access-Token');
    httpImpl.fixRequestHeader(http, cfg);
    expect(cfg.headers['Customized-Access-Token']).toBeUndefined();
  });

  it('should not add Access Token to headers if no http.getAccessToken', () => {
    http.getAccessToken = undefined;
    const cfg = { headers: {} };
    state.accessToken.value = '';
    config.set('access_token_name', 'Customized-Access-Token');
    httpImpl.fixRequestHeader(http, cfg);
    expect(cfg.headers['Customized-Access-Token']).toBeUndefined();
  });

  it('should merge existing headers with new headers', () => {
    const cfg = { headers: { 'Existing-Header': 'existingValue' } };
    httpImpl.fixRequestHeader(http, cfg);
    expect(cfg.headers['Existing-Header']).toBe('existingValue');
    expect(cfg.headers['Content-Type']).toBe(DEFAULT_HTTP_HEADER_CONTENT_TYPE);
    expect(cfg.headers['Accept']).toBe(DEFAULT_HTTP_HEADER_ACCEPT);
    expect(cfg.headers[DEFAULT_APP_TOKEN_NAME]).toBe(state.appToken.value);
    expect(cfg.headers[DEFAULT_ACCESS_TOKEN_NAME]).toBe(state.accessToken.value);
  });

  it('should overwrite undefined Content-Type header with default value', () => {
    const cfg = {
      headers: {
        'Existing-Header': 'existingValue',
        'Content-Type': undefined,
      },
    };
    httpImpl.fixRequestHeader(http, cfg);
    expect(cfg.headers['Existing-Header']).toBe('existingValue');
    expect(cfg.headers['Content-Type']).toBe(DEFAULT_HTTP_HEADER_CONTENT_TYPE);
    expect(cfg.headers['Accept']).toBe(DEFAULT_HTTP_HEADER_ACCEPT);
    expect(cfg.headers[DEFAULT_APP_TOKEN_NAME]).toBe(state.appToken.value);
    expect(cfg.headers[DEFAULT_ACCESS_TOKEN_NAME]).toBe(state.accessToken.value);
  });

  it('should keep existing non-nullish Content-Type header', () => {
    const cfg = {
      headers: {
        'Existing-Header': 'existingValue',
        'Content-Type': 'my-customized-content-type',
      },
    };
    httpImpl.fixRequestHeader(http, cfg);
    expect(cfg.headers['Existing-Header']).toBe('existingValue');
    expect(cfg.headers['Content-Type']).toBe('my-customized-content-type');
    expect(cfg.headers['Accept']).toBe(DEFAULT_HTTP_HEADER_ACCEPT);
    expect(cfg.headers[DEFAULT_APP_TOKEN_NAME]).toBe(state.appToken.value);
    expect(cfg.headers[DEFAULT_ACCESS_TOKEN_NAME]).toBe(state.accessToken.value);
  });

  it('should set default Content-Type for configuration without headers', () => {
    const cfg = { };
    httpImpl.fixRequestHeader(http, cfg);
    expect(cfg.headers['Content-Type']).toBe(DEFAULT_HTTP_HEADER_CONTENT_TYPE);
    expect(cfg.headers['Accept']).toBe(DEFAULT_HTTP_HEADER_ACCEPT);
    expect(cfg.headers[DEFAULT_APP_TOKEN_NAME]).toBe(state.appToken.value);
    expect(cfg.headers[DEFAULT_ACCESS_TOKEN_NAME]).toBe(state.accessToken.value);
  });
});

/**
 * Test the `fixGetRequestParams` function.
 */
describe('fixGetRequestParams', () => {
  it('should return the input config', () => {
    const cfg = { data: {} };
    const result = httpImpl.fixGetRequestParams(http, cfg);
    expect(result).toBe(cfg);
  });

  it('should add timestamp and random number to GET request params', () => {
    const cfg = { method: 'get', params: {} };
    httpImpl.fixGetRequestParams(http, cfg);
    expect(cfg.params._t).toBeDefined();
    expect(cfg.params._r).toBeDefined();
  });

  it('should not modify params for non-GET requests', () => {
    const cfg = { method: 'post', params: { key: 'value' } };
    httpImpl.fixGetRequestParams(http, cfg);
    expect(cfg.params).toEqual({ key: 'value' });
  });

  it('should not overwrite existing GET request params', () => {
    const cfg = { method: 'get', params: { existing: 'value' } };
    httpImpl.fixGetRequestParams(http, cfg);
    expect(cfg.params.existing).toBe('value');
    expect(cfg.params._t).toBeDefined();
    expect(cfg.params._r).toBeDefined();
  });
});

/**
 * Test the `transformRequestData` function.
 */
describe('fixDataTransformers', () => {
  it('should return the input config', () => {
    const cfg = { data: {} };
    const result = httpImpl.fixDataTransformers(http, cfg);
    expect(result).toBe(cfg);
  });

  it('should add default data transformers', () => {
    const cfg = { data: {} };
    httpImpl.fixDataTransformers(http, cfg);
    expect(cfg.transformRequest).toEqual([httpImpl.transformRequestData]);
    expect(cfg.transformResponse).toEqual([httpImpl.transformResponseData]);
  });

  it('should append to existing data transformers', () => {
    const oldRequestTransformers = [
      (data) => data,
    ];
    const oldResponseTransformers = [
      (data) => data,
    ];
    const cfg = {
      data: {},
      transformRequest: oldRequestTransformers,
      transformResponse: oldResponseTransformers,
    };
    httpImpl.fixDataTransformers(http, cfg);
    expect(cfg.transformRequest).toBeDefined();
    expect(cfg.transformRequest.length).toBe(oldRequestTransformers.length + 1);
    expect(cfg.transformRequest)
      .toEqual([httpImpl.transformRequestData, ...oldRequestTransformers]);
    expect(cfg.transformResponse)
      .toEqual([httpImpl.transformResponseData, ...oldResponseTransformers]);
  });
});

/**
 * Test the `transformRequestData` function.
 */
describe('transformRequestData', () => {
  it('should return input data for non-JSON content-type', () => {
    const data = '123';
    const headers = { 'Content-Type': 'text/plain' };
    const result = httpImpl.transformRequestData(data, headers);
    expect(result).toBe(data);
  });

  it('should stringify JSON data with JSON stringifier supporting bigint', () => {
    const data = { key: 'value', bigint: 12345678901234567890n };
    const headers = { 'Content-Type': 'application/json' };
    const result = httpImpl.transformRequestData(data, headers);
    expect(result).toBe('{"key":"value","bigint":12345678901234567890}');
  });

  it('should stringify UTF-8 JSON data with JSON stringifier supporting bigint', () => {
    const data = { key: 'value', bigint: 12345678901234567890n };
    const headers = { 'Content-Type': 'application/json;charset=UTF-8' };
    const result = httpImpl.transformRequestData(data, headers);
    expect(result).toBe('{"key":"value","bigint":12345678901234567890}');
  });

  it('should not remove empty fields of JSON data before stringify', () => {
    const data = { key: 'value', empty: '' };
    const headers = { 'Content-Type': 'application/json' };
    const result = httpImpl.transformRequestData(data, headers);
    expect(result).toBe('{"key":"value","empty":""}');
  });
});

/**
 * Test the `transformResponseData` function.
 */
describe('transformResponseData', () => {
  it('should return input data for non-json content-type', () => {
    const data = '123';
    const headers = { 'Content-Type': 'text/plain' };
    const result = httpImpl.transformResponseData(data, headers);
    expect(result).toBe(data);
  });

  it('should parse JSON string with JSON stringifier supporting bigint', () => {
    const data = '{"key":"value","bigint":12345678901234567890}';
    const headers = { 'Content-Type': 'application/json' };
    const result = httpImpl.transformResponseData(data, headers);
    expect(result).toEqual({ key: 'value', bigint: 12345678901234567890n });
  });

  it('should parse UTF-8 JSON string with JSON stringifier supporting bigint', () => {
    const data = '{"key":"value","bigint":12345678901234567890}';
    const headers = { 'Content-Type': 'application/json;charset=UTF-8' };
    const result = httpImpl.transformResponseData(data, headers);
    expect(result).toEqual({ key: 'value', bigint: 12345678901234567890n });
  });

  it('should return input data for JSON content-type but non-string value', () => {
    const data = 123;
    const headers = { 'Content-Type': 'application/json' };
    const result = httpImpl.transformResponseData(data, headers);
    expect(result).toBe(data);
  });
});

/**
 * Test the `confirmLogin` function.
 */
describe('confirmLogin', () => {
  it('should confirm login when access token is expired, with default Login page', async () => {
    const result = await httpImpl.confirmLogin(http);
    expect(result).toBe('Login');
    expect(state.confirmImpl.type).toBe('info');
    expect(state.confirmImpl.title).toBe('是否重新登录');
    expect(state.confirmImpl.message).toBe('您尚未登录或者已经登出，请选择重新登录，或者选择“放弃”停留在本页面');
    expect(state.confirmImpl.okLabel).toBe('重新登录');
    expect(state.confirmImpl.cancelLabel).toBe('放弃');
    expect(state.resetAccessToken).toHaveBeenCalledOnce();
    expect(state.accessToken.value).toBe('');
    expect(state.getRouter).toHaveBeenCalledOnce();
    expect(state.pushRouter).toHaveBeenCalledOnce();
    expect(state.router.name).toBe('Login');
  });

  it('should confirm login when access token is expired, with customized Login page', async () => {
    config.set('login_page', 'CustomizedLogin');
    const result = await httpImpl.confirmLogin(http);
    expect(result).toBe('CustomizedLogin');
    expect(state.confirmImpl.type).toBe('info');
    expect(state.confirmImpl.title).toBe('是否重新登录');
    expect(state.confirmImpl.message).toBe('您尚未登录或者已经登出，请选择重新登录，或者选择“放弃”停留在本页面');
    expect(state.confirmImpl.okLabel).toBe('重新登录');
    expect(state.confirmImpl.cancelLabel).toBe('放弃');
    expect(state.resetAccessToken).toHaveBeenCalledOnce();
    expect(state.accessToken.value).toBe('');
    expect(state.getRouter).toHaveBeenCalledOnce();
    expect(state.pushRouter).toHaveBeenCalledOnce();
    expect(state.router.name).toBe('CustomizedLogin');
  });

  it('should throw error if no http.getRouter', async () => {
    http.getRouter = undefined;
    await expect(httpImpl.confirmLogin(http)).rejects.toThrow();
  });

  it('should throw error if http.getRouter() return null', async () => {
    http.getRouter = () => null;
    await expect(httpImpl.confirmLogin(http)).rejects.toThrow();
  });

  it('should throw error if no http.getRouter().push', async () => {
    http.getRouter = () => {};
    await expect(httpImpl.confirmLogin(http)).rejects.toThrow();
  });
});

/**
 * Test the `handleUnknownError` function.
 */
describe('handleUnknownError', () => {
  it('should handle unknown error with message and params', async () => {
    const error = {
      type: 'AUTHENTICATION_ERROR',
      code: 'SESSION_EXPIRED',
      params: [{
        key: 'entity',
        value: 'unknown',
      }],
      message: '未知错误的消息',
    };
    try {
      await httpImpl.handleUnknownError(error);
    } catch (e) {
      expect(e).toBe(error);
      expect(state.alertImpl.type).toBe('error');
      expect(state.alertImpl.title).toBe('错误');
      expect(state.alertImpl.message)
        .toBe(`${error.message}：请与管理员联系<br><br>错误参数为：${Json.stringify(e.params)}`);
      expect(state.resetAccessToken).not.toHaveBeenCalled();
      expect(state.getRouter).not.toHaveBeenCalled();
      expect(state.pushRouter).not.toHaveBeenCalled();
    }
  });
  it('should handle unknown error with message and without params', async () => {
    const error = {
      type: 'AUTHENTICATION_ERROR',
      code: 'SESSION_EXPIRED',
      message: '未知错误的消息',
    };
    try {
      await httpImpl.handleUnknownError(error);
    } catch (e) {
      expect(e).toBe(error);
      expect(state.alertImpl.type).toBe('error');
      expect(state.alertImpl.title).toBe('错误');
      expect(state.alertImpl.message).toBe(`${error.message}：请与管理员联系`);
      expect(state.resetAccessToken).not.toHaveBeenCalled();
      expect(state.getRouter).not.toHaveBeenCalled();
      expect(state.pushRouter).not.toHaveBeenCalled();
    }
  });
  it('should handle unknown error without message and with params', async () => {
    const error = {
      type: 'AUTHENTICATION_ERROR',
      code: 'SESSION_EXPIRED',
      message: '',
      params: [{
        key: 'entity',
        value: 'unknown',
      }],
    };
    try {
      await httpImpl.handleUnknownError(error);
    } catch (e) {
      expect(e).toBe(error);
      expect(state.alertImpl.type).toBe('error');
      expect(state.alertImpl.title).toBe('错误');
      expect(state.alertImpl.message)
        .toBe(`发生未知错误：请与管理员联系<br><br>错误参数为：${Json.stringify(e.params)}`);
      expect(state.resetAccessToken).not.toHaveBeenCalled();
      expect(state.getRouter).not.toHaveBeenCalled();
      expect(state.pushRouter).not.toHaveBeenCalled();
    }
  });
  it('should handle unknown error without message and without params', async () => {
    const error = {
      type: 'AUTHENTICATION_ERROR',
      code: 'SESSION_EXPIRED',
      message: '',
    };
    try {
      await httpImpl.handleUnknownError(error);
    } catch (e) {
      expect(e).toBe(error);
      expect(state.alertImpl.type).toBe('error');
      expect(state.alertImpl.title).toBe('错误');
      expect(state.alertImpl.message).toBe('发生未知错误：请与管理员联系');
      expect(state.resetAccessToken).not.toHaveBeenCalled();
      expect(state.getRouter).not.toHaveBeenCalled();
      expect(state.pushRouter).not.toHaveBeenCalled();
    }
  });
});

/**
 * Test the `handleResponseError` function.
 */
describe('handleResponseError', () => {
  it('should handle LOGIN_REQUIRED error by confirming login', async () => {
    const error = {
      type: 'AUTHENTICATION_ERROR',
      code: 'LOGIN_REQUIRED',
    };
    const spy = jest.spyOn(confirm, 'show');
    const page = await httpImpl.handleResponseError(http, error);
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
    expect(page).toBe('Login');
    expect(state.confirmImpl.type).toBe('info');
    expect(state.confirmImpl.title).toBe('是否重新登录');
    expect(state.confirmImpl.message).toBe('您尚未登录或者已经登出，请选择重新登录，或者选择“放弃”停留在本页面');
    expect(state.confirmImpl.okLabel).toBe('重新登录');
    expect(state.confirmImpl.cancelLabel).toBe('放弃');
    expect(state.resetAccessToken).toHaveBeenCalledOnce();
    expect(state.accessToken.value).toBe('');
    expect(state.getRouter).toHaveBeenCalledOnce();
    expect(state.pushRouter).toHaveBeenCalledOnce();
    expect(state.router.name).toBe('Login');
  });

  it('should handle SESSION_EXPIRED error of app', async () => {
    const error = {
      type: 'AUTHENTICATION_ERROR',
      code: 'SESSION_EXPIRED',
      params: [{
        key: 'entity',
        value: 'app',
      }],
      message: '应用的会话已过期',
    };
    const spy = jest.spyOn(alert, 'show');
    try {
      await httpImpl.handleResponseError(http, error);
    } catch (e) {
      expect(spy).toHaveBeenCalledOnce();
      spy.mockRestore();
      expect(e).toBe(error);
      expect(state.alertImpl.type).toBe('error');
      expect(state.alertImpl.title).toBe('错误');
      expect(state.alertImpl.message).toBe('应用会话已过期，请与管理员联系');
      expect(state.resetAccessToken).not.toHaveBeenCalled();
      expect(state.getRouter).not.toHaveBeenCalled();
      expect(state.pushRouter).not.toHaveBeenCalled();
    }
  });

  it('should handle SESSION_EXPIRED error of user', async () => {
    const error = {
      type: 'AUTHENTICATION_ERROR',
      code: 'SESSION_EXPIRED',
      params: [{
        key: 'entity',
        value: 'user',
      }],
      message: '用户的会话已过期',
    };
    const spy = jest.spyOn(confirm, 'show');
    const page = await httpImpl.handleResponseError(http, error);
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
    expect(page).toBe('Login');
    expect(state.confirmImpl.type).toBe('info');
    expect(state.confirmImpl.title).toBe('是否重新登录');
    expect(state.confirmImpl.message).toBe('您尚未登录或者已经登出，请选择重新登录，或者选择“放弃”停留在本页面');
    expect(state.confirmImpl.okLabel).toBe('重新登录');
    expect(state.confirmImpl.cancelLabel).toBe('放弃');
    expect(state.resetAccessToken).toHaveBeenCalledOnce();
    expect(state.accessToken.value).toBe('');
    expect(state.getRouter).toHaveBeenCalledOnce();
    expect(state.pushRouter).toHaveBeenCalledOnce();
    expect(state.router.name).toBe('Login');
  });

  it('should handle SESSION_EXPIRED error of unknown', async () => {
    const error = {
      type: 'AUTHENTICATION_ERROR',
      code: 'SESSION_EXPIRED',
      params: [{
        key: 'entity',
        value: 'unknown',
      }],
      message: '未知错误的消息',
    };
    const spy = jest.spyOn(alert, 'show');
    try {
      await httpImpl.handleResponseError(http, error);
    } catch (e) {
      expect(spy).toHaveBeenCalledOnce();
      spy.mockRestore();
      expect(e).toBe(error);
      expect(state.alertImpl.type).toBe('error');
      expect(state.alertImpl.title).toBe('错误');
      expect(state.alertImpl.message)
        .toBe(`未知错误的消息：请与管理员联系<br><br>错误参数为：${Json.stringify(e.params)}`);
      expect(state.resetAccessToken).not.toHaveBeenCalled();
      expect(state.getRouter).not.toHaveBeenCalled();
      expect(state.pushRouter).not.toHaveBeenCalled();
    }
  });

  it('should handle INVALID_TOKEN error of app', async () => {
    const error = {
      type: 'AUTHENTICATION_ERROR',
      code: 'INVALID_TOKEN',
      params: [{
        key: 'entity',
        value: 'app',
      }, {
        key: 'token',
        value: 'invalid-app-token',
      }],
      message: '应用的令牌不正确',
    };
    const spy = jest.spyOn(alert, 'show');
    try {
      await httpImpl.handleResponseError(http, error);
    } catch (e) {
      expect(spy).toHaveBeenCalledOnce();
      spy.mockRestore();
      expect(e).toBe(error);
      expect(state.alertImpl.type).toBe('error');
      expect(state.alertImpl.title).toBe('错误');
      expect(state.alertImpl.message).toBe('应用令牌错误，请与管理员联系');
      expect(state.resetAccessToken).not.toHaveBeenCalled();
      expect(state.getRouter).not.toHaveBeenCalled();
      expect(state.pushRouter).not.toHaveBeenCalled();
    }
  });

  it('should handle INVALID_TOKEN error of user', async () => {
    const error = {
      type: 'AUTHENTICATION_ERROR',
      code: 'INVALID_TOKEN',
      params: [{
        key: 'entity',
        value: 'user',
      }, {
        key: 'token',
        value: 'invalid-user-token',
      }],
      message: '用户的令牌不正确',
    };
    const spy = jest.spyOn(confirm, 'show');
    const page = await httpImpl.handleResponseError(http, error);
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
    expect(page).toBe('Login');
    expect(state.confirmImpl.type).toBe('info');
    expect(state.confirmImpl.title).toBe('是否重新登录');
    expect(state.confirmImpl.message).toBe('您尚未登录或者已经登出，请选择重新登录，或者选择“放弃”停留在本页面');
    expect(state.confirmImpl.okLabel).toBe('重新登录');
    expect(state.confirmImpl.cancelLabel).toBe('放弃');
    expect(state.resetAccessToken).toHaveBeenCalledOnce();
    expect(state.accessToken.value).toBe('');
    expect(state.getRouter).toHaveBeenCalledOnce();
    expect(state.pushRouter).toHaveBeenCalledOnce();
    expect(state.router.name).toBe('Login');
  });

  it('should handle INVALID_TOKEN error of unknown', async () => {
    const error = {
      type: 'AUTHENTICATION_ERROR',
      code: 'INVALID_TOKEN',
      params: [{
        key: 'entity',
        value: 'unknown',
      }],
      message: '未知错误的消息',
    };
    const spy = jest.spyOn(alert, 'show');
    try {
      await httpImpl.handleResponseError(http, error);
    } catch (e) {
      expect(spy).toHaveBeenCalledOnce();
      spy.mockRestore();
      expect(e).toBe(error);
      expect(state.alertImpl.type).toBe('error');
      expect(state.alertImpl.title).toBe('错误');
      expect(state.alertImpl.message)
        .toBe(`未知错误的消息：请与管理员联系<br><br>错误参数为：${Json.stringify(e.params)}`);
      expect(state.resetAccessToken).not.toHaveBeenCalled();
      expect(state.getRouter).not.toHaveBeenCalled();
      expect(state.pushRouter).not.toHaveBeenCalled();
    }
  });

  it('should handle INVALID_TOKEN error of unknown', async () => {
    const error = {
      type: 'AUTHENTICATION_ERROR',
      code: 'INVALID_TOKEN',
      params: [{
        key: 'entity',
        value: 'unknown',
      }],
      message: '未知错误的消息',
    };
    const spy = jest.spyOn(alert, 'show');
    try {
      await httpImpl.handleResponseError(http, error);
    } catch (e) {
      expect(spy).toHaveBeenCalledOnce();
      spy.mockRestore();
      expect(e).toBe(error);
      expect(state.alertImpl.type).toBe('error');
      expect(state.alertImpl.title).toBe('错误');
      expect(state.alertImpl.message)
        .toBe(`未知错误的消息：请与管理员联系<br><br>错误参数为：${Json.stringify(e.params)}`);
      expect(state.resetAccessToken).not.toHaveBeenCalled();
      expect(state.getRouter).not.toHaveBeenCalled();
      expect(state.pushRouter).not.toHaveBeenCalled();
    }
  });

  it('should handle APP_AUTHENTICATION_REQUIRED error by showing alert', async () => {
    const error = {
      type: 'AUTHENTICATION_ERROR',
      code: 'APP_AUTHENTICATION_REQUIRED',
      message: '当前应用未认证或令牌已过期，请重新认证',
    };
    const spy = jest.spyOn(alert, 'show');
    try {
      await httpImpl.handleResponseError(http, error);
    } catch (e) {
      expect(spy).toHaveBeenCalledOnce();
      spy.mockRestore();
      expect(e).toBe(error);
      expect(state.alertImpl.type).toBe('error');
      expect(state.alertImpl.title).toBe('错误');
      expect(state.alertImpl.message).toBe('当前应用未认证或令牌已过期，请与管理员联系');
      expect(state.resetAccessToken).not.toHaveBeenCalled();
      expect(state.getRouter).not.toHaveBeenCalled();
      expect(state.pushRouter).not.toHaveBeenCalled();
    }
  });

  it('should handle unknown error with message', async () => {
    const error = {
      type: 'SERVER_ERROR',
      code: 'UNKNOWN_ERROR',
      message: 'Unknown error occurred',
    };
    const spy = jest.spyOn(alert, 'show');
    try {
      await httpImpl.handleResponseError(http, error);
    } catch (e) {
      expect(spy).toHaveBeenCalledOnce();
      spy.mockRestore();
      expect(e).toBe(error);
      expect(state.alertImpl.type).toBe('error');
      expect(state.alertImpl.title).toBe('错误');
      expect(state.alertImpl.message).toBe('Unknown error occurred：请与管理员联系');
      expect(state.resetAccessToken).not.toHaveBeenCalled();
      expect(state.getRouter).not.toHaveBeenCalled();
      expect(state.pushRouter).not.toHaveBeenCalled();
    }
  });

  it('should handle unknown error without message', async () => {
    const error = {
      type: 'SERVER_ERROR',
      code: 'UNKNOWN_ERROR',
    };
    const spy = jest.spyOn(alert, 'show');
    try {
      await httpImpl.handleResponseError(http, error);
    } catch (e) {
      expect(spy).toHaveBeenCalledOnce();
      spy.mockRestore();
      expect(e).toBe(error);
      expect(state.alertImpl.type).toBe('error');
      expect(state.alertImpl.title).toBe('错误');
      expect(state.alertImpl.message).toBe('发生未知错误：请与管理员联系');
      expect(state.resetAccessToken).not.toHaveBeenCalled();
      expect(state.getRouter).not.toHaveBeenCalled();
      expect(state.pushRouter).not.toHaveBeenCalled();
    }
  });
});

/**
 * Test the `validateConfig` function.
 */
describe('validateConfig', () => {
  it('should pass with default configuration', () => {
    expect(httpImpl.validateConfig(http)).toBe(true);
  });

  it('should throw if loading.setImpl is not set', () => {
    loading.impl = undefined;
    expect(() => httpImpl.validateConfig(http)).toThrow();
  });

  it('should throw if alert.setImpl is not set', () => {
    alert.impl = undefined;
    expect(() => httpImpl.validateConfig(http)).toThrow();
  });

  it('should throw if confirm.setImpl is not set', () => {
    confirm.impl = undefined;
    expect(() => httpImpl.validateConfig(http)).toThrow();
  });

  it('should throw if http.getAccessToken is not set', () => {
    http.getAccessToken = undefined;
    expect(() => httpImpl.validateConfig(http)).toThrow();
  });

  it('should throw if http.resetAccessToken is not set', () => {
    http.resetAccessToken = undefined;
    expect(() => httpImpl.validateConfig(http)).toThrow();
  });

  it('should throw if http.getRouter is not set', () => {
    http.getRouter = undefined;
    expect(() => httpImpl.validateConfig(http)).toThrow();
  });

  it('should pass if config[http_header_content_type] is set', () => {
    config.set('http_header_content_type', 'application/xml');
    expect(httpImpl.validateConfig(http)).toBe(true);
    expect(config.get('http_header_content_type')).toBe('application/xml');
  });

  it('should set if config[http_header_content_type] is not set', () => {
    config.remove('http_header_content_type');
    expect(httpImpl.validateConfig(http)).toBe(true);
    expect(config.get('http_header_content_type')).toBe(DEFAULT_HTTP_HEADER_CONTENT_TYPE);
  });

  it('should pass if config[http_header_accept] is set', () => {
    config.set('http_header_accept', 'application/xml');
    expect(httpImpl.validateConfig(http)).toBe(true);
    expect(config.get('http_header_accept')).toBe('application/xml');
  });

  it('should set if config[http_header_accept] is not set', () => {
    config.remove('http_header_accept');
    expect(httpImpl.validateConfig(http)).toBe(true);
    expect(config.get('http_header_accept')).toBe(DEFAULT_HTTP_HEADER_ACCEPT);
  });

  it('should pass if config[http_timeout] is set', () => {
    config.set('http_timeout', 200);
    expect(httpImpl.validateConfig(http)).toBe(true);
    expect(config.get('http_timeout')).toBe(200);
  });

  it('should set if config[http_timeout] is not set', () => {
    config.remove('http_timeout');
    expect(httpImpl.validateConfig(http)).toBe(true);
    expect(config.get('http_timeout')).toBe(DEFAULT_HTTP_TIMEOUT);
  });

  it('should pass if config[app_token_name] is set', () => {
    config.set('app_token_name', 'app-token');
    expect(httpImpl.validateConfig(http)).toBe(true);
    expect(config.get('app_token_name')).toBe('app-token');
  });

  it('should set if config[app_token_name] is not set', () => {
    config.remove('app_token_name');
    expect(httpImpl.validateConfig(http)).toBe(true);
    expect(config.get('app_token_name')).toBe(DEFAULT_APP_TOKEN_NAME);
  });

  it('should pass if config[access_token_name] is set', () => {
    config.set('access_token_name', 'user-token');
    expect(httpImpl.validateConfig(http)).toBe(true);
    expect(config.get('access_token_name')).toBe('user-token');
  });

  it('should set if config[access_token_name] is not set', () => {
    config.remove('access_token_name');
    expect(httpImpl.validateConfig(http)).toBe(true);
    expect(config.get('access_token_name')).toBe(DEFAULT_ACCESS_TOKEN_NAME);
  });

  it('should pass if config[api_base_url] is set', () => {
    config.set('api_base_url', 'xxx');
    expect(httpImpl.validateConfig(http)).toBe(true);
    expect(config.get('api_base_url')).toBe('xxx');
  });

  it('should throw if config[api_base_url] is not set', () => {
    config.remove('api_base_url');
    expect(() => httpImpl.validateConfig(http)).toThrow();
  });

  it('should pass if config[app_token_value] is set', () => {
    config.set('app_token_value', 'xxx');
    expect(httpImpl.validateConfig(http)).toBe(true);
    expect(config.get('app_token_value')).toBe('xxx');
  });

  it('should throw if config[app_token_value] is not set', () => {
    config.remove('app_token_value');
    expect(() => httpImpl.validateConfig(http)).toThrow();
  });

  it('should pass if config[login_page] is set', () => {
    config.set('login_page', 'xxx');
    expect(httpImpl.validateConfig(http)).toBe(true);
    expect(config.get('login_page')).toBe('xxx');
  });

  it('should set if config[login_page] is not set', () => {
    config.remove('login_page');
    expect(httpImpl.validateConfig(http)).toBe(true);
    expect(config.get('login_page')).toBe(DEFAULT_LOGIN_PAGE);
  });
});

/**
 * Test the `requestConfigInterceptor` function.
 */
describe('requestConfigInterceptor', () => {
  it('should return the input config', () => {
    const cfg = {
      method: 'get',
      params: {
        key: 'value',
      },
      headers: { 'Existing-Header': 'existingValue' },
    };
    const result = httpImpl.requestConfigInterceptor(http, cfg);
    expect(result).toBe(cfg);
  });

  it('should validate config', () => {
    const cfg = {
      method: 'get',
      params: {
        key: 'value',
      },
      headers: { 'Existing-Header': 'existingValue' },
    };
    const spy = jest.spyOn(httpImpl, 'validateConfig');
    const result = httpImpl.requestConfigInterceptor(http, cfg);
    expect(result).toBe(cfg);
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it('should set baseURL with specified value', () => {
    const cfg = {
      method: 'get',
      params: {
        key: 'value',
      },
      headers: { 'Existing-Header': 'existingValue' },
    };
    config.set('api_base_url', 'xxx');
    const result = httpImpl.requestConfigInterceptor(http, cfg);
    expect(result).toBe(cfg);
    expect(result.baseURL).toBe('xxx');
  });

  it('should set timeout with specified value', () => {
    const cfg = {
      method: 'get',
      params: {
        key: 'value',
      },
      headers: { 'Existing-Header': 'existingValue' },
    };
    config.set('http_timeout', 111);
    const result = httpImpl.requestConfigInterceptor(http, cfg);
    expect(result).toBe(cfg);
    expect(result.timeout).toBe(111);
  });

  it('should set timeout with default value', () => {
    const cfg = {
      method: 'get',
      params: {
        key: 'value',
      },
      headers: { 'Existing-Header': 'existingValue' },
    };
    config.remove('http_timeout');
    const result = httpImpl.requestConfigInterceptor(http, cfg);
    expect(result).toBe(cfg);
    expect(result.timeout).toBe(DEFAULT_HTTP_TIMEOUT);
  });

  it('should call fixRequestHeader', () => {
    const cfg = {
      method: 'get',
      params: {
        key: 'value',
      },
      headers: { 'Existing-Header': 'existingValue' },
    };
    config.remove('http_timeout');
    const spy = jest.spyOn(httpImpl, 'fixRequestHeader');
    const result = httpImpl.requestConfigInterceptor(http, cfg);
    expect(result).toBe(cfg);
    expect(spy).toHaveBeenCalledOnce();
    expect(cfg.headers['Existing-Header']).toBe('existingValue');
    expect(cfg.headers['Content-Type']).toBe(DEFAULT_HTTP_HEADER_CONTENT_TYPE);
    expect(cfg.headers['Accept']).toBe(DEFAULT_HTTP_HEADER_ACCEPT);
    expect(cfg.headers[DEFAULT_APP_TOKEN_NAME]).toBe('TestAppToken');
    expect(cfg.headers[DEFAULT_ACCESS_TOKEN_NAME]).toBe(state.accessToken.value);
    spy.mockRestore();
  });

  it('should call fixGetRequestParams', () => {
    const cfg = {
      method: 'get',
      params: {
        key: 'value',
      },
      headers: { 'Existing-Header': 'existingValue' },
    };
    config.remove('http_timeout');
    const spy = jest.spyOn(httpImpl, 'fixGetRequestParams');
    const result = httpImpl.requestConfigInterceptor(http, cfg);
    expect(result).toBe(cfg);
    expect(spy).toHaveBeenCalledOnce();
    expect(cfg.params._t).toBeDefined();
    expect(cfg.params._r).toBeDefined();
    spy.mockRestore();
  });
});

/**
 * Test the `responseSuccessInterceptor` function.
 */
describe('responseSuccessInterceptor', () => {
  it('should call loading.clear()', () => {
    const response = {
      data: { id: 12345678901234567890n, code: 'app' },
    };
    const spy = jest.spyOn(loading, 'clear');
    loading.show('Loading...');
    expect(state.loadingImpl.message).toBe('Loading...');
    httpImpl.responseSuccessInterceptor(http, response);
    expect(spy).toHaveBeenCalledOnce();
    expect(state.loadingImpl.message).toBeUndefined();
    spy.mockRestore();
  });

  it('should return the response.data', () => {
    const response = {
      data: { id: 12345678901234567890n, code: 'app' },
    };
    const result = httpImpl.responseSuccessInterceptor(http, response);
    expect(result).toEqual({ id: 12345678901234567890n, code: 'app' });
  });

  it('should return null if no response data', () => {
    const response = {};
    const result = httpImpl.responseSuccessInterceptor(http, response);
    expect(result).toBeNull();
  });
});

/**
 * Test the `responseFailInterceptor` function.
 */
describe('responseFailInterceptor', () => {
  it('should call loading.clear()', async () => {
    const errorResponse = {
      response: {
        data: {
          type: 'SERVER_ERROR',
          code: 'INVALID_VALUE',
          params: [{
            key: 'name',
            value: 'app',
          }, {
            key: 'id',
            value: '12345678901234567890',
          }],
          message: '应用的令牌不正确',
        },
      },
    };
    const spy = jest.spyOn(loading, 'clear');
    loading.show('Loading...');
    expect(state.loadingImpl.message).toBe('Loading...');
    try {
      await httpImpl.responseFailInterceptor(http, errorResponse);
    } catch (e) {
      expect(spy).toHaveBeenCalled();
      expect(state.loadingImpl.message).toBeUndefined();
      spy.mockRestore();
    }
  });

  it('should call handleResponseError', async () => {
    const errorResponse = {
      response: {
        data: {
          type: 'SERVER_ERROR',
          code: 'INVALID_VALUE',
          params: [{
            key: 'name',
            value: 'app',
          }, {
            key: 'id',
            value: '12345678901234567890',
          }],
          message: '应用的令牌不正确',
        },
      },
    };
    const spy = jest.spyOn(httpImpl, 'handleResponseError');
    loading.show('Loading...');
    expect(state.loadingImpl.message).toBe('Loading...');
    try {
      await httpImpl.responseFailInterceptor(http, errorResponse);
    } catch (e) {
      expect(spy).toHaveBeenCalledOnce();
      spy.mockRestore();
    }
  });

  it('response.config.skipAutoErrorHandling === true', async () => {
    const errorInfo = {
      type: 'SERVER_ERROR',
      code: 'INVALID_VALUE',
      params: [{
        key: 'name',
        value: 'app',
      }, {
        key: 'id',
        value: '12345678901234567890',
      }],
      message: '应用的令牌不正确',
    };
    const errorResponse = {
      response: {
        data: errorInfo,
      },
      config: {
        skipAutoErrorHandling: true,
      },
    };
    loading.show('Loading...');
    expect(state.loadingImpl.message).toBe('Loading...');
    try {
      await httpImpl.responseFailInterceptor(http, errorResponse);
    } catch (e) {
      expect(e).toBe(errorInfo);
    }
  });

  it('no response.data, has response.message', async () => {
    const errorResponse = {
      message: 'Unknown error occurred',
    };
    const spy = jest.spyOn(alert, 'show');
    try {
      await httpImpl.responseFailInterceptor(http, errorResponse);
    } catch (e) {
      expect(spy).toHaveBeenCalledOnce();
      spy.mockRestore();
      expect(e).toEqual({
        type: 'NETWORK_ERROR',
        code: 'UNKNOWN',
        message: '网络请求发生未知错误: Unknown error occurred',
      });
      expect(state.alertImpl.type).toBe('error');
      expect(state.alertImpl.title).toBe('错误');
      expect(state.alertImpl.message).toBe('网络请求发生未知错误: Unknown error occurred');
    }
  });

  it('no response.data, has response.message, skipAutoErrorHandling === true', async () => {
    const errorResponse = {
      message: 'Unknown error occurred',
      config: {
        skipAutoErrorHandling: true,
      },
    };
    const spy = jest.spyOn(alert, 'show');
    try {
      await httpImpl.responseFailInterceptor(http, errorResponse);
    } catch (e) {
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
      expect(e).toEqual({
        type: 'NETWORK_ERROR',
        code: 'UNKNOWN',
        message: '网络请求发生未知错误: Unknown error occurred',
      });
    }
  });

  it('no response.data, no response.message', async () => {
    const errorResponse = {
      value: 'Unknown error occurred',
    };
    const spy = jest.spyOn(alert, 'show');
    try {
      await httpImpl.responseFailInterceptor(http, errorResponse);
    } catch (e) {
      expect(spy).toHaveBeenCalledOnce();
      spy.mockRestore();
      expect(e).toEqual({
        type: 'NETWORK_ERROR',
        code: 'UNKNOWN',
        message: '网络请求发生未知错误: {"value":"Unknown error occurred"}',
      });
      expect(state.alertImpl.type).toBe('error');
      expect(state.alertImpl.title).toBe('错误');
      expect(state.alertImpl.message).toBe('网络请求发生未知错误: {"value":"Unknown error occurred"}');
    }
  });

  it('no response.data, no response.message, skipAutoErrorHandling === true', async () => {
    const errorResponse = {
      value: 'Unknown error occurred',
      config: {
        skipAutoErrorHandling: true,
      },
    };
    const spy = jest.spyOn(alert, 'show');
    try {
      await httpImpl.responseFailInterceptor(http, errorResponse);
    } catch (e) {
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
      expect(e).toEqual({
        type: 'NETWORK_ERROR',
        code: 'UNKNOWN',
        message: '网络请求发生未知错误: {"value":"Unknown error occurred","config":{"skipAutoErrorHandling":true}}',
      });
    }
  });
});

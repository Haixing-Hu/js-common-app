////////////////////////////////////////////////////////////////////////////////
//
//    Copyright (c) 2022 - 2024.
//    Haixing Hu, Qubit Co. Ltd.
//
//    All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////
import AxiosMockAdapter from 'axios-mock-adapter';
import { Json } from '@haixing_hu/json';
import Logger from '@haixing_hu/logging';
import { alert, confirm } from '@haixing_hu/common-ui';
import { http } from '../src';
import {
  DEFAULT_HTTP_HEADER_CONTENT_TYPE,
  DEFAULT_HTTP_HEADER_ACCEPT,
  DEFAULT_APP_TOKEN_NAME,
  DEFAULT_ACCESS_TOKEN_NAME,
} from '../src/impl/http-impl';
import HttpImplState from './impl/http-impl-state';

const state = new HttpImplState();

const mock = new AxiosMockAdapter(http);

beforeEach(() => {
  state.reset();
  jest.clearAllMocks();
  mock.reset();
});

afterAll(() => {
  mock.restore();
});

Logger.getLogger('http').setLevel('info');

describe('http.interceptors.request', () => {
  it('should stringify posted data with JSON stringifier supporting bigint', async () => {
    const params = { id: 12345678901234567890n, name: 'John' };
    const response = { success: true, name: 'John Doe' };
    const spy = jest.spyOn(Json, 'stringify');
    mock.onPost('/data').reply((cfg) => {
      expect(spy).toHaveBeenCalledWith(params);
      spy.mockRestore();
      expect(cfg.data).toEqual('{"id":12345678901234567890,"name":"John"}');
      return [200, response];  // 模拟成功响应
    });
    const result = await http.post('/data', params);
    expect(result).toEqual(response);
  });

  it('should not stringify posted data for non-JSON content-type', async () => {
    const params = 'hello world';
    const response = { success: true, name: 'John Doe' };
    const spy = jest.spyOn(Json, 'stringify');
    mock.onPost('/data').reply((cfg) => {
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
      expect(cfg.data).toBe('hello world');
      return [200, response];  // 模拟成功响应
    });
    const result = await http.post('/data', params, {
      headers: { 'Content-Type': 'text/plain' },
    });
    expect(result).toEqual(response);
  });

  it('should add default HTTP request headers', async () => {
    const params = { id: 12345678901234567890n, name: 'John' };
    const response = { success: true, name: 'John Doe' };
    mock.onPost('/data').reply((cfg) => {
      const headers = cfg.headers;
      expect(headers.get('Content-Type')).toBe(DEFAULT_HTTP_HEADER_CONTENT_TYPE);
      expect(headers.get('Accept')).toBe(DEFAULT_HTTP_HEADER_ACCEPT);
      expect(headers.get(DEFAULT_APP_TOKEN_NAME)).toBe(state.appToken.value);
      expect(headers.get(DEFAULT_ACCESS_TOKEN_NAME)).toBe(state.accessToken.value);
      const data = cfg.data;
      expect(data).toBe('{"id":12345678901234567890,"name":"John"}');
      return [200, Json.stringify(response), { 'Content-Type': 'application/json' }];
    });
    const result = await http.post('/data', params);
    expect(result).toEqual(response);
  });

  it('should successfully parse the response with lower-case content-type header', async () => {
    const params = { id: 12345678901234567890n, name: 'John' };
    const response = { success: true, name: 'John Doe' };
    mock.onPost('/data').reply((cfg) => {
      const headers = cfg.headers;
      expect(headers.get('Content-Type')).toBe(DEFAULT_HTTP_HEADER_CONTENT_TYPE);
      expect(headers.get('Accept')).toBe(DEFAULT_HTTP_HEADER_ACCEPT);
      expect(headers.get(DEFAULT_APP_TOKEN_NAME)).toBe(state.appToken.value);
      expect(headers.get(DEFAULT_ACCESS_TOKEN_NAME)).toBe(state.accessToken.value);
      const data = cfg.data;
      expect(data).toBe('{"id":12345678901234567890,"name":"John"}');
      return [200, Json.stringify(response), { 'content-type': 'application/json' }];
    });
    const result = await http.post('/data', params);
    expect(result).toEqual(response);
  });
});

describe('http.interceptors.response', () => {
  it('should parse response with JSON stringifier supporting bigint', async () => {
    const params = { id: 12345678901234567890n, name: 'John' };
    const response = { success: true, id: 12345678901234567890n, name: 'John Doe' };
    const responseText = '{"success":true,"id":12345678901234567890,"name":"John Doe"}';
    const responseHeaders = {
      'Content-Type': DEFAULT_HTTP_HEADER_CONTENT_TYPE,
    };
    const spy = jest.spyOn(Json, 'parse');
    mock.onPost('/data').reply((cfg) => {
      expect(cfg.data).toEqual('{"id":12345678901234567890,"name":"John"}');
      return [200, responseText, responseHeaders];  // 模拟成功响应
    });
    const result = await http.post('/data', params);
    expect(spy).toHaveBeenCalledWith(responseText);
    spy.mockRestore();
    expect(result).toEqual(response);
  });

  it('should not parse response for non-JSON content-type', async () => {
    const params = { id: 12345678901234567890n, name: 'John' };
    const responseText = '{"id":12345678901234567890,"name":"John Doe","success":true}';
    const responseHeaders = {
      'Content-Type': 'text/plain',
    };
    const spy = jest.spyOn(Json, 'parse');
    mock.onPost('/data').reply((cfg) => {
      expect(cfg.data).toEqual('{"id":12345678901234567890,"name":"John"}');
      return [200, responseText, responseHeaders];  // 模拟成功响应
    });
    const result = await http.post('/data', params);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
    expect(result).toEqual(responseText);
  });

  it('should handle LOGIN_REQUIRED error', async () => {
    const params = { id: 12345678901234567890n, name: 'John' };
    const error = {
      type: 'AUTHENTICATION_ERROR',
      code: 'LOGIN_REQUIRED',
    };
    const spy = jest.spyOn(confirm, 'show');
    mock.onPost('/data').reply((cfg) => {
      const headers = cfg.headers;
      expect(headers.get('Content-Type')).toBe(DEFAULT_HTTP_HEADER_CONTENT_TYPE);
      expect(headers.get('Accept')).toBe(DEFAULT_HTTP_HEADER_ACCEPT);
      expect(headers.get(DEFAULT_APP_TOKEN_NAME)).toBe(state.appToken.value);
      expect(headers.get(DEFAULT_ACCESS_TOKEN_NAME)).toBe(state.accessToken.value);
      const data = cfg.data;
      expect(data).toBe('{"id":12345678901234567890,"name":"John"}');
      return [401, error];  // 模拟登录错误响应
    });
    http.post('/data', params).catch((page) => {
      expect(spy).toHaveBeenCalledOnce();
      spy.mockRestore();
      expect(page).toBe('Login');
      expect(state.confirmImpl.type).toBe('info');
      expect(state.confirmImpl.title).toBe('是否重新登录');
      expect(state.confirmImpl.message).toBe('您尚未登录或者已经登出，请选择重新登录，或者选择“放弃”停留在本页面');
      expect(state.confirmImpl.okLabel).toBe('重新登录');
      expect(state.confirmImpl.cancelLabel).toBe('放弃');
      expect(state.resetAccessToken).toHaveBeenCalled();
      expect(state.accessToken.value).toBe('');
      expect(state.getRouter).toHaveBeenCalled();
      expect(state.pushRouter).toHaveBeenCalled();
      expect(state.router.name).toBe('Login');
    });
  });

  it('should handle LOGIN_REQUIRED error, skipAutoErrorHandling is set', async () => {
    const params = { id: 12345678901234567890n, name: 'John' };
    const error = {
      type: 'AUTHENTICATION_ERROR',
      code: 'LOGIN_REQUIRED',
    };
    const spy = jest.spyOn(confirm, 'show');
    mock.onPost('/data').reply((cfg) => {
      const headers = cfg.headers;
      expect(headers.get('Content-Type')).toBe(DEFAULT_HTTP_HEADER_CONTENT_TYPE);
      expect(headers.get('Accept')).toBe(DEFAULT_HTTP_HEADER_ACCEPT);
      expect(headers.get(DEFAULT_APP_TOKEN_NAME)).toBe(state.appToken.value);
      expect(headers.get(DEFAULT_ACCESS_TOKEN_NAME)).toBe(state.accessToken.value);
      const data = cfg.data;
      expect(data).toBe('{"id":12345678901234567890,"name":"John"}');
      return [401, error];  // 模拟登录错误响应
    });
    try {
      await http.post('/data', params, { skipAutoErrorHandling: true });
    } catch (e) {
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
      expect(e).toEqual(error);
    }
  });

  it('should handle app SESSION_EXPIRED error', async () => {
    const params = { id: 12345678901234567890n, name: 'John' };
    const error = {
      type: 'AUTHENTICATION_ERROR',
      code: 'SESSION_EXPIRED',
      params: [{
        key: 'entity',
        value: 'app',
      }],
      message: '应用的会话已过期',
    };
    mock.onPost('/data').reply((cfg) => {
      const headers = cfg.headers;
      expect(headers.get('Content-Type')).toBe(DEFAULT_HTTP_HEADER_CONTENT_TYPE);
      expect(headers.get('Accept')).toBe(DEFAULT_HTTP_HEADER_ACCEPT);
      expect(headers.get(DEFAULT_APP_TOKEN_NAME)).toBe(state.appToken.value);
      expect(headers.get(DEFAULT_ACCESS_TOKEN_NAME)).toBe(state.accessToken.value);
      const data = cfg.data;
      expect(data).toBe('{"id":12345678901234567890,"name":"John"}');
      return [401, error];  // 模拟登录错误响应
    });
    const spy = jest.spyOn(alert, 'show');
    try {
      await http.post('/data', params);
    } catch (e) {
      expect(spy).toHaveBeenCalledOnce();
      spy.mockRestore();
      expect(e).toEqual(error);
      expect(state.alertImpl.type).toBe('error');
      expect(state.alertImpl.title).toBe('错误');
      expect(state.alertImpl.message).toBe('应用会话已过期，请与管理员联系');
      expect(state.resetAccessToken).not.toHaveBeenCalled();
      expect(state.getRouter).not.toHaveBeenCalled();
      expect(state.pushRouter).not.toHaveBeenCalled();
    }
  });

  it('should handle app SESSION_EXPIRED error, skipAutoErrorHandling is set', async () => {
    const params = { id: 12345678901234567890n, name: 'John' };
    const error = {
      type: 'AUTHENTICATION_ERROR',
      code: 'SESSION_EXPIRED',
      params: [{
        key: 'entity',
        value: 'app',
      }],
      message: '应用的会话已过期',
    };
    mock.onPost('/data').reply((cfg) => {
      const headers = cfg.headers;
      expect(headers.get('Content-Type')).toBe(DEFAULT_HTTP_HEADER_CONTENT_TYPE);
      expect(headers.get('Accept')).toBe(DEFAULT_HTTP_HEADER_ACCEPT);
      expect(headers.get(DEFAULT_APP_TOKEN_NAME)).toBe(state.appToken.value);
      expect(headers.get(DEFAULT_ACCESS_TOKEN_NAME)).toBe(state.accessToken.value);
      const data = cfg.data;
      expect(data).toBe('{"id":12345678901234567890,"name":"John"}');
      return [401, error];  // 模拟登录错误响应
    });
    const spy = jest.spyOn(alert, 'show');
    try {
      await http.post('/data', params, { skipAutoErrorHandling: true });
    } catch (e) {
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
      expect(e).toEqual(error);
    }
  });

  it('should handle user SESSION_EXPIRED error', async () => {
    const params = { id: 12345678901234567890n, name: 'John' };
    const error = {
      type: 'AUTHENTICATION_ERROR',
      code: 'SESSION_EXPIRED',
      params: [{
        key: 'entity',
        value: 'user',
      }],
      message: '用户的会话已过期',
    };
    mock.onPost('/data').reply((cfg) => {
      const headers = cfg.headers;
      expect(headers.get('Content-Type')).toBe(DEFAULT_HTTP_HEADER_CONTENT_TYPE);
      expect(headers.get('Accept')).toBe(DEFAULT_HTTP_HEADER_ACCEPT);
      expect(headers.get(DEFAULT_APP_TOKEN_NAME)).toBe(state.appToken.value);
      expect(headers.get(DEFAULT_ACCESS_TOKEN_NAME)).toBe(state.accessToken.value);
      const data = cfg.data;
      expect(data).toBe('{"id":12345678901234567890,"name":"John"}');
      return [401, error];  // 模拟登录错误响应
    });
    const spy = jest.spyOn(alert, 'show');
    try {
      await http.post('/data', params);
    } catch (e) {
      expect(spy).toHaveBeenCalledOnce();
      spy.mockRestore();
      expect(e).toEqual(error);
      expect(state.alertImpl.type).toBe('error');
      expect(state.alertImpl.title).toBe('错误');
      expect(state.alertImpl.message).toBe('用户的会话已过期，请与管理员联系');
      expect(state.resetAccessToken).not.toHaveBeenCalled();
      expect(state.getRouter).not.toHaveBeenCalled();
      expect(state.pushRouter).not.toHaveBeenCalled();
    }
  });

  it('should handle user SESSION_EXPIRED error, skipAutoErrorHandling is set', async () => {
    const params = { id: 12345678901234567890n, name: 'John' };
    const error = {
      type: 'AUTHENTICATION_ERROR',
      code: 'SESSION_EXPIRED',
      params: [{
        key: 'entity',
        value: 'user',
      }],
      message: '用户的会话已过期',
    };
    mock.onPost('/data').reply((cfg) => {
      const headers = cfg.headers;
      expect(headers.get('Content-Type')).toBe(DEFAULT_HTTP_HEADER_CONTENT_TYPE);
      expect(headers.get('Accept')).toBe(DEFAULT_HTTP_HEADER_ACCEPT);
      expect(headers.get(DEFAULT_APP_TOKEN_NAME)).toBe(state.appToken.value);
      expect(headers.get(DEFAULT_ACCESS_TOKEN_NAME)).toBe(state.accessToken.value);
      const data = cfg.data;
      expect(data).toBe('{"id":12345678901234567890,"name":"John"}');
      return [401, error];  // 模拟登录错误响应
    });
    const spy = jest.spyOn(alert, 'show');
    try {
      await http.post('/data', params, { skipAutoErrorHandling: true });
    } catch (e) {
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
      expect(e).toEqual(error);
    }
  });

  it('should handle unknown SESSION_EXPIRED error', async () => {
    const params = { id: 12345678901234567890n, name: 'John' };
    const error = {
      type: 'AUTHENTICATION_ERROR',
      code: 'SESSION_EXPIRED',
      params: [{
        key: 'entity',
        value: 'unknown',
      }],
      message: '未知错误的消息',
    };
    mock.onPost('/data').reply((cfg) => {
      const headers = cfg.headers;
      expect(headers.get('Content-Type')).toBe(DEFAULT_HTTP_HEADER_CONTENT_TYPE);
      expect(headers.get('Accept')).toBe(DEFAULT_HTTP_HEADER_ACCEPT);
      expect(headers.get(DEFAULT_APP_TOKEN_NAME)).toBe(state.appToken.value);
      expect(headers.get(DEFAULT_ACCESS_TOKEN_NAME)).toBe(state.accessToken.value);
      const data = cfg.data;
      expect(data).toBe('{"id":12345678901234567890,"name":"John"}');
      return [401, error];  // 模拟登录错误响应
    });
    const spy = jest.spyOn(alert, 'show');
    try {
      await http.post('/data', params);
    } catch (e) {
      expect(spy).toHaveBeenCalledOnce();
      spy.mockRestore();
      expect(e).toEqual(error);
      expect(state.alertImpl.type).toBe('error');
      expect(state.alertImpl.title).toBe('错误');
      expect(state.alertImpl.message)
        .toBe(`未知错误的消息：请与管理员联系<br><br>错误参数为：${Json.stringify(e.params)}`);
      expect(state.resetAccessToken).not.toHaveBeenCalled();
      expect(state.getRouter).not.toHaveBeenCalled();
      expect(state.pushRouter).not.toHaveBeenCalled();
    }
  });

  it('should handle unknown SESSION_EXPIRED error, skipAutoErrorHandling is set', async () => {
    const params = { id: 12345678901234567890n, name: 'John' };
    const error = {
      type: 'AUTHENTICATION_ERROR',
      code: 'SESSION_EXPIRED',
      params: [{
        key: 'entity',
        value: 'unknown',
      }],
      message: '未知错误的消息',
    };
    mock.onPost('/data').reply((cfg) => {
      const headers = cfg.headers;
      expect(headers.get('Content-Type')).toBe(DEFAULT_HTTP_HEADER_CONTENT_TYPE);
      expect(headers.get('Accept')).toBe(DEFAULT_HTTP_HEADER_ACCEPT);
      expect(headers.get(DEFAULT_APP_TOKEN_NAME)).toBe(state.appToken.value);
      expect(headers.get(DEFAULT_ACCESS_TOKEN_NAME)).toBe(state.accessToken.value);
      const data = cfg.data;
      expect(data).toBe('{"id":12345678901234567890,"name":"John"}');
      return [401, error];  // 模拟登录错误响应
    });
    const spy = jest.spyOn(alert, 'show');
    try {
      await http.post('/data', params, { skipAutoErrorHandling: true });
    } catch (e) {
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
      expect(e).toEqual(error);
    }
  });

  it('should handle app INVALID_TOKEN error', async () => {
    const params = { id: 12345678901234567890n, name: 'John' };
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
    mock.onPost('/data').reply((cfg) => {
      const headers = cfg.headers;
      expect(headers.get('Content-Type')).toBe(DEFAULT_HTTP_HEADER_CONTENT_TYPE);
      expect(headers.get('Accept')).toBe(DEFAULT_HTTP_HEADER_ACCEPT);
      expect(headers.get(DEFAULT_APP_TOKEN_NAME)).toBe(state.appToken.value);
      expect(headers.get(DEFAULT_ACCESS_TOKEN_NAME)).toBe(state.accessToken.value);
      const data = cfg.data;
      expect(data).toBe('{"id":12345678901234567890,"name":"John"}');
      return [401, error];  // 模拟登录错误响应
    });
    const spy = jest.spyOn(alert, 'show');
    try {
      await http.post('/data', params);
    } catch (e) {
      expect(spy).toHaveBeenCalledOnce();
      spy.mockRestore();
      expect(e).toEqual(error);
      expect(state.alertImpl.type).toBe('error');
      expect(state.alertImpl.title).toBe('错误');
      expect(state.alertImpl.message).toBe('应用令牌错误，请与管理员联系');
      expect(state.resetAccessToken).not.toHaveBeenCalled();
      expect(state.getRouter).not.toHaveBeenCalled();
      expect(state.pushRouter).not.toHaveBeenCalled();
    }
  });

  it('should handle app INVALID_TOKEN error, skipAutoErrorHandling is set', async () => {
    const params = { id: 12345678901234567890n, name: 'John' };
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
    mock.onPost('/data').reply((cfg) => {
      const headers = cfg.headers;
      expect(headers.get('Content-Type')).toBe(DEFAULT_HTTP_HEADER_CONTENT_TYPE);
      expect(headers.get('Accept')).toBe(DEFAULT_HTTP_HEADER_ACCEPT);
      expect(headers.get(DEFAULT_APP_TOKEN_NAME)).toBe(state.appToken.value);
      expect(headers.get(DEFAULT_ACCESS_TOKEN_NAME)).toBe(state.accessToken.value);
      const data = cfg.data;
      expect(data).toBe('{"id":12345678901234567890,"name":"John"}');
      return [401, error];  // 模拟登录错误响应
    });
    const spy = jest.spyOn(alert, 'show');
    try {
      await http.post('/data', params, { skipAutoErrorHandling: true });
    } catch (e) {
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
      expect(e).toEqual(error);
    }
  });

  it('should handle user INVALID_TOKEN error', async () => {
    const params = { id: 12345678901234567890n, name: 'John' };
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
    mock.onPost('/data').reply((cfg) => {
      const headers = cfg.headers;
      expect(headers.get('Content-Type')).toBe(DEFAULT_HTTP_HEADER_CONTENT_TYPE);
      expect(headers.get('Accept')).toBe(DEFAULT_HTTP_HEADER_ACCEPT);
      expect(headers.get(DEFAULT_APP_TOKEN_NAME)).toBe(state.appToken.value);
      expect(headers.get(DEFAULT_ACCESS_TOKEN_NAME)).toBe(state.accessToken.value);
      const data = cfg.data;
      expect(data).toBe('{"id":12345678901234567890,"name":"John"}');
      return [401, error];  // 模拟登录错误响应
    });
    const spy = jest.spyOn(confirm, 'show');
    http.post('/data', params).catch((page) => {
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
  });

  it('should handle user INVALID_TOKEN error, skipAutoErrorHandling is set', async () => {
    const params = { id: 12345678901234567890n, name: 'John' };
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
    mock.onPost('/data').reply((cfg) => {
      const headers = cfg.headers;
      expect(headers.get('Content-Type')).toBe(DEFAULT_HTTP_HEADER_CONTENT_TYPE);
      expect(headers.get('Accept')).toBe(DEFAULT_HTTP_HEADER_ACCEPT);
      expect(headers.get(DEFAULT_APP_TOKEN_NAME)).toBe(state.appToken.value);
      expect(headers.get(DEFAULT_ACCESS_TOKEN_NAME)).toBe(state.accessToken.value);
      const data = cfg.data;
      expect(data).toBe('{"id":12345678901234567890,"name":"John"}');
      return [401, error];  // 模拟登录错误响应
    });
    const spy = jest.spyOn(confirm, 'show');
    try {
      await http.post('/data', params, { skipAutoErrorHandling: true });
    } catch (e) {
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
      expect(e).toEqual(error);
    }
  });

  it('should handle unknown INVALID_TOKEN error', async () => {
    const params = { id: 12345678901234567890n, name: 'John' };
    const error = {
      type: 'AUTHENTICATION_ERROR',
      code: 'INVALID_TOKEN',
      params: [{
        key: 'entity',
        value: 'unknown',
      }],
      message: '未知错误的消息',
    };
    mock.onPost('/data').reply((cfg) => {
      const headers = cfg.headers;
      expect(headers.get('Content-Type')).toBe(DEFAULT_HTTP_HEADER_CONTENT_TYPE);
      expect(headers.get('Accept')).toBe(DEFAULT_HTTP_HEADER_ACCEPT);
      expect(headers.get(DEFAULT_APP_TOKEN_NAME)).toBe(state.appToken.value);
      expect(headers.get(DEFAULT_ACCESS_TOKEN_NAME)).toBe(state.accessToken.value);
      const data = cfg.data;
      expect(data).toBe('{"id":12345678901234567890,"name":"John"}');
      return [401, error];  // 模拟登录错误响应
    });
    const spy = jest.spyOn(alert, 'show');
    try {
      await http.post('/data', params);
    } catch (e) {
      expect(spy).toHaveBeenCalledOnce();
      spy.mockRestore();
      expect(e).toEqual(error);
      expect(state.alertImpl.type).toBe('error');
      expect(state.alertImpl.title).toBe('错误');
      expect(state.alertImpl.message)
        .toBe(`未知错误的消息：请与管理员联系<br><br>错误参数为：${Json.stringify(e.params)}`);
      expect(state.resetAccessToken).not.toHaveBeenCalled();
      expect(state.getRouter).not.toHaveBeenCalled();
      expect(state.pushRouter).not.toHaveBeenCalled();
    }
  });

  it('should handle unknown INVALID_TOKEN error, skipAutoErrorHandling is set', async () => {
    const params = { id: 12345678901234567890n, name: 'John' };
    const error = {
      type: 'AUTHENTICATION_ERROR',
      code: 'INVALID_TOKEN',
      params: [{
        key: 'entity',
        value: 'unknown',
      }],
      message: '未知错误的消息',
    };
    mock.onPost('/data').reply((cfg) => {
      const headers = cfg.headers;
      expect(headers.get('Content-Type')).toBe(DEFAULT_HTTP_HEADER_CONTENT_TYPE);
      expect(headers.get('Accept')).toBe(DEFAULT_HTTP_HEADER_ACCEPT);
      expect(headers.get(DEFAULT_APP_TOKEN_NAME)).toBe(state.appToken.value);
      expect(headers.get(DEFAULT_ACCESS_TOKEN_NAME)).toBe(state.accessToken.value);
      const data = cfg.data;
      expect(data).toBe('{"id":12345678901234567890,"name":"John"}');
      return [401, error];  // 模拟登录错误响应
    });
    const spy = jest.spyOn(alert, 'show');
    try {
      await http.post('/data', params, { skipAutoErrorHandling: true });
    } catch (e) {
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
      expect(e).toEqual(error);
    }
  });

  it('should handle unknown APP_AUTHENTICATION_REQUIRED error', async () => {
    const params = { id: 12345678901234567890n, name: 'John' };
    const error = {
      type: 'AUTHENTICATION_ERROR',
      code: 'APP_AUTHENTICATION_REQUIRED',
      message: '当前应用未认证或令牌已过期，请重新认证',
    };
    mock.onPost('/data').reply((cfg) => {
      const headers = cfg.headers;
      expect(headers.get('Content-Type')).toBe(DEFAULT_HTTP_HEADER_CONTENT_TYPE);
      expect(headers.get('Accept')).toBe(DEFAULT_HTTP_HEADER_ACCEPT);
      expect(headers.get(DEFAULT_APP_TOKEN_NAME)).toBe(state.appToken.value);
      expect(headers.get(DEFAULT_ACCESS_TOKEN_NAME)).toBe(state.accessToken.value);
      const data = cfg.data;
      expect(data).toBe('{"id":12345678901234567890,"name":"John"}');
      return [401, error];  // 模拟登录错误响应
    });
    const spy = jest.spyOn(alert, 'show');
    try {
      await http.post('/data', params);
    } catch (e) {
      expect(spy).toHaveBeenCalledOnce();
      spy.mockRestore();
      expect(e).toEqual(error);
      expect(state.alertImpl.type).toBe('error');
      expect(state.alertImpl.title).toBe('错误');
      expect(state.alertImpl.message).toBe('当前应用未认证或令牌已过期，请与管理员联系');
      expect(state.resetAccessToken).not.toHaveBeenCalled();
      expect(state.getRouter).not.toHaveBeenCalled();
      expect(state.pushRouter).not.toHaveBeenCalled();
    }
  });

  it('should handle unknown APP_AUTHENTICATION_REQUIRED error, skipAutoErrorHandling is set', async () => {
    const params = { id: 12345678901234567890n, name: 'John' };
    const error = {
      type: 'AUTHENTICATION_ERROR',
      code: 'APP_AUTHENTICATION_REQUIRED',
      message: '当前应用未认证或令牌已过期，请重新认证',
    };
    mock.onPost('/data').reply((cfg) => {
      const headers = cfg.headers;
      expect(headers.get('Content-Type')).toBe(DEFAULT_HTTP_HEADER_CONTENT_TYPE);
      expect(headers.get('Accept')).toBe(DEFAULT_HTTP_HEADER_ACCEPT);
      expect(headers.get(DEFAULT_APP_TOKEN_NAME)).toBe(state.appToken.value);
      expect(headers.get(DEFAULT_ACCESS_TOKEN_NAME)).toBe(state.accessToken.value);
      const data = cfg.data;
      expect(data).toBe('{"id":12345678901234567890,"name":"John"}');
      return [401, error];  // 模拟登录错误响应
    });
    const spy = jest.spyOn(alert, 'show');
    try {
      await http.post('/data', params, { skipAutoErrorHandling: true });
    } catch (e) {
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
      expect(e).toEqual(error);
    }
  });

  it('should handle unknown error with message', async () => {
    const params = { id: 12345678901234567890n, name: 'John' };
    const error = {
      type: 'SERVER_ERROR',
      code: 'UNKNOWN_ERROR',
      message: 'Unknown error occurred',
    };
    mock.onPost('/data').reply((cfg) => {
      const headers = cfg.headers;
      expect(headers.get('Content-Type')).toBe(DEFAULT_HTTP_HEADER_CONTENT_TYPE);
      expect(headers.get('Accept')).toBe(DEFAULT_HTTP_HEADER_ACCEPT);
      expect(headers.get(DEFAULT_APP_TOKEN_NAME)).toBe(state.appToken.value);
      expect(headers.get(DEFAULT_ACCESS_TOKEN_NAME)).toBe(state.accessToken.value);
      const data = cfg.data;
      expect(data).toBe('{"id":12345678901234567890,"name":"John"}');
      return [401, error];  // 模拟登录错误响应
    });
    const spy = jest.spyOn(alert, 'show');
    try {
      await http.post('/data', params);
    } catch (e) {
      expect(spy).toHaveBeenCalledOnce();
      spy.mockRestore();
      expect(e).toEqual(error);
      expect(state.alertImpl.type).toBe('error');
      expect(state.alertImpl.title).toBe('错误');
      expect(state.alertImpl.message).toBe('Unknown error occurred：请与管理员联系');
      expect(state.resetAccessToken).not.toHaveBeenCalled();
      expect(state.getRouter).not.toHaveBeenCalled();
      expect(state.pushRouter).not.toHaveBeenCalled();
    }
  });

  it('should handle unknown error with message, skipAutoErrorHandling is set', async () => {
    const params = { id: 12345678901234567890n, name: 'John' };
    const error = {
      type: 'SERVER_ERROR',
      code: 'UNKNOWN_ERROR',
      message: 'Unknown error occurred',
    };
    mock.onPost('/data').reply((cfg) => {
      const headers = cfg.headers;
      expect(headers.get('Content-Type')).toBe(DEFAULT_HTTP_HEADER_CONTENT_TYPE);
      expect(headers.get('Accept')).toBe(DEFAULT_HTTP_HEADER_ACCEPT);
      expect(headers.get(DEFAULT_APP_TOKEN_NAME)).toBe(state.appToken.value);
      expect(headers.get(DEFAULT_ACCESS_TOKEN_NAME)).toBe(state.accessToken.value);
      const data = cfg.data;
      expect(data).toBe('{"id":12345678901234567890,"name":"John"}');
      return [401, error];  // 模拟登录错误响应
    });
    const spy = jest.spyOn(alert, 'show');
    try {
      await http.post('/data', params, { skipAutoErrorHandling: true });
    } catch (e) {
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
      expect(e).toEqual(error);
    }
  });

  it('should handle unknown error without message', async () => {
    const params = { id: 12345678901234567890n, name: 'John' };
    const error = {
      type: 'SERVER_ERROR',
      code: 'UNKNOWN_ERROR',
    };
    mock.onPost('/data').reply((cfg) => {
      const headers = cfg.headers;
      expect(headers.get('Content-Type')).toBe(DEFAULT_HTTP_HEADER_CONTENT_TYPE);
      expect(headers.get('Accept')).toBe(DEFAULT_HTTP_HEADER_ACCEPT);
      expect(headers.get(DEFAULT_APP_TOKEN_NAME)).toBe(state.appToken.value);
      expect(headers.get(DEFAULT_ACCESS_TOKEN_NAME)).toBe(state.accessToken.value);
      const data = cfg.data;
      expect(data).toBe('{"id":12345678901234567890,"name":"John"}');
      return [401, error];  // 模拟登录错误响应
    });
    const spy = jest.spyOn(alert, 'show');
    try {
      await http.post('/data', params);
    } catch (e) {
      expect(spy).toHaveBeenCalledOnce();
      spy.mockRestore();
      expect(e).toEqual(error);
      expect(state.alertImpl.type).toBe('error');
      expect(state.alertImpl.title).toBe('错误');
      expect(state.alertImpl.message).toBe('发生未知错误：请与管理员联系');
      expect(state.resetAccessToken).not.toHaveBeenCalled();
      expect(state.getRouter).not.toHaveBeenCalled();
      expect(state.pushRouter).not.toHaveBeenCalled();
    }
  });

  it('should handle unknown error without message, skipAutoErrorHandling is set', async () => {
    const params = { id: 12345678901234567890n, name: 'John' };
    const error = {
      type: 'SERVER_ERROR',
      code: 'UNKNOWN_ERROR',
    };
    mock.onPost('/data').reply((cfg) => {
      const headers = cfg.headers;
      expect(headers.get('Content-Type')).toBe(DEFAULT_HTTP_HEADER_CONTENT_TYPE);
      expect(headers.get('Accept')).toBe(DEFAULT_HTTP_HEADER_ACCEPT);
      expect(headers.get(DEFAULT_APP_TOKEN_NAME)).toBe(state.appToken.value);
      expect(headers.get(DEFAULT_ACCESS_TOKEN_NAME)).toBe(state.accessToken.value);
      const data = cfg.data;
      expect(data).toBe('{"id":12345678901234567890,"name":"John"}');
      return [401, error];  // 模拟登录错误响应
    });
    const spy = jest.spyOn(alert, 'show');
    try {
      await http.post('/data', params, { skipAutoErrorHandling: true });
    } catch (e) {
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
      expect(e).toEqual(error);
    }
  });
});

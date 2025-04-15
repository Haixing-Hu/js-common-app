////////////////////////////////////////////////////////////////////////////////
//
//    Copyright (c) 2022 - 2024.
//    Haixing Hu, Qubit Co. Ltd.
//
//    All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////
import AxiosMockAdapter from 'axios-mock-adapter';
import { AxiosHeaders } from 'axios';
import Logger from '@qubit-ltd/logging';
import { loading } from '@qubit-ltd/common-ui';
import { http } from '../src';
import HttpImplState from './impl/http-impl-state';

const state = new HttpImplState(http);

const mock = new AxiosMockAdapter(http);

beforeEach(() => {
  state.reset();
  mock.reset();
  jest.clearAllMocks();
  jest.spyOn(loading, 'clear').mockImplementation(() => {});
  if (!window.URL.createObjectURL) {
    window.URL.createObjectURL = jest.fn();
  }
  if (!window.URL.revokeObjectURL) {
    window.URL.revokeObjectURL = jest.fn();
  }
  jest.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:http://example.com/blob');
  jest.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {});
  jest.spyOn(document.body, 'appendChild').mockImplementation(() => {});
  jest.spyOn(document.body, 'removeChild').mockImplementation(() => {});
});

afterAll(() => {
  mock.restore();
  jest.restoreAllMocks();
});

Logger.getLogger('http').setLevel('info');

describe('http.noAutoClearLoading', () => {
  it('should call loading.clear by default on successful response', async () => {
    mock.onGet('/test').reply(200, { success: true });
    
    await http.get('/test');
    
    expect(loading.clear).toHaveBeenCalledTimes(1);
  });

  it('should not call loading.clear if noAutoClearLoading is true on successful response', async () => {
    mock.onGet('/test').reply(200, { success: true });
    
    await http.get('/test', { noAutoClearLoading: true });
    
    expect(loading.clear).not.toHaveBeenCalled();
  });

  it('should call loading.clear on failed response regardless of noAutoClearLoading', async () => {
    mock.onGet('/test').reply(500);
    
    await expect(http.get('/test', { noAutoClearLoading: true })).rejects.not.toThrow();
    
    expect(loading.clear).toHaveBeenCalledTimes(2);
  });

  it('should call loading.clear on successful POST response by default', async () => {
    mock.onPost('/test').reply(200, { success: true });
    
    await http.post('/test', { data: 'test' });
    
    expect(loading.clear).toHaveBeenCalledTimes(1);
  });

  it('should not call loading.clear on successful POST response if noAutoClearLoading is true', async () => {
    mock.onPost('/test').reply(200, { success: true });
    
    await http.post('/test', { data: 'test' }, { noAutoClearLoading: true });
    
    expect(loading.clear).not.toHaveBeenCalled();
  });
});

describe('http.download.noAutoClearLoading', () => {
  const url = '/file';
  const params = { key: 'value' };
  const mimeType = 'application/pdf';
  const contentDisposition = 'attachment; filename="test.pdf"';
  const response = {
    data: new Blob(['file content'], { type: mimeType }),
    headers: {
      'Content-Type': mimeType,
      'Content-Disposition': contentDisposition,
    },
  };

  it('should call loading.clear by default when downloading a file', async () => {
    mock.onGet(url).reply(200, response.data, response.headers);
    
    await http.download(url, params, mimeType, false);
    
    expect(loading.clear).toHaveBeenCalledTimes(1);
  });

  it('should not call loading.clear when downloading a file with noAutoClearLoading option', async () => {
    mock.onGet(url).reply(200, response.data, response.headers);
    
    await http.download(url, params, mimeType, false, null, { noAutoClearLoading: true });
    
    expect(loading.clear).not.toHaveBeenCalled();
  });

  it('should call loading.clear when download fails regardless of noAutoClearLoading', async () => {
    mock.onGet(url).reply(500);
    
    await expect(http.download(url, params, mimeType, false, null, { 
      noAutoClearLoading: true 
    })).rejects.not.toThrow();
    
    expect(loading.clear).toHaveBeenCalledTimes(2);
  });
}); 
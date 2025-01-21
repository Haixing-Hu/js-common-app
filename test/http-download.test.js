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
import { http } from '../src';
import HttpImplState from './impl/http-impl-state';

const state = new HttpImplState(http);

const mock = new AxiosMockAdapter(http);

beforeEach(() => {
  state.reset();
  mock.reset();
  jest.clearAllMocks();
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

describe('http.download', () => {
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

  it('should download the file and return file info', async () => {
    mock.onGet(url).reply((cfg) => {
      expect(cfg.headers.getAccept()).toBe('application/pdf');
      return [200, response.data, response.headers];
    });
    const result = await http.download(url, params, mimeType, true);
    expect(result).toEqual({
      blob: response.data,
      filename: 'test.pdf',
      mimeType,
    });
    expect(window.URL.createObjectURL).toHaveBeenCalledWith(response.data);
    expect(window.URL.revokeObjectURL).toHaveBeenCalled();
    expect(document.body.appendChild).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalled();
  });

  it('should return file info without auto downloading', async () => {
    mock.onGet(url).reply(200, response.data, response.headers);
    const result = await http.download(url, params, mimeType, false);
    expect(result).toEqual({
      blob: response.data,
      filename: 'test.pdf',
      mimeType,
    });
    expect(window.URL.createObjectURL).not.toHaveBeenCalled();
    expect(window.URL.revokeObjectURL).not.toHaveBeenCalled();
    expect(document.body.appendChild).not.toHaveBeenCalled();
    expect(document.body.removeChild).not.toHaveBeenCalled();
  });

  it('should use default filename if Content-Disposition header is missing', async () => {
    const headers = {
      get: jest.fn((header) => {
        if (header === 'Content-Type') return mimeType;
        return null;
      }),
    };
    mock.onGet(url).reply(200, response.data, headers);
    const result = await http.download(url, params, mimeType, false);
    expect(result).toEqual({
      blob: response.data,
      filename: 'downloaded_file',
      mimeType,
    });
  });

  it('should use provided mimeType if Content-Type header is missing', async () => {
    const headers = new AxiosHeaders({
      'Content-Disposition': contentDisposition,
    });
    mock.onGet(url).reply(200, response.data, headers);
    const result = await http.download(url, params, mimeType, false);
    expect(result).toEqual({
      blob: response.data,
      filename: 'test.pdf',
      mimeType,
    });
  });

  it('should use the */* mime type if not provided ', async () => {
    mock.onGet(url).reply((cfg) => {
      expect(cfg.headers.getAccept()).toBe('*/*');
      return [200, response.data, response.headers];
    });
    const result = await http.download(url, params, null, true);
    expect(result).toEqual({
      blob: response.data,
      filename: 'test.pdf',
      mimeType,
    });
    expect(window.URL.createObjectURL).toHaveBeenCalledWith(response.data);
    expect(window.URL.revokeObjectURL).toHaveBeenCalled();
    expect(document.body.appendChild).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalled();
  });

  it('should throw error if request fails', async () => {
    mock.onGet(url).reply(500);
    await expect(http.download(url, params, mimeType, false)).rejects.not.toThrow();
    expect(state.alertImpl.type).toBe('error');
    expect(state.alertImpl.title).toBe('错误');
    expect(state.alertImpl.message).toBe('网络请求发生未知错误: Request failed with status code 500');
  });

  it('should use the specified filename', async () => {
    mock.onGet(url).reply((cfg) => {
      expect(cfg.headers.getAccept()).toBe('*/*');
      return [200, response.data, response.headers];
    });
    const result = await http.download(url, params, null, true, 'foo.pdf');
    expect(result).toEqual({
      blob: response.data,
      filename: 'foo.pdf',
      mimeType,
    });
    expect(window.URL.createObjectURL).toHaveBeenCalledWith(response.data);
    expect(window.URL.revokeObjectURL).toHaveBeenCalled();
    expect(document.body.appendChild).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalled();
  });

  it('should decode the URI encoded filename', async () => {
    const url = '/file';
    const params = { key: 'value' };
    const mimeType = 'application/pdf';
    const contentDisposition = 'attachment; filename*=UTF-8\'\'%E6%B5%99%E6%B1%9F%E4%B9%85%E7%AB%8B%E8%B4%A8%E4%BF%9D%E4%B9%A6.pdf\n';
    const response = {
      data: new Blob(['file content'], { type: mimeType }),
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': contentDisposition,
      },
    };
    mock.onGet(url).reply((cfg) => {
      expect(cfg.headers.getAccept()).toBe('application/pdf');
      return [200, response.data, response.headers];
    });
    const result = await http.download(url, params, mimeType, true);
    console.log(result);
    expect(result).toEqual({
      blob: response.data,
      filename: '浙江久立质保书.pdf',
      mimeType,
    });
    expect(window.URL.createObjectURL).toHaveBeenCalledWith(response.data);
    expect(window.URL.revokeObjectURL).toHaveBeenCalled();
    expect(document.body.appendChild).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalled();
  });
});

////////////////////////////////////////////////////////////////////////////////
//
//    Copyright (c) 2022 - 2024.
//    Haixing Hu, Qubit Co. Ltd.
//
//    All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////
import { AxiosHeaders } from 'axios';
import { Json } from '@qubit-ltd/json';
import { Logger, Log } from '@qubit-ltd/logging';
import config from '@qubit-ltd/config';
import { isString } from '@qubit-ltd/type-detect';
import { loading, alert, confirm } from '@qubit-ltd/common-ui';
import extractContentDispositionFilename
  from './extract-content-disposition-filename';

/**
 * 默认的 HTTP 请求头的 Content-Type 键值。
 *
 * @type {string}
 */
const DEFAULT_HTTP_HEADER_CONTENT_TYPE = 'application/json;charset=UTF-8';

/**
 * 默认的 HTTP 请求头的 Accept 键值。
 *
 * @type {string}
 */
const DEFAULT_HTTP_HEADER_ACCEPT = 'application/json;charset=UTF-8';

/**
 * 默认的 HTTP 请求超时时间，单位为毫秒。
 *
 * @type {number}
 */
const DEFAULT_HTTP_TIMEOUT = 60000;

/**
 * 默认的 App Token 的键名。
 *
 * @type {string}
 */
const DEFAULT_APP_TOKEN_NAME = 'X-Auth-App-Token';

/**
 * 默认的 Access Token 的键名。
 *
 * @type {string}
 */
const DEFAULT_ACCESS_TOKEN_NAME = 'X-Auth-User-Token';

/**
 * 默认的用户登录页面的路由名称。
 *
 * @type {string}
 */
const DEFAULT_LOGIN_PAGE = 'Login';

/**
 * JSON 内容类型的前缀。
 *
 * @type {string}
 */
const JSON_CONTENT_TYPE_PREFIX = 'application/json';

/**
 * 此模块使用的全局 logger。
 *
 * @type {Logger}
 * @private
 * @author 胡海星
 */
const logger = Logger.getLogger('http');

/**
 * The implementation of the `http` object.
 *
 * @author Haixing Hu
 */
class HttpImpl {
  /**
   * 设置所有HTTP请求头。
   *
   * @param {Axios} http
   *     待配置的 axios 对象。
   * @param {object} cfg
   *     axios HTTP请求的配置对象，此函数会修改该配置对象内部的属性。
   * @returns
   *     修改后的配置对象。
   * @private
   * @author 胡海星
   */
  @Log
  fixRequestHeader(http, cfg) {
    logger.debug('HTTP headers before fixing:', cfg.headers);
    // 设置所有HTTP请求头默认的 Content-Type 和 Accept 键值
    const defaultHeaders = {
      'Content-Type': config.get('http_header_content_type', DEFAULT_HTTP_HEADER_CONTENT_TYPE),
      'Accept': config.get('http_header_accept', DEFAULT_HTTP_HEADER_ACCEPT),
    };
    // 所有 HTTP 请求头默认带上 App Token 键值
    const appTokenName = config.get('app_token_name', DEFAULT_APP_TOKEN_NAME);
    const appTokenValue = config.get('app_token_value');
    if (appTokenValue) {
      logger.debug('Add App Token to HTTP headers:', appTokenName, '=', appTokenValue);
      defaultHeaders[appTokenName] = appTokenValue;
    }
    // 所有 HTTP 请求头默认带上 Access Token 键值
    const accessTokenName = config.get('access_token_name', DEFAULT_ACCESS_TOKEN_NAME);
    if (typeof http.getAccessToken === 'function') {
      const accessToken = http.getAccessToken();
      logger.debug('Get the access Token:', accessToken);
      if (accessToken?.value) {
        logger.debug('Add Access Token to HTTP headers:', accessTokenName, '=', accessToken.value);
        defaultHeaders[accessTokenName] = accessToken.value;
      }
    } else {
      logger.warn('未设置`http.getAccessToken`方法，必须调用`http.getAccessToken = function() {...}`进行设置');
    }
    // 合并配置对象的请求头和上面设置的默认请求头，使用 AxiosHeaders 避免大小写问题
    const cfgHeaders = new AxiosHeaders(cfg.headers ?? {});    // 注意：cfg.headers 可能为 null 或 undefined
    for (const key of Object.keys(defaultHeaders)) {
      // 如果配置对象的请求头没有设置，则使用上面设置的默认请求头; 否则保留配置对象的请求头
      if (!cfgHeaders.has(key)) {
        cfgHeaders.set(key, defaultHeaders[key]);
      }
    }
    cfg.headers = cfgHeaders.toJSON();
    logger.debug('HTTP headers after fixing:', cfg.headers);
    return cfg;
  }

  /**
   * 修改所有HTTP GET请求的参数，加上当前时间戳和随机数，防止浏览器缓存。
   *
   * @param {Axios} http
   *     待配置的 axios 对象。
   * @param {object} cfg
   *     axios HTTP请求的配置对象，此函数会修改该配置对象内部的属性。
   * @returns
   *     修改后的配置对象。
   * @private
   * @author 胡海星
   */
  @Log
  fixGetRequestParams(http, cfg) {
    if (cfg.method === 'get') {
      logger.debug('HTTP GET parameters before fixing:', cfg.params);
      const params = {
        _t: new Date().getTime(),   // 加上当前时间戳
        _r: Math.random(),          // 再加上一个随机数
      };
      cfg.params = { ...params, ...cfg.params };
      logger.debug('HTTP GET parameters before fixing:', cfg.params);
    }
    return cfg;
  }

  /**
   * 检查此HTTP对象是否配置完整。
   *
   * @param {Axios} http
   *     待配置的 axios 对象。
   * @private
   * @author 胡海星
   */
  @Log
  validateConfig(http) {
    if (!loading.getImpl()) {
      throw new Error('未设置`Loading`类的具体实现对象，必须调用`loading.setImpl()`方法设置');
    }
    if (!alert.getImpl()) {
      throw new Error('未设置`Alert`类的具体实现对象，必须调用`alert.setImpl()`方法设置');
    }
    if (!confirm.getImpl()) {
      throw new Error('未设置`Confirm`类的具体实现对象，必须调用`confirm.setImpl()`方法设置');
    }
    if (typeof http.getAccessToken !== 'function') {
      throw new Error('未设置`http.getAccessToken`方法，必须调用`http.getAccessToken = function() {...}`进行设置');
    }
    if (typeof http.resetAccessToken !== 'function') {
      throw new Error('未设置`http.resetAccessToken`方法，必须调用`http.resetAccessToken = function() {...}`进行设置');
    }
    if (typeof http.getRouter !== 'function') {
      throw new Error('未设置`http.getRouter`方法，必须调用`http.getRouter = function() {...}`进行设置');
    }
    if (!config.has('http_header_content_type')) {
      logger.info(`未设置\`http_header_content_type\`配置，将设置为默认值：'${DEFAULT_HTTP_HEADER_CONTENT_TYPE}'.`
        + '可调用`config.set("http_header_content_type", contentType)`进行设置');
      config.set('http_header_content_type', DEFAULT_HTTP_HEADER_CONTENT_TYPE);
    }
    if (!config.has('http_header_accept')) {
      logger.info(`未设置\`http_header_accept\`配置，将设置为默认值：'${DEFAULT_HTTP_HEADER_ACCEPT}'.`
        + '可调用`config.set("http_header_accept", accept)`进行设置');
      config.set('http_header_accept', DEFAULT_HTTP_HEADER_ACCEPT);
    }
    if (!config.has('http_timeout')) {
      logger.info(`未设置\`http_timeout\`配置，将设置为默认值：${DEFAULT_HTTP_TIMEOUT}.`
        + '可调用`config.set("http_timeout", timeout)`进行设置');
      config.set('http_timeout', DEFAULT_HTTP_TIMEOUT);
    }
    if (!config.has('app_token_name')) {
      logger.info(`未设置\`app_token_name\`配置，将设置为默认值：'${DEFAULT_APP_TOKEN_NAME}'.`
        + '可调用`config.set("app_token_name", name)`进行设置');
      config.set('app_token_name', DEFAULT_APP_TOKEN_NAME);
    }
    if (!config.has('access_token_name')) {
      logger.info(`未设置\`access_token_name\`配置，将设置为默认值：'${DEFAULT_ACCESS_TOKEN_NAME}'.`
        + '可调用`config.set("access_token_name", name)`进行设置');
      config.set('access_token_name', DEFAULT_ACCESS_TOKEN_NAME);
    }
    if (!config.has('api_base_url')) {
      throw new Error('未设置`api_base_url`配置参数，必须调用`config.set("api_base_url", url)`进行设置');
    }
    if (!config.has('app_token_value')) {
      throw new Error('未设置`app_token_value`配置参数，必须调用`config.set("app_token_value", value)`进行设置');
    }
    if (!config.has('login_page')) {
      logger.info(`未设置\`login_page\`配置，将设置为默认值：'${DEFAULT_LOGIN_PAGE}'.`
        + '可调用`config.set("login_page", loginPage)`进行设置');
      config.set('login_page', DEFAULT_LOGIN_PAGE);
    }
    return true;
  }

  /**
   * 转换请求数据。
   *
   * @param {object} data
   *     待转换的请求数据。
   * @param {AxiosHeaders} headers
   *     请求头。
   * @return {any}
   *     转换后的请求数据。
   * @private
   * @author 胡海星
   */
  @Log
  transformRequestData(data, headers) {
    // 注意：headers 是一个 AxiosHeaders 对象，必须用 get 方法获取值，不能直接用下标，否则大小写不同的键名会被认为是不同的键
    const contentType = headers.get('Content-Type');
    if (data && contentType?.startsWith(JSON_CONTENT_TYPE_PREFIX)) {
      return Json.stringify(data);         // 使用自定义的JSON Stringifier重新序列化请求数据
    }
    return data;
  }

  /**
   * 转换响应数据。
   *
   * @param {any} data
   *     待转换的响应数据。
   * @param {AxiosHeaders} headers
   *     响应头。
   * @return {any}
   *     转换后的响应数据。
   * @private
   * @author 胡海星
   */
  @Log
  transformResponseData(data, headers) {
    // 注意：headers 是一个 AxiosHeaders 对象，必须用 get 方法获取值，不能直接用下标，否则大小写不同的键名会被认为是不同的键
    const contentType = headers.get('Content-Type');
    if (isString(data)) {
      if (data.length === 0) {
        return null;
      }
      if (contentType?.startsWith(JSON_CONTENT_TYPE_PREFIX)) {
        // 使用自定义的JSON Parser重新解析响应数据为 JSON 对象，从而提供对64位整数的支持
        return Json.parse(data);
      }
    }
    return data;
  }

  /**
   * 配置数据转换器。
   *
   * @param {Axios} http
   *     待配置的 axios 对象。
   * @param {object} cfg
   *     axios HTTP请求的配置对象，此函数会修改该配置对象内部的属性。
   * @return {object}
   *     修改后的配置对象。
   */
  @Log
  fixDataTransformers(http, cfg) {
    cfg.transformRequest = [
      this.transformRequestData,
      ...(cfg.transformRequest ?? []),
    ];
    cfg.transformResponse = [
      this.transformResponseData,
      ...(cfg.transformResponse ?? []),
    ];
    return cfg;
  }

  /**
   * 请求配置拦截器。
   *
   * @param {Axios} http
   *     待配置的 axios 对象。
   * @param {object} cfg
   *     axios HTTP请求的配置对象，此函数会修改该配置对象内部的属性。
   * @return {object}
   *     修改后的配置对象。
   */
  @Log
  requestConfigInterceptor(http, cfg) {
    this.validateConfig(http);  // 检查HTTP对象是否配置完整
    logger.debug('Axios request configuration before fixing:', cfg);
    cfg.baseURL = config.get('api_base_url');
    cfg.timeout = config.get('http_timeout', DEFAULT_HTTP_TIMEOUT);
    this.fixRequestHeader(http, cfg);
    this.fixGetRequestParams(http, cfg);
    this.fixDataTransformers(http, cfg);
    logger.debug('Axios request configuration after fixing:', cfg);
    return cfg;
  }

  /**
   * 响应拦截器。
   *
   * @param {Axios} http
   *     待配置的 axios 对象。
   * @param {object} response
   *     HTTP响应对象。
   * @return {object}
   *     HTTP响应中解析出的JSON对象（即`response.data`），或者响应对象。当且仅当
   *     `response.config.returnResponse`为`true`时，返回响应对象。
   */
  @Log
  responseSuccessInterceptor(http, response) {
    loading.clear();  // 清除载入提示遮盖层
    logger.debug('Request success: response =', response);
    if (response.config?.returnResponse === true) {
      // 如果请求配置中设置了 returnResponse 为 true，则返回响应对象；注意此时
      // response.data 已经被 transformResponse 中注册的函数转换过了
      return response;
    } else {
      // 对于其他成功响应，直接返回响应体的数据；
      // 该数据应该已被在 transformResponse 中注册的函数转换过了
      return response.data ?? null;
    }
  }

  /**
   * 让用户确认是否重新登录。
   *
   * @param {Axios} http
   *     待配置的 axios 对象。
   * @return {Promise}
   *     一个Promise对象，表示用户的选择，如果用户选择重新登录，则返回一个resolve的Promise对象，
   *     否则返回一个reject的Promise对象，表示用户放弃重新登录。
   * @private
   * @author 胡海星
   */
  @Log
  confirmLogin(http) {
    return confirm.info(
      '是否重新登录',
      '您尚未登录或者已经登出，请选择重新登录，或者选择“放弃”停留在本页面',
      '重新登录',
      '放弃',
    ).then(() => {
      http.resetAccessToken();
      if (typeof http.getRouter !== 'function') {
        throw new Error('未设置`http.getRouter`方法，必须调用`http.getRouter = function() {...}`进行设置');
      }
      // FIXME: 这里重复用了代码，是否需要抽象出一个公共方法？参见 basic-user-store.js
      const router = http.getRouter();
      if (typeof router?.push !== 'function') {
        throw new Error('`http.getRouter`方法的返回值不是一个`VueRouter`对象，无法调用`push`方法');
      }
      const loginPage = config.get('login_page', DEFAULT_LOGIN_PAGE);
      logger.info('Redirect to user login page:', loginPage);
      return router.push({ name: loginPage });
    });
  }

  /**
   * 处理未知错误。
   *
   * @param {object} error
   *     服务器返回的错误信息对象。
   * @return {Promise}
   *     一个reject的Promise对象，表示处理失败。
   * @private
   * @author 胡海星
   */
  @Log
  handleUnknownError(error) {
    const line1 = error.message ? `${error.message}：请与管理员联系` : '发生未知错误：请与管理员联系';
    const line2 = error.params ? `<br><br>错误参数为：${Json.stringify(error.params)}` : '';
    return alert.error('错误', `${line1}${line2}`).then(() => Promise.reject(error));
  }

  /**
   * 处理已知错误。
   *
   * @param {object} error
   *     服务器返回的错误信息对象。
   * @return {Promise}
   *     一个reject的Promise对象，表示处理失败。
   * @private
   * @author 胡海星
   */
  @Log
  handleKnownError(error) {
    const message = error.message ? `${error.message}` : '发生未知错误：请与管理员联系';
    return alert.error('错误', message).then(() => Promise.reject(error));
  }

  /**
   * 处理请求错误。
   *
   * @param {Axios} http
   *     待配置的 axios 对象。
   * @param {object} error
   *     服务器返回的错误信息对象。
   * @return {Promise}
   *     一个Promise对象，表示处理错误的结果，如果处理成功，则返回一个resolve的Promise对象，
   *     否则返回一个reject的Promise对象，表示处理失败。
   * @private
   * @author 胡海星
   */
  @Log
  handleResponseError(http, error) {
    logger.debug('Handle request error:', error);
    switch (error.code) {
      case 'LOGIN_REQUIRED':                // 对于未授权错误，询问用户是否愿意重新登录
        return this.confirmLogin(http);
      case 'SESSION_EXPIRED':               // 对于已过期会话，要求用户重新登录
        if (error.params && error.params[0]?.value === 'app') {
          return alert.error('错误', '应用会话已过期，请与管理员联系')
            .then(() => Promise.reject(error));
        } else if (error.params && error.params[0]?.value === 'user') {
          return this.confirmLogin(http);
        } else {
          return this.handleUnknownError(error);
        }
      case 'INVALID_TOKEN':                 // 对于令牌无效会话，要求用户重新登录
        if (error.params && error.params[0]?.value === 'app') {
          return alert.error('错误', '应用令牌错误，请与管理员联系')
            .then(() => Promise.reject(error));
        } else if (error.params && error.params[0]?.value === 'user') {
          return this.confirmLogin(http);
        } else {
          return this.handleUnknownError(error);
        }
      case 'APP_AUTHENTICATION_REQUIRED':
        return alert.error('错误', '当前应用未认证或令牌已过期，请与管理员联系')
          .then(() => Promise.reject(error));
      default:                              // 其他错误代码，默认显示错误消息
        return this.handleKnownError(error);
    }
  }

  /**
   * 响应错误拦截器。
   *
   * @param {Axios} http
   *     待配置的 axios 对象。
   * @param {object} error
   *     出错时的response对象。
   * @return {Promise<object>}
   *     一个reject的Promise对象，表示响应错误。
   */
  @Log
  responseFailInterceptor(http, error) {
    loading.clear();  // 清除载入提示遮盖层
    logger.error('Request failed:', error);
    const cfg = error.config;
    if (error.response?.data) {
      if (cfg?.skipAutoErrorHandling) {   // skipAutoErrorHandling 表示跳过自动异常处理
        return Promise.reject(error.response?.data);
      } else {
        return this.handleResponseError(http, error.response?.data);
      }
    } else {
      // 对于没有错误消息的错误，把错误对象JSON格式化后输出。
      const message = error.message ?? Json.stringify(error);
      // 确保返回的依然是 ErrorInfo 对象
      const errorInfo = {
        type: 'NETWORK_ERROR',
        code: 'UNKNOWN',
        message: `网络请求发生未知错误: ${message}`,
      };
      if (cfg?.skipAutoErrorHandling) {   // skipAutoErrorHandling 表示跳过自动异常处理
        return Promise.reject(errorInfo);
      } else {
        return alert.error('错误', `网络请求发生未知错误: ${message}`)
          .then(() => Promise.reject(errorInfo));
      }
    }
  }

  /**
   * 下载指定的文件。
   *
   * @param {string} url
   *    获取待下载文件的URL。函数将通过HTTP GET操作访问该URL。
   * @param {object|null|undefined} params
   *    HTTP请求的参数，其中属性将以查询字符串的形式，自动编码后附加到URL后。默认值为`{}`。
   * @param {string} mimeType
   *    文件的MIME类型。如不提供则自动从响应头中解析获取。
   * @param {boolean} autoDownload
   *    是否自动下载文件。默认值为`true`。如此参数为`false`，则返回一个包含下载的文件的信息
   *    的对象，详见返回值说明。
   * @param {string} filename
   *    下载的文件的名称。如不提供则自动从响应头中解析获取，或者使用默认值`downloaded_file`。
   * @return {Promise<object|ErrorInfo>}
   *    此HTTP请求的`Promise`对象。若操作成功，则解析成功，并返回一个包含下载的文件的信息的
   *    对象，其中包含以下属性：
   *    - `blob: Blob` 下载的文件的二进制数据；
   *    - `filename: string` 下载的文件的名称；
   *    - `mimeType: string` 下载的文件的MIME类型；
   *
   *    如果操作失败，则解析失败并返回一个`ErrorInfo`对象。如果操作成功且`autoDownload`
   *    设置为`true`，浏览器会自动开始下载文件。
   */
  @Log
  download(url, params = {}, mimeType = null, autoDownload = true, filename = null) {
    return this.get(url, {
      params,
      returnResponse: true,    // 返回原始的响应对象而非解析后的数据
      responseType: 'blob',
      headers: {
        Accept: mimeType ?? '*/*',
      },
    }).then((response) => {
      // 获取返回的 Content-Type 头，注意，response.headers 是一个 AxiosHeaders 对象，
      // 必须用 get 方法获取值，不能直接用下标，否则大小写不同的键名会被认为是不同的键
      const contentType = mimeType ?? response.headers.get('Content-Type');
      // 从响应头中解析文件名（可选，后端需提供文件名）
      const contentDisposition = response.headers.get('Content-Disposition');
      filename = filename ?? extractContentDispositionFilename(contentDisposition) ?? 'downloaded_file';
      // 获取返回的 Blob 数据
      const blob = new Blob([response.data], { type: contentType });
      if (autoDownload) {
        // 创建一个临时 URL
        const url = window.URL.createObjectURL(blob);
        // 创建一个隐藏的 <a> 元素触发下载
        const a = window.document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = decodeURIComponent(filename);
        // 将 <a> 元素添加到 DOM，触发点击事件，然后移除
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
        // 释放 URL
        window.URL.revokeObjectURL(url);
      }
      return {
        blob,
        filename,
        mimeType: contentType,
      };
    });
  }
}

const httpImpl = new HttpImpl();

export {
  DEFAULT_HTTP_TIMEOUT,
  DEFAULT_HTTP_HEADER_CONTENT_TYPE,
  DEFAULT_HTTP_HEADER_ACCEPT,
  DEFAULT_APP_TOKEN_NAME,
  DEFAULT_ACCESS_TOKEN_NAME,
  DEFAULT_LOGIN_PAGE,
  httpImpl,
};

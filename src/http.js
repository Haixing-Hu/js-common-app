////////////////////////////////////////////////////////////////////////////////
//
//    Copyright (c) 2022 - 2024.
//    Haixing Hu, Qubit Co. Ltd.
//
//    All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////
import axios from 'axios';
import httpImpl from './impl/http-impl';

/**
 * 一个自定义的 axios 实例。
 *
 * 使用该实例发送请求时，会自动在请求头中加上 App Token 和 Access Token。
 *
 * 该实例还会自动处理服务器返回的错误信息，包括未授权错误、会话过期错误、令牌无效错误等。
 *
 * 如果请求选项参数中设置了 `skipAutoErrorHandling` 为 `true`，则不会自动处理错误，
 * 而是直接返回一个 reject 状态的 Promise 对象，其参数为服务器返回的错误信息，调用方
 * 可通过`catch((error) => {...})`对自行处理错误信息。
 *
 * 使用该实例前，需确保已完成下述配置：
 * - 已经通过`loading.setImpl()`设置了`loading`在当前的UI框架下的具体实现对象；
 * - 已经通过`alert.setImpl()`设置了`alert`在当前的UI框架下的具体实现对象；
 * - 已经通过`confirm.setImpl()`设置了`confirm`在当前的UI框架下的具体实现对象；
 * - 已经设置了`http.getAccessToken` 方法，该方法用于获取当前用户登录后的存取令牌，
 *   返回值是一个`Token`对象；
 * - 已经设置了`http.resetAccessToken`方法，该方法用于重置用户登录后的存取令牌；
 * - 已经设置了`http.getRouter`方法，该方法用于获取当前的路由器对象，返回值是一个
 *   `VueRouter`对象。
 * - `config`对象提供了以下配置：
 *     - `'api_base_url'`：API服务器的基础URL；如未设置，则抛出异常；
 *     - `'http_timeout'`：HTTP请求的超时时间；如未设置，则使用默认值 `60000`；
 *     - `'http_header_content_type'`：HTTP请求头的 Content-Type 键值；如未设置，
 *       则使用默认值 `'application/json;charset=UTF-8'`；
 *     - `'http_header_accept'`：HTTP请求头的 Accept 键值；如未设置，则使用默认值
 *       `'application/json;charset=UTF-8'`；
 *     - `'app_token_name'`：App Token 的键名；如未设置，则使用默认值 `'X-Auth-App-Token'`；
 *     - `'app_token_value'`：App Token 的键值；如未设置，则抛出异常；
 *     - `'access_token_name'`：Access Token 的键名；如未设置，则使用默认值 `'X-Auth-User-Token'`；
 *     - `'login_page'`：用户登录页面的路由名称；如未设置，则使用默认值 `'Login'`；
 *
 * @type axios
 * @author 胡海星
 */
const http = axios.create({
  transitional: {
    silentJSONParsing: false,     // 不要静默 JSON 解析
    forcedJSONParsing: false,     // 不要强制 JSON 解析
    clarifyTimeoutError: false,
  },
  headers: {
    common: {                     // 设置所有请求的默认请求头
      'Accept': undefined,        // 必须设置默认的 Accept 头为 undefined，后面才能被拦截器修改
      'Content-Type': undefined,  // 必须设置默认的 Content-Type 头为 undefined，后面才能被拦截器修改
    },
  },
});

/**
 * 配置拦截器设置 HTTP 请求头。
 *
 * @private
 * @author 胡海星
 */
http.interceptors.request.use(
  (cfg) => httpImpl.requestConfigInterceptor(http, cfg),
);

/**
 * 配置拦截器处理 HTTP 请求的响应结果。
 *
 * @private
 * @author 胡海星
 */
http.interceptors.response.use(
  (response) => httpImpl.responseSuccessInterceptor(http, response),
  (error) => httpImpl.responseFailInterceptor(http, error),
);

export default http;

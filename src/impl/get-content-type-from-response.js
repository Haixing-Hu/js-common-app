////////////////////////////////////////////////////////////////////////////////
//
//    Copyright (c) 2022 - 2025.
//    Haixing Hu, Qubit Co. Ltd.
//
//    All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////
import { Logger } from '@qubit-ltd/logging';

const logger = Logger.getLogger('http');

/**
 * 从 HTTP 响应中获取 MIME 类型。
 *
 * @param {AxiosHeaders} response
 *     HTTP 响应对象。
 * @param {string|null} mimeType
 *     用于下载的 MIME 类型（可选）。
 * @return {string}
 *     获取到的 MIME 类型。
 */
function getContentTypeFromResponse(response, mimeType) {
  // 注意，response.headers 是一个 AxiosHeaders 对象，必须用 get 方法获取值，
  // 不能直接用下标，否则大小写不同的键名会被认为是不同的键
  const contentType = mimeType ?? response.headers.get('Content-Type');
  logger.debug('The Content-Type of downloaded file is:', contentType);
  return contentType;
}

export default getContentTypeFromResponse;

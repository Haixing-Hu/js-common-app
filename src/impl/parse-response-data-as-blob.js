////////////////////////////////////////////////////////////////////////////////
//
//    Copyright (c) 2022 - 2025.
//    Haixing Hu, Qubit Co. Ltd.
//
//    All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////
import { Logger } from '@qubit-ltd/logging';

const BUFFER_SIZE = 1024;

const logger = Logger.getLogger('http');

/**
 * 将 base64 编码的字符串解码为字节数组。
 *
 * @param {string} base64String
 *     base64 编码的字符串。
 * @return {Uint8Array[]}
 *     解码后的字节数组列表。
 * @private
 */
function decodeBase64ToByteArrays(base64String) {
  const byteCharacters = atob(base64String); // 解码 base64 数据
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += BUFFER_SIZE) {
    const slice = byteCharacters.slice(offset, offset + BUFFER_SIZE);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }
  return byteArrays;
}

/**
 * 尝试将 base64 编码的数据转换为 Blob 对象。
 *
 * @param {string} data
 *     要转换的数据。
 * @param {string} contentType
 *     Blob 对象的 MIME 类型。
 * @return {Blob}
 *     转换后的 Blob 对象。如果转换失败，则返回包含原始数据的 Blob 对象。
 * @private
 */
function tryConvertBase64ToBlob(data, contentType) {
  try {
    const byteArrays = decodeBase64ToByteArrays(data);
    return new Blob(byteArrays, { type: contentType });
  } catch (e) {
    logger.error('Failed to decode base64 data, treating as plain text:', e);
    // 如果 base64 解码失败，将其作为普通文本处理
    return new Blob([data], { type: contentType });
  }
}

/**
 * 将 HTTP 响应数据解析为 Blob 对象。
 *
 * @param response
 *     HTTP 响应对象。
 * @param contentType
 *     Blob 对象的 MIME 类型。
 * @return {Blob}
 *     解析得到的 Blob 对象。
 */
function parseResponseDataAsBlob(response, contentType) {
  const data = response.data;
  if (data === null || data === undefined) {  // 处理 null 和 undefined
    logger.error('Response data is null or undefined, creating empty blob');
    return new Blob([], { type: contentType });
  }
  if (typeof data === 'string') {
    if (data.startsWith('data:')) {
      // 处理 data URL 格式的 base64 编码数据
      const commaIndex = data.indexOf(',');
      const base64Data = data.substring(commaIndex + 1); // 获取 base64 数据部分
      return tryConvertBase64ToBlob(base64Data, contentType);
    } else if (/^[A-Za-z0-9+/=]+$/.test(data)) {
      // 处理纯 base64 编码的数据
      logger.debug('Detected base64 encoded response data');
      return tryConvertBase64ToBlob(data, contentType);
    } else {
      // 处理普通文本数据
      return new Blob([data], { type: contentType });
    }
  } else {
    // 对于直接的二进制数据，直接使用返回的 data（Blob）
    return new Blob([data], { type: contentType });
  }
}

export default parseResponseDataAsBlob;

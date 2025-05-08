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
  logger.debug('Starting base64 decoding, input data length:', base64String.length);
  const byteCharacters = atob(base64String); // 解码 base64 数据
  logger.debug('Base64 decoded to raw bytes, length:', byteCharacters.length);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += BUFFER_SIZE) {
    const slice = byteCharacters.slice(offset, offset + BUFFER_SIZE);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
    logger.debug('Processed chunk', byteArrays.length, 'of size:', slice.length, 'bytes');
  }
  logger.debug('Base64 decoding completed, total chunks:', byteArrays.length);
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
    logger.debug('Converting base64 to blob, data length:', data.length);
    const byteArrays = decodeBase64ToByteArrays(data);
    logger.debug('Base64 conversion successful, total byte arrays:', byteArrays.length);
    return new Blob(byteArrays, { type: contentType });
  } catch (e) {
    logger.error('Base64 conversion failed, falling back to plain text. Error:', e);
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
  if (data === null || data === undefined) {
    logger.error('Response data is null or undefined, creating empty blob');
    return new Blob([], { type: contentType });
  }
  // If data is already a Blob, return it directly
  if (data instanceof Blob) {
    logger.debug('Data is already a Blob, returning it directly');
    return data;
  }
  // Case 1: Binary data
  if (typeof data !== 'string') {
    const dataType = typeof data;
    const className = data?.constructor?.name ?? 'unknown';
    logger.debug('Processing binary data - Type: %s, Class: %s, MIME type: %s',
      dataType,
      className,
      contentType || 'unknown');

    try {
      // 如果传入的是特殊对象，不能直接传给Blob构造函数，先转换为标准的Uint8Array
      let safeData;

      // 如果是ArrayBuffer或者TypedArray，直接使用
      if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
        safeData = data;
      } else {
        // 尝试转换为数组形式
        let dataArray;
        try {
          if (Array.isArray(data)) {
            // 1. 尝试转换为数组
            dataArray = data;
          } else if ((typeof data === 'object') && (typeof data.length === 'number')) {
            // 2. 如果有length属性，尝试按照类数组对象处理
            dataArray = [];
            const length = data.length;
            for (let i = 0; i < length; i++) {
              if (i in data) {
                dataArray[i] = data[i];
              } else {
                dataArray[i] = 0;
              }
            }
          } else {
            // 3. 如果以上都失败，将对象转换为JSON字符串
            dataArray = [JSON.stringify(data)];
          }
        } catch (e) {
          logger.error('Failed to convert data to array, using default array:', e);
          dataArray = [JSON.stringify(String(data))];
        }

        // 确保数组元素都是数字或者处理JSON字符串情况
        if (dataArray.length === 1 && typeof dataArray[0] === 'string') {
          // 如果是字符串，直接返回字符串内容而不是尝试转换为数字数组
          safeData = dataArray[0];
        } else {
          // 对于数字数组，保持原来的逻辑
          const byteArray = new Uint8Array(dataArray.length);
          for (let i = 0; i < dataArray.length; i++) {
            const value = dataArray[i];
            if (typeof value === 'number' && !Number.isNaN(value)) {
              byteArray[i] = value;
            } else {
              byteArray[i] = 0;
            }
          }
          safeData = byteArray;
        }
      }

      return new Blob([safeData], { type: contentType || '' });
    } catch (e) {
      logger.error('Failed to create Blob from binary data, falling back to empty Blob:', e);
      return new Blob([], { type: contentType || '' });
    }
  }

  // Case 2: Data URL format
  if (data.startsWith('data:')) {
    logger.debug('Processing Data URL format');
    const commaIndex = data.indexOf(',');
    const base64Data = data.substring(commaIndex + 1);
    logger.debug('Extracted base64 data, length:', base64Data.length);
    return tryConvertBase64ToBlob(base64Data, contentType);
  }

  // // Case 3: Base64 data (quoted)
  // if (/^"[A-Za-z0-9+/=]+"$/.test(data)) {
  //   logger.debug('Processing base64 encoded data, length:', data.length);
  //   const base64Content = data.substring(1, data.length - 1);
  //   return tryConvertBase64ToBlob(base64Content, contentType);
  // }

  // // Case 4: Base64 data (unquoted)
  // if (/^[A-Za-z0-9+/=]+$/.test(data)) {
  //   logger.debug('Processing base64 encoded data, length:', data.length);
  //   return tryConvertBase64ToBlob(data, contentType);
  // }

  // Case 5: Plain text
  logger.debug('Processing plain text data, length:', data.length);
  return new Blob([data], { type: contentType });
}

export default parseResponseDataAsBlob;

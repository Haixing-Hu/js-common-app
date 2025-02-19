////////////////////////////////////////////////////////////////////////////////
//
//    Copyright (c) 2022 - 2025.
//    Haixing Hu, Qubit Co. Ltd.
//
//    All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////
import { Logger } from '@qubit-ltd/logging';
import extractContentDispositionFilename from './extract-content-disposition-filename';

const DEFAULT_FILENAME = 'downloaded_file';
const logger = Logger.getLogger('http');

/**
 * 从 HTTP 响应中获取文件名。
 *
 * @param {AxiosHeaders} response
 *     HTTP 响应对象。
 * @param {string|null} filename
 *     用于下载的文件名（可选）。
 * @return {string}
 *     获取到的文件名。
 */
function getFilenameFromResponse(response, filename) {
  if (!filename) {
    // 从响应头中解析文件名（可选，后端需提供文件名）
    // 注意，response.headers 是一个 AxiosHeaders 对象，必须用 get 方法获取值，
    // 不能直接用下标，否则大小写不同的键名会被认为是不同的键
    const contentDisposition = response.headers.get('Content-Disposition');
    logger.debug('Content-Disposition:', contentDisposition);
    filename = extractContentDispositionFilename(contentDisposition);
    logger.debug('Extracted filename from Content-Disposition:', filename);
  }
  if (!filename) {
    filename = DEFAULT_FILENAME;
  }
  logger.debug('The filename of downloaded file is:', filename);
  return filename;
}

export default getFilenameFromResponse;

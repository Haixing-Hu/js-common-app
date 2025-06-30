////////////////////////////////////////////////////////////////////////////////
//
//    Copyright (c) 2022 - 2024.
//    Haixing Hu, Qubit Co. Ltd.
//
//    All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////

/**
 * 从Content-Disposition头中提取文件名。
 *
 * @param {string} contentDisposition
 *     Content-Disposition 头的值。
 * @return {string|null}
 *     从Content-Disposition头中提取的文件名，如果提取失败，则返回`null`。
 * @private
 */
function extractContentDispositionFilename(contentDisposition) {
  if (!contentDisposition) {
    return null;
  }
  // 优先匹配 filename*=
  const filenameStarMatch = contentDisposition.match(/filename\*=(?:UTF-8'')?([^;]+)/);
  if (filenameStarMatch) {
    return decodeURIComponent(filenameStarMatch[1].trim());
  }
  // 如果 filename* 不存在，匹配 filename=
  const filenameMatch = contentDisposition.match(/filename=['"]?([^"']+)['"]?/);
  if (filenameMatch) {
    return filenameMatch[1].trim();
  }
  return null;
}

export default extractContentDispositionFilename;

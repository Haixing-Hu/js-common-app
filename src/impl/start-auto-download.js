////////////////////////////////////////////////////////////////////////////////
//
//    Copyright (c) 2022 - 2025.
//    Haixing Hu, Qubit Co. Ltd.
//
//    All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////

/**
 * 启动自动下载。
 *
 * @param blob
 *     要下载的 Blob 对象。
 * @param filename
 *     下载文件的文件名。
 */
function startAutoDownload(blob, filename) {
  // 创建一个临时 URL
  const url = window.URL.createObjectURL(blob);
  // 创建一个隐藏的 <a> 元素触发下载
  const a = window.document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  // 将 <a> 元素添加到 DOM，触发点击事件，然后移除
  window.document.body.appendChild(a);
  a.click();
  window.document.body.removeChild(a);
  // 释放 URL
  window.URL.revokeObjectURL(url);
}

export default startAutoDownload;

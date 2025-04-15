# HTTP 模块测试

## noAutoClearLoading 参数测试

`http-no-auto-clear-loading.test.js` 测试文件验证了 http 和 http.download 函数中 noAutoClearLoading 参数的功能。

### noAutoClearLoading 参数说明

在正常情况下，HTTP 请求完成后（无论成功还是失败），系统都会自动清除加载提示遮盖层（调用 `loading.clear()`）。在某些特殊场景下，您可能希望控制加载提示遮盖层的显示和隐藏，例如连续发送多个请求时，希望所有请求完成后再清除加载提示。

`noAutoClearLoading` 参数允许您在发送 HTTP 请求时，禁止系统在请求成功响应后自动清除加载提示遮盖层。

### 使用方法

#### 标准 HTTP 请求

```javascript
// 默认情况：请求成功后会自动清除加载提示遮盖层
http.get('/api/data');

// 设置 noAutoClearLoading 为 true，请求成功后不会自动清除加载提示遮盖层
http.get('/api/data', { noAutoClearLoading: true });

// 对于 POST 请求
http.post('/api/data', postData, { noAutoClearLoading: true });
```

#### 文件下载 

```javascript
// 默认情况：下载成功后会自动清除加载提示遮盖层
http.download('/api/file', params, mimeType, autoDownload);

// 设置 noAutoClearLoading 为 true，下载成功后不会自动清除加载提示遮盖层
http.download('/api/file', params, mimeType, autoDownload, null, { 
  noAutoClearLoading: true 
});
```

### 注意事项

1. 当 `noAutoClearLoading` 设置为 `true` 时，仅在请求**成功**的情况下不会自动清除加载提示遮盖层。
2. 如果请求**失败**，无论 `noAutoClearLoading` 是否设置为 `true`，系统都会自动清除加载提示遮盖层。
3. 当您使用 `noAutoClearLoading: true` 时，需要自己手动调用 `loading.clear()` 来清除加载提示遮盖层。

### 测试用例

`http-no-auto-clear-loading.test.js` 测试文件包含以下测试用例：

1. HTTP 请求相关测试:
   - 默认情况下，成功响应后应调用 loading.clear
   - 当 noAutoClearLoading 为 true 时，成功响应后不应调用 loading.clear
   - 无论 noAutoClearLoading 是否为 true，失败响应后都应调用 loading.clear
   - POST 请求默认应调用 loading.clear
   - 当 noAutoClearLoading 为 true 时，POST 请求成功后不应调用 loading.clear

2. HTTP 下载相关测试:
   - 默认情况下，文件下载成功后应调用 loading.clear
   - 当 noAutoClearLoading 选项为 true 时，文件下载成功后不应调用 loading.clear
   - 无论 noAutoClearLoading 是否为 true，下载失败后都应调用 loading.clear

### 运行测试

```bash
# 只运行 noAutoClearLoading 相关测试
yarn test http-no-auto-clear-loading.test.js

# 运行所有测试
yarn test
``` 
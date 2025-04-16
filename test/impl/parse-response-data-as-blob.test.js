////////////////////////////////////////////////////////////////////////////////
//
//    Copyright (c) 2022 - 2024.
//    Haixing Hu, Qubit Co. Ltd.
//
//    All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////
import Logger from '@qubit-ltd/logging';
import parseResponseDataAsBlob from '../../src/impl/parse-response-data-as-blob';

// 模拟Logger以便捕获日志
jest.mock('@qubit-ltd/logging', () => {
  const mockDebug = jest.fn();
  const mockError = jest.fn();
  return {
    getLogger: jest.fn(() => ({
      debug: mockDebug,
      error: mockError,
    })),
    Logger: {
      getLogger: jest.fn(() => ({
        debug: mockDebug,
        error: mockError,
      })),
    },
  };
});

// 模拟全局的atob函数
global.atob = jest.fn(str => Buffer.from(str, 'base64').toString('binary'));

describe('parseResponseDataAsBlob', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该处理null或undefined的响应数据', () => {
    // null数据
    const responseWithNull = { data: null };
    const blobFromNull = parseResponseDataAsBlob(responseWithNull, 'text/plain');
    expect(blobFromNull instanceof Blob).toBe(true);
    expect(blobFromNull.size).toBe(0);
    expect(blobFromNull.type).toBe('text/plain');

    // undefined数据
    const responseWithUndefined = { data: undefined };
    const blobFromUndefined = parseResponseDataAsBlob(responseWithUndefined, 'text/plain');
    expect(blobFromUndefined instanceof Blob).toBe(true);
    expect(blobFromUndefined.size).toBe(0);
    expect(blobFromUndefined.type).toBe('text/plain');
  });

  it('应该直接返回已经是Blob的数据', () => {
    const originalBlob = new Blob(['test content'], { type: 'text/plain' });
    const response = { data: originalBlob };
    const result = parseResponseDataAsBlob(response, 'application/octet-stream');
    expect(result).toBe(originalBlob);
  });

  it('应该处理二进制数据', () => {
    const binaryData = new Uint8Array([1, 2, 3, 4]);
    const response = { data: binaryData };
    const result = parseResponseDataAsBlob(response, 'application/octet-stream');
    expect(result instanceof Blob).toBe(true);
    expect(result.type).toBe('application/octet-stream');
  });

  it('应该处理Data URL格式的数据', async () => {
    // 创建一个简单的data URL
    const dataUrl = 'data:text/plain;base64,SGVsbG8gV29ybGQ='; // "Hello World" in base64
    const response = { data: dataUrl };
    const result = parseResponseDataAsBlob(response, 'text/plain');
    
    expect(result instanceof Blob).toBe(true);
    expect(result.type).toBe('text/plain');
    
    // 验证Blob内容
    const text = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsText(result);
    });
    
    expect(text).toBe('Hello World');
  });

  it('应该在base64解码失败时正确处理', () => {
    // 模拟atob抛出异常
    global.atob.mockImplementationOnce(() => {
      throw new Error('Invalid base64');
    });

    const dataUrl = 'data:text/plain;base64,InvalidBase64Data';
    const response = { data: dataUrl };
    const result = parseResponseDataAsBlob(response, 'text/plain');
    
    expect(result instanceof Blob).toBe(true);
    expect(result.type).toBe('text/plain');
  });

  it('应该处理普通文本数据', () => {
    const textData = 'Hello World';
    const response = { data: textData };
    const result = parseResponseDataAsBlob(response, 'text/plain');
    
    expect(result instanceof Blob).toBe(true);
    expect(result.type).toBe('text/plain');
  });

  it('应该能处理大型base64数据（分块处理）', async () => {
    // 创建一个超过1024字节的数据来测试分块功能
    const largeData = 'A'.repeat(2000);
    const largeBase64 = Buffer.from(largeData).toString('base64');
    const dataUrl = `data:text/plain;base64,${largeBase64}`;
    const response = { data: dataUrl };
    
    const result = parseResponseDataAsBlob(response, 'text/plain');
    expect(result instanceof Blob).toBe(true);
    
    // 验证内容
    const text = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsText(result);
    });
    
    expect(text).toBe(largeData);
  });

  it('应该处理不同类型的二进制数据和边界情况', () => {
    // 测试 ArrayBuffer 类型的二进制数据
    const arrayBuffer = new ArrayBuffer(4);
    const arrayBufferResponse = { data: arrayBuffer };
    const arrayBufferResult = parseResponseDataAsBlob(arrayBufferResponse, 'application/octet-stream');
    expect(arrayBufferResult instanceof Blob).toBe(true);
    expect(arrayBufferResult.type).toBe('application/octet-stream');
    
    // 测试没有类名的二进制数据
    const mockBinaryData = new Uint8Array([1, 2, 3, 4]);
    // 模拟一个对象，它的 constructor 不存在或没有 name 属性
    const mockBinaryDataWithoutClassName = Object.create(mockBinaryData);
    Object.defineProperty(mockBinaryDataWithoutClassName, 'constructor', {
      get: function() { return undefined; }
    });
    const responseWithoutClassName = { data: mockBinaryDataWithoutClassName };
    const resultWithoutClassName = parseResponseDataAsBlob(responseWithoutClassName, 'application/octet-stream');
    expect(resultWithoutClassName instanceof Blob).toBe(true);
    expect(resultWithoutClassName.type).toBe('application/octet-stream');
    
    // 测试没有contentType的情况 (这会覆盖 `contentType || 'unknown'` 的分支)
    const binaryData = new Uint8Array([1, 2, 3, 4]);
    const responseWithoutContentType = { data: binaryData };
    const resultWithoutContentType = parseResponseDataAsBlob(responseWithoutContentType, null);
    expect(resultWithoutContentType instanceof Blob).toBe(true);
    expect(resultWithoutContentType.type).toBe('');
    
    // 测试空字符串contentType的情况 (处理 93 行 contentType || 'unknown' 的逻辑)
    const binaryDataWithEmptyContentType = new Uint8Array([1, 2, 3, 4]);
    const responseWithEmptyContentType = { data: binaryDataWithEmptyContentType };
    const resultWithEmptyContentType = parseResponseDataAsBlob(responseWithEmptyContentType, '');
    expect(resultWithEmptyContentType instanceof Blob).toBe(true);
    expect(resultWithEmptyContentType.type).toBe('');
  });
  
  it('应该处理contentType为undefined的情况', () => {
    // 测试contentType为undefined的情况 (这会直接覆盖 contentType || 'unknown' 分支)
    const binaryData = new Uint8Array([5, 6, 7, 8]);
    const response = { data: binaryData };
    // 明确传入undefined作为contentType
    const result = parseResponseDataAsBlob(response, undefined);
    expect(result instanceof Blob).toBe(true);
    expect(result.type).toBe('');
    
    // 检查日志调用中是否包含'unknown'值
    const logger = Logger.getLogger();
    expect(logger.debug).toHaveBeenCalled();
    // 获取debug方法的调用参数
    const callArgs = logger.debug.mock.calls.find(
      call => call[0] === 'Processing binary data - Type: %s, Class: %s, MIME type: %s'
    );
    expect(callArgs).toBeDefined();
    expect(callArgs[3]).toBe('unknown'); // 第四个参数应该是'unknown'
  });
  
  // 新增测试用例开始
  it('应该正确处理普通数组数据', () => {
    // 测试普通数组 - 覆盖107-108行代码
    const arrayData = [65, 66, 67, 68]; // ASCII码：ABCD
    const response = { data: arrayData };
    const result = parseResponseDataAsBlob(response, 'text/plain');
    expect(result instanceof Blob).toBe(true);
    expect(result.type).toBe('text/plain');
  });
  
  it('应该正确处理类数组对象', async () => {
    // 测试类数组对象 - 覆盖112-124行代码
    const arrayLikeObject = {
      0: 72,   // H
      1: 101,  // e
      2: 108,  // l
      3: 108,  // l
      4: 111,  // o
      length: 5
    };
    const response = { data: arrayLikeObject };
    const result = parseResponseDataAsBlob(response, 'text/plain');
    expect(result instanceof Blob).toBe(true);
    
    // 验证Blob内容
    const text = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsText(result);
    });
    
    expect(text).toBe('Hello');
  });
  
  it('应该处理类数组对象中存在缺失索引的情况', async () => {
    // 测试有缺失索引的类数组对象 - 覆盖112-124行代码中的if (i in data)分支
    const sparseArrayLikeObject = {
      0: 84,   // T
      2: 115,  // s
      4: 33,   // !
      length: 5
    };
    const response = { data: sparseArrayLikeObject };
    const result = parseResponseDataAsBlob(response, 'text/plain');
    expect(result instanceof Blob).toBe(true);
    
    // 验证Blob内容 (缺失索引应填充为0)
    const arrayBuffer = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsArrayBuffer(result);
    });
    
    const uint8Array = new Uint8Array(arrayBuffer);
    expect(uint8Array[0]).toBe(84); // T
    expect(uint8Array[1]).toBe(0);  // 缺失索引填充为0
    expect(uint8Array[2]).toBe(115); // s
    expect(uint8Array[3]).toBe(0);  // 缺失索引填充为0
    expect(uint8Array[4]).toBe(33); // !
  });
  
  it('应该将非数组、非类数组对象转换为JSON字符串', async () => {
    // 测试普通对象转JSON - 覆盖第112-124行代码的else分支
    const objectData = { name: 'Test', value: 123 };
    const response = { data: objectData };
    const result = parseResponseDataAsBlob(response, 'application/json');
    expect(result instanceof Blob).toBe(true);
    expect(result.type).toBe('application/json');
    
    // 验证Blob内容是否为对象的JSON字符串
    const text = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsText(result);
    });
    
    const expectedJson = JSON.stringify(objectData);
    expect(text).toBe(expectedJson);
  });
  
  it('应该在转换为数组时处理异常情况', () => {
    // 测试数据转换出错的情况 - 覆盖try-catch块的catch分支
    // 创建一个会在JSON.stringify时抛出异常的对象
    const cyclicObject = {};
    cyclicObject.self = cyclicObject; // 循环引用会导致JSON.stringify失败
    
    // 重写JSON.stringify以抛出异常
    const originalStringify = JSON.stringify;
    JSON.stringify = jest.fn(() => {
      throw new Error('Cyclic object value');
    });
    
    const response = { data: cyclicObject };
    const result = parseResponseDataAsBlob(response, 'application/json');
    
    expect(result instanceof Blob).toBe(true);
    expect(result.type).toBe('application/json');
    
    // 验证日志错误被记录
    const logger = Logger.getLogger();
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to convert data to array, using default array:',
      expect.any(Error)
    );
    
    // 恢复原始JSON.stringify
    JSON.stringify = originalStringify;
  });
  
  it('应该在处理数组中非数字元素时将其转换为0', async () => {
    // 测试数组中包含非数字元素 - 覆盖132-141行的类型检查逻辑
    const mixedArray = [65, 'B', NaN, undefined, null, 70]; // 只有65和70是有效数字
    const response = { data: mixedArray };
    const result = parseResponseDataAsBlob(response, 'text/plain');
    expect(result instanceof Blob).toBe(true);
    
    // 验证Blob内容
    const arrayBuffer = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsArrayBuffer(result);
    });
    
    const uint8Array = new Uint8Array(arrayBuffer);
    expect(uint8Array[0]).toBe(65); // 有效数字
    expect(uint8Array[1]).toBe(0);  // 'B'被转换为0
    expect(uint8Array[2]).toBe(0);  // NaN被转换为0
    expect(uint8Array[3]).toBe(0);  // undefined被转换为0
    expect(uint8Array[4]).toBe(0);  // null被转换为0
    expect(uint8Array[5]).toBe(70); // 有效数字
  });
  
  it('应该在Blob创建失败时回退到空Blob', () => {
    // 模拟Blob构造函数抛出异常 - 覆盖最外层try-catch的catch分支
    const originalBlob = global.Blob;
    let blobCallCount = 0;
    
    // 模拟第一次调用Blob时抛出异常，第二次正常
    global.Blob = jest.fn((...args) => {
      blobCallCount++;
      if (blobCallCount === 1) {
        throw new Error('Blob creation failed');
      }
      return new originalBlob(...args);
    });
    
    const data = new Uint8Array([1, 2, 3]);
    const response = { data };
    const result = parseResponseDataAsBlob(response, 'application/octet-stream');
    
    expect(result instanceof originalBlob).toBe(true);
    expect(result.size).toBe(0); // 应该是一个空Blob
    expect(result.type).toBe('application/octet-stream');
    
    // 验证日志错误被记录
    const logger = Logger.getLogger();
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to create Blob from binary data, falling back to empty Blob:',
      expect.any(Error)
    );
    
    // 恢复原始Blob
    global.Blob = originalBlob;
  });
  
  // 添加新的测试用例
  it('应该正确处理空数组对象', async () => {
    // 测试数据数组为空的情况 - 覆盖134-137行的分支判断逻辑
    const mockArrayData = [];
    const response = { data: mockArrayData };
    const result = parseResponseDataAsBlob(response, 'application/json');
    
    expect(result instanceof Blob).toBe(true);
    expect(result.type).toBe('application/json');
    
    // 验证Blob内容大小
    expect(result.size).toBe(0);
  });
  
  it('应该正确处理非字符串和非数字的元素', () => {
    // 测试数组中包含非字符串也非数字的元素
    const mockArrayData = [true, {}, null, undefined];
    const response = { data: mockArrayData };
    const result = parseResponseDataAsBlob(response, 'application/json');
    
    expect(result instanceof Blob).toBe(true);
    expect(result.type).toBe('application/json');
    // 这些值应该被转为0
    expect(result.size).toBe(4); // 4个元素的Uint8Array
  });
  
  it('应该正确处理对象数组的转换', () => {
    // 测试一个特殊情况，直接传入一个只有一个字符串元素的数组
    // 这会触发136行的字符串元素处理逻辑
    const dataArray = ['{"test":true}'];
    // 直接调用一个一定会在内部创建文本内容blob的场景
    const response = { data: dataArray };
    const result = parseResponseDataAsBlob(response, 'application/json');
    
    expect(result instanceof Blob).toBe(true);
    expect(result.type).toBe('application/json');
  });
  
  it('应该在Blob创建失败时使用空字符串作为类型', () => {
    // 测试当Blob创建失败时，如果contentType为空字符串，应该正确处理
    const originalBlob = global.Blob;
    let blobCallCount = 0;
    
    // 模拟第一次调用Blob时抛出异常，第二次正常
    global.Blob = jest.fn((...args) => {
      blobCallCount++;
      if (blobCallCount === 1) {
        throw new Error('Blob creation failed');
      }
      return new originalBlob(...args);
    });
    
    const data = new Uint8Array([1, 2, 3]);
    const response = { data };
    const result = parseResponseDataAsBlob(response, '');  // 传入空字符串作为contentType
    
    expect(result instanceof originalBlob).toBe(true);
    expect(result.size).toBe(0); // 应该是一个空Blob
    expect(result.type).toBe(''); // 类型应该为空字符串
    
    // 恢复原始Blob
    global.Blob = originalBlob;
  });
}); 
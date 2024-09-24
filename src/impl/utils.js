////////////////////////////////////////////////////////////////////////////////
//
//    Copyright (c) 2022 - 2024.
//    Haixing Hu, Qubit Co. Ltd.
//
//    All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////
import { isString } from '@haixing_hu/type-detect';
import { BoolRule, NumberRule, IntegerRule } from '@haixing_hu/common-validation-rule';

/**
 * 将指定的字符串值转换为合适的类型。
 *
 * 目前此函数支持将字符串值转换为布尔值、整数、浮点数，如果无法转换，则返回原始字符串值。
 *
 * @param {any} value
 *     指定的值。
 * @return {any}
 *     返回转换后的值。
 * @private
 * @author 胡海星
 */
function convert(value) {
  if (isString(value)) {
    if (BoolRule.isValid(value)) {
      return (value.trim().toLowerCase() === 'true');
    } else if (IntegerRule.isValid(value)) {
      return parseInt(value, 10);
    } else if (NumberRule.isValid(value)) {
      return parseFloat(value);
    } else {
      return String(value); // convert the wrapper object to primitive
    }
  } else {
    return value;
  }
}

export {
  convert,
};

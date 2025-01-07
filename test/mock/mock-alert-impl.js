////////////////////////////////////////////////////////////////////////////////
//
//    Copyright (c) 2022 - 2024.
//    Haixing Hu, Qubit Co. Ltd.
//
//    All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////
import { AlertImpl } from '@qubit-ltd/common-ui';

/**
 * A mock implementation of the {@link AlertImpl} class.
 *
 * @author Haixing Hu
 */
class MockAlertImpl extends AlertImpl {
  type = undefined;

  title = undefined;

  message = undefined;

  show(type, title, message) {
    this.type = type;
    this.title = title;
    this.message = message;
    return new Promise((resolve, _) => {
      console.log(`MockAlertImpl.show: '${type}' - '${title}' - '${message}'`);
      resolve();
    });
  }

  reset() {
    this.type = undefined;
    this.title = undefined;
    this.message = undefined;
  }
}

export default MockAlertImpl;

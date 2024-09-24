////////////////////////////////////////////////////////////////////////////////
//
//    Copyright (c) 2022 - 2024.
//    Haixing Hu, Qubit Co. Ltd.
//
//    All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////
import { ConfirmImpl } from '@haixing_hu/common-ui';

/**
 * A mock implementation of the {@link ConfirmImpl} class.
 *
 * @author Haixing Hu
 */
class MockConfirmImpl extends ConfirmImpl {
  type = undefined;

  title = undefined;

  message = undefined;

  okLabel = undefined;

  cancelLabel = undefined;

  show(type, title, message, okLabel, cancelLabel) {
    this.type = type;
    this.title = title;
    this.message = message;
    this.okLabel = okLabel;
    this.cancelLabel = cancelLabel;
    return new Promise((resolve, _) => {
      console.log(`MockConfirmImpl.show: ${type} - ${title} - ${message} - ${okLabel} - ${cancelLabel}`);
      resolve();
    });
  }

  reset() {
    this.type = undefined;
    this.title = undefined;
    this.message = undefined;
    this.okLabel = undefined;
    this.cancelLabel = undefined;
  }
}

export default MockConfirmImpl;

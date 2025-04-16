////////////////////////////////////////////////////////////////////////////////
//
//    Copyright (c) 2022 - 2024.
//    Haixing Hu, Qubit Co. Ltd.
//
//    All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////
import { LoadingImpl } from '@qubit-ltd/common-ui';

/**
 * A mock implementation of the {@link LoadingImpl} class.
 *
 * @author Haixing Hu
 */
class MockLoadingImpl extends LoadingImpl {
  message = undefined;

  show(message) {
    this.message = message;
    console.log(`MockLoadingImpl.show: ${message}`);
  }

  hide() {
    this.message = undefined;
    console.log('MockLoadingImpl.hide');
  }

  reset() {
    this.message = undefined;
  }
}

export default MockLoadingImpl;

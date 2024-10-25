////////////////////////////////////////////////////////////////////////////////
//
//    Copyright (c) 2022 - 2024.
//    Haixing Hu, Qubit Co. Ltd.
//
//    All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////
import config from '@haixing_hu/config';
import { loading, alert, confirm } from '@haixing_hu/common-ui';
import MockLoadingImpl from '../mock/mock-loading-impl';
import MockAlertImpl from '../mock/mock-alert-impl';
import MockConfirmImpl from '../mock/mock-confirm-impl';
import { http } from '../../src';

/**
 * The state object for testing the `http` object.
 *
 * @author Haixing Hu
 */
class HttpImplState {
  loadingImpl = new MockLoadingImpl();

  alertImpl = new MockAlertImpl();

  confirmImpl = new MockConfirmImpl();

  router = {
    name: '',

    reset() {
      this.name = '';
    },
  };

  appToken = {
    value: 'TestAppToken',

    reset() {
      this.value = 'TestAppToken';
    },
  };

  accessToken = {
    value: 'TestAccessToken',
    createTime: '2024-01-01T00:00:00Z',
    maxAge: 3600,
    previousValue: 'OldAccessToken',

    reset() {
      this.value = 'TestAccessToken';
      this.createTime = '2024-01-01T00:00:00Z';
      this.maxAge = 3600;
      this.previousValue = 'OldAccessToken';
    },
  };

  getAccessToken = jest.fn(() => this.accessToken);

  resetAccessToken = jest.fn(() => { this.accessToken.value = ''; });

  pushRouter = jest.fn((obj) => {
    this.router.name = obj.name;
    return Promise.resolve(obj.name);
  });

  getRouter = jest.fn(() => ({
    push: this.pushRouter,
  }));

  constructor() {
    this.reset();
  }

  reset() {
    this.loadingImpl.reset();
    this.alertImpl.reset();
    this.confirmImpl.reset();
    this.router.reset();
    this.appToken.reset();
    this.accessToken.reset();
    config.set('api_base_url', 'https://127.0.0.1/api');
    config.remove('http_timeout');
    config.remove('http_header_content_type');
    config.remove('http_header_accept');
    config.remove('app_token_name');
    config.set('app_token_value', this.appToken.value);
    config.remove('access_token_name');
    config.remove('login_page');
    http.getAccessToken = this.getAccessToken;
    http.resetAccessToken = this.resetAccessToken;
    http.getRouter = this.getRouter;
    loading.setImpl(this.loadingImpl);
    alert.setImpl(this.alertImpl);
    confirm.setImpl(this.confirmImpl);
  }
}

export default HttpImplState;

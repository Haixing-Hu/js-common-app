# @qubit-ltd/common-app

[![npm version](https://badge.fury.io/js/@qubit-ltd/common-app.svg)](https://badge.fury.io/js/@qubit-ltd/common-app)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![中文文档](https://img.shields.io/badge/文档-中文版-blue.svg)](README.zh_CN.md)
[![CircleCI](https://dl.circleci.com/status-badge/img/gh/Haixing-Hu/js-common-app/tree/master.svg?style=shield)](https://dl.circleci.com/status-badge/redirect/gh/Haixing-Hu/js-common-app/tree/master)
[![Coverage Status](https://coveralls.io/repos/github/Haixing-Hu/js-common-app/badge.svg?branch=master)](https://coveralls.io/github/Haixing-Hu/js-common-app?branch=master)

A JavaScript library of utilities for developing web applications, providing authentication storage, HTTP client with automatic token management, user state management, and utility functions for web development.

## Features

- **AuthStorage**: Secure storage management for user authentication data
- **HTTP Client**: Enhanced Axios instance with automatic token handling and error management
- **BasicUserStore**: Pinia-based user state management with authentication workflows
- **Utility Functions**: Helper functions for common web development tasks

## Installation

```bash
npm install @qubit-ltd/common-app
```

or

```bash
yarn add @qubit-ltd/common-app
```

## Quick Start

```javascript
import { AuthStorage, http, BasicUserStore } from '@qubit-ltd/common-app';

// Initialize authentication storage
const authStorage = new AuthStorage('my-app');

// Use the HTTP client
const response = await http.get('/api/users');

// HTTP module automatically handles filename extraction
```

## API Reference

### AuthStorage

A class for managing user authentication data in local storage and cookies. It provides secure storage for user credentials, tokens, and profile information.

#### Constructor

```javascript
const authStorage = new AuthStorage(appCode);
```

- `appCode` (string): Application code used as prefix for storage keys

#### Key Methods

**User Information Management:**
```javascript
// User ID
authStorage.storeUserId(123);
const userId = authStorage.loadUserId();
authStorage.removeUserId();

// Username and Password
authStorage.storeUsername('john_doe');
authStorage.storePassword('password123');
const username = authStorage.loadUsername();
const password = authStorage.loadPassword();

// User Profile
authStorage.storeName('John Doe');
authStorage.storeAvatar('avatar.jpg');
authStorage.storeGender('MALE');
authStorage.storeMobile('1234567890');
```

**Token Management:**
```javascript
const token = {
  value: 'jwt-token-here',
  createTime: '2024-01-01T00:00:00Z',
  maxAge: '3600'
};

authStorage.storeToken(token);
const storedToken = authStorage.loadToken();
authStorage.removeToken();

// Check if token exists
const hasToken = authStorage.hasTokenValue();
const tokenValue = authStorage.loadTokenValue();
```

**Permissions and Roles:**
```javascript
authStorage.storePrivileges(['read', 'write', 'admin']);
authStorage.storeRoles(['user', 'moderator']);
const privileges = authStorage.loadPrivileges();
const roles = authStorage.loadRoles();
```

**Complete User Session:**
```javascript
// Store complete login response
const loginResponse = {
  user: { id: 123, username: 'john', name: 'John Doe' },
  token: { value: 'jwt-token', maxAge: '3600' },
  privileges: ['read', 'write'],
  roles: ['user']
};

authStorage.storeLoginResponse(loginResponse);
const session = authStorage.loadLoginResponse();
authStorage.removeLoginResponse();
```

### http

An enhanced Axios instance with automatic token management, error handling, and file download capabilities.

#### Key Features

- **64-bit Long Integer Support**: Uses `@qubit-ltd/json` custom serializer to perfectly handle backend long integer IDs
- **Intelligent Error Handling**: Automatically handles authentication errors like `LOGIN_REQUIRED`, `SESSION_EXPIRED`, `INVALID_TOKEN`
- **UI Abstraction Layer Integration**: Deep integration with `@qubit-ltd/common-ui` for automatic loading and error dialogs
- **Automatic Token Management**: Automatically adds App Token and Access Token to request headers
- **File Download Functionality**: Built-in file download with automatic filename and MIME type parsing
- **Anti-Cache Mechanism**: Automatically adds timestamp and random parameters to GET requests

#### Long Integer Handling Principle

```javascript
// When sending requests, BigInt is automatically serialized
const data = { id: 12345678901234567890n, name: 'John' };
// Serialized as: {"id":12345678901234567890,"name":"John"}

// When receiving responses, long integers are automatically parsed as BigInt
const response = '{"id":12345678901234567890,"name":"John Doe"}';
// Parsed as: { id: 12345678901234567890n, name: "John Doe" }
```

#### Automatic Error Handling

The HTTP object can automatically handle the following error types:

| Error Code | Handling Method | Description |
|-----------|----------------|-------------|
| `LOGIN_REQUIRED` | Show login confirmation dialog | User not logged in or needs re-authentication |
| `SESSION_EXPIRED` | Handle based on parameters | Application or user session expired |
| `INVALID_TOKEN` | Handle based on parameters | Application or user token invalid |
| `APP_AUTHENTICATION_REQUIRED` | Show error message | Application authentication failed |
| Network Errors | Show generic error message | Network connectivity issues |

#### Configuration Requirements

Before using the HTTP client, ensure these configurations are set:

```javascript
import { loading, alert, confirm } from '@qubit-ltd/common-ui';
import config from '@qubit-ltd/config';

// Set UI framework implementations
loading.setImpl(yourLoadingImpl);
alert.setImpl(yourAlertImpl);
confirm.setImpl(yourConfirmImpl);

// Configure HTTP settings
config.set('api_base_url', 'https://api.example.com');
config.set('app_token_value', 'your-app-token');
config.set('http_timeout', 30000);

// Set token management functions
http.getAccessToken = () => authStorage.loadToken();
http.resetAccessToken = () => authStorage.removeToken();
http.getRouter = () => yourVueRouter;
```

#### Basic Usage

```javascript
// GET request
const users = await http.get('/api/users');

// POST request with data
const newUser = await http.post('/api/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// PUT request
const updatedUser = await http.put('/api/users/123', userData);

// DELETE request
await http.delete('/api/users/123');
```

#### Advanced Options

```javascript
// Skip automatic error handling
try {
  const response = await http.get('/api/data', {
    skipAutoErrorHandling: true
  });
} catch (error) {
  // Handle error manually
  console.error('Request failed:', error);
}

// Return full response object
const fullResponse = await http.get('/api/data', {
  returnResponse: true
});
console.log(fullResponse.status, fullResponse.headers);

// Prevent automatic loading clear
await http.post('/api/upload', formData, {
  noAutoClearLoading: true
});
```

#### File Download

```javascript
// Simple download
await http.download('/api/files/report.pdf');

// Download with parameters
await http.download('/api/files/export', {
  format: 'xlsx',
  dateRange: '2024-01-01,2024-12-31'
});

// Get download information without auto-download
const fileInfo = await http.download('/api/files/data.csv', {}, null, false);
console.log(fileInfo.filename, fileInfo.mimeType);
// fileInfo contains: { blob, filename, mimeType }

// Download with custom filename
await http.download('/api/files/123', {}, 'application/pdf', true, 'custom-name.pdf');
```

### BasicUserStore

A Pinia store class for managing user authentication state and workflows.

> **📖 Detailed Documentation**: [BasicUserStore User Authentication Management Guide](doc/tutorials/basic-user-store.md) - See complete technical documentation and best practices

#### Core Features

- **Multiple Login Methods**: Username/password, mobile/SMS, social network Open ID login
- **Smart State Management**: Automatically manages user info, tokens, privileges, and roles
- **Persistent Storage**: Uses AuthStorage for local storage management
- **Token Validation**: Automatic token validity and expiration checking
- **Security Mechanisms**: Token reset, login confirmation, and other security features
- **Permission Management**: Integrated user privileges and role management
- **HTTP Integration**: Seamless integration with HTTP client for automatic token injection

#### Dependency Injection

BasicUserStore uses dependency injection pattern with three core dependencies:

```javascript
class UserStore extends BasicUserStore {
  constructor() {
    super(
      userAuthenticateApi,  // User authentication API object
      verifyCodeApi,        // Verification code API object
      appCode              // Application code
    );
  }
}
```

#### Required API Interface

| Interface Method | Description | Return Value |
|-----------------|-------------|--------------|
| `loginByUsername(username, password)` | Username/password login | LoginResponse |
| `loginByMobile(mobile, verifyCode)` | Mobile/SMS login | LoginResponse |
| `loginByOpenId(socialNetwork, appId, openId)` | Social network login | LoginResponse |
| `bindOpenId(socialNetwork, appId, openId)` | Bind social account | void |
| `logout()` | User logout | void |
| `getLoginInfo()` | Get login information | LoginResponse |
| `checkToken(userId, tokenValue)` | Check token validity | Token \| null |
| `sendBySms(mobile, scene)` | Send SMS verification code | void |

#### State Management

```javascript
// User basic information
userStore.user;          // Current user object {id, username, nickname, avatar, name, gender, mobile}
userStore.password;      // User password (saved only when remember login)
userStore.saveLogin;     // Whether to save login info
userStore.token;         // Access token {value, expiredTime}

// Permissions and roles
userStore.privileges;    // User privileges array
userStore.roles;         // User roles array
userStore.organization;  // User organization

// Social login
userStore.socialNetwork; // Social network type ('WECHAT', etc.)
userStore.appId;         // Social app ID
userStore.openId;        // Social open ID

// Computed properties
userStore.loggedIn;      // Boolean: whether user is logged in
```

#### Authentication Flow Examples

```javascript
// Username/password login
await userStore.loginByUsername('john_doe', 'password123', true);

// Mobile/SMS login
await userStore.sendLoginVerifyCode('1234567890');
await userStore.loginByMobile('1234567890', '123456', false);

// Social login
await userStore.loginByOpenId('WECHAT', 'app123', 'openid456');

// Auto-restore login state
const token = await userStore.loadToken();
if (token) {
  await userStore.refreshLoginInfo();
}

// Logout
await userStore.logout();
```

#### Permission and Role Management

```javascript
// Check permissions
const hasPermission = (permission) => {
  return userStore.privileges.includes(permission);
};

// Check roles
const hasRole = (role) => {
  return userStore.roles.includes(role);
};

// Use in templates
<q-btn v-if="hasPermission('USER_DELETE')" label="Delete User" />
```

#### HTTP Client Integration

```javascript
// Configure in boot/http.js
http.getAccessToken = function() {
  const store = useUserStore();
  return store.token;
};

http.resetAccessToken = function() {
  const store = useUserStore();
  store.resetToken();
};
```

## Configuration

The library uses `@qubit-ltd/config` for configuration management. Key configuration options:

```javascript
import config from '@qubit-ltd/config';

// API settings
config.set('api_base_url', 'https://api.example.com');
config.set('http_timeout', 30000);

// Authentication
config.set('app_token_name', 'X-Auth-App-Token');
config.set('app_token_value', 'your-app-token');
config.set('access_token_name', 'X-Auth-User-Token');

// HTTP headers
config.set('http_header_content_type', 'application/json;charset=UTF-8');
config.set('http_header_accept', 'application/json;charset=UTF-8');

// UI settings
config.set('login_page', 'Login');
config.set('social_network', 'WECHAT');
config.set('social_network_app_id', 'your-app-id');
```

## Error Handling

The HTTP client provides automatic error handling for common scenarios:

- **LOGIN_REQUIRED**: Automatically prompts user to re-login
- **TOKEN_EXPIRED**: Handles token expiration and refresh
- **UNAUTHORIZED**: Redirects to login page
- **Network errors**: Shows appropriate error messages

You can disable automatic error handling by setting `skipAutoErrorHandling: true` in request options.

> 📖 **Detailed Documentation**: See [HTTP Object Features and Usage Guide](doc/http-features.md) for more technical details, including long integer handling principles, UI abstraction layer integration, error handling mechanisms, and more.

## TypeScript Support

This library is written in JavaScript but provides TypeScript-friendly APIs. Type definitions are included for better development experience.

## Dependencies

This library requires the following peer dependencies:

- `@qubit-ltd/common-ui`: UI components for loading, alert, confirm
- `@qubit-ltd/config`: Configuration management
- `@qubit-ltd/storage`: Storage utilities
- `@qubit-ltd/logging`: Logging framework
- `axios`: HTTP client
- `pinia`: State management (for BasicUserStore)

## License

Apache License 2.0

## Contributing

Please read our contributing guidelines and submit pull requests to the repository.

## Support

For issues and questions, please use the GitHub issues page.

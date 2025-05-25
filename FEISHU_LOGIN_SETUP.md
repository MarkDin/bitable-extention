# 飞书扫码登录配置指南

## 概述

本项目已集成飞书扫码登录功能，用户可以通过飞书App扫码快速登录系统。

## 功能特性

- ✅ 飞书扫码登录
- ✅ 用户信息获取和显示
- ✅ Token自动刷新
- ✅ 登录状态管理
- ✅ 安全的OAuth2.0流程

## 配置步骤

### 1. 飞书应用信息

**当前配置的应用ID：** `cli_a8848b72377ad00e`

### 2. 配置重定向URI

在飞书开放平台的应用设置中，需要添加以下重定向URI：

**开发环境：**
```
http://localhost:5173/auth/callback
```

**生产环境：**
```
https://yourdomain.com/auth/callback
```

### 3. 设置环境变量（可选）

如果需要覆盖默认配置，可以在项目根目录创建 `.env` 文件：

```bash
# 飞书应用配置
VITE_FEISHU_CLIENT_ID=cli_a8848b72377ad00e
VITE_FEISHU_REDIRECT_URI=http://localhost:5173/auth/callback
```

**注意：** 在Vite项目中，环境变量必须以 `VITE_` 前缀开头才能在客户端代码中访问。

### 4. 权限配置

在飞书开放平台中，确保应用具有以下权限：
- `user:read` - 读取用户基本信息

## 使用方法

### 1. 启动开发服务器

```bash
npm run dev
```

### 2. 访问登录页面

```
http://localhost:5173/login
```

### 3. 扫码登录流程

1. 页面会自动显示飞书登录二维码
2. 使用飞书App扫描二维码
3. 在飞书App中确认授权
4. 自动跳转到主页面并显示用户信息

### 4. 用户信息显示

登录成功后，用户信息会显示在界面中，包括：
- 用户头像
- 用户姓名
- 邮箱地址
- 登录状态

## 代码结构

```
client/src/
├── lib/
│   └── feishuAuth.ts          # 飞书认证服务
├── hooks/
│   └── useFeishuAuth.ts       # 飞书认证Hook
├── components/
│   ├── FeishuQRLogin.tsx      # 扫码登录组件
│   └── UserInfo.tsx           # 用户信息组件
└── pages/
    └── Login.tsx              # 登录页面
```

## 路由配置

- `/login` - 登录页面
- `/auth/callback` - OAuth回调处理页面
- `/` - 主页面（需要登录）
- `/auto-complete` - 字段自动补全页面
- `/config-manager` - 配置管理页面

## API说明

### 认证服务 (feishuAuth.ts)

- `buildAuthUrl()` - 构建授权URL
- `getUserAccessToken()` - 获取访问令牌
- `getUserInfo()` - 获取用户信息
- `refreshAccessToken()` - 刷新访问令牌
- `isLoggedIn()` - 检查登录状态

### 认证Hook (useFeishuAuth.ts)

```typescript
const {
  isAuthenticated,  // 是否已认证
  user,            // 用户信息
  accessToken,     // 访问令牌
  isLoading,       // 加载状态
  error,           // 错误信息
  login,           // 登录函数
  logout,          // 登出函数
  refreshToken,    // 刷新令牌
  clearError       // 清除错误
} = useFeishuAuth(config);
```

## 安全考虑

1. **状态验证**: 使用随机state参数防止CSRF攻击
2. **Token存储**: 访问令牌存储在localStorage中
3. **自动刷新**: Token过期前自动刷新
4. **错误处理**: 完善的错误处理和用户提示

## 故障排除

### 1. 二维码不显示

- 检查网络连接
- 确认飞书SDK加载成功
- 查看浏览器控制台错误

### 2. 扫码后无响应

- 检查重定向URI配置是否正确
- 确认CLIENT_ID正确
- 查看网络请求是否成功

### 3. 登录失败

- 检查应用权限配置
- 确认环境变量设置
- 查看错误提示信息

### 4. 常见错误

**错误：redirect_uri_mismatch**
- 解决：确保重定向URI与飞书开放平台配置完全一致

**错误：invalid_client**
- 解决：检查CLIENT_ID是否正确

**错误：access_denied**
- 解决：用户拒绝授权，请重新扫码

## 开发调试

启动开发服务器：

```bash
npm run dev
```

访问登录页面进行测试：

```
http://localhost:5173/login
```

查看控制台日志了解详细的登录流程。

## 注意事项

1. 确保飞书应用已发布并通过审核
2. 重定向URI必须与配置完全一致（包括协议、域名、端口、路径）
3. 开发环境可以使用HTTP，生产环境建议使用HTTPS
4. 定期检查Token有效期并刷新

## 相关链接

- [飞书开放平台](https://open.feishu.cn/)
- [飞书OAuth文档](https://open.feishu.cn/document/sso/web-application-sso/login-overview)
- [飞书QR SDK文档](https://open.feishu.cn/document/sso/web-application-sso/qr-sdk-documentation) 
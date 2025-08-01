# 更新后的飞书登录流程

## 概述

已成功修改飞书登录功能，采用轮询方案：扫码成功后不跳转页面，使用隐藏iframe触发后端处理，同时轮询后端接口获取用户信息。

## 新的登录流程

### 1. 用户扫码阶段
- 用户访问登录页面 `/login`
- 显示飞书二维码
- 用户使用飞书App扫码

### 2. 触发后端处理阶段
- 扫码成功后获得 `tmp_code` 和 `state`
- 使用隐藏iframe触发飞书服务器处理：
  ```
  https://passport.feishu.cn/suite/passport/oauth/authorize?client_id={CLIENT_ID}&redirect_uri={BACKEND_CALLBACK}&response_type=code&state={STATE}&tmp_code={TMP_CODE}
  ```
- 飞书服务器验证后重定向到后端：
  ```
  https://crm-data-service-dk1543100966.replit.app/auth/callback?code={授权码}&state={状态参数}
  ```
- **关键：用户页面不跳转，继续停留在登录页面**

### 3. 后端处理阶段
后端的 `/auth/callback` 接口需要：
1. 解析 `code` 和 `state` 参数
2. 使用 `code` 获取 `user_access_token`
3. 获取用户信息
4. 将token和用户信息存储到服务器全局map中（以 `state` 为key）
5. **不需要重定向回前端**

### 4. 前端轮询获取用户信息阶段
- iframe触发后端处理的同时，前端开始轮询后端接口
- 轮询调用：
  ```
  GET https://crm-data-service-dk1543100966.replit.app/feishu/user_info?state={状态参数}
  ```
- 轮询设置：最多15次，每次间隔2秒，总共30秒
- 获取到用户信息后：
  - 存储用户信息和token到localStorage
  - 清理state相关数据
  - 跳转到主页面 `/auto-complete`

## 轮询机制说明

### 轮询策略
```javascript
// 轮询配置
const maxRetries = 15; // 最多重试15次
const retryInterval = 2000; // 每次间隔2秒
const totalTimeout = 30000; // 总超时时间30秒

// 轮询逻辑
while (retryCount < maxRetries) {
    try {
        const result = await getUserInfoByState(state);
        // 成功获取用户信息，结束轮询
        break;
    } catch (err) {
        // 失败，继续轮询
        await sleep(2000);
    }
}
```

### 错误处理
- **网络错误**：继续重试直到超时
- **后端未处理完成**：返回404或用户未找到，继续重试
- **超时**：显示"获取用户信息超时，请重试登录"
- **其他错误**：立即停止轮询并显示错误信息

## State参数处理机制

### State生命周期
1. **生成** - 前端生成随机state并存储到localStorage
2. **发送** - 将state发送给飞书服务器
3. **传递** - 飞书服务器将state传递给后端
4. **存储** - 后端以state为key存储用户信息
5. **轮询** - 前端使用相同的state轮询获取用户信息
6. **清理** - 登录完成后清理localStorage中的state

### State一致性
- 扫码时使用的state与轮询时使用的state完全一致
- state存储在localStorage中，确保页面刷新也不丢失
- 登录完成或重试时清理state数据

## 关键修改文件

### 1. `client/src/lib/feishuAuth.ts`
- 添加了 `getUserInfoByState(state)` 函数
- 修改 `buildAuthUrl()` 直接重定向到后端

### 2. `client/src/components/FeishuQRLogin.tsx`
- **核心修改**：使用隐藏iframe触发后端处理
- **核心修改**：实现轮询机制获取用户信息
- 页面不跳转，用户体验流畅

### 3. `client/src/pages/Login.tsx`
- 简化登录组件，去掉重定向处理逻辑
- 保留扫码成功和错误处理

## 后端接口要求

### `/auth/callback` 接口
- **输入**：`?code={授权码}&state={状态参数}`
- **处理**：获取用户信息并存储到全局map（以state为key）
- **输出**：无需重定向，直接返回处理结果即可

### `/feishu/user_info` 接口
- **输入**：`?state={状态参数}`
- **输出**：用户信息和token（格式见 `client/src/lib/callback.md`）
- **错误情况**：
  - 用户未找到：返回404或特定错误码
  - 处理中：返回404或特定错误码（前端会继续轮询）

## 配置说明

- 飞书应用的重定向URI配置为：`https://crm-data-service-dk1543100966.replit.app/auth/callback`
- 前端不处理重定向，使用轮询机制

## 测试流程

1. 访问 `/login` 页面
2. 扫描二维码
3. 确认页面**不跳转**，显示"正在登录..."状态
4. 确认控制台显示轮询日志
5. 确认轮询成功获取用户信息
6. 确认跳转到主页面

## 优势

- **用户体验好**：页面不跳转，过程流畅
- **容错性强**：轮询机制处理网络波动
- **调试友好**：详细的轮询日志
- **安全性高**：state参数验证机制

## 调试信息

前端会输出详细的调试日志，包括：
- iframe创建和清理过程
- 轮询进度和结果
- State参数的生成和使用
- 用户信息获取过程
- 错误和重试情况 
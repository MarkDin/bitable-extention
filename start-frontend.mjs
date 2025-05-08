#!/usr/bin/env node

/**
 * 简单的纯前端启动脚本 - 使用ESM模块格式
 * 适用于Replit环境
 */

import { exec } from 'child_process';

console.log('🚀 正在启动纯前端应用...');
console.log('📢 这是一个纯前端应用，不需要后端服务器');

// 使用 --host 0.0.0.0 参数允许从外部访问
const cmd = 'npx vite --host 0.0.0.0';
console.log(`💻 执行命令: ${cmd}`);

const process = exec(cmd);

// 将子进程的输出附加到主进程
process.stdout.on('data', (data) => {
  console.log(data);
});

process.stderr.on('data', (data) => {
  console.error(data);
});

process.on('exit', (code) => {
  console.log(`🛑 子进程退出，退出码: ${code}`);
});

// 保持脚本运行
console.log('⌛ 服务器已启动...');
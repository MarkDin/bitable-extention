#!/usr/bin/env node

/**
 * 飞书多维表格数据助手 - 纯前端启动脚本
 * 
 * 此脚本用于启动纯前端应用，适用于Windows和类Unix系统
 */

import { spawn } from 'child_process';
import { platform } from 'os';

console.log('正在启动飞书多维表格数据助手...');
console.log('这是一个纯前端应用，不需要后端服务器');

// 根据操作系统选择合适的命令
const isWindows = platform() === 'win32';
const command = isWindows ? 'npx.cmd' : 'npx';
const args = ['vite', '--host', '0.0.0.0'];

// 启动Vite开发服务器
const viteProcess = spawn(command, args, { 
  stdio: 'inherit',
  shell: true
});

// 输出进程信息
console.log(`Vite服务器启动，进程ID: ${viteProcess.pid}`);

// 处理进程退出
viteProcess.on('close', (code) => {
  console.log(`Vite服务器已关闭，退出码: ${code}`);
});

// 处理Ctrl+C信号
process.on('SIGINT', () => {
  console.log('检测到终止信号，正在关闭服务...');
  viteProcess.kill();
  process.exit(0);
});

console.log('\n提示: 按Ctrl+C可以停止服务器\n');

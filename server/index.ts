/**
 * 飞书多维表格插件前端启动服务
 * 使用Vite启动开发环境
 */

import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import express from 'express';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// 创建一个简单的Express应用作为代理，以满足Replit的端口要求
const app = express();
const REPLIT_PORT = 5000; // Replit期望的端口
const VITE_PORT = 5173;   // Vite默认端口

// 简单的健康检查端点
app.get('/health', (req, res) => {
  res.send('OK');
});

// 重定向到Vite服务器
app.get('*', (req, res) => {
  res.redirect(`http://localhost:${VITE_PORT}${req.url}`);
});

// 启动Express服务
const server = http.createServer(app);
server.listen(REPLIT_PORT, () => {
  console.log(`Express代理服务器运行在端口 ${REPLIT_PORT}`);
});

console.log('启动飞书多维表格插件 - 纯前端版本');
console.log('-------------------------------');
console.log('项目已重构为纯前端应用');
console.log('正在启动Vite开发服务器...');

// 启动Vite开发服务器
const viteProcess = exec(`npx vite --host 0.0.0.0 --port ${VITE_PORT}`, {
  cwd: projectRoot
});

// 将Vite输出流转到控制台
viteProcess.stdout?.on('data', (data) => {
  console.log(data.toString().trim());
});

viteProcess.stderr?.on('data', (data) => {
  console.error(data.toString().trim());
});

// 处理退出
viteProcess.on('exit', (code) => {
  console.log(`Vite服务器已退出，退出码: ${code}`);
  server.close(); // 关闭Express服务器
  process.exit(code || 0);
});

// 保持进程运行
process.on('SIGINT', () => {
  console.log('接收到退出信号，正在关闭服务器...');
  viteProcess.kill();
  server.close(); // 关闭Express服务器
  process.exit(0);
});

console.log('服务器启动完成');
console.log(`- Express代理: http://localhost:${REPLIT_PORT}`);
console.log(`- Vite开发服务器: http://localhost:${VITE_PORT}`);
/**
 * 飞书多维表格插件启动脚本
 * 纯前端版本
 */

const { spawn } = require('child_process');
const process = require('process');

console.log('启动飞书多维表格插件前端应用...');

// Vite开发服务器命令
const viteProcess = spawn('npx', ['vite', '--host', '0.0.0.0'], { 
  stdio: 'inherit',
  shell: true
});

console.log(`Vite服务器已启动，进程ID: ${viteProcess.pid}`);
console.log('请在浏览器中访问: http://localhost:5173/');

// 处理退出信号
process.on('SIGINT', () => {
  console.log('接收到退出信号，正在关闭服务器...');
  viteProcess.kill();
  process.exit(0);
});

// 处理子进程退出
viteProcess.on('close', (code) => {
  console.log(`Vite服务器已退出，退出码: ${code}`);
  process.exit(code);
});
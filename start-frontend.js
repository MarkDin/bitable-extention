/**
 * 纯前端启动脚本 - 仅启动Vite开发服务器
 * 设计用于在Replit环境下运行
 */

// 使用ESM导入语法
import { exec } from 'child_process';

console.log('正在启动纯前端应用...');
console.log('这是一个纯前端应用，不需要后端服务器');

// 直接使用exec而不是spawn，简化处理
const viteProcess = exec('npx vite --host 0.0.0.0', (error, stdout, stderr) => {
  if (error) {
    console.error(`执行错误: ${error}`);
    return;
  }
  console.log(`输出: ${stdout}`);
  if (stderr) console.error(`错误: ${stderr}`);
});

// 输出进程信息
console.log(`Vite服务器启动，进程ID: ${viteProcess.pid}`);

// 处理Ctrl+C信号
process.on('SIGINT', () => {
  console.log('检测到终止信号，正在关闭服务...');
  process.exit(0);
});

// 保持进程运行
process.stdin.resume();

console.log('\n提示: 按Ctrl+C可以停止服务器\n');
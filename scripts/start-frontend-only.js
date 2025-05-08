/**
 * 纯前端启动脚本 - 仅启动Vite开发服务器而不需要后端
 * 适用于Windows/macOS/Linux所有平台
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// 判断操作系统类型
const isWindows = os.platform() === 'win32';

// 确定npm可执行文件路径
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

console.log('正在启动纯前端应用...');
console.log('这是一个纯前端实现，无需后端服务器');

// 启动前端Vite开发服务器
const viteProcess = spawn(npmCmd, ['run', 'dev:frontend'], {
  stdio: 'inherit',
  shell: isWindows // Windows需要shell
});

// 处理进程退出
viteProcess.on('close', (code) => {
  console.log(`前端服务器已退出，退出码: ${code}`);
});

// 处理Ctrl+C信号
process.on('SIGINT', () => {
  console.log('检测到终止信号，正在关闭服务...');
  
  if (viteProcess) {
    if (isWindows) {
      // Windows上的进程终止方式不同
      spawn('taskkill', ['/pid', viteProcess.pid, '/f', '/t'], { shell: true });
    } else {
      viteProcess.kill('SIGINT');
    }
  }
  
  process.exit(0);
});

console.log('\n提示: 按Ctrl+C可以停止服务器\n');
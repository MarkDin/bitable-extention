import { useEffect } from 'react';

/**
 * Hash路由重定向组件
 * 检测用户是否访问了错误的URL格式，自动重定向到hash路由
 */
const HashRedirect: React.FC = () => {
    useEffect(() => {
        // 检查当前URL是否使用了hash路由
        const hasHash = window.location.hash;
        const pathname = window.location.pathname;

        // 如果没有hash且路径是根路径，重定向到hash路由
        if (!hasHash && pathname === '/') {
            console.log('检测到访问根路径但未使用hash路由，自动重定向到 /#/');
            window.location.replace('/#/');
            return;
        }

        // 如果访问了其他路径但没有hash，重定向到hash格式
        if (!hasHash && pathname !== '/') {
            console.log(`检测到访问 ${pathname} 但未使用hash路由，自动重定向到 /#${pathname}`);
            window.location.replace(`/#${pathname}`);
            return;
        }
    }, []);

    return null; // 这个组件不渲染任何内容
};

export default HashRedirect;
// 测试代理配置
import axios from 'axios';

async function testProxy() {
    try {
        console.log('测试代理配置...');

        // 测试通过代理访问飞书API
        const response = await axios.post('http://localhost:5000/api/feishu/open-apis/auth/v3/tenant_access_token/internal', {
            app_id: 'cli_a8823c9bb8f4900b',
            app_secret: 'v4HA5OV8oGjzewbdAmHWu3cj65vQBoMq'
        }, {
            headers: {
                'Content-Type': 'application/json',
            }
        });

        console.log('代理配置测试成功！');
        console.log('Token:', response.data.tenant_access_token);

    } catch (error) {
        console.error('代理配置测试失败:', error.response?.data || error.message);
    }
}

testProxy(); 
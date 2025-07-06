import axios from 'axios';

// 飞书应用配置
const FEISHU_APP_ID = 'cli_a8823c9bb8f4900b';
const FEISHU_APP_SECRET = 'v4HA5OV8oGjzewbdAmHWu3cj65vQBoMq';
const APP_TOKEN = 'Tzgpbndy9a6aZfsKuKhcaFT8nag';
const TABLE_ID = 'tblbxDXCWmq9kaCT';

// 创建axios实例
const axiosInstance = axios.create();

async function testReadPermission() {
    try {
        // 1. 获取飞书Token
        console.log('正在获取飞书访问令牌...');
        const tokenResp = await axiosInstance.post('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
            app_id: FEISHU_APP_ID,
            app_secret: FEISHU_APP_SECRET
        });

        const tenant_access_token = tokenResp.data.tenant_access_token;
        console.log('✅ 访问令牌获取成功');

        // 2. 测试表格元数据读取
        console.log('正在测试表格元数据读取...');
        try {
            const metaResp = await axiosInstance.get(
                `https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}`,
                { headers: { Authorization: `Bearer ${tenant_access_token}` } }
            );

            if (metaResp.data.code === 0) {
                console.log('✅ 表格元数据读取成功:', metaResp.data.data.name);
            } else {
                console.log('❌ 表格元数据读取失败:', metaResp.data.msg);
            }
        } catch (metaError) {
            console.log('❌ 表格元数据读取异常:', metaError.response?.data || metaError.message);
        }

        // 3. 测试表格字段读取
        console.log('正在测试表格字段读取...');
        try {
            const fieldsResp = await axiosInstance.get(
                `https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/fields`,
                { headers: { Authorization: `Bearer ${tenant_access_token}` } }
            );

            if (fieldsResp.data.code === 0) {
                console.log('✅ 表格字段读取成功，共', fieldsResp.data.data.items.length, '个字段');
                console.log('字段列表:', fieldsResp.data.data.items.map(f => f.field_name).join(', '));
            } else {
                console.log('❌ 表格字段读取失败:', fieldsResp.data.msg);
            }
        } catch (fieldsError) {
            console.log('❌ 表格字段读取异常:', fieldsError.response?.data || fieldsError.message);
        }

        // 4. 测试记录读取
        console.log('正在测试记录读取...');
        try {
            const recordsResp = await axiosInstance.get(
                `https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records?page_size=10`,
                { headers: { Authorization: `Bearer ${tenant_access_token}` } }
            );

            if (recordsResp.data.code === 0) {
                console.log('✅ 记录读取成功，共', recordsResp.data.data.items.length, '条记录');
                if (recordsResp.data.data.items.length > 0) {
                    const firstRecord = recordsResp.data.data.items[0];
                    console.log('第一条记录示例:', JSON.stringify(firstRecord.fields, null, 2));
                }
            } else {
                console.log('❌ 记录读取失败:', recordsResp.data.msg);
            }
        } catch (recordsError) {
            console.log('❌ 记录读取异常:', recordsError.response?.data || recordsError.message);
        }

        // 5. 测试写入权限（创建一条测试记录）
        console.log('正在测试写入权限...');
        try {
            const testRecord = {
                fields: {
                    id: 999,
                    name: '测试字段',
                    mapping_field: 'test_field',
                    source: 'TEST'
                }
            };

            const writeResp = await axiosInstance.post(
                `https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records`,
                { fields: testRecord.fields },
                { headers: { Authorization: `Bearer ${tenant_access_token}` } }
            );

            if (writeResp.data.code === 0) {
                console.log('✅ 写入权限测试成功，记录ID:', writeResp.data.data.record.record_id);

                // 立即删除测试记录
                try {
                    await axiosInstance.delete(
                        `https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records/${writeResp.data.data.record.record_id}`,
                        { headers: { Authorization: `Bearer ${tenant_access_token}` } }
                    );
                    console.log('✅ 测试记录已清理');
                } catch (deleteError) {
                    console.log('⚠️ 清理测试记录失败，请手动删除:', deleteError.response?.data || deleteError.message);
                }
            } else {
                console.log('❌ 写入权限测试失败:', writeResp.data.msg);
            }
        } catch (writeError) {
            console.log('❌ 写入权限测试异常:', writeError.response?.data || writeError.message);
        }

    } catch (error) {
        console.error('❌ 测试失败:', error.response?.data || error.message);
    }
}

// 执行测试
testReadPermission().catch(console.error); 
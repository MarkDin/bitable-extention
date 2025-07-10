import axios from 'axios';

// 飞书应用配置
const FEISHU_APP_ID = 'cli_a8848b72377ad00e';
const FEISHU_APP_SECRET = 'qJiZZNJaG8dvreToQvVjKfnxqpFLRcNf';
const APP_TOKEN = 'Tzgpbndy9a6aZfsKuKhcaFT8nag';
const TABLE_ID = 'tblbxDXCWmq9kaCT';

// 创建axios实例
const axiosInstance = axios.create();

// 原始字段配置
const fieldsConfig = [
    // NC字段
    { id: 'orderNo', name: '订单ID', mapping_field: 'orderNo', type: 'NC' },
    { id: 'custShortName', name: '客户简称', mapping_field: 'custShortName', type: 'NC' },
    { id: 'materialIndex', name: '产品索引号', mapping_field: 'materialIndex', type: 'NC' },
    { id: 'debitamount', name: '已收款金额', mapping_field: 'debitamount', type: 'NC' },
    { id: 'incomeName', name: '收款协议（NC）', mapping_field: 'incomeName', type: 'NC' },
    { id: 'quantityOnHand', name: '现存量', mapping_field: 'quantityOnHand', type: 'NC' },
    { id: 'salesperson', name: '销售负责人', mapping_field: 'salesperson', type: 'NC' },
    { id: 'deliveryFactory', name: '发货工厂', mapping_field: 'deliveryFactory', type: 'NC' },
    { id: 'custRequestDate', name: '客户要求日期', mapping_field: 'custRequestDate', type: 'NC' },
    { id: 'deliveryDate', name: '签署PI交期', mapping_field: 'deliveryDate', type: 'NC' },
    { id: 'boxOrNot', name: '箱盒是否下单', mapping_field: 'boxOrNot', type: 'NC' },

    // SMOM字段
    { id: 'plannedStartTime', name: '计划开始时间', mapping_field: 'plannedStartTime', type: 'SMOM' },
    { id: 'planEndTime', name: '计划结束时间', mapping_field: 'planEndTime', type: 'SMOM' },

    // TMS字段
    { id: 'bookingStatus', name: '订舱状态', mapping_field: 'bookingStatus', type: 'TMS' },
    { id: 'etd', name: 'ETD', mapping_field: 'etd', type: 'TMS' },
    { id: 'eta', name: 'ETA', mapping_field: 'eta', type: 'TMS' },
    { id: 'loadDate', name: '装柜时间', mapping_field: 'loadDate', type: 'TMS' },
    { id: 'needShipment', name: '是否需要出货', mapping_field: 'needShipment', type: 'TMS' },

    // CRM字段
    { id: 'customerCode', name: '客户编码', mapping_field: 'customerCode', type: 'CRM' },
    { id: 'custName', name: '客户全称', mapping_field: 'custName', type: 'CRM' },
    { id: 'country', name: '客户国家', mapping_field: 'country', type: 'CRM' },
    { id: 'publicSea', name: '所属区域公海', mapping_field: 'publicSea', type: 'CRM' },
    { id: 'publicSeaPoolStatus', name: '公海池状态', mapping_field: 'publicSeaPoolStatus', type: 'CRM' },
    { id: 'paymentPeriod', name: '账期', mapping_field: 'paymentPeriod', type: 'CRM' },
    { id: 'collectionAgreement', name: '收款协议（CRM）', mapping_field: 'collectionAgreement', type: 'CRM' },
    { id: 'estimatedRecoveryTime', name: '预计回收时间', mapping_field: 'estimatedRecoveryTime', type: 'CRM' },

    // MRP字段
    { id: 'isDraft', name: '图稿状态', mapping_field: 'isDraft', type: 'MRP' },
];

async function main() {
    try {
        // 1. 获取飞书Token
        console.log('正在获取飞书访问令牌...');
        const tokenResp = await axiosInstance.post('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
            app_id: FEISHU_APP_ID,
            app_secret: FEISHU_APP_SECRET
        });

        const tenant_access_token = tokenResp.data.tenant_access_token;
        console.log('访问令牌获取成功', tenant_access_token);

        // 2. 清空现有记录（可选）
        try {
            console.log('正在获取现有记录...');
            let has_more = true;
            let page_token = '';
            let existingRecordIds = [];

            while (has_more) {
                const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records?page_size=100${page_token ? `&page_token=${page_token}` : ''}`;
                const resp = await axiosInstance.get(url, {
                    headers: { Authorization: `Bearer ${tenant_access_token}` }
                });

                if (resp.data.code !== 0) {
                    console.warn('获取现有记录失败:', resp.data.msg);
                    break;
                }

                const records = resp.data.data.items || [];
                existingRecordIds = existingRecordIds.concat(records.map(r => r.record_id));
                has_more = resp.data.data.has_more;
                page_token = resp.data.data.page_token;
            }

            if (existingRecordIds.length > 0) {
                console.log(`正在删除 ${existingRecordIds.length} 条现有记录...`);
                // 批量删除现有记录
                const batchSize = 100;
                for (let i = 0; i < existingRecordIds.length; i += batchSize) {
                    const batch = existingRecordIds.slice(i, i + batchSize);
                    await axiosInstance.post(
                        `https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records/batch_delete`,
                        { records: batch },  // 直接传递record_id字符串数组
                        { headers: { Authorization: `Bearer ${tenant_access_token}` } }
                    );
                }
                console.log('现有记录删除完成');
            }
        } catch (cleanupError) {
            console.warn('清理现有记录失败，继续写入新记录:', cleanupError.message);
        }

        // 3. 转换字段配置为多维表格记录格式
        console.log('正在转换字段配置...');
        const records = fieldsConfig.map((field, index) => ({
            fields: {
                // 根据写入规则转换
                id: index + 1,  // id字段替换为数字，从1开始编号
                name: field.name,
                mapping_field: field.mapping_field,
                source: field.type  // type对应表格中的source字段
                // 不写入isChecked和isDisabled字段
            }
        }));

        console.log(`准备写入 ${records.length} 条记录到多维表格...`);

        // 4. 分批写入记录（飞书API限制每次最多500条）
        const batchSize = 100;
        for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);

            console.log(`正在写入第 ${Math.floor(i / batchSize) + 1} 批，共 ${batch.length} 条记录...`);

            const addRecordsResp = await axiosInstance.post(
                `https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records/batch_create`,
                {
                    records: batch
                },
                {
                    headers: {
                        Authorization: `Bearer ${tenant_access_token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (addRecordsResp.data.code !== 0) {
                throw new Error(`写入失败: ${addRecordsResp.data.msg}`);
            }

            console.log(`第 ${Math.floor(i / batchSize) + 1} 批写入成功`);
        }

        console.log('✅ 字段配置写入完成！');
        console.log(`📊 共写入 ${fieldsConfig.length} 条字段配置记录`);
        console.log(`🔗 表格链接: https://global-intco.feishu.cn/base/${APP_TOKEN}?table=${TABLE_ID}`);

    } catch (error) {
        console.error('❌ 写入字段配置失败:', error.response?.data || error.message);
        process.exit(1);
    }
}

// 执行主函数
main().catch(console.error); 
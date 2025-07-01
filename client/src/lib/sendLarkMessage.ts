const sendUrl = 'https://open.feishu.cn/open-apis/bot/v2/hook/5b3ac02c-c18f-4263-af51-abaf655dbbac'

// 卡片模板配置
// 请在飞书开放平台的搭建工具中创建卡片模板，并替换以下配置
const CARD_TEMPLATE_CONFIG = {
    template_id: 'AAqIYhbgzY69r', // 请替换为实际的模板ID，在搭建工具中复制卡片模板ID获取
    template_version_name: '1.0.0' // 请替换为实际的版本号，若不填将使用最新版本
};

// 模板变量映射配置
// 这些变量名称需要与飞书搭建工具中定义的变量名称一致
const TEMPLATE_VARIABLES = {
    FIELD_LIST: 'field_list',        // 补全的字段列表
    COMPLETE_ROW_COUNT: 'complete_row_count', // 补全行数
    START_TIME: 'start_time',        // 补全开始时间
    END_TIME: 'end_time',          // 补全结束时间
    COMPLETE_RESULT: 'complete_result',   // 补全结果
    DOC_LINK: 'doc_link'           // 多维表格链接
};

// 操作日志接口定义
interface OperationLog {
    submitTime: string;
    endTime: string;
    selectedFields: string[];
    totalRows: number;
    completionResult: {
        status: 'success' | 'partial' | 'failed' | 'no_permission' | 'noChange';
        successCount: number;
        errorCount: number;
        unchangedCount: number;
        fieldCreationErrors?: string[]; // 字段创建错误信息
    };
    bitableUrl: string;
    tableName: string;
    tableId: string;
}

/**
 * 验证卡片模板配置
 * @returns 配置是否有效
 */
function validateTemplateConfig(): boolean {
    if (!CARD_TEMPLATE_CONFIG.template_id || CARD_TEMPLATE_CONFIG.template_id === 'AAqyBQVmUNxxx') {
        console.warn('[SendLarkMessage] 警告：请配置正确的卡片模板ID');
        return false;
    }
    return true;
}

/**
 * 发送操作日志到飞书群聊 - 使用卡片模板
 * @param log 操作日志对象
 */
export async function sendOperationLogToFeishu(log: OperationLog): Promise<boolean> {
    return false;
    try {
        // 验证配置
        if (!validateTemplateConfig()) {
            console.error('[SendLarkMessage] 卡片模板配置无效，请检查 template_id');
            return false;
        }

        // 格式化时间
        const formatTime = (isoString: string) => {
            const date = new Date(isoString);
            return date.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZone: 'Asia/Shanghai'
            });
        };

        // 根据状态确定补全结果文本
        const getCompleteResultText = (result: OperationLog['completionResult']) => {
            let statusText = '';
            switch (result.status) {
                case 'success':
                    statusText = '✅全部正确';
                    break;
                case 'partial':
                    statusText = `⚠️部分成功：成功${result.successCount}行，失败${result.errorCount}行`;
                    break;
                case 'failed':
                    statusText = `❌补全失败：${result.errorCount}行失败`;
                    break;
                case 'no_permission':
                    statusText = '🔒权限不足';
                    break;
                case 'noChange':
                    statusText = '📝无需更新';
                    break;
                default:
                    statusText = '📊处理完成';
                    break;
            }

            // 如果有字段创建错误，添加到结果文本中
            if (result.fieldCreationErrors && result.fieldCreationErrors.length > 0) {
                statusText += `\n🔧字段创建问题：${result.fieldCreationErrors.join('；')}`;
            }

            return statusText;
        };

        // 构建字段列表文本
        const fieldListText = `补全${log.selectedFields.length}个字段: ${log.selectedFields.join('、')}`;

        // 构建卡片模板消息
        const templateMessage = {
            msg_type: "interactive",
            card: {
                type: "template",
                data: {
                    template_id: CARD_TEMPLATE_CONFIG.template_id,
                    template_version_name: CARD_TEMPLATE_CONFIG.template_version_name,
                    template_variable: {
                        // 根据模板变量映射数据
                        [TEMPLATE_VARIABLES.FIELD_LIST]: fieldListText,                    // 补全的字段
                        [TEMPLATE_VARIABLES.COMPLETE_ROW_COUNT]: log.totalRows,             // 补全行数
                        [TEMPLATE_VARIABLES.START_TIME]: formatTime(log.submitTime),        // 补全开始时间
                        [TEMPLATE_VARIABLES.END_TIME]: formatTime(log.endTime),             // 补全结束时间
                        [TEMPLATE_VARIABLES.COMPLETE_RESULT]: getCompleteResultText(log.completionResult), // 补全结果
                        [TEMPLATE_VARIABLES.DOC_LINK]: log.bitableUrl                       // 多维表格链接
                    }
                }
            }
        };

        console.log('[SendLarkMessage] 发送飞书卡片模板:', JSON.stringify(templateMessage, null, 2));

        // 发送到飞书
        const response = await fetch(sendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(templateMessage)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[SendLarkMessage] 发送失败:', response.status, errorText);

            // 解析错误信息
            try {
                const errorData = JSON.parse(errorText);
                if (errorData.msg) {
                    console.error('[SendLarkMessage] 错误详情:', errorData.msg);
                }
            } catch (e) {
                // 忽略JSON解析错误
            }

            return false;
        }

        const result = await response.json();
        console.log('[SendLarkMessage] 发送成功:', result);

        // 检查返回结果
        if (result.code !== 0) {
            console.error('[SendLarkMessage] 业务错误:', result.msg);
            return false;
        }

        return true;

    } catch (error) {
        console.error('[SendLarkMessage] 发送操作日志失败:', error);
        return false;
    }
}

/**
 * 发送简单文本消息到飞书
 * @param text 消息内容
 */
export async function sendTextToFeishu(text: string): Promise<boolean> {
    try {
        const message = {
            msg_type: "text",
            content: {
                text: text
            }
        };

        const response = await fetch(sendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message)
        });

        if (!response.ok) {
            console.error('[SendLarkMessage] 发送文本消息失败:', response.status);
            return false;
        }

        const result = await response.json();
        console.log('[SendLarkMessage] 文本消息发送成功:', result);
        return true;

    } catch (error) {
        console.error('[SendLarkMessage] 发送文本消息失败:', error);
        return false;
    }
}

/**
 * 测试卡片模板配置 - 发送测试消息
 * @returns 测试是否成功
 */
export async function testCardTemplate(): Promise<boolean> {
    const testLog: OperationLog = {
        submitTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 5000).toISOString(), // 5秒后
        selectedFields: ['ETA', '价格', '到期时间'],
        totalRows: 2,
        completionResult: {
            status: 'success',
            successCount: 2,
            errorCount: 0,
            unchangedCount: 0,
            fieldCreationErrors: [] // 测试时无字段创建错误
        },
        bitableUrl: 'https://example.com/test-table',
        tableName: '测试表格',
        tableId: 'test_table_id'
    };

    console.log('[SendLarkMessage] 发送测试卡片...');
    return await sendOperationLogToFeishu(testLog);
}
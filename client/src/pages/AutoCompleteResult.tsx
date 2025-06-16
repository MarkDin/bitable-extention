import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import React from 'react';

interface AutoCompleteResultProps {
    status: 'success' | 'partial' | 'failed' | 'no_permission' | 'noChange';
    successCount: number;
    errorCount: number;
    unchangedCount: number;
    onReturn: () => void;
}

const AutoCompleteResult: React.FC<AutoCompleteResultProps> = ({
    status,
    successCount,
    errorCount,
    unchangedCount,
    onReturn
}) => {
    const getStatusConfig = () => {
        switch (status) {
            case 'no_permission':
                return {
                    icon: <XCircle className="w-16 h-16 text-red-500" />,
                    message: '数据补全失败: 无当前表格编辑权限',
                    color: 'text-red-500',
                    bgColor: 'bg-red-50'
                };
            case 'success':
                return {
                    icon: <CheckCircle className="w-16 h-16 text-green-500" />,
                    message: '数据补全成功，数据是否更新见「补全状态」列',
                    color: 'text-green-500',
                    bgColor: 'bg-green-50'
                };
            case 'partial':
                return {
                    icon: <AlertCircle className="w-16 h-16 text-orange-500" />,
                    message: '数据补全完成，失败数据详见「补全状态」列',
                    color: 'text-orange-500',
                    bgColor: 'bg-orange-50'
                };
            case 'noChange':
                return {
                    icon: <CheckCircle className="w-16 h-16 text-blue-500" />,
                    message: '当前数据已经是最新',
                    color: 'text-blue-500',
                    bgColor: 'bg-blue-50'
                };
            case 'failed':
            default:
                return {
                    icon: <XCircle className="w-16 h-16 text-red-500" />,
                    message: '数据补全失败: 失败原因',
                    color: 'text-red-500',
                    bgColor: 'bg-red-50'
                };
        }
    };

    const statusConfig = getStatusConfig();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
            <div className="w-full max-w-md">

                {/* 顶部提示 */}
                <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg w-full">
                    <div className="flex items-center text-blue-700">
                        <div className="w-4 h-4 bg-blue-500 rounded-full mr-2 flex-shrink-0"></div>
                        <span className="text-sm">如需帮助，请点击加入反馈群</span>
                    </div>
                </div>

                {/* 插图区域 */}
                <div className="flex justify-center mb-8">
                    <div className={`w-48 h-48 ${statusConfig.bgColor} rounded-lg flex items-center justify-center`}>
                        {statusConfig.icon}
                    </div>
                </div>

                {/* 结果文案 */}
                <div className="text-center mb-8">
                    <p className={`text-lg font-medium ${statusConfig.color}`}>
                        {statusConfig.message}
                    </p>

                    {/* 统计信息 */}
                    {(successCount > 0 || errorCount > 0 || unchangedCount > 0) && (
                        <div className="mt-4 text-sm text-gray-600 space-y-1">
                            {successCount > 0 && (
                                <div>成功更新: {successCount} 条</div>
                            )}
                            {unchangedCount > 0 && (
                                <div>无变化: {unchangedCount} 条</div>
                            )}
                            {errorCount > 0 && (
                                <div className="text-red-500 font-bold">失败: {errorCount} 条</div>
                            )}
                        </div>
                    )}
                </div>

                {/* 返回按钮 */}
                <Button
                    onClick={onReturn}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                >
                    返回
                </Button>
            </div>
        </div>
    );
};

export default AutoCompleteResult; 
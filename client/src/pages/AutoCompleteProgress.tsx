import { Progress } from "@/components/ui/progress";
import React from 'react';

interface AutoCompleteProgressProps {
    completedCount: number;
    totalCount: number;
}

const AutoCompleteProgress: React.FC<AutoCompleteProgressProps> = ({
    completedCount,
    totalCount
}) => {
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
            <div className="w-full max-w-md">
                {/* 插图区域 */}
                <div className="flex justify-center mb-8">
                    <div className="w-48 h-48 bg-blue-100 rounded-lg flex items-center justify-center">
                        <div className="text-6xl">📊</div>
                    </div>
                </div>

                {/* 进度条 */}
                <div className="mb-6">
                    <Progress value={percentage} className="h-2 mb-2" />
                    <div className="text-center text-sm text-gray-600">
                        {completedCount}/{totalCount} ({percentage}%)
                    </div>
                </div>

                {/* 提示文案 */}
                <div className="text-center mb-8">
                    <p className="text-lg text-gray-800">
                        数据补全中，
                        <span className="text-red-500 font-medium">请勿关闭插件</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AutoCompleteProgress; 
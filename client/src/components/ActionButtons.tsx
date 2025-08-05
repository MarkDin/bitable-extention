import { cn } from '@/lib/utils';
import React from 'react';

interface ActionButtonsProps {
  onApply: () => void;
  isApplyDisabled: boolean;
  isLoading: boolean;
  hasError: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onApply, isApplyDisabled, isLoading, hasError }) => {
  return (
    <div className="bg-white  py-4 flex-shrink-0">
      {hasError && (
        <div className="mb-3 text-xs text-[#f04438]">
          ⚠️ 字段配置加载失败，使用默认配置
        </div>
      )}
      <button
        onClick={onApply}
        disabled={isApplyDisabled || isLoading}
        className={cn(
          "w-full h-11 text-white text-sm font-medium rounded-lg transition-colors",
          (isApplyDisabled || isLoading)
            ? "bg-[#d0d5dd] cursor-not-allowed"
            : "bg-[#165dff] hover:bg-[#1570ef]"
        )}
      >
        {isLoading ? "加载中..." : "开始同步数据"}
      </button>
    </div>
  );
};

export default ActionButtons;

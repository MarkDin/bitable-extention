import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";
import React from "react";

interface ActionButtonsProps {
  onCancel: () => void;
  onApply: () => void;
  isLoading?: boolean;
  applyText?: string;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onCancel,
  onApply,
  isLoading = false,
}) => {
  return (
    <div className="flex space-x-2">
      <Button
        className="flex-1 bg-primary text-white"
        onClick={onApply}
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            处理中...
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <UploadCloud className="w-4 h-4 mr-1" />
            补全
          </div>
        )}
      </Button>
    </div>
  );
};

export default ActionButtons;

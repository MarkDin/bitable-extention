import React from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export interface Mapping {
  id: number;
  sourceField: string;
  targetField: string;
  isActive: boolean;
}

interface FieldMappingProps {
  mappings: Mapping[];
  onToggle: (id: number, isActive: boolean) => void;
  onEditMappings: () => void;
}

const FieldMapping: React.FC<FieldMappingProps> = ({
  mappings,
  onToggle,
  onEditMappings,
}) => {
  return (
    <div className="mb-6">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium">字段映射</span>
        <button 
          className="text-xs text-primary"
          onClick={onEditMappings}
        >
          编辑映射
        </button>
      </div>
      
      <div className="border border-[#E5E6EB] rounded-md divide-y divide-[#E5E6EB]">
        {mappings.map((mapping) => (
          <div key={mapping.id} className="flex items-center p-3">
            <div className="flex-1">
              <div className="font-medium text-sm">{mapping.sourceField}</div>
              <div className="text-xs text-[#86909C]">映射至：{mapping.targetField}</div>
            </div>
            <Switch 
              checked={mapping.isActive}
              onCheckedChange={(checked) => onToggle(mapping.id, checked)}
              className={cn(
                "data-[state=checked]:bg-primary"
              )}
            />
          </div>
        ))}
        
        {mappings.length === 0 && (
          <div className="p-3 text-center text-[#86909C] text-sm">
            暂无字段映射，请点击"编辑映射"添加
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldMapping;

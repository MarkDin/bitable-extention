import React from "react";
import { cn } from "@/lib/utils";

export interface FieldDiff {
  field: string;
  oldValue: string | null;
  newValue: string | null;
  status: "unchanged" | "added" | "changed" | "removed";
}

interface CompanyData {
  name: string;
  industry: string;
  logo: string;
  fields: FieldDiff[];
}

interface DataPreviewProps {
  data: CompanyData | null;
  isLoading: boolean;
}

const DataPreview: React.FC<DataPreviewProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="p-4 border-t border-[#E5E6EB]">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium">数据预览</h3>
          <span className="text-xs text-[#86909C]">正在加载...</span>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-12 bg-gray-200 rounded-md"></div>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded-md"></div>
            <div className="h-8 bg-gray-200 rounded-md"></div>
            <div className="h-8 bg-gray-200 rounded-md"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 border-t border-[#E5E6EB]">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium">数据预览</h3>
        </div>
        <div className="text-center py-8 text-[#86909C]">
          <p>无数据</p>
          <p className="text-xs mt-1">请选择查询字段和数据源进行查询</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-[#E5E6EB]">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium">数据预览</h3>
        <span className="text-xs text-[#86909C]">找到 1 条匹配记录</span>
      </div>
      
      {/* Company Card */}
      <div className="mb-4 border border-[#E5E6EB] rounded-md overflow-hidden">
        {/* Company Header */}
        <div className="flex items-center p-3 bg-[#F2F3F5]">
          <img 
            src={data.logo}
            alt={`${data.name} logo`} 
            className="w-8 h-8 rounded-md object-cover"
          />
          <div className="ml-2">
            <div className="font-medium">{data.name}</div>
            <div className="text-xs text-[#86909C]">{data.industry}</div>
          </div>
        </div>
        
        {/* Data Field Comparison */}
        <div className="divide-y divide-[#E5E6EB]">
          {data.fields.map((field, index) => (
            <div 
              key={index} 
              className={cn(
                "flex p-3",
                field.status === "added" && "diff-highlight-add",
                field.status === "changed" && "diff-highlight-change"
              )}
            >
              <div className="w-28 text-sm text-[#86909C]">{field.field}</div>
              <div className="flex-1 text-sm">
                {field.status === "unchanged" && field.newValue}
                
                {field.status === "added" && field.newValue}
                
                {field.status === "changed" && (
                  <div className="flex items-center">
                    <span className="line-through text-[#86909C]">{field.oldValue}</span>
                    <svg className="w-4 h-4 mx-1 text-warning" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"></path>
                    </svg>
                    <span>{field.newValue}</span>
                  </div>
                )}
                
                {field.status === "removed" && (
                  <span className="line-through text-[#86909C]">{field.oldValue}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DataPreview;

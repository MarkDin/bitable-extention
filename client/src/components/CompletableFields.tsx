import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiService } from '@/lib/apiService';
import { Field } from '@/lib/dataSync';
import { Info } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface CompletableFieldsProps {
  fields: Field[];
  selectedFields: Field[];
  onSelectionChange: (fields: Field[]) => void;
}

interface FieldStatus {
  field: Field;
  existsInTable: boolean;
  fieldType?: string;
}

const CompletableFields: React.FC<CompletableFieldsProps> = ({ fields, selectedFields, onSelectionChange }) => {
  const [fieldStatuses, setFieldStatuses] = useState<FieldStatus[]>([]);
  const [loading, setLoading] = useState(true);

  // 检查字段是否在表格中已存在
  useEffect(() => {
    const checkFieldsExistence = async () => {
      if (!fields?.length) {
        setLoading(false);
        return;
      }

      try {
        const tableFields = await apiService.getAllFields();
        const tableFieldNames = await Promise.all(
          tableFields.map(async (f) => ({
            name: await f.getName(),
            type: await f.getType(),
            id: f.id
          }))
        );

        const statuses: FieldStatus[] = fields.map(field => {
          const existingField = tableFieldNames.find(tf => tf.name === field.mapping_field);
          return {
            field,
            existsInTable: !!existingField,
            fieldType: existingField?.type?.toString()
          };
        });

        setFieldStatuses(statuses);

        // 自动选中已存在的字段
        const existingFields = statuses
          .filter(status => status.existsInTable)
          .map(status => status.field);

        // 合并已存在的字段和用户已选择的字段（去重）
        const newSelectedFields = [...selectedFields];
        existingFields.forEach(field => {
          const exists = newSelectedFields.some(f =>
            f.name === field.name && f.mapping_field === field.mapping_field
          );
          if (!exists) {
            newSelectedFields.push(field);
          }
        });

        if (newSelectedFields.length !== selectedFields.length) {
          onSelectionChange(newSelectedFields);
        }
      } catch (error) {
        console.error('检查字段存在性失败:', error);
      } finally {
        setLoading(false);
      }
    };

    checkFieldsExistence();
  }, [fields]);

  if (!fields?.length) {
    return null;
  }

  const handleToggle = (fieldStatus: FieldStatus) => {
    // 如果字段已存在于表格中，不允许取消勾选
    if (fieldStatus.existsInTable) {
      return;
    }

    const field = fieldStatus.field;
    const exists = selectedFields.some(f => f.name === field.name && f.mapping_field === field.mapping_field);
    const newSelection = exists
      ? selectedFields.filter(f => !(f.name === field.name && f.mapping_field === field.mapping_field))
      : [...selectedFields, field];
    onSelectionChange(newSelection);
  };

  const isFieldSelected = (field: Field) => {
    return selectedFields.some(f => f.name === field.name && f.mapping_field === field.mapping_field);
  };

  const getFieldStatusText = (status: FieldStatus) => {
    if (status.existsInTable) {
      return '已存在';
    }
    return '新增';
  };

  if (loading) {
    return (
      <div className="mb-6">
        <div className="mb-2 flex items-center">
          <h3 className="text-base font-normal text-[#1D2129]">请选择要补全的字段</h3>
          <span className="ml-2 text-xs text-[#86909C]">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center">
        <h3 className="block text-base font-semibold mb-1">请选择要补全的字段</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="ml-2 h-4 w-4 text-[#86909C] cursor-help" />
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="bg-white border border-[#E5E6EB] shadow-lg rounded-lg p-3 max-w-[280px]"
              sideOffset={5}
            >
              <div className="text-sm space-y-2">
                <div className="flex items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C9CDD4] mt-1.5 mr-2 flex-shrink-0"></div>
                  <span className="text-[#1D2129] leading-5">灰色默认勾选的字段是多维表格中已存在的字段，提交后会自动更新</span>
                </div>
                <div className="flex items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C9CDD4] mt-1.5 mr-2 flex-shrink-0"></div>
                  <span className="text-[#1D2129] leading-5">新增勾选的字段，会在多维表格最后插入新列</span>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span className="ml-2 text-xs text-[#86909C]">({fields.length})</span>
      </div>
      <div className="flex flex-col gap-2">
        {fieldStatuses.map((fieldStatus, index) => (
          <div
            key={index}
            className={`flex items-center py-2 px-4 ${fieldStatus.existsInTable ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center flex-1">
              <Checkbox
                id={`field-${index}`}
                checked={isFieldSelected(fieldStatus.field)}
                onCheckedChange={() => handleToggle(fieldStatus)}
                disabled={fieldStatus.existsInTable}
                className={fieldStatus.existsInTable ? 'cursor-not-allowed' : 'cursor-pointer'}
              />
              <label
                htmlFor={`field-${index}`}
                className={`text-base ml-2 font-normal flex-1 text-[#1D2129] ${fieldStatus.existsInTable
                  ? 'cursor-not-allowed'
                  : 'cursor-pointer'
                  }`}
              >
                {fieldStatus.field.mapping_field}
              </label>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-sm ${fieldStatus.existsInTable ? 'bg-[#F2F3F5] text-[#86909C]' : 'bg-[#E8FFEA] text-[#00B42A]'
              }`}>
              {getFieldStatusText(fieldStatus)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompletableFields;

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

  const getFieldStatusColor = (status: FieldStatus) => {
    if (status.existsInTable) {
      return 'text-[#165DFF] bg-[#E8F3FF]';
    }
    return 'text-[#00B42A] bg-[#E8F7FF]';
  };

  if (loading) {
    return (
      <div className="mb-6">
        <div className="mb-2 flex items-center">
          <h3 className="font-medium">请选择要补全的字段</h3>
          <span className="ml-2 text-xs text-[#86909C]">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center">
        <h3 className="font-medium">请选择要补全的字段</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="ml-2 h-4 w-4 text-[#86909C] cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <div className="text-sm space-y-1">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-[#86909C] mr-2"></div>
                  <span>灰色默认勾选的字段是多维表格中已存在的字段，提交后会自动更新</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-[#86909C] mr-2"></div>
                  <span>新增勾选的字段，会在多维表格最后插入新列</span>
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
            className={`flex items-center justify-between py-2 px-4 border rounded ${fieldStatus.existsInTable
              ? 'border-[#165DFF] bg-[#F7F8FA]'
              : 'border-[#e5e6eb] bg-white'
              }`}
          >
            <div className="flex items-center flex-1">
              <Checkbox
                id={`field-${index}`}
                checked={isFieldSelected(fieldStatus.field)}
                onCheckedChange={() => handleToggle(fieldStatus)}
                disabled={fieldStatus.existsInTable}
              />
              <label
                htmlFor={`field-${index}`}
                className={`text-sm ml-2 font-medium flex-1 ${fieldStatus.existsInTable
                  ? 'text-[#165DFF] cursor-default'
                  : 'text-[#1d2129] cursor-pointer'
                  }`}
              >
                {fieldStatus.field.mapping_field}
              </label>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded ${getFieldStatusColor(fieldStatus)}`}>
              {getFieldStatusText(fieldStatus)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompletableFields;

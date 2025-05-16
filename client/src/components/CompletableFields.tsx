
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface CompletableFieldsProps {
  fields: Array<{ name: string; mapping_field: string }>;
  selectedFields: string[];
  onSelectionChange: (fields: string[]) => void;
}

const CompletableFields: React.FC<CompletableFieldsProps> = ({ fields, selectedFields, onSelectionChange }) => {
  if (!fields?.length) {
    return null;
  }

  const handleToggle = (field: string) => {
    const newSelection = selectedFields.includes(field)
      ? selectedFields.filter(f => f !== field)
      : [...selectedFields, field];
    onSelectionChange(newSelection);
  };

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center">
        <h3 className="font-medium">可补全字段</h3>
        <span className="ml-2 text-xs text-[#86909C]">({fields.length})</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {fields.map((field, index) => (
          <div key={index} className="flex items-center space-x-2 bg-secondary rounded-md px-2 py-1">
            <Checkbox
              id={`field-${index}`}
              checked={selectedFields.includes(field.name)}
              onCheckedChange={() => handleToggle(field.name)}
            />
            <label htmlFor={`field-${index}`} className="text-xs cursor-pointer">
              {field.mapping_field}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompletableFields;

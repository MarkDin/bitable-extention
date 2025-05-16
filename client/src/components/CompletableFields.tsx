import { Checkbox } from '@/components/ui/checkbox';
import { Config, Field } from '@/lib/dataSync';
import React from 'react';

interface CompletableFieldsProps {
  fields: Field[];
  selectedFields: Field[];
  onSelectionChange: (fields: Field[]) => void;
}

const CompletableFields: React.FC<CompletableFieldsProps> = ({ fields, selectedFields, onSelectionChange }) => {
  if (!fields?.length) {
    return null;
  }

  const handleToggle = (field: Field) => {
    const exists = selectedFields.some(f => f.name === field.name && f.mapping_field === field.mapping_field);
    const newSelection = exists
      ? selectedFields.filter(f => !(f.name === field.name && f.mapping_field === field.mapping_field))
      : [...selectedFields, field];
    onSelectionChange(newSelection);
  };

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center">
        <h3 className="font-medium">可补全字段</h3>
        <span className="ml-2 text-xs text-[#86909C]">({fields.length})</span>
      </div>
      <div className="flex flex-col gap-2">
        {fields.map((field, index) => (
          <div
            key={index}
            className="flex items-center py-2 px-4 border border-[#e5e6eb] rounded bg-white"
          >
            <Checkbox
              id={`field-${index}`}
              checked={selectedFields.some(f => f.name === field.name && f.mapping_field === field.mapping_field)}
              onCheckedChange={() => handleToggle(field)}
            />
            <label htmlFor={`field-${index}`} className="text-sm cursor-pointer ml-2 font-medium text-[#1d2129]">
              {field.mapping_field}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompletableFields;

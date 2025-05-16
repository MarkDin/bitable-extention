
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface CompletableFieldsProps {
  fields: Array<{ name: string; mapping_field: string }>;
}

const CompletableFields: React.FC<CompletableFieldsProps> = ({ fields }) => {
  if (!fields?.length) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center">
        <h3 className="font-medium">可补全字段</h3>
        <span className="ml-2 text-xs text-[#86909C]">({fields.length})</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {fields.map((field, index) => (
          <Badge key={index} variant="secondary" className="text-xs">
            {field.mapping_field}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default CompletableFields;

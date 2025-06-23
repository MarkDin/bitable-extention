// 定义字段类型
type FieldType = 'NC' | 'SMOM' | 'TMS' | 'CRM' | 'MRP' | '赛意';

export interface Field {
    id: string;
    name: string;  // 对应 systemName
    type: FieldType;  // 对应 source
    isChecked: boolean;
    isDisabled?: boolean;
    helperText?: string;
    mapping_field: string;  // 对应 key
}

export type { FieldType };

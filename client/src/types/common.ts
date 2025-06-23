// 定义字段类型
type FieldType = 'NC' | '赛意' | 'TMS';

interface Field {
    id: string;
    name: string;
    type: FieldType;
    isChecked: boolean;
    isDisabled?: boolean;
    helperText?: string;
}

export type { Field, FieldType };
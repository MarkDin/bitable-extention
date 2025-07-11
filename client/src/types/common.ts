export interface Field {
    id: string;
    name: string;  // 对应 systemName
    type: string;  // 对应 source
    isChecked: boolean;
    isDisabled?: boolean;
    helperText?: string;
    mapping_field: string;  // 对应 key
}

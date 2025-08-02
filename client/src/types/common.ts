export interface Field {
    id: string;
    name: string;  // 对应 systemName
    type: string;  // 对应 source
    isChecked: boolean;
    isDisabled?: boolean;
    helperText?: string;
    mapping_field: string;  // 对应 key
    // 新增字段映射关系
    targetFieldId?: string;  // 映射到的目标字段ID
    targetFieldName?: string; // 映射到的目标字段名称
    mappingType?: 'existing' | 'new'; // 映射类型：existing=填充到现有列，new=新增列
    // 警告状态
    hasWarning?: boolean; // 是否有警告
    warningMessage?: string; // 警告信息
}

// 表格字段接口
export interface TableField {
    id: string;
    name: string;
    type: string;
}

// 表格字段配置接口 - 用于保存每个表格的字段配置
export interface TableFieldConfig {
    tableId: string;
    tableName: string;
    fieldConfigs: {
        fieldId: string;
        fieldName: string;
        isChecked: boolean;
        targetFieldId?: string;
        targetFieldName?: string;
        mappingType: 'existing' | 'new';
    }[];
    lastUpdated: string;
}

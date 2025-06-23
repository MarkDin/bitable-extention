import { cn } from '@/lib/utils';
import { Field, FieldType } from "@/types/common";

// 标签样式配置
const tagStyles: Record<FieldType, { bg: string; text: string }> = {
    'NC': { bg: 'bg-[#f5e8ff]', text: 'text-[#722ed1]' },
    'SMOM': { bg: 'bg-[#fff3e8]', text: 'text-[#ff8800]' },
    'TMS': { bg: 'bg-[#e8f3ff]', text: 'text-[#165dff]' },
    'CRM': { bg: 'bg-[#e8ffea]', text: 'text-[#00d437]' },
    'MRP': { bg: 'bg-[#ffe8f1]', text: 'text-[#ff0066]' },
    '赛意': { bg: 'bg-[#e8fffb]', text: 'text-[#0fc6c2]' },
};
// 自定义Checkbox组件以完全匹配Figma设计
const CustomCheckbox: React.FC<{
    id?: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    disabled?: boolean;
    indeterminate?: boolean;
}> = ({ id, checked, onCheckedChange, disabled, indeterminate }) => {
    return (
        <button
            id={id}
            type="button"
            role="checkbox"
            aria-checked={indeterminate ? "mixed" : checked}
            disabled={disabled}
            onClick={() => !disabled && onCheckedChange(!checked)}
            className={cn(
                "h-3.5 w-3.5 rounded-sm relative flex items-center justify-center transition-colors shrink-0",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                // 边框和背景
                !checked && "bg-white border-2 border-[#e5e6eb]",
                checked && !disabled && "bg-[#165dff] border-0",
                checked && disabled && "bg-[#c9cdd4] border-0",
                disabled && "cursor-not-allowed"
            )}
        >
            {checked && !indeterminate && (
                <svg className="h-2.5 w-2.5" viewBox="0 0 10 10" fill="none">
                    <path
                        d="M8.5 2.5L3.5 7.5L1.5 5.5"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            )}
            {indeterminate && (
                <div className="h-0.5 w-1.5 bg-white rounded-[0.5px]" />
            )}
        </button>
    );
};

export const FieldsSection: React.FC<{
    fields: Field[];
    onFieldChange: (id: string, checked: boolean) => void;
    onSelectAll: (checked: boolean) => void;
    isAllSelected: boolean;
    isPartiallySelected: boolean;
}> = ({ fields, onFieldChange, onSelectAll, isAllSelected, isPartiallySelected }) => {
    // 按类型分组字段
    const ncFields = fields.filter(f => f.type === 'NC');
    const smomFields = fields.filter(f => f.type === 'SMOM');
    const tmsFields = fields.filter(f => f.type === 'TMS');
    const crmFields = fields.filter(f => f.type === 'CRM');
    const mrpFields = fields.filter(f => f.type === 'MRP');
    const saiyiFields = fields.filter(f => f.type === '赛意');

    return (
        <div className="flex flex-col gap-2.5 flex-1 min-h-0">
            <p className="text-sm font-medium text-[#1d2129]">
                将以下勾选的字段数据同步到表格中
            </p>

            <div className="bg-[#f7f8fa] rounded-[3px] p-[10px] flex-1 min-h-[300px]">
                <div className="flex flex-col gap-2.5 h-full overflow-y-auto">
                    {/* 全选 */}
                    <div className="flex items-center gap-2">
                        <CustomCheckbox
                            id="select-all"
                            checked={isAllSelected}
                            onCheckedChange={onSelectAll}
                            indeterminate={isPartiallySelected && !isAllSelected}
                        />
                        <label htmlFor="select-all" className="text-sm font-medium text-[#1d2129] cursor-pointer select-none">
                            全选
                        </label>
                    </div>

                    {/* 分隔线 */}
                    <div className="h-px bg-[#e5e6eb] -mx-[10px]" />

                    <div className="flex flex-col gap-2.5">
                        {/* NC类字段 */}
                        {ncFields.length > 0 && (
                            <div className="flex flex-col gap-2.5">
                                {ncFields.map(field => (
                                    <FieldItem
                                        key={field.id}
                                        field={field}
                                        onCheckedChange={(checked) => onFieldChange(field.id, checked)}
                                    />
                                ))}
                            </div>
                        )}

                        {/* SMOM类字段 */}
                        {smomFields.length > 0 && (
                            <div className="flex flex-col gap-2.5 mt-2">
                                {smomFields.map(field => (
                                    <FieldItem
                                        key={field.id}
                                        field={field}
                                        onCheckedChange={(checked) => onFieldChange(field.id, checked)}
                                    />
                                ))}
                            </div>
                        )}

                        {/* TMS类字段 */}
                        {tmsFields.length > 0 && (
                            <div className="flex flex-col gap-2.5 mt-2">
                                {tmsFields.map(field => (
                                    <FieldItem
                                        key={field.id}
                                        field={field}
                                        onCheckedChange={(checked) => onFieldChange(field.id, checked)}
                                    />
                                ))}
                            </div>
                        )}

                        {/* CRM类字段 */}
                        {crmFields.length > 0 && (
                            <div className="flex flex-col gap-2.5 mt-2">
                                {crmFields.map(field => (
                                    <FieldItem
                                        key={field.id}
                                        field={field}
                                        onCheckedChange={(checked) => onFieldChange(field.id, checked)}
                                    />
                                ))}
                            </div>
                        )}

                        {/* MRP类字段 */}
                        {mrpFields.length > 0 && (
                            <div className="flex flex-col gap-2.5 mt-2">
                                {mrpFields.map(field => (
                                    <FieldItem
                                        key={field.id}
                                        field={field}
                                        onCheckedChange={(checked) => onFieldChange(field.id, checked)}
                                    />
                                ))}
                            </div>
                        )}

                        {/* 赛意类字段 */}
                        {saiyiFields.length > 0 && (
                            <div className="flex flex-col gap-2.5 mt-2">
                                {saiyiFields.map(field => (
                                    <FieldItem
                                        key={field.id}
                                        field={field}
                                        onCheckedChange={(checked) => onFieldChange(field.id, checked)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// 字段项组件
const FieldItem: React.FC<{
    field: Field;
    onCheckedChange: (checked: boolean) => void;
}> = ({ field, onCheckedChange }) => {
    return (
        <div className="flex items-center justify-between pr-2">
            <div className="flex items-center gap-2.5">
                <CustomCheckbox
                    id={`field-${field.id}`}
                    checked={field.isChecked}
                    onCheckedChange={(checked) => onCheckedChange(checked)}
                    disabled={field.isDisabled}
                />
                <FieldTag type={field.type} />
                <label htmlFor={`field-${field.id}`} className="text-sm text-[#1f2329] cursor-pointer">
                    {field.name}
                </label>
            </div>
            {field.isDisabled && (
                <span className="text-xs text-[#86909c]">数据表已有字段默认选中</span>
            )}
        </div>
    );
};

// 字段标签组件
const FieldTag: React.FC<{ type: FieldType }> = ({ type }) => {
    const style = tagStyles[type];
    return (
        <div className={cn('px-2 h-5 flex items-center rounded-sm text-xs', style.bg)}>
            <span className={style.text}>{type}</span>
        </div>
    );
};


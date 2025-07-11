import { cn } from '@/lib/utils';
import { Field } from "@/types/common";

// 预定义颜色池 - 精心挑选的颜色组合
const COLOR_POOL = [
    { bg: 'bg-[#f5e8ff]', text: 'text-[#722ed1]' }, // 紫色
    { bg: 'bg-[#fff3e8]', text: 'text-[#ff8800]' }, // 橙色
    { bg: 'bg-[#e8f3ff]', text: 'text-[#165dff]' }, // 蓝色
    { bg: 'bg-[#e8ffea]', text: 'text-[#00d437]' }, // 绿色
    { bg: 'bg-[#ffe8f1]', text: 'text-[#ff0066]' }, // 粉色
    { bg: 'bg-[#e8fffb]', text: 'text-[#0fc6c2]' }, // 青色
    { bg: 'bg-[#fff8e8]', text: 'text-[#d48806]' }, // 金色
    { bg: 'bg-[#f0e8ff]', text: 'text-[#9254de]' }, // 淡紫色
    { bg: 'bg-[#e8f5ff]', text: 'text-[#1890ff]' }, // 天蓝色
    { bg: 'bg-[#e8fdf5]', text: 'text-[#13c2c2]' }, // 薄荷绿
    { bg: 'bg-[#fff2e8]', text: 'text-[#fa8c16]' }, // 暖橙色
    { bg: 'bg-[#f9f0ff]', text: 'text-[#b37feb]' }, // 浅紫色
];

// 字符串哈希函数 - 为相同字符串生成相同索引
const stringHash = (str: string): number => {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return Math.abs(hash);
};

// 获取字段标签样式
const getFieldTagStyle = (type: string) => {
    // 已知类型的固定样式配置
    const knownTypes: Record<string, { bg: string; text: string }> = {
        'NC': { bg: 'bg-[#f5e8ff]', text: 'text-[#722ed1]' },
        'SMOM': { bg: 'bg-[#fff3e8]', text: 'text-[#ff8800]' },
        'TMS': { bg: 'bg-[#e8f3ff]', text: 'text-[#165dff]' },
        'CRM': { bg: 'bg-[#e8ffea]', text: 'text-[#00d437]' },
        'MRP': { bg: 'bg-[#ffe8f1]', text: 'text-[#ff0066]' },
        '赛意': { bg: 'bg-[#e8fffb]', text: 'text-[#0fc6c2]' },
    };

    // 如果是已知类型，使用固定样式
    if (knownTypes[type]) {
        return knownTypes[type];
    }

    // 对于未知类型，使用动态颜色生成
    const colorIndex = stringHash(type) % COLOR_POOL.length;
    return COLOR_POOL[colorIndex];
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
    // 按类型对字段进行分组
    const groupedFields = fields.reduce((acc, field) => {
        if (!acc[field.type]) {
            acc[field.type] = [];
        }
        acc[field.type].push(field);
        return acc;
    }, {} as Record<string, Field[]>);

    // 按类型名称排序（已知类型优先）
    const knownTypeOrder = ['NC', 'SMOM', 'TMS', 'CRM', 'MRP', '赛意'];
    const sortedTypes = Object.keys(groupedFields).sort((a, b) => {
        const aIndex = knownTypeOrder.indexOf(a);
        const bIndex = knownTypeOrder.indexOf(b);

        // 如果都是已知类型，按预定义顺序排序
        if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex;
        }

        // 已知类型排在前面
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;

        // 未知类型按字母顺序排序
        return a.localeCompare(b);
    });

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

                    {/* 动态渲染所有类型的字段 */}
                    <div className="flex flex-col gap-2.5">
                        {sortedTypes.map((type, typeIndex) => (
                            <div key={type} className={cn("flex flex-col gap-2.5", typeIndex > 0 && "mt-2")}>
                                {groupedFields[type].map(field => (
                                    <FieldItem
                                        key={field.id}
                                        field={field}
                                        onCheckedChange={(checked) => onFieldChange(field.id, checked)}
                                    />
                                ))}
                            </div>
                        ))}
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
                <span className="text-xs text-[#86909c]">已有字段默认选中</span>
            )}
        </div>
    );
};

// 字段标签组件
const FieldTag: React.FC<{ type: string }> = ({ type }) => {
    const style = getFieldTagStyle(type);
    return (
        <div className={cn('px-2 h-5 flex items-center rounded-sm text-xs', style.bg)}>
            <span className={style.text}>{type}</span>
        </div>
    );
};


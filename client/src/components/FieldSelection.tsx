import { cn } from '@/lib/utils';
import { Field, TableField } from "@/types/common";
import { AlertTriangle, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// 预定义颜色池 - 精心挑选的颜色组合
const COLOR_POOL = [
    { bg: 'bg-[#f5e8ff]', text: 'text-[#722ed1]', cardBg: 'bg-[#f5e8ff]', cardBorder: 'border-[#722ed1]' }, // 紫色
    { bg: 'bg-[#fff3e8]', text: 'text-[#ff8800]', cardBg: 'bg-[#fff3e8]', cardBorder: 'border-[#ff8800]' }, // 橙色
    { bg: 'bg-[#e8f3ff]', text: 'text-[#165dff]', cardBg: 'bg-[#e8f3ff]', cardBorder: 'border-[#165dff]' }, // 蓝色
    { bg: 'bg-[#e8ffea]', text: 'text-[#00d437]', cardBg: 'bg-[#e8ffea]', cardBorder: 'border-[#00d437]' }, // 绿色
    { bg: 'bg-[#ffe8f1]', text: 'text-[#ff0066]', cardBg: 'bg-[#ffe8f1]', cardBorder: 'border-[#ff0066]' }, // 粉色
    { bg: 'bg-[#e8fffb]', text: 'text-[#0fc6c2]', cardBg: 'bg-[#e8fffb]', cardBorder: 'border-[#0fc6c2]' }, // 青色
    { bg: 'bg-[#fff8e8]', text: 'text-[#d48806]', cardBg: 'bg-[#fff8e8]', cardBorder: 'border-[#d48806]' }, // 金色
    { bg: 'bg-[#f0e8ff]', text: 'text-[#9254de]', cardBg: 'bg-[#f0e8ff]', cardBorder: 'border-[#9254de]' }, // 淡紫色
    { bg: 'bg-[#e8f5ff]', text: 'text-[#1890ff]', cardBg: 'bg-[#e8f5ff]', cardBorder: 'border-[#1890ff]' }, // 天蓝色
    { bg: 'bg-[#e8fdf5]', text: 'text-[#13c2c2]', cardBg: 'bg-[#e8fdf5]', cardBorder: 'border-[#13c2c2]' }, // 薄荷绿
    { bg: 'bg-[#fff2e8]', text: 'text-[#fa8c16]', cardBg: 'bg-[#fff2e8]', cardBorder: 'border-[#fa8c16]' }, // 暖橙色
    { bg: 'bg-[#f9f0ff]', text: 'text-[#b37feb]', cardBg: 'bg-[#f9f0ff]', cardBorder: 'border-[#b37feb]' }, // 浅紫色
];

// 字符串哈希函数 - 为相同字符串生成相同索引
const stringHash = (str: string): number => {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return Math.abs(hash);
};

// 获取字段标签样式和卡片样式
const getFieldTagStyle = (type: string) => {
    // 已知类型的固定样式配置，包含卡片样式
    const knownTypes: Record<string, {
        bg: string;
        text: string;
        cardBg: string;
        cardBorder: string;
    }> = {
        'NC': {
            bg: 'bg-[#f5e8ff]',
            text: 'text-[#722ed1]',
            cardBg: 'bg-[#f5e8ff]',
            cardBorder: 'border-[#722ed1]'
        },
        'SMOM': {
            bg: 'bg-[#fff3e8]',
            text: 'text-[#ff8800]',
            cardBg: 'bg-[#fff3e8]',
            cardBorder: 'border-[#ff8800]'
        },
        'TMS': {
            bg: 'bg-[#e8f3ff]',
            text: 'text-[#165dff]',
            cardBg: 'bg-[#e8f3ff]',
            cardBorder: 'border-[#165dff]'
        },
        'CRM': {
            bg: 'bg-[#e8ffea]',
            text: 'text-[#00d437]',
            cardBg: 'bg-[#e8ffea]',
            cardBorder: 'border-[#00d437]'
        },
        'MRP': {
            bg: 'bg-[#ffe8f1]',
            text: 'text-[#ff0066]',
            cardBg: 'bg-[#ffe8f1]',
            cardBorder: 'border-[#ff0066]'
        },
        '赛意': {
            bg: 'bg-[#e8fffb]',
            text: 'text-[#0fc6c2]',
            cardBg: 'bg-[#e8fffb]',
            cardBorder: 'border-[#0fc6c2]'
        },
        '青蓝': {
            bg: 'bg-[#e8fffb]',
            text: 'text-[#0fc6c2]',
            cardBg: 'bg-[#e8fffb]',
            cardBorder: 'border-[#0fc6c2]'
        }
    };

    // 如果是已知类型，使用固定样式
    if (knownTypes[type]) {
        return knownTypes[type];
    }

    // 对于未知类型，使用动态颜色生成
    const colorIndex = stringHash(type) % COLOR_POOL.length;
    return COLOR_POOL[colorIndex];
};

// 自定义Checkbox组件 - 匹配Figma设计
const CustomCheckbox: React.FC<{
    id?: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    disabled?: boolean;
}> = ({ id, checked, onCheckedChange, disabled }) => {
    return (
        <button
            id={id}
            type="button"
            role="checkbox"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => !disabled && onCheckedChange(!checked)}
            className={cn(
                "h-4 w-4 rounded border flex items-center justify-center transition-colors shrink-0",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                !checked && "bg-white border-[#d0d5dd] hover:border-[#98a2b3]",
                checked && !disabled && "bg-[#165dff] border-[#165dff]",
                checked && disabled && "bg-[#c9cdd4] border-[#c9cdd4]",
                disabled && "cursor-not-allowed"
            )}
        >
            {checked && (
                <svg className="h-2.5 w-2.5" viewBox="0 0 16 16" fill="none">
                    <path
                        d="M13.5 4.5L6 12L2.5 8.5"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            )}
        </button>
    );
};

// 字段映射下拉选择器 - 匹配Figma设计
const FieldMappingSelect: React.FC<{
    field: Field;
    tableFields: TableField[];
    onMappingChange: (fieldId: string, targetFieldId?: string, targetFieldName?: string, mappingType?: 'existing' | 'new') => void;
}> = ({ field, tableFields, onMappingChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);

    const handleSelect = (targetFieldId?: string, targetFieldName?: string, mappingType?: 'existing' | 'new') => {
        onMappingChange(field.id, targetFieldId, targetFieldName, mappingType);
        setIsOpen(false);
    };

    const currentSelection = field.mappingType === 'new'
        ? '新增列'
        : field.targetFieldName || '请选择字段';

    // 点击外部关闭下拉框
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div ref={selectRef} className="relative w-full">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-8 px-3 py-1 bg-white border border-[#d0d5dd] rounded-md flex items-center justify-between text-sm text-[#344054] hover:border-[#98a2b3] transition-colors shadow-sm"
            >
                <span>{currentSelection}</span>
                <ChevronDown className={cn(
                    "h-4 w-4 text-[#667085] transition-transform",
                    isOpen && "rotate-180"
                )} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#d0d5dd] rounded-md shadow-lg z-20 max-h-40 overflow-y-auto">
                    <button
                        onClick={() => handleSelect(undefined, undefined, 'new')}
                        className="w-full px-3 py-2 text-left text-sm text-[#344054] hover:bg-[#f9fafb] flex items-center gap-2 border-b border-[#f2f4f7]"
                    >
                        <span className="text-[#165dff] font-bold">+</span>
                        新增列
                    </button>
                    {tableFields && tableFields.length > 0 ? (
                        tableFields.map(tableField => (
                            <button
                                key={tableField.id}
                                onClick={() => handleSelect(tableField.id, tableField.name, 'existing')}
                                className={cn(
                                    "w-full px-3 py-2 text-left text-sm text-[#344054] hover:bg-[#f9fafb]",
                                    field.targetFieldId === tableField.id && "bg-[#f5f8ff] text-[#165dff]"
                                )}
                            >
                                {tableField.name}
                            </button>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-sm text-[#98a2b3] italic">
                            暂无可用字段
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const FieldsSection: React.FC<{
    fields: Field[];
    tableFields: TableField[];
    onFieldChange: (id: string, checked: boolean) => void;
    onFieldMappingChange: (fieldId: string, targetFieldId?: string, targetFieldName?: string, mappingType?: 'existing' | 'new') => void;
}> = ({ fields, tableFields, onFieldChange, onFieldMappingChange }) => {
    // 计算统计信息
    const totalFields = fields.length;
    const checkedFields = fields.filter(f => f.isChecked).length;

    return (
        <div className="flex flex-col gap-3">
            {/* 统计信息 */}
            <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-[3px]">
                    <div className="flex items-center justify-center w-4 h-4">
                        <svg width="16" height="16" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12.2287 5.55716C12.6455 6.15493 12.9388 6.84523 13.0716 7.59106H14.6667V9.40926H13.0716C12.9388 10.1551 12.6455 10.8454 12.2287 11.4432L13.3569 12.5714L12.0713 13.857L10.943 12.7288C10.3453 13.1456 9.65497 13.4389 8.90914 13.5717V15.1668H7.09094V13.5717C6.34511 13.4389 5.65481 13.1456 5.05704 12.7288L3.92881 13.857L2.64317 12.5714L3.77137 11.4432C3.35457 10.8454 3.06128 10.1551 2.92848 9.40926H1.33337V7.59106H2.92848C3.06128 6.84523 3.35457 6.15493 3.77137 5.55716L2.64317 4.42893L3.92881 3.14329L5.05704 4.2715C5.65481 3.8547 6.34511 3.5614 7.09094 3.42861V1.8335H8.90914V3.42861C9.65497 3.5614 10.3453 3.8547 10.943 4.2715L12.0713 3.14329L13.3569 4.42893L12.2287 5.55716Z" stroke="#363949" strokeLinejoin="round" />
                            <path d="M8.00004 10.1668C8.92051 10.1668 9.66671 9.42063 9.66671 8.50016C9.66671 7.5797 8.92051 6.8335 8.00004 6.8335C7.07957 6.8335 6.33337 7.5797 6.33337 8.50016C6.33337 9.42063 7.07957 10.1668 8.00004 10.1668Z" stroke="#363949" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div className="text-black text-sm font-medium leading-snug">
                        选择同步字段 ({totalFields})
                    </div>
                </div>
                <div className="h-6 px-2.5 py-1 bg-gray-100 rounded-[40px] flex justify-center items-center whitespace-nowrap">
                    <div className="text-zinc-700 text-xs font-medium leading-none">
                        {checkedFields} 已选
                    </div>
                </div>
            </div>

            {/* 字段列表 */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {fields.map(field => (
                    <FieldCard
                        key={field.id}
                        field={field}
                        tableFields={tableFields}
                        onCheckedChange={(checked) => onFieldChange(field.id, checked)}
                        onMappingChange={onFieldMappingChange}
                    />
                ))}
            </div>
        </div>
    );
};

// 字段卡片组件 - 精确匹配Figma设计
const FieldCard: React.FC<{
    field: Field;
    tableFields: TableField[];
    onCheckedChange: (checked: boolean) => void;
    onMappingChange: (fieldId: string, targetFieldId?: string, targetFieldName?: string, mappingType?: 'existing' | 'new') => void;
}> = ({ field, tableFields, onCheckedChange, onMappingChange }) => {
    // 获取字段标签样式，用于卡片边框和背景
    const tagStyle = getFieldTagStyle(field.type);

    return (
        <div className={cn(
            "border-2 rounded-md p-4 transition-all duration-200",
            field.isChecked
                ? `${tagStyle.cardBg} ${tagStyle.cardBorder}` // 使用标签对应的卡片样式
                : "border-[#e4e7ec] bg-white hover:border-[#d0d5dd]"
        )}>
            <div className="flex items-center justify-between">
                {/* 左侧：复选框和字段名 */}
                <div className="flex items-center gap-3">
                    <CustomCheckbox
                        id={`field-${field.id}`}
                        checked={field.isChecked}
                        onCheckedChange={onCheckedChange}
                        disabled={false}
                    />
                    <div className="flex items-center gap-2">
                        <label
                            htmlFor={`field-${field.id}`}
                            className="text-sm font-medium text-[#101828] cursor-pointer"
                        >
                            {field.name}
                        </label>
                        {/* 警告图标 */}
                        {field.hasWarning && (
                            <AlertTriangle className="h-4 w-4 text-[#f59e0b]" />
                        )}
                    </div>
                </div>

                {/* 右侧：字段标签 */}
                <FieldTag type={field.type} />
            </div>

            {/* 字段映射选择器 - 只在勾选时显示 */}
            {field.isChecked && (
                <div className="mt-3 space-y-2">
                    <label className="text-xs text-[#475467]">
                        填充到表格列：
                    </label>
                    <FieldMappingSelect
                        field={field}
                        tableFields={tableFields}
                        onMappingChange={onMappingChange}
                    />
                </div>
            )}

            {/* 状态提示信息 */}
            {(field.helperText || field.warningMessage) && (
                <div className="mt-2 space-y-1">
                    {field.helperText && (
                        <div className="text-xs text-[#667085]">
                            {field.helperText}
                        </div>
                    )}
                    {field.warningMessage && (
                        <div className="text-xs text-[#f59e0b]">
                            {field.warningMessage}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// 字段标签组件
const FieldTag: React.FC<{ type: string }> = ({ type }) => {
    const style = getFieldTagStyle(type);
    return (
        <div className={cn('px-2 py-0.5 rounded text-xs font-medium', style.bg)}>
            <span className={style.text}>{type}</span>
        </div>
    );
};


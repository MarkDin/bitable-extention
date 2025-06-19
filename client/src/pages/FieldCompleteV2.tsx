import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import React, { useState } from 'react';

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

// 标签样式配置
const tagStyles: Record<FieldType, { bg: string; text: string }> = {
    'NC': { bg: 'bg-[#f5e8ff]', text: 'text-[#722ed1]' },
    '赛意': { bg: 'bg-[#e8fffb]', text: 'text-[#0fc6c2]' },
    'TMS': { bg: 'bg-[#e8f3ff]', text: 'text-[#165dff]' },
};

// 自定义Select组件以匹配Figma设计
const CustomSelect: React.FC<{
    value: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    options: { value: string; label: string }[];
    className?: string;
}> = ({ value, onValueChange, placeholder, options, className }) => {
    const selectedOption = options.find(opt => opt.value === value);

    return (
        <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger className={cn(
                "bg-[#f2f3f5] border-0 h-[30px] px-3 py-1 rounded-sm",
                "focus:ring-0 focus:ring-offset-0 hover:bg-[#e8e9eb]",
                className
            )}>
                <span className={cn(
                    "text-sm font-normal",
                    selectedOption ? "text-[#1d2129]" : "text-[#c9cdd4]"
                )}>
                    {selectedOption?.label || placeholder}
                </span>
            </SelectTrigger>
            <SelectContent>
                {options.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
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

// 条件设置区域组件
const ConditionSection: React.FC = () => {
    const [table, setTable] = useState('table1');
    const [field, setField] = useState('field1');
    const [content, setContent] = useState('content1');

    return (
        <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-[5px] flex-wrap">
                <span className="text-sm font-medium text-[#1d2129]">当</span>

                <CustomSelect
                    value={table}
                    onValueChange={setTable}
                    placeholder="选择表格"
                    options={[
                        { value: 'table1', label: '欧洲一区项目跟进表' },
                        { value: 'table2', label: '亚洲区项目跟进表' }
                    ]}
                    className="w-[173px]"
                />

                <span className="text-sm font-medium text-[#1d2129]">中的</span>

                <CustomSelect
                    value={field}
                    onValueChange={setField}
                    placeholder="选择字段"
                    options={[
                        { value: 'field1', label: 'PI号' },
                        { value: 'field2', label: '订单号' }
                    ]}
                    className="w-[103px]"
                />

                <span className="text-sm font-medium text-[#1d2129]">字段</span>
            </div>

            <div className="flex items-center gap-[5px] flex-wrap">
                <span className="text-sm font-medium text-[#1d2129]">内容是</span>

                <CustomSelect
                    value={content}
                    onValueChange={setContent}
                    placeholder="选择内容格式"
                    options={[
                        { value: 'content1', label: '订单号，例如：IN20240404' },
                        { value: 'content2', label: '合同号，例如：CN20240404' }
                    ]}
                    className="w-[221px]"
                />

                <span className="text-base font-medium text-[#1d2129]">时，</span>
            </div>
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

// 字段项组件
const FieldItem: React.FC<{
    field: Field;
    onCheckedChange: (checked: boolean) => void;
}> = ({ field, onCheckedChange }) => {
    return (
        <div className="flex items-center justify-between pr-2">
            <div className="flex items-center gap-2">
                <CustomCheckbox
                    id={field.id}
                    checked={field.isChecked}
                    onCheckedChange={onCheckedChange}
                    disabled={field.isDisabled}
                />
                <label
                    htmlFor={field.id}
                    className={cn(
                        "text-sm leading-[22px] select-none",
                        field.isDisabled ? "text-[#c9cdd4] cursor-not-allowed" : "text-[#1d2129] cursor-pointer"
                    )}
                >
                    {field.name}
                </label>
                <FieldTag type={field.type} />
            </div>
            {field.helperText && (
                <span className="text-xs text-[#86909c] flex-shrink-0">{field.helperText}</span>
            )}
        </div>
    );
};

// 字段选择区域组件
const FieldsSection: React.FC<{
    fields: Field[];
    onFieldChange: (id: string, checked: boolean) => void;
    onSelectAll: (checked: boolean) => void;
    isAllSelected: boolean;
    isPartiallySelected: boolean;
}> = ({ fields, onFieldChange, onSelectAll, isAllSelected, isPartiallySelected }) => {
    // 按类型分组字段
    const ncFields = fields.filter(f => f.type === 'NC');
    const saiyiFields = fields.filter(f => f.type === '赛意');
    const tmsFields = fields.filter(f => f.type === 'TMS');

    return (
        <div className="flex flex-col gap-2.5">
            <p className="text-sm font-medium text-[#1d2129]">
                将以下勾选的字段数据同步到表格中
            </p>

            <div className="bg-[#f7f8fa] rounded-[3px] p-[10px] h-[444px]">
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
                    </div>
                </div>
            </div>
        </div>
    );
};

// 主组件
const FieldCompleteV2: React.FC = () => {
    // 初始化字段数据
    const [fields, setFields] = useState<Field[]>([
        // NC类字段（已选中但禁用）
        { id: 'nc1', name: '订单号', type: 'NC', isChecked: true, isDisabled: true, helperText: '数据表已有字段默认选中' },
        { id: 'nc2', name: '客户名称', type: 'NC', isChecked: true, isDisabled: true, helperText: '数据表已有字段默认选中' },
        { id: 'nc3', name: '产品编码', type: 'NC', isChecked: true, isDisabled: true, helperText: '数据表已有字段默认选中' },
        { id: 'nc4', name: '数量', type: 'NC', isChecked: true, isDisabled: true, helperText: '数据表已有字段默认选中' },
        { id: 'nc5', name: '金额', type: 'NC', isChecked: true, isDisabled: true, helperText: '数据表已有字段默认选中' },
        // 赛意类字段（未选中）
        { id: 'saiyi1', name: '发货日期', type: '赛意', isChecked: false, isDisabled: false },
        { id: 'saiyi2', name: '物流单号', type: '赛意', isChecked: false, isDisabled: false },
        { id: 'saiyi3', name: '收货地址', type: '赛意', isChecked: false, isDisabled: false },
        // TMS类字段（已选中）
        { id: 'tms1', name: '运输方式', type: 'TMS', isChecked: true, isDisabled: false },
        { id: 'tms2', name: '承运商', type: 'TMS', isChecked: true, isDisabled: false },
        { id: 'tms3', name: '预计到达时间', type: 'TMS', isChecked: true, isDisabled: false },
        { id: 'tms4', name: '运费', type: 'TMS', isChecked: true, isDisabled: false },
    ]);

    // 处理字段选择变化
    const handleFieldChange = (id: string, checked: boolean) => {
        setFields(prev => prev.map(field =>
            field.id === id ? { ...field, isChecked: checked } : field
        ));
    };

    // 处理全选
    const handleSelectAll = (checked: boolean) => {
        setFields(prev => prev.map(field =>
            field.isDisabled ? field : { ...field, isChecked: checked }
        ));
    };

    // 计算全选状态
    const selectableFields = fields.filter(f => !f.isDisabled);
    const selectedCount = selectableFields.filter(f => f.isChecked).length;
    const isAllSelected = selectableFields.length > 0 && selectedCount === selectableFields.length;
    const isPartiallySelected = selectedCount > 0 && selectedCount < selectableFields.length;

    // 处理同步数据
    const handleSync = () => {
        const selectedFields = fields.filter(f => f.isChecked);
        console.log('同步数据:', selectedFields);
        // 这里添加实际的同步逻辑
    };

    return (
        <div className="w-full h-full bg-white flex flex-col">
            {/* 内容区域 */}
            <div className="flex-1 flex flex-col px-6 py-5 gap-5 overflow-y-auto">
                {/* 条件设置 */}
                <ConditionSection />

                {/* 字段选择 */}
                <FieldsSection
                    fields={fields}
                    onFieldChange={handleFieldChange}
                    onSelectAll={handleSelectAll}
                    isAllSelected={isAllSelected}
                    isPartiallySelected={isPartiallySelected}
                />
            </div>

            {/* 底部区域 */}
            <div className="bg-white border-t border-[#e5e6eb] px-6 py-3 flex flex-col gap-1">
                <p className="text-xs text-[#000000] leading-[22px]">
                    请注意检查你有表格编辑权限
                </p>
                <button
                    onClick={handleSync}
                    className="w-full h-8 bg-[#165dff] hover:bg-[#4080ff] text-white text-sm font-medium rounded-sm transition-colors flex items-center justify-center"
                >
                    同步数据
                </button>
            </div>
        </div>
    );
};

export default FieldCompleteV2; 
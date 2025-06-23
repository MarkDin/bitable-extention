import { useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger
} from '@/components/ui/select';
import { cn } from "@/lib/utils";
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

export default ConditionSection;
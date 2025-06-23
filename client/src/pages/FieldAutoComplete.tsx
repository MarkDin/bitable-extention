import { FieldsSection } from "@/components/FieldSelection";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useFeishuBase } from "@/hooks/use-feishu-base";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/apiService";
import { autoCompleteFields } from "@/lib/autoCompleteHelper";
import { QueryType } from "@/lib/dataSync";
import { cn } from "@/lib/utils";
import { Field } from "@/types/common";
import { bitable } from "@lark-base-open/js-sdk";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import AutoCompleteProgress from "./AutoCompleteProgress";
import AutoCompleteResult from "./AutoCompleteResult";

type PageState = 'form' | 'progress' | 'result';

interface CompletionResult {
  status: 'success' | 'partial' | 'failed' | 'no_permission' | 'noChange';
  successCount: number;
  errorCount: number;
  unchangedCount: number;
}


// 查询类型选项
const QUERY_TYPE_OPTIONS = [
  { value: QueryType.CUSTOMER, label: '客户简称' },
  { value: QueryType.ORDER, label: '订单ID' }
];

/**
 * 从多维表格配置中获取字段映射配置
 */
// async function getMappingConfig(): Promise<Field[]> {
//   try {
//     const config = await bitable.bridge.getData<Field[]>('mapping_config');
//     if (config && Array.isArray(config) && config.length > 0) {
//       console.log('[FieldAutoComplete] 从配置中读取到字段映射:', config.length, '个字段');
//       return config;
//     }
//   } catch (error) {
//     console.warn('[FieldAutoComplete] 读取配置失败，使用默认配置:', error);
//   }

//   console.log('[FieldAutoComplete] 使用默认字段配置');
//   return DEFAULT_AVAILABLE_FIELDS;
// }



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

// 自定义Checkbox组件
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

// 字段标签组件
const FieldTag: React.FC<{ type: string }> = ({ type }) => {
  // 根据字段类型确定标签样式
  const getTagStyle = () => {
    switch (type) {
      case 'NC':
        return { bg: 'bg-[#f5e8ff]', text: 'text-[#722ed1]', label: 'NC' };
      case 'SMOM':
        return { bg: 'bg-[#fff3e8]', text: 'text-[#ff8800]', label: 'SMOM' };
      case 'TMS':
        return { bg: 'bg-[#e8f3ff]', text: 'text-[#165dff]', label: 'TMS' };
      case 'CRM':
        return { bg: 'bg-[#e8ffea]', text: 'text-[#00d437]', label: 'CRM' };
      case 'MRP':
        return { bg: 'bg-[#ffe8f1]', text: 'text-[#ff0066]', label: 'MRP' };
      case '赛意':
        return { bg: 'bg-[#e8fffb]', text: 'text-[#0fc6c2]', label: '赛意' };
      default:
        return { bg: 'bg-[#f5e8ff]', text: 'text-[#722ed1]', label: type };
    }
  };

  const style = getTagStyle();
  return (
    <div className={cn('px-2 h-5 flex items-center rounded-sm text-xs', style.bg)}>
      <span className={style.text}>{style.label}</span>
    </div>
  );
};


const FieldAutoComplete = () => {
  // 初始化字段数据
  const [fields, setFields] = useState<Field[]>([
    // NC字段
    { id: 'orderNo', name: '订单ID', mapping_field: 'orderNo', type: 'NC', isChecked: false, isDisabled: false },
    { id: 'custShortName', name: '客户简称', mapping_field: 'custShortName', type: 'NC', isChecked: false, isDisabled: false },
    { id: 'materialIndex', name: '产品索引号', mapping_field: 'materialIndex', type: 'NC', isChecked: false, isDisabled: false },
    { id: 'debitamount', name: '已收款金额', mapping_field: 'debitamount', type: 'NC', isChecked: false, isDisabled: false },
    { id: 'incomeName', name: '收款协议', mapping_field: 'incomeName', type: 'NC', isChecked: false, isDisabled: false },
    { id: 'quantityOnHand', name: '现存量', mapping_field: 'quantityOnHand', type: 'NC', isChecked: false, isDisabled: false },
    { id: 'salesperson', name: '销售负责人', mapping_field: 'salesperson', type: 'NC', isChecked: false, isDisabled: false },
    { id: 'deliveryFactory', name: '发货工厂', mapping_field: 'deliveryFactory', type: 'NC', isChecked: false, isDisabled: false },
    { id: 'custRequestDate', name: '客户要求日期', mapping_field: 'custRequestDate', type: 'NC', isChecked: false, isDisabled: false },
    { id: 'deliveryDate', name: '签署PI交期', mapping_field: 'deliveryDate', type: 'NC', isChecked: false, isDisabled: false },
    { id: 'boxOrNot', name: '箱盒是否下单', mapping_field: 'boxOrNot', type: 'NC', isChecked: false, isDisabled: false },

    // SMOM字段
    { id: 'plannedStartTime', name: '计划开始时间', mapping_field: 'plannedStartTime', type: 'SMOM', isChecked: false, isDisabled: false },
    { id: 'planEndTime', name: '计划结束时间', mapping_field: 'planEndTime', type: 'SMOM', isChecked: false, isDisabled: false },

    // TMS字段
    { id: 'bookingStatus', name: '订舱状态', mapping_field: 'bookingStatus', type: 'TMS', isChecked: false, isDisabled: false },
    { id: 'etd', name: 'ETD', mapping_field: 'etd', type: 'TMS', isChecked: false, isDisabled: false },
    { id: 'eta', name: 'ETA', mapping_field: 'eta', type: 'TMS', isChecked: false, isDisabled: false },
    { id: 'loadDate', name: '装柜时间', mapping_field: 'loadDate', type: 'TMS', isChecked: false, isDisabled: false },
    { id: 'needShipment', name: '是否需要出货', mapping_field: 'needShipment', type: 'TMS', isChecked: false, isDisabled: false },

    // CRM字段
    { id: 'customerCode', name: '客户编码', mapping_field: 'customerCode', type: 'CRM', isChecked: false, isDisabled: false },
    { id: 'custName', name: '客户全称', mapping_field: 'custName', type: 'CRM', isChecked: false, isDisabled: false },
    { id: 'country', name: '客户国家', mapping_field: 'country', type: 'CRM', isChecked: false, isDisabled: false },
    { id: 'publicSea', name: '所属区域公海', mapping_field: 'publicSea', type: 'CRM', isChecked: false, isDisabled: false },
    { id: 'publicSeaPoolStatus', name: '公海池状态', mapping_field: 'publicSeaPoolStatus', type: 'CRM', isChecked: false, isDisabled: false },
    { id: 'paymentPeriod', name: '账期', mapping_field: 'paymentPeriod', type: 'CRM', isChecked: false, isDisabled: false },
    { id: 'collectionAgreement', name: '收款协议', mapping_field: 'collectionAgreement', type: 'CRM', isChecked: false, isDisabled: false },
    { id: 'estimatedRecoveryTime', name: '预计回收时间', mapping_field: 'estimatedRecoveryTime', type: 'CRM', isChecked: false, isDisabled: false },

    // MRP字段
    { id: 'isDraft', name: '图稿状态', mapping_field: 'isDraft', type: 'MRP', isChecked: false, isDisabled: false },
  ]);
  const { toast } = useToast();
  const {
    selection,
    loading: feishuLoading,
  } = useFeishuBase();

  const [pageState, setPageState] = useState<PageState>('form');
  const [queryType, setQueryType] = useState<QueryType>(QueryType.CUSTOMER); // 默认选中客户简称
  const [firstColumnFieldId, setFirstColumnFieldId] = useState<string>(""); // 第一列字段ID
  const [firstColumnFieldName, setFirstColumnFieldName] = useState<string>(""); // 第一列字段名称
  const [dataSource, setDataSource] = useState<number>(1);
  const [tableName, setTableName] = useState<string>("");
  const [configLoading, setConfigLoading] = useState(false);
  const [currentTable, setCurrentTable] = useState<any>(null);

  // 进度相关状态
  const [progressData, setProgressData] = useState({ completed: 0, total: 0 });
  const [completionResult, setCompletionResult] = useState<CompletionResult | null>(null);

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

  // 获取第一列字段ID
  useEffect(() => {
    const initializeTable = async () => {
      try {
        const table = await bitable.base.getActiveTable();
        setCurrentTable(table);

        // 获取有序的字段列表（通过视图获取）
        const activeView = await table.getActiveView();
        const visibleFieldIds = await activeView.getVisibleFieldIdList();

        if (visibleFieldIds && visibleFieldIds.length > 0) {
          // 第一个字段就是A列
          const firstFieldId = visibleFieldIds[0];
          setFirstColumnFieldId(firstFieldId);

          // 获取字段名称用于日志
          const firstField = await table.getFieldById(firstFieldId);
          const name = await firstField.getName();
          setFirstColumnFieldName(name);
          console.log('[FieldAutoComplete] A列字段ID:', firstFieldId, '字段名称:', name);
        }

        // 获取所有字段名称
        const allFields = await table.getFieldList();
        const fieldNames = new Set<string>();

        for (const field of allFields) {
          const fieldName = await field.getName();
          fieldNames.add(fieldName);
        }

        console.log('[FieldAutoComplete] 表格现有字段:', Array.from(fieldNames));

        // 更新fields状态，将已存在的字段设置为选中且禁用
        setFields(prevFields =>
          prevFields.map(field => {
            const isExistingField = fieldNames.has(field.name);
            return {
              ...field,
              isChecked: isExistingField ? true : field.isChecked,
              isDisabled: isExistingField,
              helperText: isExistingField ? '数据表已有字段默认选中' : undefined
            };
          })
        );
      } catch (error) {
        console.error('[FieldAutoComplete] 初始化表格失败:', error);
        toast({
          variant: "destructive",
          title: "错误",
          description: "初始化表格失败",
        });
      }
    };

    initializeTable();
  }, [toast]);


  // 直接从apiService获取字段映射
  const { data: mappingsData } = useQuery({
    queryKey: ["mappings", dataSource],
    queryFn: async () => {
      const mappings = await apiService.getFieldMappings(dataSource);
      return { mappings };
    },
    enabled: !!dataSource,
  });

  // Update mappings when fetched
  useEffect(() => {
    if (mappingsData?.mappings) {

    }
  }, [mappingsData]);


  useEffect(() => {
    // 定义回调
    const handleSelectionChange = async () => {
      try {
        const table = await bitable.base.getActiveTable();
        if (table && typeof table.getName === "function") {
          const name = await table.getName();
          setTableName(name);

          // 获取所有字段名称
          const allFields = await table.getFieldList();
          const fieldNames = new Set<string>();

          for (const field of allFields) {
            const fieldName = await field.getName();
            fieldNames.add(fieldName);
          }

          console.log('[FieldAutoComplete] 表格切换，现有字段:', Array.from(fieldNames));

          // 更新fields状态，将已存在的字段设置为选中且禁用
          setFields(prevFields =>
            prevFields.map(field => {
              const isExistingField = fieldNames.has(field.name);
              return {
                ...field,
                isChecked: isExistingField ? true : field.isChecked,
                isDisabled: isExistingField,
                helperText: isExistingField ? '数据表已有字段默认选中' : undefined
              };
            })
          );
        } else {
          setTableName("");
        }
      } catch {
        setTableName("");
      }
    };

    // 注册监听
    const off = bitable.base.onSelectionChange(handleSelectionChange);
    // 初始化时主动获取一次
    handleSelectionChange();

    // 卸载时移除监听
    return () => {
      if (typeof off === "function") off();
    };
  }, []);



  const handleApply = async () => {
    try {
      // 获取选中的字段
      const selectedFields = fields.filter(f => f.isChecked);

      console.log('[FieldAutoComplete] 开始补全，查询类型:', queryType, '第一列字段ID:', firstColumnFieldId);

      if (!firstColumnFieldId) {
        toast({
          variant: "destructive",
          title: "无法获取第一列字段",
        });
        return;
      }

      if (!selectedFields.length) {
        toast({
          variant: "destructive",
          title: "请选择要补全的字段",
        });
        return;
      }

      // 切换到进度页面
      setPageState('progress');
      setProgressData({ completed: 0, total: 0 });

      // await refreshSelection();
      await autoCompleteFields({
        toast,
        selectedFields,
        queryFieldId: firstColumnFieldId, // 使用第一列字段ID
        onProgress: (completed, total) => {
          setProgressData({ completed, total });
        },
        onComplete: (result) => {
          setCompletionResult(result);
          setPageState('result');
        }
      });
    } catch (e: any) {
      console.error('[FieldAutoComplete] 补全失败:', e);
      toast({
        variant: "destructive",
        title: "补全失败",
        description: e.message,
      });
      // 如果出现异常，回到表单页面
      setPageState('form');
    }
  };

  const handleReturn = () => {
    setPageState('form');
    setCompletionResult(null);
    setProgressData({ completed: 0, total: 0 });
  };

  // 根据页面状态渲染不同内容
  if (pageState === 'progress') {
    return (
      <AutoCompleteProgress
        completedCount={progressData.completed}
        totalCount={progressData.total}
      />
    );
  }

  if (pageState === 'result' && completionResult) {
    return (
      <AutoCompleteResult
        status={completionResult.status}
        successCount={completionResult.successCount}
        errorCount={completionResult.errorCount}
        unchangedCount={completionResult.unchangedCount}
        onReturn={handleReturn}
      />
    );
  }

  // 如果配置还在加载中，显示加载状态
  if (configLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-sm text-[#86909C]">正在加载字段配置...</div>
        </div>
      </div>
    );
  }

  // 默认表单页面 - 使用新的 UI 组件
  return (
    <div className="w-full h-full bg-white flex flex-col">
      {/* 内容区域 */}
      <div className="flex-1 flex flex-col px-3 sm:px-4 md:px-5 py-4 gap-4 overflow-y-auto">
        {/* 条件设置 */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-[5px] flex-wrap">
            <span className="text-sm font-medium text-[#1d2129]">当</span>

            <input
              type="text"
              className="bg-[#f2f3f5] border-0 h-[30px] px-3 py-1 rounded-sm flex-1 min-w-[120px] max-w-[173px] text-sm text-[#1d2129]"
              value={tableName || '未获取到表格名称'}
              disabled
              readOnly
            />

            <span className="text-sm font-medium text-[#1d2129]">中的</span>

            <div className="bg-[#f2f3f5] border-0 h-[30px] px-3 py-1 rounded-sm flex items-center justify-center text-sm text-[#1d2129] w-auto min-w-[90px] sm:min-w-[100px] md:min-w-[103px]">
              <span>{firstColumnFieldName || '...'}</span>
            </div>

            <span className="text-sm font-medium text-[#1d2129]">字段</span>
          </div>

          <div className="flex items-center gap-[5px] flex-wrap">
            <span className="text-sm font-medium text-[#1d2129]">内容是</span>

            <div className="bg-[#f2f3f5] h-[30px] px-3 py-1 rounded-sm flex-1 min-w-[150px] max-w-[221px] flex items-center">
              <span className="text-sm text-[#1d2129]">
                {/* {queryType === QueryType.CUSTOMER ? '客户简称' : '订单ID'} */}
                订单号，例如：IN20240404
              </span>
            </div>

            <span className="text-base font-medium text-[#1d2129]">时，</span>
          </div>
        </div>

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
      <div className="bg-white border-t border-[#e5e6eb] px-3 sm:px-4 md:px-5 py-2.5 flex flex-col gap-1">
        <p className="text-xs text-[#000000] leading-[22px]">
          请注意检查你有表格编辑权限
        </p>
        <button
          onClick={handleApply}
          disabled={fields.filter(f => f.isChecked).length === 0}
          className={cn(
            "w-full h-8 text-white text-sm font-medium rounded-sm transition-colors flex items-center justify-center",
            fields.filter(f => f.isChecked).length === 0
              ? "bg-[#c9cdd4] cursor-not-allowed"
              : "bg-[#165dff] hover:bg-[#4080ff]"
          )}
        >
          同步数据
        </button>
      </div>
    </div>
  );
};

export default FieldAutoComplete;
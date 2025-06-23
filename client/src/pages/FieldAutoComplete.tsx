import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useFeishuBase } from "@/hooks/use-feishu-base";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/apiService";
import { autoCompleteFields } from "@/lib/autoCompleteHelper";
import { Field, QueryType } from "@/lib/dataSync";
import { cn } from "@/lib/utils";
import { bitable } from "@lark-base-open/js-sdk";
import { useMutation, useQuery } from "@tanstack/react-query";
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

// 默认字段配置 - 按查询类型分类
const DEFAULT_AVAILABLE_FIELDS: Field[] = [
  // 客户相关字段 (客户简称查询时显示)
  // { name: 'accountName', mapping_field: '客户名称', query_type: 'customer' },
  // { name: 'accountType', mapping_field: '客户类型', query_type: 'customer' },
  // { name: 'industry', mapping_field: '所属行业', query_type: 'customer' },
  // { name: 'region', mapping_field: '所在地区', query_type: 'customer' },

  // 订单相关字段 (订单ID查询时显示)
  { name: 'projectNo', mapping_field: '项目号', query_type: 'order' },
  { name: 'orderNo', mapping_field: 'NC-SMOM-TMS-CRM订单号', query_type: 'order' },
  { name: 'custShortName', mapping_field: 'NC客户简称', query_type: 'order' },
  { name: 'materialIndex', mapping_field: 'NC索引', query_type: 'order' },
  { name: 'incomeName', mapping_field: 'NC收款协议', query_type: 'order' },
  { name: 'salesperson', mapping_field: 'NC销售业务员', query_type: 'order' },
  { name: 'deliveryFactory', mapping_field: 'NC发货工厂', query_type: 'order' },
  { name: 'quantityOnHand', mapping_field: 'NC现存量', query_type: 'order' },
  { name: 'custRequestDate', mapping_field: 'NC客户要求日期', query_type: 'order' },
  { name: 'deliveryDate', mapping_field: 'NC签署PI交期', query_type: 'order' },
  { name: 'boxOrNot', mapping_field: 'NC箱盒是否下单', query_type: 'order' },
  { name: 'plannedStartTime', mapping_field: 'SMOM计划开始时间（上线时间）', query_type: 'order' },
  { name: 'planEndTime', mapping_field: 'SMOM计划完工时间', query_type: 'order' },
  { name: 'needShipment', mapping_field: '是否需要出货', query_type: 'order' },
  { name: 'bookingStatus', mapping_field: 'TMS订舱状态', query_type: 'order' },
  { name: 'etd', mapping_field: 'TMS预计离港时间', query_type: 'order' },
  { name: 'eta', mapping_field: 'TMS预计到港时间', query_type: 'order' },
  { name: 'loadDate', mapping_field: 'TMS装柜时间', query_type: 'order' },
  { name: 'customerCode', mapping_field: 'NC-CRM客户编码', query_type: 'order' },
  { name: 'custName', mapping_field: 'CRM客户全称', query_type: 'order' },
  { name: 'publicSea', mapping_field: 'CRM所属区域公海', query_type: 'order' },
  { name: 'country', mapping_field: 'CRM国家', query_type: 'order' },
  { name: 'collectionAgreement', mapping_field: 'CRM收款协议', query_type: 'order' },
  { name: 'paymentPeriod', mapping_field: 'CRM账期（天）', query_type: 'order' },
  { name: 'publicSeaPoolStatus', mapping_field: 'CRM公海池状态', query_type: 'order' },
  { name: 'estimatedRecoveryTime', mapping_field: 'CRM预计回收时间', query_type: 'order' },
  { name: 'isDraft', mapping_field: 'MRP是否定稿', query_type: 'order' },

];

// 查询类型选项
const QUERY_TYPE_OPTIONS = [
  { value: QueryType.CUSTOMER, label: '客户简称' },
  { value: QueryType.ORDER, label: '订单ID' }
];

/**
 * 从多维表格配置中获取字段映射配置
 */
async function getMappingConfig(): Promise<Field[]> {
  try {
    const config = await bitable.bridge.getData<Field[]>('mapping_config');
    if (config && Array.isArray(config) && config.length > 0) {
      console.log('[FieldAutoComplete] 从配置中读取到字段映射:', config.length, '个字段');
      return config;
    }
  } catch (error) {
    console.warn('[FieldAutoComplete] 读取配置失败，使用默认配置:', error);
  }

  console.log('[FieldAutoComplete] 使用默认字段配置');
  return DEFAULT_AVAILABLE_FIELDS;
}

/**
 * 根据查询类型过滤字段列表
 * @param fields 所有字段列表
 * @param queryType 查询类型
 * @returns 过滤后的字段列表
 */
function getFieldsByQueryType(fields: Field[], queryType: QueryType): Field[] {
  return fields.filter(field => {
    if (!field.query_type) return true; // 兼容旧数据
    if (queryType === QueryType.ORDER) {
      // 订单ID查询：显示订单字段 + 客户字段 + 通用字段
      return field.query_type === 'order' || field.query_type === 'customer' || field.query_type === 'both';
    } else {
      // 客户简称查询：只显示客户字段 + 通用字段
      return field.query_type === 'customer' || field.query_type === 'both';
    }
  });
}

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
    if (type === 'customer') {
      return { bg: 'bg-[#e8fffb]', text: 'text-[#0fc6c2]', label: '客户' };
    } else if (type === 'order') {
      return { bg: 'bg-[#e8f3ff]', text: 'text-[#165dff]', label: '订单' };
    } else {
      return { bg: 'bg-[#f5e8ff]', text: 'text-[#722ed1]', label: '通用' };
    }
  };

  const style = getTagStyle();
  return (
    <div className={cn('px-2 h-5 flex items-center rounded-sm text-xs', style.bg)}>
      <span className={style.text}>{style.label}</span>
    </div>
  );
};

// 字段项组件
const FieldItem: React.FC<{
  field: Field;
  isChecked: boolean;
  onCheckedChange: (checked: boolean) => void;
}> = ({ field, isChecked, onCheckedChange }) => {
  return (
    <div className="flex items-center justify-between pr-2">
      <div className="flex items-center gap-2">
        <CustomCheckbox
          id={field.name}
          checked={isChecked}
          onCheckedChange={onCheckedChange}
        />
        <label
          htmlFor={field.name}
          className="text-sm leading-[22px] select-none text-[#1d2129] cursor-pointer"
        >
          {field.mapping_field}
        </label>
        <FieldTag type={field.query_type || 'both'} />
      </div>
    </div>
  );
};

const FieldAutoComplete = () => {
  const { toast } = useToast();
  const {
    selection,
    loading: feishuLoading,
  } = useFeishuBase();

  const [pageState, setPageState] = useState<PageState>('form');
  const [queryType, setQueryType] = useState<QueryType>(QueryType.CUSTOMER); // 默认选中客户简称
  const [firstColumnFieldId, setFirstColumnFieldId] = useState<string>(""); // 第一列字段ID
  const [dataSource, setDataSource] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [availableFields, setAvailableFields] = useState<Field[]>([]);
  const [filteredFields, setFilteredFields] = useState<Field[]>([]);
  const [selectedFields, setSelectedFields] = useState<Field[]>([]);
  const [tableName, setTableName] = useState<string>("");
  const [configLoading, setConfigLoading] = useState(true);
  const [currentTable, setCurrentTable] = useState<any>(null);

  // 进度相关状态
  const [progressData, setProgressData] = useState({ completed: 0, total: 0 });
  const [completionResult, setCompletionResult] = useState<CompletionResult | null>(null);

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
          console.log('[FieldAutoComplete] A列字段ID:', firstFieldId, '字段名称:', name);
        }
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

  // 获取字段映射配置
  useEffect(() => {
    const fetchMappingConfig = async () => {
      setConfigLoading(true);
      try {
        const fields = await getMappingConfig();
        setAvailableFields(fields);

        // 根据默认查询类型过滤字段
        const filtered = getFieldsByQueryType(fields, queryType);
        setFilteredFields(filtered);

        console.log('[FieldAutoComplete] 字段配置加载完成:', fields.length, '个字段，过滤后:', filtered.length, '个字段');
      } catch (error) {
        console.error('[FieldAutoComplete] 加载字段配置失败:', error);
        // 出错时使用默认配置
        setAvailableFields(DEFAULT_AVAILABLE_FIELDS);
        const filtered = getFieldsByQueryType(DEFAULT_AVAILABLE_FIELDS, queryType);
        setFilteredFields(filtered);
      } finally {
        setConfigLoading(false);
      }
    };

    fetchMappingConfig();
  }, []);

  // 当查询类型改变时，更新可选字段列表
  useEffect(() => {
    if (availableFields.length > 0) {
      const filtered = getFieldsByQueryType(availableFields, queryType);
      setFilteredFields(filtered);

      // 过滤已选字段，只保留在新的过滤列表中的字段
      const validSelectedFields = selectedFields.filter(selectedField =>
        filtered.some(filteredField =>
          filteredField.name === selectedField.name && filteredField.mapping_field === selectedField.mapping_field
        )
      );

      // 如果过滤后的已选字段数量发生变化，更新状态
      if (validSelectedFields.length !== selectedFields.length) {
        setSelectedFields(validSelectedFields);
      }

      console.log('[FieldAutoComplete] 查询类型变更:', queryType, '过滤后字段数量:', filtered.length, '保留已选字段数量:', validSelectedFields.length);
    }
  }, [queryType, availableFields]);

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

  // 搜索变更 - 直接使用apiService
  const { mutate: searchMutate, isPending: isSearching } = useMutation({
    mutationFn: async () => {
      const result = await apiService.search({
        query: searchQuery,
        field: firstColumnFieldId, // 使用第一列字段ID
        apiConfigId: dataSource,
        selection: selection || undefined
      });
      return result;
    },
    onSuccess: () => {
      setSearchPerformed(true);
      toast({
        variant: "default",
        title: "搜索完成",
        description: "成功获取数据",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "搜索失败",
        description: error.message,
      });
    }
  });

  useEffect(() => {
    // 定义回调
    const handleSelectionChange = async () => {
      try {
        const table = await bitable.base.getActiveTable();
        if (table && typeof table.getName === "function") {
          const name = await table.getName();
          setTableName(name);
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
        {/* 条件设置区域 */}
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

            <CustomSelect
              value={queryType}
              onValueChange={(value) => setQueryType(value as QueryType)}
              placeholder="选择查询类型"
              options={QUERY_TYPE_OPTIONS}
              className="w-[90px] sm:w-[100px] md:w-[103px]"
            />

            <span className="text-sm font-medium text-[#1d2129]">字段</span>
          </div>

          <div className="flex items-center gap-[5px] flex-wrap">
            <span className="text-sm font-medium text-[#1d2129]">内容是</span>

            <div className="bg-[#f2f3f5] h-[30px] px-3 py-1 rounded-sm flex-1 min-w-[150px] max-w-[221px] flex items-center">
              <span className="text-sm text-[#1d2129]">
                {queryType === QueryType.CUSTOMER ? '客户简称' : '订单ID'}
              </span>
            </div>

            <span className="text-base font-medium text-[#1d2129]">时，</span>
          </div>
        </div>

        {/* 字段选择区域 */}
        <div className="flex flex-col gap-2.5 flex-1 min-h-0">
          <p className="text-sm font-medium text-[#1d2129]">
            将以下勾选的字段数据同步到表格中
          </p>

          <div className="bg-[#f7f8fa] rounded-[3px] p-2 sm:p-[10px] flex-1 min-h-[300px]">
            <div className="flex flex-col gap-2.5 h-full overflow-y-auto">
              {/* 全选 */}
              <div className="flex items-center gap-2">
                <CustomCheckbox
                  id="select-all"
                  checked={selectedFields.length === filteredFields.length && filteredFields.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedFields([...filteredFields]);
                    } else {
                      setSelectedFields([]);
                    }
                  }}
                  indeterminate={selectedFields.length > 0 && selectedFields.length < filteredFields.length}
                />
                <label htmlFor="select-all" className="text-sm font-medium text-[#1d2129] cursor-pointer select-none">
                  全选
                </label>
              </div>

              {/* 分隔线 */}
              <div className="h-px bg-[#e5e6eb] -mx-2 sm:-mx-[10px]" />

              {/* 字段列表 */}
              <div className="flex flex-col gap-2.5">
                {configLoading ? (
                  <div className="text-center py-4">
                    <div className="text-sm text-[#86909C]">正在加载字段配置...</div>
                  </div>
                ) : filteredFields.length === 0 ? (
                  <div className="text-center py-4">
                    <div className="text-sm text-[#86909C]">暂无可用字段</div>
                  </div>
                ) : (
                  filteredFields.map((field) => (
                    <FieldItem
                      key={`${field.name}-${field.mapping_field}`}
                      field={field}
                      isChecked={selectedFields.some(
                        sf => sf.name === field.name && sf.mapping_field === field.mapping_field
                      )}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedFields([...selectedFields, field]);
                        } else {
                          setSelectedFields(selectedFields.filter(
                            sf => !(sf.name === field.name && sf.mapping_field === field.mapping_field)
                          ));
                        }
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部区域 */}
      <div className="bg-white border-t border-[#e5e6eb] px-3 sm:px-4 md:px-5 py-2.5 flex flex-col gap-1">
        <p className="text-xs text-[#000000] leading-[22px]">
          请注意检查你有表格编辑权限
        </p>
        <button
          onClick={handleApply}
          disabled={selectedFields.length === 0}
          className={cn(
            "w-full h-8 text-white text-sm font-medium rounded-sm transition-colors flex items-center justify-center",
            selectedFields.length === 0
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
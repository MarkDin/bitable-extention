import ActionButtons from "@/components/ActionButtons";
import CompletableFields from "@/components/CompletableFields";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFeishuBase } from "@/hooks/use-feishu-base";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/apiService";
import { autoCompleteFields } from "@/lib/autoCompleteHelper";
import { Field, QueryType } from "@/lib/dataSync";
import { bitable } from "@lark-base-open/js-sdk";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import AutoCompleteProgress from "./AutoCompleteProgress";
import AutoCompleteResult from "./AutoCompleteResult";

type PageState = 'form' | 'progress' | 'result';

interface CompletionResult {
  status: 'success' | 'partial' | 'failed' | 'no_permission';
  successCount: number;
  errorCount: number;
  unchangedCount: number;
}

// 默认字段配置 - 按查询类型分类
const DEFAULT_AVAILABLE_FIELDS: Field[] = [
  // 客户相关字段 (客户简称查询时显示)
  { name: 'accountName', mapping_field: '客户名称', query_type: 'customer' },
  { name: 'accountType', mapping_field: '客户类型', query_type: 'customer' },
  { name: 'industry', mapping_field: '所属行业', query_type: 'customer' },
  { name: 'region', mapping_field: '所在地区', query_type: 'customer' },

  // 订单相关字段 (订单ID查询时显示)
  { name: 'orderId', mapping_field: '订单编号', query_type: 'order' },
  { name: 'orderStatus', mapping_field: '订单状态', query_type: 'order' },
  { name: 'orderAmount', mapping_field: '订单金额', query_type: 'order' },
  { name: 'orderDate', mapping_field: '下单时间', query_type: 'order' },

  // 通用字段 (两种查询都显示)
  { name: 'contactPerson', mapping_field: '联系人', query_type: 'both' },
  { name: 'contactPhone', mapping_field: '联系电话', query_type: 'both' },
  { name: 'contactEmail', mapping_field: '联系邮箱', query_type: 'both' },
  { name: 'salesPerson', mapping_field: '销售负责人', query_type: 'both' },
  { name: 'customerLevel', mapping_field: '客户等级', query_type: 'both' },
  { name: 'lastContactDate', mapping_field: '最后联系时间', query_type: 'both' },
  { name: 'nextFollowUpDate', mapping_field: '下次跟进时间', query_type: 'both' },
  { name: 'remarks', mapping_field: '备注', query_type: 'both' }
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

const FieldAutoComplete = () => {
  const { toast } = useToast();
  const {
    recordFields,
    selection,
    refreshSelection,
    selectedCellValue,
    loading: feishuLoading,
    activeTable
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

  // Handle toggling mapping active state
  const handleToggleMapping = (id: number, isActive: boolean) => {

  };

  const handleCancel = () => {
    setSearchQuery("");
    setSearchPerformed(false);
  };

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

  // 默认表单页面
  return (
    <>
      <div className="p-4">

        {/* Table Name Section */}
        <div className="mb-4">
          <label className="block text-base font-semibold mb-1">补全的数据表</label>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded bg-gray-100 text-base"
            value={tableName || '未获取到表格名称'}
            disabled
            readOnly
          />
        </div>

        {/* Query Type Selection Section */}
        <div className="mb-6">
          <div className="mb-1 text-sm font-medium flex items-center">
            选择补全依据并在数据表第一列填充对应数据
          </div>
          <Select value={queryType} onValueChange={(value) => setQueryType(value as QueryType)}>
            <SelectTrigger className="w-full text-sm bg-white">
              <SelectValue placeholder="选择查询类型" />
            </SelectTrigger>
            <SelectContent>
              {QUERY_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Data Source Section */}
        {/* <div className="mb-6">
          <div className="mb-1 text-sm font-medium">数据源</div>
          <Select value={dataSource.toString()} onValueChange={(value) => setDataSource(parseInt(value))}>
            <SelectTrigger className="w-full text-sm bg-white">
              <SelectValue placeholder="选择数据源" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key={1} value="1">
                mock数据
              </SelectItem>
            </SelectContent>
          </Select>
        </div> */}

        <CompletableFields
          fields={filteredFields}
          selectedFields={selectedFields}
          onSelectionChange={setSelectedFields}
        />
      </div>

      {/* Footer */}
      <footer className="px-4 py-3 border-t border-[#E5E6EB]">
        <div className="text-sm text-blue-600 mb-3 text-center">
          仅支持补全当前数据表中本人有编辑权限的数据
        </div>
        <ActionButtons
          onCancel={handleCancel}
          onApply={handleApply}
        // isLoading={isUpdating}
        />
      </footer>


    </>
  );
};

export default FieldAutoComplete;
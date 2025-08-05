import ActionButtons from "@/components/ActionButtons";
import { FieldSelection } from "@/components/FieldSelection";
import HelpAndFeedback from "@/components/HelpAndFeedback";
import QueryCondition from "@/components/QueryCondition";
import { useFeishuBase } from "@/hooks/use-feishu-base";
import { useToast } from "@/hooks/use-toast";
import { autoCompleteFields } from "@/lib/autoCompleteHelper";
import { QueryType } from "@/lib/dataSync";
import { getFieldsConfig } from "@/lib/fieldsConfigService";
import { Field, TableField, TableFieldConfig } from "@/types/common";
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
  fieldCreationErrors?: string[]; // 字段创建错误信息
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





const FieldAutoComplete = () => {
  // 使用 useQuery 从多维表格获取字段配置
  const { data: fieldsConfigData, isLoading: fieldsConfigLoading, error: fieldsConfigError } = useQuery({
    queryKey: ['fieldsConfig'],
    queryFn: getFieldsConfig,
    staleTime: 5 * 60 * 1000, // 5分钟内不会重新请求
    gcTime: 10 * 60 * 1000, // 10分钟后垃圾回收
    retry: 2, // 失败重试2次
  });

  // 初始化字段数据
  const [fields, setFields] = useState<Field[]>([]);
  const [tableFields, setTableFields] = useState<TableField[]>([]); // 当前表格的字段列表
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

  // 表格配置相关状态
  const [currentTableId, setCurrentTableId] = useState<string>("");

  // 表格配置管理函数
  const getTableConfigKey = (tableId: string) => `table_field_config_${tableId}`;

  // 保存表格字段配置
  const saveTableFieldConfig = async (tableId: string, tableName: string, fields: Field[]) => {
    try {
      const config: TableFieldConfig = {
        tableId,
        tableName,
        fieldConfigs: fields.map(field => ({
          fieldId: field.id,
          fieldName: field.name,
          isChecked: field.isChecked,
          targetFieldId: field.targetFieldId,
          targetFieldName: field.targetFieldName,
          mappingType: field.mappingType || 'new'
        })),
        lastUpdated: new Date().toISOString()
      };

      const configKey = getTableConfigKey(tableId);
      await bitable.bridge.setData(configKey, JSON.stringify(config));

      console.log('[FieldAutoComplete] 表格配置已保存:', { tableId, tableName, configCount: config.fieldConfigs.length });
    } catch (error) {
      console.error('[FieldAutoComplete] 保存表格配置失败:', error);
    }
  };

  // 加载表格字段配置
  const loadTableFieldConfig = async (tableId: string): Promise<TableFieldConfig | null> => {
    try {
      const configKey = getTableConfigKey(tableId);
      const configData = await bitable.bridge.getData(configKey);

      if (configData && typeof configData === 'string') {
        const config: TableFieldConfig = JSON.parse(configData);
        console.log('[FieldAutoComplete] 加载表格配置成功:', { tableId, configCount: config.fieldConfigs.length });
        return config;
      }

      console.log('[FieldAutoComplete] 没有找到表格配置:', tableId);
      return null;
    } catch (error) {
      console.error('[FieldAutoComplete] 加载表格配置失败:', error);
      return null;
    }
  };

  // 获取表格字段列表
  const getTableFields = async (currentTableInstance: any): Promise<TableField[]> => {
    try {
      if (!currentTableInstance) return [];

      const allFields = await currentTableInstance.getFieldList();
      const tableFieldsList: TableField[] = [];

      for (const field of allFields) {
        const fieldName = await field.getName();
        const fieldType = await field.getType();
        // const fieldId = await field.getId();

        tableFieldsList.push({
          id: field.id,
          name: fieldName,
          type: fieldType
        });
      }

      console.log('[FieldAutoComplete] 当前表格字段:', tableFieldsList);
      console.log('[FieldAutoComplete] 表格字段数量:', tableFieldsList.length);
      return tableFieldsList;
    } catch (error) {
      console.error('[FieldAutoComplete] 获取表格字段失败:', error);
      return [];
    }
  };

  // 字段匹配函数：优先加载保存的配置，否则基于字段名称匹配
  const matchExistingFields = async (fieldsToMatch: Field[], currentTableInstance: any) => {
    try {
      if (!currentTableInstance || !fieldsToMatch.length) return fieldsToMatch;

      // 获取表格ID和字段
      const tableName = await currentTableInstance.getName();
      const tableId = `table_${tableName}`.replace(/[^a-zA-Z0-9_]/g, '_');
      setCurrentTableId(tableId);

      const currentTableFields = await getTableFields(currentTableInstance);
      setTableFields(currentTableFields);

      // 尝试加载保存的配置
      const savedConfig = await loadTableFieldConfig(tableId);

      // 创建字段名称映射（用于fallback）
      const fieldNameMap = new Map<string, TableField>();
      currentTableFields.forEach(field => {
        fieldNameMap.set(field.name, field);
      });

      console.log('[FieldAutoComplete] 表格ID:', tableId);
      console.log('[FieldAutoComplete] 是否有保存配置:', !!savedConfig);
      console.log('[FieldAutoComplete] 字段名称映射:', Array.from(fieldNameMap.keys()));

      // 更新字段状态，优先使用保存的配置
      return fieldsToMatch.map(field => {
        // 首先查找保存的配置
        const savedFieldConfig = savedConfig?.fieldConfigs.find(fc => fc.fieldId === field.id);

        if (savedFieldConfig) {
          // 使用保存的配置
          console.log('[FieldAutoComplete] 使用保存配置:', savedFieldConfig.fieldName);

          // 验证目标字段是否仍然存在
          const targetFieldExists = savedFieldConfig.targetFieldId ?
            currentTableFields.some(tf => tf.id === savedFieldConfig.targetFieldId) : false;

          return {
            ...field,
            isChecked: savedFieldConfig.isChecked,
            targetFieldId: targetFieldExists ? savedFieldConfig.targetFieldId : undefined,
            targetFieldName: targetFieldExists ? savedFieldConfig.targetFieldName : undefined,
            mappingType: targetFieldExists ? savedFieldConfig.mappingType : 'new' as const,
            // 警告状态
            hasWarning: field.name === '电话' || field.name.includes('电话'),
            warningMessage: (field.name === '电话' || field.name.includes('电话')) ? '请注意检查你有表格编辑权限' : undefined
          };
        } else {
          // 没有保存配置，使用名称匹配（原逻辑）
          const existingField = fieldNameMap.get(field.name);
          const isExistingField = !!existingField;

          console.log('[FieldAutoComplete] 使用名称匹配:', field.name, isExistingField ? '找到同名字段' : '无同名字段');

          return {
            ...field,
            isChecked: isExistingField ? true : field.isChecked,
            isDisabled: false,
            helperText: isExistingField ? '已有同名字段' : undefined,
            targetFieldId: isExistingField ? existingField.id : undefined,
            targetFieldName: isExistingField ? existingField.name : undefined,
            mappingType: isExistingField ? 'existing' as const : 'new' as const,
            // 警告状态
            hasWarning: field.name === '电话' || field.name.includes('电话'),
            warningMessage: (field.name === '电话' || field.name.includes('电话')) ? '请注意检查你有表格编辑权限' : undefined
          };
        }
      });
    } catch (error) {
      console.error('[FieldAutoComplete] 匹配字段失败:', error);
      return fieldsToMatch;
    }
  };

  // 当字段配置数据加载完成时，更新本地状态并匹配已存在字段
  useEffect(() => {
    if (fieldsConfigData && fieldsConfigData.length > 0) {
      console.log('[FieldAutoComplete] 字段配置加载完成，共', fieldsConfigData.length, '个字段');

      // 如果当前有表格，立即进行字段匹配
      if (currentTable) {
        console.log('[FieldAutoComplete] 字段配置加载，开始匹配现有表格字段');
        matchExistingFields(fieldsConfigData, currentTable).then(matchedFields => {
          console.log('[FieldAutoComplete] 初始字段匹配完成');
          setFields(matchedFields);
        });
      } else {
        console.log('[FieldAutoComplete] 没有当前表格，直接设置字段配置');
        setFields(fieldsConfigData);
      }
    }
  }, [fieldsConfigData, currentTable]);

  // 如果字段配置加载失败，显示错误提示
  useEffect(() => {
    if (fieldsConfigError) {
      console.error('[FieldAutoComplete] 字段配置加载失败:', fieldsConfigError);
      toast({
        title: "字段配置加载失败",
        description: "无法从多维表格加载字段配置，将使用默认配置。",
        variant: "destructive",
      });
    }
  }, [fieldsConfigError, toast]);

  // 处理字段选择变化
  const handleFieldChange = (id: string, checked: boolean) => {
    setFields(prev => prev.map(field => {
      if (field.id === id) {
        const updatedField = { ...field, isChecked: checked };

        // 如果是新勾选的字段且没有预设映射，设置默认映射为新增列
        if (checked && !field.targetFieldId) {
          updatedField.mappingType = 'new';
          updatedField.targetFieldId = undefined;
          updatedField.targetFieldName = undefined;
        }
        // 如果取消勾选，清除映射信息
        else if (!checked) {
          updatedField.mappingType = 'new';
          updatedField.targetFieldId = undefined;
          updatedField.targetFieldName = undefined;
        }

        return updatedField;
      }
      return field;
    }));
  };

  // 处理字段映射变化
  const handleFieldMappingChange = (
    fieldId: string,
    targetFieldId?: string,
    targetFieldName?: string,
    mappingType?: 'existing' | 'new'
  ) => {
    setFields(prev => prev.map(field =>
      field.id === fieldId
        ? {
          ...field,
          targetFieldId,
          targetFieldName,
          mappingType
        }
        : field
    ));
  };

  // 移除了 tableChanged 相关的逻辑，因为现在使用了更好的字段匹配机制


  // 直接从apiService获取字段映射
  // const { data: mappingsData } = useQuery({
  //   queryKey: ["mappings", dataSource],
  //   queryFn: async () => {
  //     const mappings = await apiService.getFieldMappings(dataSource);
  //     return { mappings };
  //   },
  //   enabled: !!dataSource,
  // });

  // // Update mappings when fetched
  // useEffect(() => {
  //   if (mappingsData?.mappings) {

  //   }
  // }, [mappingsData]);


  useEffect(() => {
    // 定义回调
    const handleSelectionChange = async () => {
      try {
        const table = await bitable.base.getActiveTable();
        if (table && typeof table.getName === "function") {
          const name = await table.getName();
          // 使用表格名称作为唯一标识符，确保同一表格每次都有相同ID
          const tableId = `table_${name}`.replace(/[^a-zA-Z0-9_]/g, '_');

          setTableName(name);
          setCurrentTable(table);
          setCurrentTableId(tableId);

          console.log('[FieldAutoComplete] 表格切换 - ID:', tableId, '名称:', name);

          // 获取有序的字段列表（通过视图获取）- 更新第一列字段信息
          const activeView = await table.getActiveView();
          const visibleFieldIds = await activeView.getVisibleFieldIdList();

          if (visibleFieldIds && visibleFieldIds.length > 0) {
            // 第一个字段就是A列
            const firstFieldId = visibleFieldIds[0];
            setFirstColumnFieldId(firstFieldId);

            // 获取字段名称用于日志
            const firstField = await table.getFieldById(firstFieldId);
            const firstFieldName = await firstField.getName();
            setFirstColumnFieldName(firstFieldName);
            console.log('[FieldAutoComplete] A列字段ID:', firstFieldId, '字段名称:', firstFieldName);
          }

          // 如果已有字段配置，进行字段匹配
          if (fields.length > 0) {
            console.log('[FieldAutoComplete] 开始匹配表格字段，字段数量:', fields.length);
            const matchedFields = await matchExistingFields(fields, table);
            console.log('[FieldAutoComplete] 字段匹配完成，结果:', matchedFields.map(f => ({
              name: f.name,
              isChecked: f.isChecked,
              mappingType: f.mappingType,
              targetFieldName: f.targetFieldName
            })));
            setFields(matchedFields);
          }
        } else {
          setTableName("");
          setFirstColumnFieldId("");
          setFirstColumnFieldName("");
          setCurrentTable(null);
          setCurrentTableId("");
        }
      } catch (error) {
        console.error('[FieldAutoComplete] 处理表格切换失败:', error);
        setTableName("");
        setFirstColumnFieldId("");
        setFirstColumnFieldName("");
        setCurrentTable(null);
        setCurrentTableId("");
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

      // 保存当前表格的字段配置
      if (currentTableId && tableName) {
        console.log('[FieldAutoComplete] 保存表格配置，表格ID:', currentTableId);
        await saveTableFieldConfig(currentTableId, tableName, fields);

        toast({
          title: "配置已保存",
          description: "当前表格的字段配置已保存，下次打开时将自动应用。",
        });
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
        },
        onOperationLog: (log) => {
          // 处理操作日志
          console.log('[FieldAutoComplete] 收到操作日志:', log);

          // 这里可以将日志发送到服务器或存储到本地
          // 例如：调用飞书 webhook 发送卡片
          handleOperationLog(log);
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

  // 处理操作日志的函数
  const handleOperationLog = async (log: any) => {
    try {
      // 保存到本地存储
      const logs = JSON.parse(localStorage.getItem('auto_complete_logs') || '[]');
      logs.push(log);
      // 只保留最近 50 条日志
      if (logs.length > 50) {
        logs.splice(0, logs.length - 50);
      }
      localStorage.setItem('auto_complete_logs', JSON.stringify(logs));

      console.log('[FieldAutoComplete] 操作日志已保存:', log);

      // 发送到飞书 webhook
      try {
        const { sendOperationLogToFeishu } = await import('@/lib/sendLarkMessage');
        const success = await sendOperationLogToFeishu(log);
        if (success) {
          console.log('[FieldAutoComplete] 操作日志已发送到飞书');
        } else {
          console.warn('[FieldAutoComplete] 发送到飞书失败');
        }
      } catch (error) {
        console.error('[FieldAutoComplete] 发送到飞书失败:', error);
      }

    } catch (error) {
      console.error('[FieldAutoComplete] 保存操作日志失败:', error);
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
        fieldCreationErrors={completionResult.fieldCreationErrors}
        onReturn={handleReturn}
      />
    );
  }

  // 如果字段配置还在加载中，显示加载状态
  if (fieldsConfigLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-sm text-[#86909C]">正在从多维表格加载字段配置...</div>
        </div>
      </div>
    );
  }

  // 如果字段配置为空（加载完成但没有数据），显示提示
  if (!fieldsConfigLoading && fields.length === 0) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-sm text-[#86909C] mb-2">字段配置为空</div>
          <div className="text-xs text-[#c9cdd4]">请检查多维表格中的字段配置数据</div>
        </div>
      </div>
    );
  }

  // 默认表单页面 - 修复底部置底问题
  return (
    <div className="w-full h-full bg-[#f8f9fa] flex flex-col">
      {/* 帮助与反馈区域 */}
      <div className="bg-white px-6 py-4 flex-shrink-0 border-b border-[#e4e7ec]">
        <HelpAndFeedback />
      </div>

      {/* 内容区域 - 优化布局 */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 px-6 py-4 overflow-y-auto">
          <div className="space-y-4">
            <QueryCondition tableName={tableName} firstColumnFieldName={firstColumnFieldName} />

            {/* 字段选择区域 */}
            <div className="bg-white rounded-lg border border-[#e4e7ec] p-4">
              <FieldSelection
                fields={fields}
                tableFields={tableFields}
                onFieldChange={handleFieldChange}
                onFieldMappingChange={handleFieldMappingChange}
              />
            </div>
          </div>
        </div>

        {/* 底部区域 - 固定在底部 */}
        <ActionButtons
          onApply={handleApply}
          isApplyDisabled={fields.filter(f => f.isChecked).length === 0}
          isLoading={fieldsConfigLoading}
          hasError={!!fieldsConfigError}
        />
      </div>
    </div>
  );
};

export default FieldAutoComplete;

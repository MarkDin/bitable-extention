import ActionButtons from "@/components/ActionButtons";
import CompletableFields from "@/components/CompletableFields";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFeishuBase } from "@/hooks/use-feishu-base";
import { useToast } from "@/hooks/use-toast";
import { useFeishuBaseStore } from "@/hooks/useFeishuBaseStore";
import { apiService } from "@/lib/apiService";
import { autoCompleteFields } from "@/lib/autoCompleteHelper";
import { Field, getConfig } from "@/lib/dataSync";
import { bitable } from "@lark-base-open/js-sdk";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
// import { applyUpdate } from "@/hooks/useApplyUpdate";

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

  const [queryField, setQueryField] = useState<string>("");
  const [dataSource, setDataSource] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [completableFields, setCompletableFields] = useState<Field[]>([]);
  const [selectedFields, setSelectedFields] = useState<Field[]>([]);
  const [tableName, setTableName] = useState<string>("");

  // 获取可补全字段配置
  useEffect(() => {
    const fetchConfig = async () => {
      const config = await getConfig();
      if (config?.field_list) {
        setCompletableFields(config.field_list);
      }
    };
    fetchConfig();
  }, []);

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
        field: queryField,
        apiConfigId: dataSource,
        selection: selection || undefined
      });
      return result;
    },
    onSuccess: () => {
      setSearchPerformed(true);
      toast({
        title: "搜索完成",
        description: "成功获取数据",
      });
    },
    onError: (error) => {
      toast({
        title: "搜索失败",
        description: error.message,
        variant: "destructive",
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

  // Function to detect selection changes and update search query
  const handleDetectSelection = async () => {
    await refreshSelection();
    const selectedValue = useFeishuBaseStore.getState().selectedCellValue;
    const selection = useFeishuBaseStore.getState().selection;
    if (selectedValue) {
      console.log('selectedValue', selectedValue);
      toast({
        title: "已检测到选中单元格",
        description: `字段: ${selection?.fieldId}, 值: ${selectedValue}`,
      });

      // If we have both field and value, auto search
      if (selection?.fieldId && selectedValue) {
        // Check if the field has changed
        if (queryField !== selection.fieldId) {
          setQueryField(selection.fieldId);
        }

        // If search term is different, update it
        if (searchQuery !== selectedValue) {
          setSearchQuery(selectedValue);
        }

        // Auto-search if field and value are valid and there's a change
        if (selection.fieldId && selectedValue && dataSource) {
          searchMutate();
        }
      }
    } else {
      toast({
        title: "未检测到选中单元格",
        description: "请在表格中选择一个单元格",
        variant: "destructive",
      });
    }
  };

  const handleSearch = () => {
    if (!queryField || !searchQuery) {
      toast({
        title: "请完成所有字段",
        description: "查询字段和搜索值不能为空",
        variant: "destructive",
      });
      return;
    }
    searchMutate();
  };

  const handleCancel = () => {
    setSearchQuery("");
    setSearchPerformed(false);
  };

  const handleApply = async () => {
    try {
      await refreshSelection();
      await autoCompleteFields({
        toast,
        selectedFields
      });
    } catch (e: any) {
      toast({ title: "补全失败", description: e.message, variant: "destructive" });
    }
  };

  return (
    <>
      <div className="p-4">

        {/* Table Name Section */}
        <div className="mb-4">
          <label className="block text-base font-semibold mb-1">表格名称</label>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded bg-gray-100 text-base"
            value={tableName || '未获取到表格名称'}
            disabled
            readOnly
          />
        </div>

        {/* Field Selection Section */}
        <div className="mb-6">
          <div className="mb-1 text-sm font-medium flex items-center">
            查询字段
            {selection?.fieldId === queryField && (
              <span className="ml-2 text-[#165DFF] bg-[#E8F3FF] text-xs px-2 py-0.5 rounded">自动选中</span>
            )}
          </div>
          <Select value={queryField} onValueChange={setQueryField}>
            <SelectTrigger className={`w-full text-sm bg-white ${selection?.fieldId === queryField ? "border-[#165DFF]" : ""}`}>
              <SelectValue placeholder="选择查询字段" />
            </SelectTrigger>
            <SelectContent>
              {recordFields.map((field) => (
                <SelectItem
                  key={field.id}
                  value={field.id}
                  className={field.id === selection?.fieldId ? "text-[#165DFF] font-medium" : ""}
                >
                  {field.id === selection?.fieldId ? `${field.name} (选中字段)` : field.name}
                </SelectItem>
              ))}
              {recordFields.length === 0 && (
                <SelectItem value="placeholder" disabled>
                  {feishuLoading ? "加载中..." : "无可用字段"}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>


        {/* Data Source Section */}
        <div className="mb-6">
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
        </div>

        <CompletableFields
          fields={completableFields}
          selectedFields={selectedFields}
          onSelectionChange={setSelectedFields}
        />
      </div>

      {/* Footer */}
      <footer className="px-4 py-3 border-t border-[#E5E6EB]">
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
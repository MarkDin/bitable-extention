import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import FieldMapping, { Mapping } from "@/components/FieldMapping";
import DataPreview, { FieldDiff } from "@/components/DataPreview";
import ActionButtons from "@/components/ActionButtons";
import { UserInfo } from "@/components/UserInfo";
import { useFeishuBase } from "@/hooks/use-feishu-base";
import { apiRequest } from "@/lib/queryClient";
import bytedanceLogo from "../assets/tech-logos/bytedance.svg";

// 定义API配置类型
interface ApiConfiguration {
  id: number;
  name: string;
  endpoint: string;
  auth_type: string;
}

// 定义配置数据的类型
interface ConfigData {
  configurations: ApiConfiguration[];
}

// 定义字段映射类型
interface FieldMappingData {
  mappings: Array<{
    id: number;
    api_configuration_id: number;
    source_field: string;
    target_field: string;
    is_active: boolean;
  }>;
}

const DataSync = () => {
  const { toast } = useToast();
  const { activeTable, recordFields, loading: feishuLoading } = useFeishuBase();
  
  const [primaryKeyField, setPrimaryKeyField] = useState<string>("");
  const [dataSource, setDataSource] = useState<number>(1);
  const [apiEndpoint, setApiEndpoint] = useState<string>("https://api.example.com/company");
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [syncStarted, setSyncStarted] = useState(false);
  const [syncCompleted, setSyncCompleted] = useState(false);
  
  // Fetch API configurations
  const { data: configData, isLoading: isLoadingConfigs } = useQuery<ConfigData>({
    queryKey: ["/api/configurations"],
    enabled: !feishuLoading,
  });
  
  // Fetch field mappings when dataSource changes
  const { data: mappingsData, isLoading: isMappingsLoading } = useQuery<FieldMappingData>({
    queryKey: ["/api/configurations", dataSource, "mappings"],
    queryFn: async () => {
      const res = await fetch(`/api/configurations/${dataSource}/mappings`);
      if (!res.ok) throw new Error("Failed to fetch mappings");
      return res.json();
    },
    enabled: !!dataSource,
  });
  
  // Sync mutation
  const { mutate: syncMutate, isPending: isSyncing } = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/search", {
        query: "全部记录",
        field: primaryKeyField,
        apiConfigId: dataSource
      });
    },
    onSuccess: async (res) => {
      const data = await res.json();
      setSyncStarted(true);
      setSyncCompleted(true);
      toast({
        title: "同步完成",
        description: "已成功同步数据",
      });
    },
    onError: (error) => {
      toast({
        title: "同步失败",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Apply updates mutation
  const { mutate: applyUpdate, isPending: isUpdating } = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/update", {
        recordId: "placeholder-record-id",
        primaryKey: primaryKeyField,
        primaryKeyValue: "all-records",
        apiConfigId: dataSource,
        mappings: mappings.filter(m => m.isActive)
      });
    },
    onSuccess: async (res) => {
      const data = await res.json();
      toast({
        title: "更新成功",
        description: "所有选定字段已更新",
      });
      setSyncCompleted(false);
      setSyncStarted(false);
    },
    onError: (error) => {
      toast({
        title: "更新失败",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update mappings when fetched
  useEffect(() => {
    if (mappingsData?.mappings) {
      setMappings(mappingsData.mappings.map((m: any) => ({
        id: m.id,
        sourceField: m.source_field,
        targetField: m.target_field,
        isActive: m.is_active
      })));
    }
  }, [mappingsData]);
  
  // Update API endpoint when data source changes
  useEffect(() => {
    // 确保configData存在并有configurations属性
    const configurations = configData && 'configurations' in configData 
      ? configData.configurations 
      : [];
    
    const config = configurations?.find((c: any) => c.id === dataSource);
    if (config) {
      setApiEndpoint(config.endpoint);
    }
  }, [dataSource, configData]);
  
  // Handle toggling mapping active state
  const handleToggleMapping = (id: number, isActive: boolean) => {
    setMappings(mappings.map(m => 
      m.id === id ? { ...m, isActive } : m
    ));
  };
  
  // Sample preview data - this would normally come from the API
  const previewData = syncCompleted ? {
    name: "字节跳动有限公司",
    industry: "互联网/科技服务",
    logo: bytedanceLogo,
    fields: [
      { field: "法定代表人", oldValue: null, newValue: "张一鸣", status: "unchanged" as const },
      { field: "注册资本", oldValue: "1亿美元", newValue: "3亿美元", status: "changed" as const },
      { field: "注册地址", oldValue: null, newValue: "北京市海淀区知春路甲48号", status: "unchanged" as const },
      { field: "成立日期", oldValue: null, newValue: "2012-03-09", status: "unchanged" as const },
      { field: "经营范围", oldValue: null, newValue: "开发、设计、经营计算机软件；设计、制作、代理、发布广告；技术开发、技术转让、...", status: "added" as const },
    ]
  } : null;
  
  const handleSync = () => {
    if (!primaryKeyField) {
      toast({
        title: "请选择主键字段",
        description: "需要指定用于同步的主键字段",
        variant: "destructive",
      });
      return;
    }
    syncMutate();
  };
  
  const handleCancel = () => {
    setSyncStarted(false);
    setSyncCompleted(false);
  };
  
  const handleApply = () => {
    if (!syncCompleted) {
      toast({
        title: "请先执行同步",
        description: "在应用更新前需要先同步数据",
        variant: "destructive",
      });
      return;
    }
    applyUpdate();
  };
  
  return (
    <>
      <div className="p-4">
        {/* 用户信息 */}
        <UserInfo />
        
        {/* Instruction */}
        <div className="mb-4 p-3 bg-[#F2F3F5] rounded-md text-sm text-[#86909C]">
          根据主键字段同步更新已有记录，确保数据保持最新
        </div>
        
        {/* Primary Key Selection */}
        <div className="mb-6">
          <div className="mb-1 text-sm font-medium">主键字段</div>
          <Select value={primaryKeyField} onValueChange={setPrimaryKeyField}>
            <SelectTrigger className="w-full text-sm bg-white">
              <SelectValue placeholder="选择主键字段" />
            </SelectTrigger>
            <SelectContent>
              {recordFields.map((field) => (
                <SelectItem key={field.id} value={field.id}>
                  {field.name}
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
        
        {/* Data Source Selection */}
        <div className="mb-6">
          <div className="mb-1 text-sm font-medium">数据源</div>
          <Select value={dataSource.toString()} onValueChange={(value) => setDataSource(parseInt(value))}>
            <SelectTrigger className="w-full text-sm bg-white">
              <SelectValue placeholder="选择数据源" />
            </SelectTrigger>
            <SelectContent>
              {configData && 'configurations' in configData && 
                configData.configurations.map((config: any) => (
                  <SelectItem key={config.id} value={config.id.toString()}>
                    {config.name}
                  </SelectItem>
                ))
              }
              {(!configData || !('configurations' in configData) || configData.configurations.length === 0) && (
                <SelectItem value="loading" disabled>
                  {isLoadingConfigs ? "加载中..." : "无可用数据源"}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        
        {/* API Endpoint */}
        <div className="mb-6">
          <div className="mb-1 text-sm font-medium">API端点</div>
          <div className="flex space-x-2">
            <Input 
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              placeholder="API 端点 URL"
              className="text-sm flex-1"
              disabled={isSyncing}
            />
            <Button onClick={handleSync} disabled={isSyncing}>
              {isSyncing ? "同步中..." : "同步"}
            </Button>
          </div>
        </div>
        
        {/* Field Mapping */}
        <FieldMapping 
          mappings={mappings}
          onToggle={handleToggleMapping}
          onEditMappings={() => {}}
        />
      </div>
      
      {/* Data Preview */}
      <DataPreview 
        data={previewData}
        isLoading={isSyncing}
      />
      
      {/* Footer */}
      <footer className="px-4 py-3 border-t border-[#E5E6EB]">
        <ActionButtons 
          onCancel={handleCancel}
          onApply={handleApply}
          isLoading={isUpdating}
          applyText="应用更新"
        />
      </footer>
    </>
  );
};

export default DataSync;

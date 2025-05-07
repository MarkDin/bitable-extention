import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FieldMapping, { Mapping } from "@/components/FieldMapping";
import DataPreview, { FieldDiff } from "@/components/DataPreview";
import ActionButtons from "@/components/ActionButtons";
import { useFeishuBase } from "@/hooks/use-feishu-base";
import { apiRequest } from "@/lib/queryClient";
import bytedanceLogo from "../assets/tech-logos/bytedance.svg";

const FieldAutoComplete = () => {
  const { toast } = useToast();
  const { activeTable, recordFields, loading: feishuLoading } = useFeishuBase();
  
  const [queryField, setQueryField] = useState<string>("");
  const [dataSource, setDataSource] = useState<number>(1);
  const [isEditMappingOpen, setIsEditMappingOpen] = useState(false);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchPerformed, setSearchPerformed] = useState(false);
  
  // Fetch API configurations
  const { data: configData } = useQuery({
    queryKey: ["/api/configurations"],
    enabled: !feishuLoading,
  });
  
  // Fetch field mappings when dataSource changes
  const { data: mappingsData, isLoading: isMappingsLoading } = useQuery({
    queryKey: ["/api/configurations", dataSource, "mappings"],
    queryFn: async () => {
      const res = await fetch(`/api/configurations/${dataSource}/mappings`);
      if (!res.ok) throw new Error("Failed to fetch mappings");
      return res.json();
    },
    enabled: !!dataSource,
  });
  
  // Search mutation
  const { mutate: searchMutate, isPending: isSearching } = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/search", {
        query: searchQuery,
        field: queryField,
        apiConfigId: dataSource
      });
    },
    onSuccess: async (res) => {
      const data = await res.json();
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
  
  // Apply updates mutation
  const { mutate: applyUpdate, isPending: isUpdating } = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/update", {
        recordId: "placeholder-record-id",
        primaryKey: queryField,
        primaryKeyValue: searchQuery,
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
  
  // Handle toggling mapping active state
  const handleToggleMapping = (id: number, isActive: boolean) => {
    setMappings(mappings.map(m => 
      m.id === id ? { ...m, isActive } : m
    ));
  };
  
  // Sample preview data - this would normally come from the API
  const previewData = searchPerformed ? {
    name: "字节跳动有限公司",
    industry: "互联网/科技服务",
    logo: bytedanceLogo,
    fields: [
      { field: "法定代表人", oldValue: null, newValue: "张一鸣", status: "unchanged" },
      { field: "注册资本", oldValue: "1亿美元", newValue: "3亿美元", status: "changed" },
      { field: "注册地址", oldValue: null, newValue: "北京市海淀区知春路甲48号", status: "unchanged" },
      { field: "成立日期", oldValue: null, newValue: "2012-03-09", status: "unchanged" },
      { field: "经营范围", oldValue: null, newValue: "开发、设计、经营计算机软件；设计、制作、代理、发布广告；技术开发、技术转让、...", status: "added" },
    ]
  } : null;
  
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
  
  const handleApply = () => {
    if (!searchPerformed) {
      toast({
        title: "请先执行搜索",
        description: "在应用更新前需要先搜索数据",
        variant: "destructive",
      });
      return;
    }
    applyUpdate();
  };
  
  return (
    <>
      <div className="p-4">
        {/* Instruction */}
        <div className="mb-4 p-3 bg-[#F2F3F5] rounded-md text-sm text-[#86909C]">
          选择一个记录的字段值作为查询条件，然后自动填充其它相关字段
        </div>
        
        {/* Field Selection Section */}
        <div className="mb-6">
          <div className="mb-1 text-sm font-medium">查询字段</div>
          <Select value={queryField} onValueChange={setQueryField}>
            <SelectTrigger className="w-full text-sm bg-white">
              <SelectValue placeholder="选择查询字段" />
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
        
        {/* Search Query Input */}
        <div className="mb-6">
          <div className="mb-1 text-sm font-medium">搜索值</div>
          <div className="flex space-x-2">
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="输入要搜索的值"
              className="text-sm"
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? "搜索中..." : "搜索"}
            </Button>
          </div>
        </div>
        
        {/* Data Source Section */}
        <div className="mb-6">
          <div className="mb-1 text-sm font-medium">数据源</div>
          <Select value={dataSource.toString()} onValueChange={(value) => setDataSource(parseInt(value))}>
            <SelectTrigger className="w-full text-sm bg-white">
              <SelectValue placeholder="选择数据源" />
            </SelectTrigger>
            <SelectContent>
              {configData?.configurations?.map((config: any) => (
                <SelectItem key={config.id} value={config.id.toString()}>
                  {config.name}
                </SelectItem>
              ))}
              {!configData && (
                <SelectItem value="loading" disabled>
                  加载中...
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        
        {/* Field Mapping */}
        <FieldMapping 
          mappings={mappings}
          onToggle={handleToggleMapping}
          onEditMappings={() => setIsEditMappingOpen(true)}
        />
      </div>
      
      {/* Data Preview */}
      <DataPreview 
        data={previewData}
        isLoading={isSearching}
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
      
      {/* Edit Mapping Dialog */}
      <Dialog open={isEditMappingOpen} onOpenChange={setIsEditMappingOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>编辑字段映射</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {mappings.map((mapping, index) => (
              <div key={index} className="grid grid-cols-5 items-center gap-2">
                <Label className="text-right col-span-1">{mapping.sourceField}</Label>
                <span className="col-span-1 text-center">→</span>
                <Input
                  className="col-span-3"
                  value={mapping.targetField}
                  onChange={(e) => {
                    const newMappings = [...mappings];
                    newMappings[index].targetField = e.target.value;
                    setMappings(newMappings);
                  }}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsEditMappingOpen(false)}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FieldAutoComplete;

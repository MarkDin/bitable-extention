import { getStoredUserInfo, type FeishuUserInfo } from '@/lib/feishuAuth';
import { feishuBase } from '@/lib/feishuBase';
import { useEffect, useState } from 'react';
import { toast } from './use-toast';
import { useFeishuBaseStore } from './useFeishuBaseStore';

export function useFeishuBase() {
  // 全局状态
  const activeTable = useFeishuBaseStore(state => state.activeTable);
  const setActiveTable = useFeishuBaseStore(state => state.setActiveTable);
  const recordFields = useFeishuBaseStore(state => state.recordFields);
  const setRecordFields = useFeishuBaseStore(state => state.setRecordFields);
  const records = useFeishuBaseStore(state => state.records);
  const setRecords = useFeishuBaseStore(state => state.setRecords);
  const selection = useFeishuBaseStore(state => state.selection);
  const setSelection = useFeishuBaseStore(state => state.setSelection);
  const currentUser = useFeishuBaseStore(state => state.currentUser);
  const setCurrentUser = useFeishuBaseStore(state => state.setCurrentUser);
  const selectedCellValue = useFeishuBaseStore(state => state.selectedCellValue);
  const setSelectedCellValue = useFeishuBaseStore(state => state.setSelectedCellValue);

  // 飞书认证用户信息
  const feishuUserInfo = useFeishuBaseStore(state => state.feishuUserInfo);
  const setFeishuUserInfo = useFeishuBaseStore(state => state.setFeishuUserInfo);

  // 本地状态
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTableData() {
      setLoading(true);
      setError(null);

      try {
        // 加载存储的飞书用户信息
        const storedUserInfo = getStoredUserInfo();
        if (storedUserInfo) {
          setFeishuUserInfo(storedUserInfo);
        }

        // Get current user information
        const user = await feishuBase.getCurrentUser();
        setCurrentUser(user);

        // Get active table
        const table = await feishuBase.getActiveTable();
        console.log('fetch table', table)
        setActiveTable(table);

        // Get fields
        const fields = await feishuBase.getFields(table.id);
        setRecordFields(fields);

        // Get current selection
        const currentSelection = await feishuBase.getSelection();
        setSelection(currentSelection);

        // If field and record are selected, get the field value


      } catch (err) {
        console.error('Error loading table data:', err);
        setError('加载数据失败，请刷新页面重试');
      } finally {
        setLoading(false);
      }
    }

    loadTableData();
  }, []);

  const updateRecord = async (recordId: string, fields: { [key: string]: any }) => {
    if (!activeTable) return;

    try {
      await feishuBase.updateRecord(activeTable.id, recordId, fields);

      // Update global records state
      const currentRecords = useFeishuBaseStore.getState().records;
      const newRecords = currentRecords.map((record: any) =>
        record.id === recordId
          ? { ...record, fields: { ...record.fields, ...fields } }
          : record
      );
      setRecords(newRecords);

      return true;
    } catch (err) {
      console.error('Error updating record:', err);
      return false;
    }
  };

  // Function to refresh selection (useful when user selects different cells)
  const refreshSelection = async () => {
    console.log('refreshSelection');
    try {
      // Get current selection
      const currentSelection = await feishuBase.getSelection();
      if (!currentSelection.viewId || !currentSelection.recordId || !currentSelection.tableId) {
        toast({ title: "未选中表格", variant: "destructive" });
        return;
      }
      setSelection(currentSelection);

      // If field and record are selected, get the field value
      if (currentSelection.fieldId && currentSelection.recordId && currentSelection.tableId) {
        console.log('getFieldValue4444', currentSelection);
        try {
          const value = await feishuBase.getFieldValue(
            currentSelection.tableId,
            currentSelection.recordId,
            currentSelection.fieldId
          );
          setSelectedCellValue(Array.isArray(value) && value[0] && typeof value[0] === 'object' && 'text' in value[0] ? value[0].text : String(value));
          return value;
        } catch (err) {
          console.error('Error getting field value:', err);
          return null;
        }
      }

      return null;
    } catch (err) {
      console.error('Error refreshing selection:', err);
      return null;
    }
  };

  // 更新飞书用户信息的方法
  const updateFeishuUserInfo = (userInfo: FeishuUserInfo | null) => {
    setFeishuUserInfo(userInfo);
  };

  // 用户权限检查辅助方法
  const checkUserPermission = (requiredPermission?: string) => {
    if (!feishuUserInfo) {
      return {
        hasPermission: false,
        reason: '用户未登录'
      };
    }

    // 这里可以根据实际需求添加权限检查逻辑
    // 例如检查用户的tenant_key、user_id等信息
    return {
      hasPermission: true,
      userInfo: feishuUserInfo
    };
  };

  return {
    activeTable,
    recordFields,
    records,
    selection,
    currentUser,
    loading,
    error,
    updateRecord,
    refreshSelection,
    selectedCellValue,
    // 飞书认证用户信息相关
    feishuUserInfo,
    updateFeishuUserInfo,
    checkUserPermission
  };
}

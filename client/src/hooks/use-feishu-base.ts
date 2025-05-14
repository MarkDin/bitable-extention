import { feishuBase } from '@/lib/feishuBase';
import { useEffect, useState } from 'react';
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
  const selectedCellValue = useFeishuBaseStore(state => state.selectedCellValue);
  const setSelectedCellValue = useFeishuBaseStore(state => state.setSelectedCellValue);
  const selectedRecordIds = useFeishuBaseStore(state => state.selectedRecordIds);
  const setSelectedRecordIds = useFeishuBaseStore(state => state.setSelectedRecordIds);
  const currentUser = useFeishuBaseStore(state => state.currentUser);
  const setCurrentUser = useFeishuBaseStore(state => state.setCurrentUser);

  // 本地状态
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTableData() {
      setLoading(true);
      setError(null);

      try {
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

        // Get records - 转换为数组形式
        const tableRecords = await feishuBase.getRecords(table.id);
        // 注意：这里我们将IRecordList类型的对象转换为数组形式
        const recordsArray = tableRecords ? Array.from(tableRecords) : [];
        setRecords(recordsArray);

        // Get current selection
        const currentSelection = await feishuBase.getSelection();
        setSelection(currentSelection);

        // If field and record are selected, get the field value
        if (currentSelection.fieldId && currentSelection.recordId && currentSelection.tableId) {
          const value = await feishuBase.getFieldValue(
            currentSelection.tableId,
            currentSelection.recordId,
            currentSelection.fieldId
          );
          setSelectedCellValue(value);
        }

        // Get selected record IDs
        if (currentSelection.tableId && currentSelection.viewId) {
          const ids = await feishuBase.getSelectedRecordIdList(
            currentSelection.tableId,
            currentSelection.viewId
          );
          setSelectedRecordIds(ids);
        }
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
    if (!activeTable) return;
    
    try {
      // Get current selection
      const currentSelection = await feishuBase.getSelection();
      setSelection(currentSelection);

      // If field and record are selected, get the field value
      if (currentSelection.fieldId && currentSelection.recordId && currentSelection.tableId) {
        const value = await feishuBase.getFieldValue(
          currentSelection.tableId,
          currentSelection.recordId,
          currentSelection.fieldId
        );
        setSelectedCellValue(value);
        return value;
      }
      
      return null;
    } catch (err) {
      console.error('Error refreshing selection:', err);
      return null;
    }
  };

  return {
    activeTable,
    recordFields,
    records,
    selection,
    selectedCellValue,
    selectedRecordIds,
    currentUser,
    loading,
    error,
    updateRecord,
    refreshSelection
  };
}

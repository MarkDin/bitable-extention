import { useState, useEffect } from 'react';
import { feishuBase, Table, Field, Record, Selection, User } from '@/lib/feishuBase';

export function useFeishuBase() {
  const [activeTable, setActiveTable] = useState<Table | null>(null);
  const [recordFields, setRecordFields] = useState<Field[]>([]);
  const [records, setRecords] = useState<Record[]>([]);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [selectedCellValue, setSelectedCellValue] = useState<string | null>(null);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
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
        setActiveTable(table);

        // Get fields
        const fields = await feishuBase.getFields(table.id);
        setRecordFields(fields);

        // Get records
        const tableRecords = await feishuBase.getRecords(table.id);
        setRecords(tableRecords);

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
      
      // Update local records state
      setRecords(prevRecords => 
        prevRecords.map(record => 
          record.id === recordId 
            ? { ...record, fields: { ...record.fields, ...fields } } 
            : record
        )
      );
      
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

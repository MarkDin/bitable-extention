import { useState, useEffect } from 'react';
import { feishuBase, Table, Field, Record } from '@/lib/feishuBase';

export function useFeishuBase() {
  const [activeTable, setActiveTable] = useState<Table | null>(null);
  const [recordFields, setRecordFields] = useState<Field[]>([]);
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTableData() {
      setLoading(true);
      setError(null);

      try {
        // Get active table
        const table = await feishuBase.getActiveTable();
        setActiveTable(table);

        // Get fields
        const fields = await feishuBase.getFields(table.id);
        setRecordFields(fields);

        // Get records
        const tableRecords = await feishuBase.getRecords(table.id);
        setRecords(tableRecords);
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

  return {
    activeTable,
    recordFields,
    records,
    loading,
    error,
    updateRecord
  };
}

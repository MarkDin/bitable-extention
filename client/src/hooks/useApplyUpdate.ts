import { toast } from '@/hooks/use-toast';
import { apiService } from '@/lib/apiService';
import { useFeishuBaseStore } from './useFeishuBaseStore';
import { ITable } from '@lark-base-open/js-sdk';
import { fork } from 'node:child_process';

interface ApplyUpdateParams {
    selectedRecordIds: string[];
    activeTable: ITable;
    
}

export async function applyUpdate(params: ApplyUpdateParams) {
  const { selectedRecordIds, activeTable } = params;
  if (!activeTable) {
    toast({
      title: "更新失败",
      description: "表格未初始化",
      variant: "destructive",
    });
    throw new Error('表格未初始化');
  }
    
  const tableId = activeTable.id;
  try {
      // search by records
      
  } catch (error: any) {
    toast({
      title: "更新失败",
      description: error.message,
      variant: "destructive",
    });
    throw error;
  }
} 

interface searchResult {
    name: string;
    value: string;
}
async function searchByRecordsID(recordIDs: string[]){
    let res: searchResult[]
   
    return res
}
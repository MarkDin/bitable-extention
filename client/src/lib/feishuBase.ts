// This is a placeholder for the actual Feishu Base JS SDK integration
// In a real implementation, we would import the actual SDK
// import { bitable } from '@lark-base-open/js-sdk';

import { bitable, FieldType, IOpenSegment, ITable } from '@lark-base-open/js-sdk';
import { IAddFieldConfig } from '@lark-base-open/js-sdk';
export interface User {
  userId: string;
  baseUserId: string;
}

export interface Selection {
  baseId: string | null;
  tableId: string | null;
  fieldId: string | null;
  viewId: string | null;
  recordId: string | null;
}

// Real implementation using Feishu Base JS SDK
export const feishuBase = {
  // Get current user info
  getCurrentUser: async (): Promise<User> => {
    try {
      // 使用新的推荐API获取baseUserId
      const baseUserId = await bitable.bridge.getBaseUserId();
      // 为了后向兼容也获取userId（不推荐使用）
      let userId;
      try {
        userId = await bitable.bridge.getUserId();
      } catch (error) {
        userId = "not-available"; // 如果旧API被完全弃用可能会抛出错误
      }

      return {
        userId,
        baseUserId
      };
    } catch (error) {
      console.error("获取用户信息失败:", error);
      throw error;
    }
  },

  // Get active table
  getActiveTable: async () => {
    try {
      return await bitable.base.getActiveTable();
    } catch (error) {
      console.error("获取当前表格失败:", error);
      throw error;
    }
  },

  // Get current selection
  getSelection: async (): Promise<Selection> => {
    try {
      const selection = await bitable.base.getSelection();
      return {
        baseId: selection.baseId || null,
        tableId: selection.tableId || null,
        fieldId: selection.fieldId || null,
        viewId: selection.viewId || null,
        recordId: selection.recordId || null
      };
    } catch (error) {
      console.error("获取当前选择失败:", error);
      throw error;
    }
  },

  // Get field value from a specific record
  getFieldValue: async (tableId: string, recordId: string, fieldId: string) => {
    const table = await bitable.base.getTableById(tableId);
    const value = await table.getCellValue(fieldId, recordId);
    return value;
  },

  // Get selected record IDs (for table views)
  getSelectedRecordIdList: async (tableId: string, viewId: string): Promise<string[]> => {
    try {
      const table = await bitable.base.getTableById(tableId);
      const view = await table.getViewById(viewId);
      // 使用可见记录列表作为选定记录
      // 注意：SDK可能没有直接提供getSelectedRecordIdList方法
      // 此处使用getVisibleRecordIdList作为替代，并过滤可能的undefined值
      const idList = await view.getVisibleRecordIdList();
      // 过滤掉undefined值并确保返回string[]类型
      return idList.filter((id): id is string => id !== undefined);
    } catch (error) {
      console.error(`获取选中记录ID失败 (表:${tableId}, 视图:${viewId}):`, error);
      throw error;
    }
  },

  // Get fields from a table
  getFields: async (tableId: string) => {
    try {
      const table = await bitable.base.getTableById(tableId);
      return await table.getFieldMetaList();
    } catch (error) {
      console.error(`获取字段列表失败 (表:${tableId}):`, error);
      throw error;
    }
  },

  // Get records from a table
  getRecords: async (tableId: string) => {
    try {
      const table = await bitable.base.getTableById(tableId);
      return await table.getRecordList();
    } catch (error) {
      console.error(`获取记录列表失败 (表:${tableId}):`, error);
      throw error;
    }
  },

  // Update a record
  updateRecord: async (tableId: string, recordId: string, fields: { [key: string]: any }): Promise<void> => {
    const table = await bitable.base.getTableById(tableId);

    // 尝试多种方法更新记录
    try {
      // 尝试方法1：使用record.update API
      const record = await table.getRecordById(recordId);

      // 创建符合SDK要求的字段-值映射
      const fieldValueMap = new Map();
      for (const [fieldId, value] of Object.entries(fields)) {
        const field = await table.getFieldById(fieldId);
        fieldValueMap.set(field, value);
      }

      // 直接更新记录
      if (record.update) {
        await record.update(fieldValueMap);
        return;
      }
    } catch (err) {
      console.warn('使用record.update更新记录失败，尝试替代方法', err);
    }
  },

  addField: async (activeTable: ITable, field_config: IAddFieldConfig) => {
    console.log('activeTable', activeTable)
    await activeTable.addField(field_config);
  }
};

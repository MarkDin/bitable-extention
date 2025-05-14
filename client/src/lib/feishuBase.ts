// This is a placeholder for the actual Feishu Base JS SDK integration
// In a real implementation, we would import the actual SDK
// import { bitable } from '@lark-base-open/js-sdk';

import { bitable, FieldType, ITable } from '@lark-base-open/js-sdk';
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
  getFieldValue: async (tableId: string, recordId: string, fieldId: string): Promise<any> => {
    try {
      const table = await bitable.base.getTableById(tableId);
      const field = await table.getFieldById(fieldId);
      
      // 获取单元格值 (兼容SDK不同版本)
      try {
        // 使用字段的属性获取单元格值
        const record = await table.getRecordById(recordId);
        const fields = record.fields || {};
        
        // 如果可以直接访问字段
        if (fields[fieldId] !== undefined) {
          const cellValue = fields[fieldId];
          // 处理对象类型的字段值，提取文本内容
          if (cellValue && typeof cellValue === 'object') {
            // 处理 {type, text} 结构或其他特殊对象
            if ('text' in cellValue) {
              return cellValue.text;
            } else if ('type' in cellValue && 'text' in cellValue) {
              return cellValue.text;
            } else if (Array.isArray(cellValue)) {
              // 处理数组类型的值
              return cellValue.map(item => 
                typeof item === 'object' && item && 'text' in item 
                  ? item.text 
                  : String(item)
              ).join(', ');
            } else {
              // 其他对象类型，尝试转为JSON字符串
              return JSON.stringify(cellValue);
            }
          }
          return cellValue;
        } else {
          // 或尝试通过表格API获取单元格内容
          const cellValue = await table.getCellValue(fieldId, recordId);
          
          // 对cellValue做同样的处理
          if (cellValue && typeof cellValue === 'object') {
            // 处理 {type, text} 结构或其他特殊对象
            if ('text' in cellValue) {
              return cellValue.text;
            } else if ('type' in cellValue && 'text' in cellValue) {
              return cellValue.text;
            } else if (Array.isArray(cellValue)) {
              // 处理数组类型的值
              return cellValue.map(item => 
                typeof item === 'object' && item && 'text' in item 
                  ? item.text 
                  : String(item)
              ).join(', ');
            } else {
              // 其他对象类型，尝试转为JSON字符串
              return JSON.stringify(cellValue);
            }
          }
          
          return cellValue;
        }
      } catch (innerError) {
        console.warn('注意: 尝试获取单元格值的首选方法失败，尝试替代方法', innerError);
        
        // 回退方法：获取整条记录然后提取特定字段
        const allRecords = await table.getRecordList();
        const targetRecord = Array.from(allRecords).find(r => r.id === recordId);
        if (targetRecord && targetRecord.fields && targetRecord.fields[fieldId] !== undefined) {
          const cellValue = targetRecord.fields[fieldId];
          
          // 对cellValue做同样的处理
          if (cellValue && typeof cellValue === 'object') {
            // 处理 {type, text} 结构或其他特殊对象
            if ('text' in cellValue) {
              return cellValue.text;
            } else if ('type' in cellValue && 'text' in cellValue) {
              return cellValue.text;
            } else if (Array.isArray(cellValue)) {
              // 处理数组类型的值
              return cellValue.map(item => 
                typeof item === 'object' && item && 'text' in item 
                  ? item.text 
                  : String(item)
              ).join(', ');
            } else {
              // 其他对象类型，尝试转为JSON字符串
              return JSON.stringify(cellValue);
            }
          }
          
          return cellValue;
        }
        return null; // 如果找不到任何值
      }
    } catch (error) {
      console.error(`获取字段值失败 (表:${tableId}, 记录:${recordId}, 字段:${fieldId}):`, error);
      throw error;
    }
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

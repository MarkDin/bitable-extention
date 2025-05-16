import { useFeishuBaseStore } from "@/hooks/useFeishuBaseStore";
import { apiService } from "@/lib/apiService";
import { Field, getCustomerInfoById } from "@/lib/dataSync";
import type { ITable } from "@lark-base-open/js-sdk";
import { bitable } from "@lark-base-open/js-sdk";

interface AutoCompleteParams {
  toast: (args: any) => void;
  selectedFields: Field[];
}

export async function autoCompleteFields({toast, selectedFields }: AutoCompleteParams) {
  // 1. 读取配置字段
  console.log('selectedFields', selectedFields);
  if (!selectedFields.length) {
    toast?.({ title: "未配置补全字段", variant: "destructive" });
    return;
  }

  // 获取当前选中的所有记录
  const activeTable: ITable = await bitable.base.getActiveTable();
  const selection = await activeTable.getSelection();
  
  // 检查是否有选中记录
  if (!selection || !selection.recordIds || selection.recordIds.length === 0) {
    toast?.({ title: "未选中记录", variant: "destructive" });
    return;
  }
  
  // 限制最大处理行数为50
  const recordIds = selection.recordIds.slice(0, 50);
  if (selection.recordIds.length > 50) {
    toast?.({ 
      title: "选中行数过多", 
      description: `已限制为最大50行，当前处理${recordIds.length}行`, 
      variant: "warning" 
    });
  }
  
  // 获取查询字段信息
  const selectedCellValue = useFeishuBaseStore.getState().selectedCellValue;
  if (!selectedCellValue) {
    toast?.({ title: "未获取到查询值", variant: "destructive" });
    return;
  }

  // 2. 获取数据
  let result: any;
  try {
    result = await getCustomerInfoById(selectedCellValue);
  } catch (e: any) {
    toast?.({ title: "获取数据失败", description: e.message, variant: "destructive" });
    return;
  }
  const resultFields = result.data || result;
  if (resultFields.errorInfo) {
    toast?.({ title: "获取数据失败", description: resultFields.errorInfo.msg, variant: "destructive" });
    return;
  }
  console.log('resultFields', resultFields);
  
  // 3. 检查表头
  const tableFields = await apiService.getAllFields();
  const allFieldNames = await Promise.all(tableFields.map((f: any) => f.getName()));
  const missingFields = selectedFields.filter((f: Field) => !allFieldNames.includes(f.mapping_field));

  // 4. 新建缺失表头
  for (const field of missingFields) {
    await apiService.createField({
      activeTable,
      name: field.mapping_field,
      type: 1 // FieldType.Text
    });
  }
  console.log('missingFields', missingFields);

  // 5. 再次获取表头
  const updatedFields = await apiService.getAllFields();
  const fieldNameToId: Record<string, string> = {};
  for (const f of updatedFields) {
    const name = await f.getName();
    fieldNameToId[name] = f.id;
  }

  // 6. 为每条选中记录写入数据
  let successCount = 0;
  for (const recordId of recordIds) {
    try {
      for (const field of selectedFields) {
        const fieldName = field.mapping_field;
        const value = resultFields[field.name];
        console.log('fieldName', field.name, 'value', value);
        if (fieldNameToId[fieldName] && value !== undefined) {
          await activeTable.setCellValue(fieldNameToId[fieldName], recordId, value);
        }
      }
      successCount++;
    } catch (error) {
      console.error(`Failed to update record ${recordId}:`, error);
    }
  }
  
  toast?.({ 
    title: "补全完成", 
    description: `已成功处理${successCount}/${recordIds.length}条记录` 
  });
} 
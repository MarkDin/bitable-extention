import { useFeishuBaseStore } from "@/hooks/useFeishuBaseStore";
import { apiService } from "@/lib/apiService";
import { Field, mockGetDataByIds, MockGetDataByIdsResult } from "@/lib/dataSync";
import type { ITable } from "@lark-base-open/js-sdk";
import { bitable } from "@lark-base-open/js-sdk";
import { feishuBase } from "./feishuBase";

interface AutoCompleteParams {
  toast: (args: any) => void;
  selectedFields: Field[];
  singleComplate: boolean;
}

export async function autoCompleteFields({ toast, selectedFields, singleComplate }: AutoCompleteParams) {
  // 1. 读取配置字段
  console.log('selectedFields', selectedFields);
  if (!selectedFields.length) {
    toast?.({ title: "未配置补全字段", variant: "destructive" });
    return;
  }

  // 获取当前选中的所有记录
  const activeTable: ITable = await bitable.base.getActiveTable();
  const selection = useFeishuBaseStore.getState().selection;
  if (!selection) {
    toast?.({ title: "未选中表格", variant: "destructive" });
    return;
  }
  console.log('selection', selection);
  let selectedRecordIds: string[] = [];
  if (singleComplate) {
    selectedRecordIds = [selection.recordId || ""];
  } else {
    selectedRecordIds = await bitable.ui.selectRecordIdList(activeTable.id, selection.viewId || "");
  }
  // 检查是否有选中记录
  if (!selectedRecordIds || selectedRecordIds.length === 0) {
    toast?.({ title: "未选中记录", variant: "destructive" });
    return;
  }

  // 限制最大处理行数为50
  const recordIds = selectedRecordIds.slice(0, 50);
  if (selectedRecordIds.length > 50) {
    toast?.({
      title: "选中行数过多",
      description: `已限制为最大50行，当前处理${recordIds.length}行`,
      variant: "warning"
    });
  }

  // 获取查询字段信息
  const selectedCellValue = await apiService.getCellValues(activeTable, recordIds, selection.fieldId || "");
  console.log('selectedCellValue', selectedCellValue);
  if (!selectedCellValue) {
    toast?.({ title: "未获取到查询值", variant: "destructive" });
    return;
  }
  // 建立selectedCellValue的映射
  const selectedCellValueMap: Record<string, string> = {};
  for (let i = 0; i < recordIds.length; i++) {
    selectedCellValueMap[recordIds[i]] = selectedCellValue[i];
  }

  // 2. 获取数据
  let result: MockGetDataByIdsResult;
  try {
    result = await mockGetDataByIds(selectedCellValue);
  } catch (e: any) {
    toast?.({ title: "获取数据失败", description: e.message, variant: "destructive" });
    return;
  }
  if (!result.success) {
    toast?.({ title: "获取数据失败", description: result.error_msg, variant: "destructive" });
    return;
  }
  const resultFields = result.data.result_map;
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
        console.log('recordId', selectedCellValueMap[recordId]);
        const fieldName = field.mapping_field;
        console.log('resultFields[recordId]', resultFields[selectedCellValueMap[recordId]]);
        const value = resultFields[selectedCellValueMap[recordId]][field.name];
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
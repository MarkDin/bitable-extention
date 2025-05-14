import type { Selection, User } from '@/lib/feishuBase';
import type { IFieldMeta, ITable } from '@lark-base-open/js-sdk';
import { create } from 'zustand';

interface FeishuBaseState {
  activeTable: ITable | null;
  setActiveTable: (table: ITable | null) => void;

  recordFields: IFieldMeta[];
  setRecordFields: (fields: IFieldMeta[]) => void;

  records: any[];
  setRecords: (records: any[]) => void;

  selection: Selection | null;
  setSelection: (selection: Selection | null) => void;

  selectedCellValue: any;
  setSelectedCellValue: (value: any) => void;

  selectedRecordIds: string[];
  setSelectedRecordIds: (ids: string[]) => void;

  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
}

export const useFeishuBaseStore = create<FeishuBaseState>((set) => ({
  activeTable: null,
  setActiveTable: (activeTable) => set({ activeTable }),

  recordFields: [],
  setRecordFields: (recordFields) => set({ recordFields }),

  records: [],
  setRecords: (records) => set({ records }),

  selection: null,
  setSelection: (selection) => set({ selection }),

  selectedCellValue: null,
  setSelectedCellValue: (selectedCellValue) => set({ selectedCellValue }),

  selectedRecordIds: [],
  setSelectedRecordIds: (selectedRecordIds) => set({ selectedRecordIds }),

  currentUser: null,
  setCurrentUser: (currentUser) => set({ currentUser }),
})); 
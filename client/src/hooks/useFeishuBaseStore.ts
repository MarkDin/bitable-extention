import type { FeishuUserInfo } from '@/lib/feishuAuth';
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


  selectedRecordIds: string[];
  setSelectedRecordIds: (ids: string[]) => void;

  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;

  selectedCellValue: any;
  setSelectedCellValue: (value: any) => void;

  // 飞书认证用户信息
  feishuUserInfo: FeishuUserInfo | null;
  setFeishuUserInfo: (userInfo: FeishuUserInfo | null) => void;

  // 获取用户信息的方法
  getUserInfo: () => FeishuUserInfo | null;
  getUserDisplayName: () => string;
  getUserInfoForLog: () => {
    displayName: string;
    userId?: string;
    openId?: string;
    unionId?: string;
    tenantKey?: string;
    email?: string;
    isLoggedIn: boolean;
  };
}

export const useFeishuBaseStore = create<FeishuBaseState>((set, get) => ({
  activeTable: null,
  setActiveTable: (activeTable) => set({ activeTable }),

  recordFields: [],
  setRecordFields: (recordFields) => set({ recordFields }),

  records: [],
  setRecords: (records) => set({ records }),

  selection: null,
  setSelection: (selection) => set({ selection }),

  selectedRecordIds: [],
  setSelectedRecordIds: (selectedRecordIds) => set({ selectedRecordIds }),

  currentUser: null,
  setCurrentUser: (currentUser) => set({ currentUser }),

  selectedCellValue: null,
  setSelectedCellValue: (selectedCellValue) => set({ selectedCellValue }),

  // 飞书认证用户信息
  feishuUserInfo: null,
  setFeishuUserInfo: (feishuUserInfo) => set({ feishuUserInfo }),

  // 获取用户信息的方法
  getUserInfo: () => {
    return get().feishuUserInfo;
  },

  getUserDisplayName: () => {
    const userInfo = get().feishuUserInfo;
    if (!userInfo) return '未登录用户';
    return userInfo.name || userInfo.en_name || '未知用户';
  },

  getUserInfoForLog: () => {
    const userInfo = get().feishuUserInfo;

    if (!userInfo) {
      return {
        displayName: '未登录用户',
        isLoggedIn: false
      };
    }

    return {
      displayName: userInfo.name || userInfo.en_name || '未知用户',
      userId: userInfo.user_id,
      openId: userInfo.open_id,
      unionId: userInfo.union_id,
      tenantKey: userInfo.tenant_key,
      email: userInfo.email,
      isLoggedIn: true
    };
  }
})); 
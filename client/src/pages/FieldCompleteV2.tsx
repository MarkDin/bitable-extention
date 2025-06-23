import ConditionSection from '@/components/condition';
import { FieldsSection } from '@/components/FieldSelection';
import { Field } from '@/types/common';
import { bitable } from "@lark-base-open/js-sdk";
import React, { useEffect, useState } from 'react';

// 主组件
const FieldCompleteV2: React.FC = () => {
    // 初始化字段数据
    const [fields, setFields] = useState<Field[]>([
        // NC字段
        { id: 'orderNo', name: '订单ID', mapping_field: 'orderNo', type: 'NC', isChecked: false, isDisabled: false },
        { id: 'custShortName', name: '客户简称', mapping_field: 'custShortName', type: 'NC', isChecked: false, isDisabled: false },
        { id: 'materialIndex', name: '产品索引号', mapping_field: 'materialIndex', type: 'NC', isChecked: false, isDisabled: false },
        { id: 'debitamount', name: '已收款金额', mapping_field: 'debitamount', type: 'NC', isChecked: false, isDisabled: false },
        { id: 'incomeName', name: '收款协议', mapping_field: 'incomeName', type: 'NC', isChecked: false, isDisabled: false },
        { id: 'quantityOnHand', name: '现存量', mapping_field: 'quantityOnHand', type: 'NC', isChecked: false, isDisabled: false },
        { id: 'salesperson', name: '销售负责人', mapping_field: 'salesperson', type: 'NC', isChecked: false, isDisabled: false },
        { id: 'deliveryFactory', name: '发货工厂', mapping_field: 'deliveryFactory', type: 'NC', isChecked: false, isDisabled: false },
        { id: 'custRequestDate', name: '客户要求日期', mapping_field: 'custRequestDate', type: 'NC', isChecked: false, isDisabled: false },
        { id: 'deliveryDate', name: '签署PI交期', mapping_field: 'deliveryDate', type: 'NC', isChecked: false, isDisabled: false },
        { id: 'boxOrNot', name: '箱盒是否下单', mapping_field: 'boxOrNot', type: 'NC', isChecked: false, isDisabled: false },

        // SMOM字段
        { id: 'plannedStartTime', name: '计划开始时间', mapping_field: 'plannedStartTime', type: 'SMOM', isChecked: false, isDisabled: false },
        { id: 'planEndTime', name: '计划结束时间', mapping_field: 'planEndTime', type: 'SMOM', isChecked: false, isDisabled: false },

        // TMS字段
        { id: 'bookingStatus', name: '订舱状态', mapping_field: 'bookingStatus', type: 'TMS', isChecked: false, isDisabled: false },
        { id: 'etd', name: 'ETD', mapping_field: 'etd', type: 'TMS', isChecked: false, isDisabled: false },
        { id: 'eta', name: 'ETA', mapping_field: 'eta', type: 'TMS', isChecked: false, isDisabled: false },
        { id: 'loadDate', name: '装柜时间', mapping_field: 'loadDate', type: 'TMS', isChecked: false, isDisabled: false },
        { id: 'needShipment', name: '是否需要出货', mapping_field: 'needShipment', type: 'TMS', isChecked: false, isDisabled: false },

        // CRM字段
        { id: 'customerCode', name: '客户编码', mapping_field: 'customerCode', type: 'CRM', isChecked: false, isDisabled: false },
        { id: 'custName', name: '客户全称', mapping_field: 'custName', type: 'CRM', isChecked: false, isDisabled: false },
        { id: 'country', name: '客户国家', mapping_field: 'country', type: 'CRM', isChecked: false, isDisabled: false },
        { id: 'publicSea', name: '所属区域公海', mapping_field: 'publicSea', type: 'CRM', isChecked: false, isDisabled: false },
        { id: 'publicSeaPoolStatus', name: '公海池状态', mapping_field: 'publicSeaPoolStatus', type: 'CRM', isChecked: false, isDisabled: false },
        { id: 'paymentPeriod', name: '账期', mapping_field: 'paymentPeriod', type: 'CRM', isChecked: false, isDisabled: false },
        { id: 'collectionAgreement', name: '收款协议', mapping_field: 'collectionAgreement', type: 'CRM', isChecked: false, isDisabled: false },
        { id: 'estimatedRecoveryTime', name: '预计回收时间', mapping_field: 'estimatedRecoveryTime', type: 'CRM', isChecked: false, isDisabled: false },

        // MRP字段
        { id: 'isDraft', name: '图稿状态', mapping_field: 'isDraft', type: 'MRP', isChecked: false, isDisabled: false },
    ]);

    // 初始化时获取表格字段
    useEffect(() => {
        const initializeTable = async () => {
            try {
                const table = await bitable.base.getActiveTable();

                // 获取所有字段名称
                const allFields = await table.getFieldList();
                const fieldNames = new Set<string>();

                for (const field of allFields) {
                    const fieldName = await field.getName();
                    fieldNames.add(fieldName);
                }

                console.log('[FieldCompleteV2] 表格现有字段:', Array.from(fieldNames));

                // 更新fields状态，将已存在的字段设置为选中且禁用
                setFields(prevFields =>
                    prevFields.map(field => {
                        const isExistingField = fieldNames.has(field.name);
                        return {
                            ...field,
                            isChecked: isExistingField ? true : field.isChecked,
                            isDisabled: isExistingField,
                            helperText: isExistingField ? '数据表已有字段默认选中' : undefined
                        };
                    })
                );
            } catch (error) {
                console.error('[FieldCompleteV2] 初始化表格失败:', error);
            }
        };

        initializeTable();
    }, []);

    // 监听表格切换
    useEffect(() => {
        const handleSelectionChange = async () => {
            try {
                const table = await bitable.base.getActiveTable();
                if (table) {
                    // 获取所有字段名称
                    const allFields = await table.getFieldList();
                    const fieldNames = new Set<string>();

                    for (const field of allFields) {
                        const fieldName = await field.getName();
                        fieldNames.add(fieldName);
                    }

                    console.log('[FieldCompleteV2] 表格切换，现有字段:', Array.from(fieldNames));

                    // 更新fields状态，将已存在的字段设置为选中且禁用
                    setFields(prevFields =>
                        prevFields.map(field => {
                            const isExistingField = fieldNames.has(field.name);
                            return {
                                ...field,
                                isChecked: isExistingField ? true : field.isChecked,
                                isDisabled: isExistingField,
                                helperText: isExistingField ? '数据表已有字段默认选中' : undefined
                            };
                        })
                    );
                }
            } catch (error) {
                console.error('[FieldCompleteV2] 获取表格字段失败:', error);
            }
        };

        // 注册监听
        const off = bitable.base.onSelectionChange(handleSelectionChange);
        // 初始化时主动获取一次
        handleSelectionChange();

        // 卸载时移除监听
        return () => {
            if (typeof off === "function") off();
        };
    }, []);

    // 处理字段选择变化
    const handleFieldChange = (id: string, checked: boolean) => {
        setFields(prev => prev.map(field =>
            field.id === id ? { ...field, isChecked: checked } : field
        ));
    };

    // 处理全选
    const handleSelectAll = (checked: boolean) => {
        setFields(prev => prev.map(field =>
            field.isDisabled ? field : { ...field, isChecked: checked }
        ));
    };

    // 计算全选状态
    const selectableFields = fields.filter(f => !f.isDisabled);
    const selectedCount = selectableFields.filter(f => f.isChecked).length;
    const isAllSelected = selectableFields.length > 0 && selectedCount === selectableFields.length;
    const isPartiallySelected = selectedCount > 0 && selectedCount < selectableFields.length;

    // 处理同步数据
    const handleSync = () => {
        const selectedFields = fields.filter(f => f.isChecked);
        console.log('同步数据:', selectedFields);
        // 这里添加实际的同步逻辑
    };

    return (
        <div className="w-full h-full bg-white flex flex-col">
            {/* 内容区域 */}
            <div className="flex-1 flex flex-col px-3 sm:px-4 md:px-5 py-4 gap-4 overflow-y-auto">
                {/* 条件设置 */}
                <ConditionSection />

                {/* 字段选择 */}
                <FieldsSection
                    fields={fields}
                    onFieldChange={handleFieldChange}
                    onSelectAll={handleSelectAll}
                    isAllSelected={isAllSelected}
                    isPartiallySelected={isPartiallySelected}
                />
            </div>

            {/* 底部区域 */}
            <div className="bg-white border-t border-[#e5e6eb] px-3 sm:px-4 md:px-5 py-2.5 flex flex-col gap-1">
                <p className="text-xs text-[#000000] leading-[22px]">
                    请注意检查你有表格编辑权限
                </p>
                <button
                    onClick={handleSync}
                    className="w-full h-8 bg-[#165dff] hover:bg-[#4080ff] text-white text-sm font-medium rounded-sm transition-colors flex items-center justify-center"
                >
                    同步数据
                </button>
            </div>
        </div>
    );
};

export default FieldCompleteV2; 
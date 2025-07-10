# 手动配置字段指南

## 当前状态

✅ **读取权限正常** - 前端可以从多维表格读取字段配置  
❌ **写入权限受限** - 自动写入脚本被拒绝（403 Forbidden）

## 解决方案：手动配置

由于写入权限受限，请按以下步骤手动在多维表格中配置字段数据：

### 步骤1：访问多维表格

**链接：** https://global-intco.feishu.cn/base/Tzgpbndy9a6aZfsKuKhcaFT8nag?table=tblbxDXCWmq9kaCT

**表格结构确认：**
- `id`: 文本类型
- `name`: 文本类型  
- `mapping_field`: 文本类型
- `source`: 文本类型
- `enable`: 复选框类型（可选）

### 步骤2：手动添加字段配置

请将以下数据逐行添加到多维表格中：

#### NC字段（11条）
| id | name | mapping_field | source |
|----|------|---------------|--------|
| 1 | 订单ID | orderNo | NC |
| 2 | 客户简称 | custShortName | NC |
| 3 | 产品索引号 | materialIndex | NC |
| 4 | 已收款金额 | debitamount | NC |
| 5 | 收款协议（NC） | incomeName | NC |
| 6 | 现存量 | quantityOnHand | NC |
| 7 | 销售负责人 | salesperson | NC |
| 8 | 发货工厂 | deliveryFactory | NC |
| 9 | 客户要求日期 | custRequestDate | NC |
| 10 | 签署PI交期 | deliveryDate | NC |
| 11 | 箱盒是否下单 | boxOrNot | NC |

#### SMOM字段（2条）
| id | name | mapping_field | source |
|----|------|---------------|--------|
| 12 | 计划开始时间 | plannedStartTime | SMOM |
| 13 | 计划结束时间 | planEndTime | SMOM |

#### TMS字段（5条）
| id | name | mapping_field | source |
|----|------|---------------|--------|
| 14 | 订舱状态 | bookingStatus | TMS |
| 15 | ETD | etd | TMS |
| 16 | ETA | eta | TMS |
| 17 | 装柜时间 | loadDate | TMS |
| 18 | 是否需要出货 | needShipment | TMS |

#### CRM字段（8条）
| id | name | mapping_field | source |
|----|------|---------------|--------|
| 19 | 客户编码 | customerCode | CRM |
| 20 | 客户全称 | custName | CRM |
| 21 | 客户国家 | country | CRM |
| 22 | 所属区域公海 | publicSea | CRM |
| 23 | 公海池状态 | publicSeaPoolStatus | CRM |
| 24 | 账期 | paymentPeriod | CRM |
| 25 | 收款协议（CRM） | collectionAgreement | CRM |
| 26 | 预计回收时间 | estimatedRecoveryTime | CRM |

#### MRP字段（1条）
| id | name | mapping_field | source |
|----|------|---------------|--------|
| 27 | 图稿状态 | isDraft | MRP |

### 步骤3：验证配置

配置完成后，可以通过以下方式验证：

1. **在线验证：** 运行 `npm run test-fields-config` 查看读取结果
2. **前端验证：** 启动应用后查看字段列表是否正确加载

### CSV导入选项

如果支持CSV导入，可以使用以下格式：

```csv
id,name,mapping_field,source
1,订单ID,orderNo,NC
2,客户简称,custShortName,NC
3,产品索引号,materialIndex,NC
4,已收款金额,debitamount,NC
5,收款协议（NC）,incomeName,NC
6,现存量,quantityOnHand,NC
7,销售负责人,salesperson,NC
8,发货工厂,deliveryFactory,NC
9,客户要求日期,custRequestDate,NC
10,签署PI交期,deliveryDate,NC
11,箱盒是否下单,boxOrNot,NC
12,计划开始时间,plannedStartTime,SMOM
13,计划结束时间,planEndTime,SMOM
14,订舱状态,bookingStatus,TMS
15,ETD,etd,TMS
16,ETA,eta,TMS
17,装柜时间,loadDate,TMS
18,是否需要出货,needShipment,TMS
19,客户编码,customerCode,CRM
20,客户全称,custName,CRM
21,客户国家,country,CRM
22,所属区域公海,publicSea,CRM
23,公海池状态,publicSeaPoolStatus,CRM
24,账期,paymentPeriod,CRM
25,收款协议（CRM）,collectionAgreement,CRM
26,预计回收时间,estimatedRecoveryTime,CRM
27,图稿状态,isDraft,MRP
```

## 配置完成后

1. **前端会自动读取：** 应用启动时会从多维表格读取最新配置
2. **支持动态更新：** 修改表格数据后，前端会在缓存过期后自动读取新配置  
3. **错误降级：** 如果读取失败，会自动使用内置的默认配置

## 注意事项

- `source` 字段必须是以下值之一：NC、SMOM、TMS、CRM、MRP、赛意
- `mapping_field` 必须是有效的英文标识符，用作API字段名
- 建议按照表格中的顺序添加，便于管理 
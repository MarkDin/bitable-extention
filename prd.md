

## 1.增加监听表格切换的能力
1.1 如果用户打开插件后切换数据表，需要同步修改插件中的显示

## 2.去掉单行补全和多选补全的能力，去掉单行补全和批量补全两个按钮，替换为补全按钮
2.1 现在默认补全所有record，如果补全的列不存在，则先新建再写入，并且需要对比修改前后值是否变化
2.2 将有变化的数据标记为黄色，没变化的数据变成白色
2.3 将出错的数据标记为红色（如果当前行的数据查询失败或者写入失败）

## 3. 修改可补全字段区域的交互逻辑
  - 如果字段数据表已存在，follow他的已有类型，不改字段类型
  - 如果字段数据表没有，直接新增文本类型的字段
  - 如果数据表中已有同名字段，默认勾选且不可修改

## 4. 点击提交后打开补全中页面
因为补全的数据量可能比较大，需要提示用户不要关闭插件以及展示补全的进度
所以我们设计`补全中`和`补全完成`两个页面，样式请参考提供的图片
1. 补全中
- 进度条展示当前补全了多少条数据，百分比的计算方式为 已经完成的条数/需要补全的总条数
- 进度条上面展示文字提示文案：数据补全中，请勿关闭插件，其中“请勿关闭插件”标红
2. 补全完成
- 展示图片所示的新页面
- 如果用户对多维表格没有编辑权限，文案为“数据补全失败: 无当前表格编辑权限”
- 如果全部成功，文案为“数据补全成功，数据是否更新见「补全状态」列”，颜色为绿色
- 如果有失败的，文案为“数据补全完成，失败数据详见「补全状态」列”，颜色为红色

## 5. 去掉mock接口
{
  "项目号": "projectNo",
  "NC-SMOM-TMS-CRM订单号": "orderNo",
  "NC客户简称": "custShortName",
  "NC索引": "materialIndex",
  "NC收款协议": "incomeName",
  "NC销售业务员": "salesperson",
  "NC发货工厂": "deliveryFactory",
  "NC现存量": "quantityOnHand",
  "NC客户要求日期": "custRequestDate",
  "NC签署PI交期": "deliveryDate",
  "NC箱盒是否下单": "boxOrNot",
  "SMOM计划开始时间（上线时间）": "plannedStartTime",
  "SMOM计划完工时间": "planEndTime",
  "是否需要出货": "needShipment",
  "TMS订舱状态": "bookingStatus",
  "TMS预计离港时间": "etd",
  "TMS预计到港时间": "eta",
  "TMS装柜时间": "loadDate",
  "NC-CRM客户编码": "customerCode",
  "CRM客户全称": "custName",
  "CRM所属区域公海": "publicSea",
  "CRM国家": "country",
  "CRM收款协议": "collectionAgreement",
  "CRM账期（天）": "paymentPeriod",
  "CRM公海池状态": "publicSeaPoolStatus",
  "CRM预计回收时间": "estimatedRecoveryTime",
  "MRP是否定稿": "isDraft"
}


## 6. 从多维表格读取字段配置
1. 将下面的配置写入给定的多维表格
const [fields, setFields] = useState<Field[]>([
    // NC字段
    { id: 'orderNo', name: '订单ID', mapping_field: 'orderNo', type: 'NC', isChecked: false, isDisabled: false },
    { id: 'custShortName', name: '客户简称', mapping_field: 'custShortName', type: 'NC', isChecked: false, isDisabled: false },
    { id: 'materialIndex', name: '产品索引号', mapping_field: 'materialIndex', type: 'NC', isChecked: false, isDisabled: false },
    { id: 'debitamount', name: '已收款金额', mapping_field: 'debitamount', type: 'NC', isChecked: false, isDisabled: false },
    { id: 'incomeName', name: '收款协议（NC）', mapping_field: 'incomeName', type: 'NC', isChecked: false, isDisabled: false },
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
    { id: 'collectionAgreement', name: '收款协议（CRM）', mapping_field: 'collectionAgreement', type: 'CRM', isChecked: false, isDisabled: false },
    { id: 'estimatedRecoveryTime', name: '预计回收时间', mapping_field: 'estimatedRecoveryTime', type: 'CRM', isChecked: false, isDisabled: false },

    // MRP字段
    { id: 'isDraft', name: '图稿状态', mapping_field: 'isDraft', type: 'MRP', isChecked: false, isDisabled: false },
  ]);
  ### 写入规则
- id字段替换为数字，从1开始编号
- type对应表格中的source字段
- 不写入isChecked和isDisabled字段
写入的代码参考我给定的test.js文件的代码

### 读取规则
fields不再hardcode在代码中，而是插件启动时从多维表格读取，映射规则如我上面写入规则所述，有不清晰不明白的请先问我



表格链接：https://global-intco.feishu.cn/base/Tzgpbndy9a6aZfsKuKhcaFT8nag?table=tblbxDXCWmq9kaCT&view=vewCygP2wl

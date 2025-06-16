

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

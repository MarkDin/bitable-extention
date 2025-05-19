# 接口定义

所有的获取数据的接口需要遵循下面的定义

## 数据 schema 接口

### 入参

无

### 出参

```json
{
  "field_list": [
    {
      "name": "accountName",
      "mapping_field": "客户名称"
    },
    {
      "name": "entityType-label",
      "mapping_field": "客户类型"
    }
  ]
}
```

field_list 表示所有的字段，是一个数组
name 表示返回的字段的英文变量名
mapping_field 标识字段在多维表格表头的中文名

## 数据获取接口

### 入参

```json
{
  "id_list": ["id1", "id2"]
}
```

### 出参

```json
{
  "success": true,
  "data": {
    "result_map": {
      "id1": {
        "field1": "value1",
        "field2": "value2",
        "field3": "value3"
      },
      "id2": {}
    }
  },
  "error_msg": "失败的原因"
}
```

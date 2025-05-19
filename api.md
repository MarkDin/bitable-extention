# 接口定义
所有的获取数据的接口需要遵循下面的定义

## 数据获取接口
### 入参
{
    'id_list': ['id1', 'id2']
}

### 出参
```json
{
    'success': true,
    'data': {
        'result_map': [
            'id1': {
                'field1': 'value1',
                'field2': 'value2',
                'field3': 'value3',
            },
            'id2': {

            },
        ]
    },
    error_msg: '失败的原因',

}
```
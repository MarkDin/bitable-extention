2. 获取用户信息接口
接口信息
URL: /feishu/user_info
方法: GET
描述: 根据state参数获取已登录用户的详细信息
请求参数
Query参数
参数名	类型	必填	描述
state	string	是	用户的状态标识符，由生成state接口返回
请求示例
curl "https://localhost:5000/feishu/user_info?state=ChCPFiT1VJZxRX7zK7gtQ9gPOja_ei8DsF3fvfWaOp4"
响应格式
成功响应 (200)
{
    "success": true,
    "data": {
        "user_info": {
            "name": "丁科",
            "en_name": "丁科",
            "open_id": "ou_0d5b7f9bd8a5f611842c4d3954e8b0f9",
            "union_id": "on_45509528b2f11fbc31b8fe7661e53da2",
            "user_id": "f534319b",
            "avatar_url": "https://s3-imfile.feishucdn.com/static-resource/v1/v3_00kv_7497c9a1-2543-46a3-8d37-8b1a81b8279g~?image_size=72x72&cut_type=&quality=&format=image&sticker_format=.webp",
            "avatar_thumb": "https://s3-imfile.feishucdn.com/static-resource/v1/v3_00kv_7497c9a1-2543-46a3-8d37-8b1a81b8279g~?image_size=72x72&cut_type=&quality=&format=image&sticker_format=.webp",
            "avatar_middle": "https://s3-imfile.feishucdn.com/static-resource/v1/v3_00kv_7497c9a1-2543-46a3-8d37-8b1a81b8279g~?image_size=240x240&cut_type=&quality=&format=image&sticker_format=.webp",
            "avatar_big": "https://s1-imfile.feishucdn.com/static-resource/v1/v3_00kv_7497c9a1-2543-46a3-8d37-8b1a81b8279g~?image_size=640x640&cut_type=&quality=&format=image&sticker_format=.webp",
            "tenant_key": "1383a678f40f1740"
        },
        "token_info": {
            "access_token": "eyJhbGciOiJFUzI1NiIs...",
            "token_type": "Bearer",
            "expires_in": 7200,
            "scope": "auth:user.id:read"
        },
        "login_time": "2025-08-01T03:56:20.123456"
    }
}
错误响应
缺少state参数 (400)
{
    "success": false,
    "error": "缺少state参数",
    "error_code": "MISSING_STATE"
}
用户未找到 (404)
{
    "success": false,
    "error": "用户未找到或已过期",
    "error_code": "USER_NOT_FOUND"
}
服务器错误 (500)
{
    "success": false,
    "error": "获取用户信息时发生错误: 具体错误信息",
    "error_code": "GET_USER_ERROR"
}
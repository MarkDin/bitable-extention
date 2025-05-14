import requests
import json

base_url = "https://api.xiaoshouyi.com"
url = "https://login.xiaoshouyi.com/auc/oauth2/token"

def get_access_token():
    headers = {
        "Content-Type":"application/x-www-form-urlencoded"
    }
    data = {
        "grant_type":"password",
        "client_id":"2b2e284b2cc93453a654454f9f4c909b",
        "client_secret":"1c39d769d68c8a9c582cb257552ee90d",
        "username":"18310796971",
        "password":"shigongdui2OQiiZqD"
    }
    res = requests.post(url,data=data,headers=headers)
    return json.loads(res.text)['access_token']
token = get_access_token()


def get_customer_info_by_id(id):
    url = f'/rest/data/v2.0/xobjects/account/{id}'
    headers = {
        "Authorization": "Bearer " + token
    }
    res = requests.get(base_url + url,headers=headers)
    print('res:', res.json())
    return res.json()
get_customer_info_by_id(3801058324038026)
# def query_data_xoql(sql):
#     url = base_url + "/rest/data/v2.0/query/xoql"
#     headers = {
#         "Content-Type": "application/x-www-form-urlencoded",
#         "Authorization": "Bearer " + token
#     }
#     data = {
#         "xoql":sql
#     }
#     r = requests.post(url,headers=headers,data=data)
#     return json.loads(r.text)


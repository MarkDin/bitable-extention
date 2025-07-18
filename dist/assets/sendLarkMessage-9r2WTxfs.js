const _="https://open.feishu.cn/open-apis/bot/v2/hook/5b3ac02c-c18f-4263-af51-abaf655dbbac",c={template_id:"AAqIYhbgzY69r",template_version_name:"1.0.0"},r={FIELD_LIST:"field_list",COMPLETE_ROW_COUNT:"complete_row_count",START_TIME:"start_time",END_TIME:"end_time",COMPLETE_RESULT:"complete_result",DOC_LINK:"doc_link"};function m(){return!0}async function T(a){try{if(!m())return console.error("[SendLarkMessage] 卡片模板配置无效，请检查 template_id"),!1;const s=t=>new Date(t).toLocaleString("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",timeZone:"Asia/Shanghai"}),l=t=>{let e="";switch(t.status){case"success":e="✅全部正确";break;case"partial":e=`⚠️部分成功：成功${t.successCount}行，失败${t.errorCount}行`;break;case"failed":e=`❌补全失败：${t.errorCount}行失败`;break;case"no_permission":e="🔒权限不足";break;case"noChange":e="📝无需更新";break;default:e="📊处理完成";break}return t.fieldCreationErrors&&t.fieldCreationErrors.length>0&&(e+=`
🔧字段创建问题：${t.fieldCreationErrors.join("；")}`),e},d=`补全${a.selectedFields.length}个字段: ${a.selectedFields.join("、")}`,i={msg_type:"interactive",card:{type:"template",data:{template_id:c.template_id,template_version_name:c.template_version_name,template_variable:{[r.FIELD_LIST]:d,[r.COMPLETE_ROW_COUNT]:a.totalRows,[r.START_TIME]:s(a.submitTime),[r.END_TIME]:s(a.endTime),[r.COMPLETE_RESULT]:l(a.completionResult),[r.DOC_LINK]:a.bitableUrl}}}};console.log("[SendLarkMessage] 发送飞书卡片模板:",JSON.stringify(i,null,2));const n=await fetch(_,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(i)});if(!n.ok){const t=await n.text();console.error("[SendLarkMessage] 发送失败:",n.status,t);try{const e=JSON.parse(t);e.msg&&console.error("[SendLarkMessage] 错误详情:",e.msg)}catch{}return!1}const o=await n.json();return console.log("[SendLarkMessage] 发送成功:",o),o.code!==0?(console.error("[SendLarkMessage] 业务错误:",o.msg),!1):!0}catch(s){return console.error("[SendLarkMessage] 发送操作日志失败:",s),!1}}export{T as sendOperationLogToFeishu};

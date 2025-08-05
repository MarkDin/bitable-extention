import React from 'react';

interface QueryConditionProps {
    tableName: string;
    firstColumnFieldName: string;
}

const QueryCondition: React.FC<QueryConditionProps> = ({ tableName, firstColumnFieldName }) => {
    return (
        <div className="bg-white rounded-lg border border-[#e4e7ec] p-4">
            <h2 className="text-sm font-medium text-[#344054] mb-3">配置查询条件</h2>
            <div className="p-2.5 bg-gray-100 rounded-lg outline outline-1 outline-offset-[-1px] outline-black/5 flex flex-col justify-center items-start gap-2.5 min-h-[8rem]">
                <div className="w-full flex flex-wrap justify-start items-center gap-[5px]">
                    <div className="justify-center text-neutral-800 text-sm font-medium font-['PingFang_SC'] leading-snug">当</div>
                    <div className="flex-1 min-w-[140px] max-w-[200px] px-3 py-1 bg-white rounded-md outline outline-1 outline-offset-[-1px] outline-black/10 flex justify-start items-center gap-1.5">
                        <div className="flex-1 py-px flex justify-start items-center overflow-hidden">
                            <div className="justify-start text-zinc-800 text-sm font-normal font-['PingFang_SC'] leading-snug truncate">
                                {tableName || '欧洲一区项目跟进表'}
                            </div>
                        </div>
                        <div className="size-3 inline-flex flex-col justify-center items-center overflow-hidden shrink-0">
                            <div className="size-3 relative overflow-hidden">
                                <div className="size-1.5 left-[6.01px] top-[8.96px] absolute origin-top-left rotate-[-135deg] bg-black/10"></div>
                            </div>
                        </div>
                    </div>
                    <div className="justify-center text-neutral-800 text-sm font-medium font-['PingFang_SC'] leading-snug">中的</div>
                    <div className="flex-1 min-w-[80px] max-w-[120px] px-3 py-1 bg-white rounded-md outline outline-1 outline-offset-[-1px] outline-black/10 flex justify-start items-center gap-1">
                        <div className="flex-1 py-px flex justify-start items-center overflow-hidden">
                            <div className="justify-start text-zinc-800 text-sm font-normal font-['PingFang_SC'] leading-snug truncate">
                                {firstColumnFieldName || 'PI订单号'}
                            </div>
                        </div>
                        <div className="size-3 inline-flex flex-col justify-center items-center overflow-hidden shrink-0">
                            <div className="size-3 relative overflow-hidden">
                                <div className="size-1.5 left-[6.01px] top-[8.96px] absolute origin-top-left rotate-[-135deg] bg-black/10"></div>
                            </div>
                        </div>
                    </div>
                    <div className="justify-center text-neutral-800 text-sm font-medium font-['PingFang_SC'] leading-snug">字段</div>
                </div>
                <div className="w-full flex flex-wrap justify-start items-center gap-[5px]">
                    <div className="justify-center text-neutral-800 text-sm font-medium font-['PingFang_SC'] leading-snug">内容是</div>
                    <div className="flex-1 min-w-[180px] max-w-[280px] px-3 py-1 bg-white rounded-md outline outline-1 outline-offset-[-1px] outline-black/10 flex justify-start items-center gap-1">
                        <div className="flex-1 py-px flex justify-start items-center overflow-hidden">
                            <div className="justify-start text-zinc-800 text-sm font-normal font-['PingFang_SC'] leading-snug truncate">订单号，例如：IN20240404</div>
                        </div>
                        <div className="size-3 inline-flex flex-col justify-center items-center overflow-hidden shrink-0">
                            <div className="size-3 relative overflow-hidden">
                                <div className="size-1.5 left-[6.01px] top-[8.96px] absolute origin-top-left rotate-[-135deg] bg-black/10"></div>
                            </div>
                        </div>
                    </div>
                    <div className="justify-center text-neutral-800 text-base font-medium font-['PingFang_SC'] leading-normal">时，</div>
                </div>
                <div className="w-full flex justify-start text-neutral-800 text-sm font-medium font-['PingFang_SC'] leading-snug">将以下勾选的字段数据同步到表格中</div>
            </div>
        </div>
    );
};

export default QueryCondition;

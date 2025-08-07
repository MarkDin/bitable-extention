import React from 'react';

/**
 * 帮助与反馈组件
 * 提供使用手册和群聊反馈入口
 */
const HelpAndFeedback: React.FC = () => {
    return (
        <div className="self-stretch h-16 relative">

            {/* 标题区域 */}
            <div className="left-1 top-[11px] absolute inline-flex justify-start items-center gap-[3px]">
                {/* 问号图标 */}
                <div data-svg-wrapper className="relative">
                    <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8.00004 15.1668C9.84097 15.1668 11.5076 14.4206 12.7141 13.2142C13.9205 12.0078 14.6667 10.3411 14.6667 8.50016C14.6667 6.65923 13.9205 4.99256 12.7141 3.78612C11.5076 2.57969 9.84097 1.8335 8.00004 1.8335C6.15911 1.8335 4.49244 2.57969 3.28599 3.78612C2.07957 4.99256 1.33337 6.65923 1.33337 8.50016C1.33337 10.3411 2.07957 12.0078 3.28599 13.2142C4.49244 14.4206 6.15911 15.1668 8.00004 15.1668Z" stroke="#333333" strokeLinejoin="round" />
                        <path d="M8 10.0418V8.7085C9.10457 8.7085 10 7.81306 10 6.7085C10 5.60393 9.10457 4.7085 8 4.7085C6.89543 4.7085 6 5.60393 6 6.7085" stroke="#333333" strokeLinecap="round" strokeLinejoin="round" />
                        <path fillRule="evenodd" clipRule="evenodd" d="M7.99996 13.0417C8.46019 13.0417 8.83329 12.6686 8.83329 12.2083C8.83329 11.7481 8.46019 11.375 7.99996 11.375C7.53973 11.375 7.16663 11.7481 7.16663 12.2083C7.16663 12.6686 7.53973 13.0417 7.99996 13.0417Z" fill="#333333" />
                    </svg>
                </div>
                {/* 标题文字 */}
                <div className="w-72 h-6 justify-center text-black text-sm font-medium font-['PingFang_SC'] leading-snug">
                    帮助与反馈
                </div>
            </div>

            {/* 查看使用手册按钮 */}
            <div
                className="w-24 h-4 left-1 top-[46px] absolute cursor-pointer group transition-all duration-200"
                onClick={() => {
                    // 这里可以添加打开使用手册的逻辑
                    window.open('https://global-intco.feishu.cn/docx/Nej2ddbQ8oqVTHxaZMgcNUx7nuf', '_blank');
                }}
            >
                <div data-svg-wrapper className="left-0 top-[2px] absolute">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-colors duration-200">
                        <path d="M6 3.5V10.5" stroke="#626784" className="group-hover:stroke-[#165DFF] transition-colors duration-200" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M1.5 9C1.36739 9 1.24021 8.94732 1.14645 8.85355C1.05268 8.75979 1 8.63261 1 8.5V2C1 1.86739 1.05268 1.74021 1.14645 1.64645C1.24021 1.55268 1.36739 1.5 1.5 1.5H4C4.53043 1.5 5.03914 1.71071 5.41421 2.08579C5.78929 2.46086 6 2.96957 6 3.5C6 2.96957 6.21071 2.46086 6.58579 2.08579C6.96086 1.71071 7.46957 1.5 8 1.5H10.5C10.6326 1.5 10.7598 1.55268 10.8536 1.64645C10.9473 1.74021 11 1.86739 11 2V8.5C11 8.63261 10.9473 8.75979 10.8536 8.85355C10.7598 8.94732 10.6326 9 10.5 9H7.5C7.10218 9 6.72064 9.15804 6.43934 9.43934C6.15804 9.72064 6 10.1022 6 10.5C6 10.1022 5.84196 9.72064 5.56066 9.43934C5.27936 9.15804 4.89782 9 4.5 9H1.5Z" stroke="#626784" className="group-hover:stroke-[#165DFF] transition-colors duration-200" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <div className="w-20 h-4 left-[17px] top-0 absolute text-center justify-center text-[#626784] group-hover:text-[#165DFF] text-xs font-normal font-['PingFang_SC'] leading-none transition-colors duration-200">查看使用手册</div>
            </div>

            {/* 分割线 */}
            <div data-svg-wrapper className="left-[113px] top-[47px] absolute">
                <svg width="1" height="14" viewBox="0 0 1 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="1" height="14" fill="#D9D9D9" />
                </svg>
            </div>

            {/* 加入群聊反馈按钮 */}
            <div
                className="w-24 h-4 left-[119px] top-[46px] absolute cursor-pointer group transition-all duration-200"
                onClick={() => {
                    // 这里可以添加打开群聊的逻辑
                    window.open('https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=feer8ca0-aa20-45f8-9d9d-845c19e28b98', '_blank');
                }}
            >
                <div data-svg-wrapper className="left-[4px] top-[2px] absolute">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-colors duration-200">
                        <path d="M3.95 10C4.90429 10.4896 6.00204 10.6221 7.04544 10.3739C8.08884 10.1257 9.00928 9.51294 9.64088 8.64611C10.2725 7.77929 10.5737 6.71538 10.4903 5.6461C10.4069 4.57683 9.94429 3.57251 9.1859 2.81412C8.42752 2.05573 7.42319 1.59315 6.35392 1.50973C5.28465 1.42631 4.22074 1.72755 3.35391 2.35915C2.48708 2.99075 1.87435 3.91118 1.62611 4.95458C1.37788 5.99798 1.51047 7.09573 2 8.05002L1 11L3.95 10Z" stroke="#626784" className="group-hover:stroke-[#165DFF] transition-colors duration-200" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <div className="w-20 h- left-[20px] top-0 absolute text-center justify-center text-[#626784] group-hover:text-[#165DFF] text-xs font-normal font-['PingFang_SC'] leading-none transition-colors duration-200">加入群聊反馈</div>
            </div>
        </div>
    );
};

export default HelpAndFeedback;
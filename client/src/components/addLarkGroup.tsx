import { Info } from "lucide-react";

// 顶部信息提示组件
const InfoMessage: React.FC = () => {
    return (
        <div className="bg-[rgba(0,122,255,0.15)] rounded-sm p-[9px] px-4">
            <div className="flex items-center gap-2">
                <div className="size-5 flex items-center justify-center">
                    <Info className="size-4 text-[#007aff]" />
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-[#1d2129]">
                    <span>如需帮助，请</span>
                    <a
                        href="https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=feer8ca0-aa20-45f8-9d9d-845c19e28b98"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-[#007aff] bg-white/60 rounded border border-[#007aff]/20 hover:bg-[#007aff]/10 hover:border-[#007aff]/40 transition-colors"
                    >
                        加入群聊反馈
                    </a>
                    <span>或</span>
                    <a
                        href="https://global-intco.feishu.cn/docx/Nej2ddbQ8oqVTHxaZMgcNUx7nuf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-[#007aff] bg-white/60 rounded border border-[#007aff]/20 hover:bg-[#007aff]/10 hover:border-[#007aff]/40 transition-colors"
                    >
                        查看字段定义
                    </a>
                </div>
            </div>
        </div>
    );
};

export default InfoMessage;
import { Info } from "lucide-react";

// 顶部信息提示组件
const InfoMessage: React.FC = () => {
    return (
        <div className="bg-[rgba(0,122,255,0.15)] rounded-sm p-[9px] px-4">
            <div className="flex items-center gap-2">
                <div className="size-5 flex items-center justify-center">
                    <Info className="size-4 text-[#007aff]" />
                </div>
                <p className="text-sm font-medium text-[#1d2129]">
                    如需帮助，请
                    <a href="#" className="text-[#007aff] hover:underline">
                        加入群聊反馈
                    </a>
                </p>
            </div>
        </div>
    );
};

export default InfoMessage;
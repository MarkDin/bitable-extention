import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getConfig, setConfig } from "@/lib/dataSync";
import { useEffect, useState } from "react";

const ConfigManager = () => {
    const { toast } = useToast();
    const [configText, setConfigText] = useState("");
    const [loading, setLoading] = useState(false);

    // 加载配置
    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const config = await getConfig();
                setConfigText(config ? JSON.stringify(config, null, 2) : "{}");
            } catch (e: any) {
                toast({ title: "加载失败", description: e.message, variant: "destructive" });
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // 保存配置
    const handleSave = async () => {
        setLoading(true);
        try {
            const json = JSON.parse(configText);
            await setConfig(json);
            toast({ title: "保存成功", description: "配置已更新" });
        } catch (e: any) {
            toast({ title: "保存失败", description: e.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h2 className="text-xl font-bold mb-4">插件配置管理</h2>
            <Textarea
                className="w-full h-64 mb-4 font-mono"
                value={configText}
                onChange={e => setConfigText(e.target.value)}
                disabled={loading}
            />
            <div className="flex gap-2">
                <Button onClick={handleSave} disabled={loading}>保存配置</Button>
            </div>
        </div>
    );
};

export default ConfigManager; 
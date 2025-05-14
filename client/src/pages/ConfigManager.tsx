import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getConfig, setConfig } from "@/lib/dataSync";
import { useEffect, useState } from "react";
import { JsonView } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';

const ConfigManager = () => {
    const { toast } = useToast();
    const [configText, setConfigText] = useState("");
    const [loading, setLoading] = useState(false);
    const [configObj, setConfigObj] = useState<any>({});

    // 加载配置
    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const config = await getConfig();
                setConfigText(config ? JSON.stringify(config, null, 2) : "{}");
                setConfigObj(config || {});
            } catch (e: any) {
                toast({ title: "加载失败", description: e.message, variant: "destructive" });
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // 监听 configObj 变化，自动同步 configText
    useEffect(() => {
        setConfigText(JSON.stringify(configObj, null, 2));
    }, [configObj]);

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

    // 添加 field_list 的新项目
    const handleAddFieldItem = () => {
        const fieldList = Array.isArray(configObj.field_list) ? [...configObj.field_list] : [];
        fieldList.push({ mapping_field: '', name: '' });
        setConfigObj({ ...configObj, field_list: fieldList });
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h2 className="text-xl font-bold mb-4">插件配置管理</h2>
            <div className="mb-4">
                <textarea
                    className="w-full h-[500px] mb-4 font-mono bg-background border rounded-md p-2"
                    value={configText}
                    onChange={e => {
                        setConfigText(e.target.value);
                        try {
                            const parsed = JSON.parse(e.target.value);
                            setConfigObj(parsed);
                        } catch (err) {
                            // 解析错误时不更新 configObj
                        }
                    }}
                    disabled={loading}
                />
            </div>
            <div className="flex flex-col gap-2 mb-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">字段映射列表</h3>
                    <Button onClick={handleAddFieldItem} size="sm">添加字段映射</Button>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 max-h-[300px] overflow-auto">
                    <JsonView data={configObj} shouldExpandNode={() => true} />
                </div>
            </div>
            <div className="flex gap-2">
                <Button onClick={handleSave} disabled={loading}>保存配置</Button>
            </div>
        </div>
    );
};

export default ConfigManager; 
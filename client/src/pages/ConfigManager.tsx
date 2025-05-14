import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getConfig, setConfig } from "@/lib/dataSync";
import { useEffect, useState } from "react";
import ReactJson from 'react-json-view';

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

    // 自定义 onAdd 逻辑
    const handleAdd = (e: any) => {
        console.log('onAdd event:', e);

        // 直接检查 e.name 是否等于 'field_list'，因为已经观察到这是正确的条件
        const isFieldListAdd = e.name === 'field_list';

        console.log('isFieldListAdd:', isFieldListAdd);

        if (isFieldListAdd) {
            // 从 updated_src 中获取新的 field_list
            const newFieldList = [...e.updated_src.field_list];

            // 遍历并替换所有 null 值
            for (let i = 0; i < newFieldList.length; i++) {
                if (newFieldList[i] === null) {
                    newFieldList[i] = { mapping_field: '', name: '' };
                }
            }

            console.log('新的 field_list:', newFieldList);

            // 更新状态
            const newConfig = { ...configObj, field_list: newFieldList };
            setConfigObj(newConfig);
            return true; // 阻止默认 onAdd
        }

        // 其他添加操作，使用默认行为
        setConfigObj(e.updated_src);
        return true;
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h2 className="text-xl font-bold mb-4">插件配置管理</h2>
            <div className="w-full h-[500px] mb-4 font-mono overflow-auto bg-background border rounded-md p-2">
                <ReactJson
                    src={configObj}
                    name={false}
                    theme="rjv-default"
                    iconStyle="triangle"
                    enableClipboard={true}
                    displayDataTypes={false}
                    displayObjectSize={false}
                    onEdit={e => setConfigObj(e.updated_src)}
                    onAdd={handleAdd}
                    onDelete={e => setConfigObj(e.updated_src)}
                    collapsed={2}
                    style={{ fontSize: 14 }}
                />
            </div>
            <div className="flex gap-2">
                <Button onClick={handleSave} disabled={loading}>保存配置</Button>
            </div>
        </div>
    );
};

export default ConfigManager; 
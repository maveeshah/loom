import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import {
    Form,
    Input,
    Button,
    DatePicker,
    InputNumber,
    Card,
    Typography,
    message,
    Breadcrumb,
    Switch,
    Skeleton
} from 'antd';
import {
    SaveOutlined,
    ArrowLeftOutlined,
    HomeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import Layout from '../components/Layout';
import { api } from '../api';

const { Title, Text } = Typography;

export default function RecordForm() {
    const { module, id } = useParams<{ module: string; id?: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [form] = Form.useForm();
    const isEditing = Boolean(id);

    const [definition, setDefinition] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!module) return;
        setLoading(true);
        const loads: Promise<any>[] = [api.fetchModuleDefinition(module)];
        if (isEditing && id) loads.push(api.fetchRecord(module, Number(id)));

        Promise.all(loads)
            .then(([def, existing]) => {
                setDefinition(def);
                if (existing) {
                    const { id: _, ...rest } = existing;
                    // Format dates for Ant Design DatePicker
                    const formattedData = { ...rest };
                    def.fields?.forEach((f: any) => {
                        if (['Date', 'DateTime'].includes(f.type) && rest[f.name]) {
                            formattedData[f.name] = dayjs(rest[f.name]);
                        }
                    });
                    form.setFieldsValue(formattedData);
                } else {
                    const defaults: Record<string, any> = {};
                    const params = new URLSearchParams(location.search);
                    def.fields?.forEach((f: any) => {
                        const isAutomatic = f.default === 'now()' || f.onupdate;
                        if (!isAutomatic) {
                            if (params.has(f.name)) {
                                defaults[f.name] = ['Integer', 'Float'].includes(f.type)
                                    ? Number(params.get(f.name))
                                    : params.get(f.name);
                            } else if (f.default !== undefined) {
                                defaults[f.name] = ['Date', 'DateTime'].includes(f.type)
                                    ? dayjs(f.default === 'now' ? undefined : f.default)
                                    : f.default;
                            }
                        }
                    });
                    form.setFieldsValue(defaults);
                }
            })
            .catch(err => message.error(err.message))
            .finally(() => setLoading(false));
    }, [module, id, location.search, form, isEditing]);

    const onFinish = async (values: any) => {
        if (!module) return;
        setSaving(true);
        try {
            // Process values (convert dayjs back to strings)
            const processedValues = { ...values };
            definition.fields?.forEach((f: any) => {
                if (['Date', 'DateTime'].includes(f.type) && values[f.name]) {
                    processedValues[f.name] = values[f.name].toISOString();
                }
            });

            if (isEditing && id) {
                await api.updateRecord(module, Number(id), processedValues);
                message.success('Record updated successfully');
            } else {
                await api.createRecord(module, processedValues);
                message.success('Record created successfully');
            }
            navigate(`/app/${module}`);
        } catch (err: any) {
            message.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const displayName = definition?.name ?? module;

    if (loading) return <Layout><div className="p-8"><Skeleton active /></div></Layout>;

    return (
        <Layout>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <Breadcrumb
                        style={{ marginBottom: 16 }}
                        items={[
                            { title: <Link to="/"><HomeOutlined /></Link> },
                            { title: <Link to={`/app/${module}`}>{displayName}</Link> },
                            { title: isEditing ? 'Edit' : 'New' },
                        ]}
                    />

                    <div className="flex items-center gap-4">
                        <Link to={isEditing ? `/app/${module}/${id}` : `/app/${module}`}>
                            <Button shape="circle" icon={<ArrowLeftOutlined />} size="large" className="shadow-sm" />
                        </Link>
                        <div>
                            <Title level={2} style={{ margin: 0, fontWeight: 800 }}>
                                {isEditing ? `Edit ${displayName}` : `New ${displayName}`}
                            </Title>
                            <Text type="secondary">
                                {isEditing ? `Refining record data for #${id}` : `Initialize a new ${displayName?.toLowerCase()} entry`}
                            </Text>
                        </div>
                    </div>
                </div>

                <Card className="premium-card" bodyStyle={{ padding: '32px' }}>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        requiredMark="optional"
                        size="large"
                        className="modern-form"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                            {definition?.fields?.map((field: any) => {
                                const isAutomatic = field.default === 'now()' || field.onupdate;
                                if (isAutomatic) return null;

                                let inputNode = <Input placeholder={`Enter ${field.name.replace(/_/g, ' ')}`} />;

                                if (field.type === 'Integer') inputNode = <InputNumber className="w-full" placeholder="0" />;
                                if (field.type === 'Float') inputNode = <InputNumber className="w-full" step="0.01" placeholder="0.00" />;
                                if (field.type === 'Boolean') return (
                                    <Form.Item
                                        key={field.name}
                                        name={field.name}
                                        label={field.name.replace(/_/g, ' ')}
                                        valuePropName="checked"
                                        className="col-span-1"
                                    >
                                        <Switch className="bg-slate-200" />
                                    </Form.Item>
                                );
                                if (field.type === 'Date') inputNode = <DatePicker className="w-full" />;
                                if (field.type === 'DateTime') inputNode = <DatePicker className="w-full" showTime />;

                                return (
                                    <Form.Item
                                        key={field.name}
                                        name={field.name}
                                        label={field.name.replace(/_/g, ' ')}
                                        rules={[{ required: field.required, message: `${field.name} is required` }]}
                                        className={field.type === 'String' ? 'col-span-2' : 'col-span-1'}
                                    >
                                        {inputNode}
                                    </Form.Item>
                                );
                            })}
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-10 pt-8 border-t border-slate-100">
                            <Link to={isEditing ? `/app/${module}/${id}` : `/app/${module}`}>
                                <Button size="large" className="rounded-xl px-8">Cancel</Button>
                            </Link>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={saving}
                                size="large"
                                icon={<SaveOutlined />}
                                className="rounded-xl px-10 shadow-lg shadow-blue-100"
                            >
                                {isEditing ? 'Save Changes' : `Create ${displayName}`}
                            </Button>
                        </div>
                    </Form>
                </Card>
            </div>
        </Layout>
    );
}

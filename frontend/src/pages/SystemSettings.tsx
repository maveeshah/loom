import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Typography, Space, Switch, List } from 'antd';
import { SaveOutlined, GlobalOutlined, AppstoreOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { api } from '../api';
import { PageHeader } from '../components/ui/PageHeader';

const { Title, Text } = Typography;

export default function SystemSettings() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState<Record<string, string>>({});

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await api.fetchSettings();
            setSettings(data);

            // Convert 'true'/'false' strings to booleans for the Switch components
            const formValues: Record<string, any> = { ...data };
            ['enable_analytics', 'enable_notifications', 'maintenance_mode'].forEach(key => {
                if (data[key] !== undefined) {
                    formValues[key] = data[key] === 'true';
                }
            });

            form.setFieldsValue(formValues);
        } catch (err) {
            message.error('Failed to load settings');
        }
    };

    const onUpdateSettings = async (values: any) => {
        setLoading(true);
        try {
            for (const [key, value] of Object.entries(values)) {
                await api.updateSetting(key, String(value));
            }
            message.success('Settings updated successfully');
        } catch (err) {
            message.error('Failed to update settings');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <PageHeader
                title="System Settings"
                subtitle="Configure global platform behavior and appearance"
            />

            <Form
                form={form}
                layout="vertical"
                onFinish={onUpdateSettings}
            >
                <Space direction="vertical" size={24} className="w-full">
                    <Card className="premium-card">
                        <div className="flex items-center gap-4 mb-6">
                            <GlobalOutlined className="text-2xl text-blue-600 bg-blue-50 p-3 rounded-xl" />
                            <div>
                                <Title level={4} className="!m-0">General Configuration</Title>
                                <Text type="secondary">Basic platform identity and display settings</Text>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Form.Item
                                label="Platform Name"
                                name="platform_name"
                                initialValue="Viemed"
                            >
                                <Input prefix={<AppstoreOutlined className="text-slate-400" />} placeholder="Viemed" size="large" />
                            </Form.Item>

                            <Form.Item
                                label="Support Email"
                                name="support_email"
                                initialValue="support@viemed.com"
                            >
                                <Input placeholder="support@viemed.com" size="large" />
                            </Form.Item>
                        </div>
                    </Card>

                    <Card className="premium-card">
                        <div className="flex items-center gap-4 mb-6">
                            <ThunderboltOutlined className="text-2xl text-amber-500 bg-amber-50 p-3 rounded-xl" />
                            <div>
                                <Title level={4} className="!m-0">Feature Flags</Title>
                                <Text type="secondary">Enable or disable advanced platform features</Text>
                            </div>
                        </div>

                        <List
                            itemLayout="horizontal"
                            dataSource={[
                                { key: 'enable_analytics', label: 'Global Analytics', desc: 'Enable usage tracking across all modules' },
                                { key: 'enable_notifications', label: 'Email Notifications', desc: 'Send automated updates to users' },
                                { key: 'maintenance_mode', label: 'Maintenance Mode', desc: 'Prevent non-admin users from accessing the app' },
                            ]}
                            renderItem={(item) => (
                                <List.Item
                                    actions={[
                                        <Form.Item name={item.key} valuePropName="checked" className="m-0" initialValue={settings[item.key] === 'true'}>
                                            <Switch />
                                        </Form.Item>
                                    ]}
                                >
                                    <List.Item.Meta
                                        title={item.label}
                                        description={item.desc}
                                    />
                                </List.Item>
                            )}
                        />
                    </Card>

                    <div className="flex justify-end">
                        <Button
                            type="primary"
                            htmlType="submit"
                            icon={<SaveOutlined />}
                            loading={loading}
                            size="large"
                            className="bg-blue-600 h-12 px-8 rounded-xl shadow-lg shadow-blue-500/20"
                        >
                            Save All Settings
                        </Button>
                    </div>
                </Space>
            </Form>
        </div>
    );
}

import { useState } from 'react';
import { Card, Form, Input, Button, message, Typography, Space } from 'antd';
import { UserOutlined, LockOutlined, SaveOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { PageHeader } from '../components/ui/PageHeader';

const { Title, Text } = Typography;

export default function ProfileSettings() {
    const { user } = useAuth();
    const [form] = Form.useForm();
    const [passwordForm] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const onUpdateProfile = async (values: any) => {
        setLoading(true);
        try {
            await api.updateMe({ full_name: values.full_name });
            message.success('Profile updated successfully');
        } catch (err: any) {
            message.error(err.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const onUpdatePassword = async (values: any) => {
        setLoading(true);
        try {
            await api.updateMe({ password: values.new_password });
            message.success('Password updated successfully');
            passwordForm.resetFields();
        } catch (err: any) {
            message.error(err.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <PageHeader
                title="Profile Settings"
                subtitle="Manage your personal information and security preferences"
            />

            <Space direction="vertical" size={24} className="w-full">
                <Card className="premium-card">
                    <div className="flex items-center gap-4 mb-6">
                        <UserOutlined className="text-2xl text-blue-600 bg-blue-50 p-3 rounded-xl" />
                        <div>
                            <Title level={4} className="!m-0">Personal Information</Title>
                            <Text type="secondary">Update your name and account details</Text>
                        </div>
                    </div>

                    <Form
                        form={form}
                        layout="vertical"
                        initialValues={{
                            full_name: user?.full_name,
                            email: user?.email,
                        }}
                        onFinish={onUpdateProfile}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Form.Item
                                label="Full Name"
                                name="full_name"
                                rules={[{ required: true, message: 'Please enter your full name' }]}
                            >
                                <Input prefix={<UserOutlined className="text-slate-400" />} placeholder="John Doe" size="large" />
                            </Form.Item>

                            <Form.Item label="Email Address">
                                <Input value={user?.email} disabled size="large" />
                                <Text type="secondary" className="text-xs">Email cannot be changed contact admin</Text>
                            </Form.Item>
                        </div>

                        <Button
                            type="primary"
                            htmlType="submit"
                            icon={<SaveOutlined />}
                            loading={loading}
                            size="large"
                            className="bg-blue-600"
                        >
                            Save Changes
                        </Button>
                    </Form>
                </Card>

                <Card className="premium-card">
                    <div className="flex items-center gap-4 mb-6">
                        <LockOutlined className="text-2xl text-amber-600 bg-amber-50 p-3 rounded-xl" />
                        <div>
                            <Title level={4} className="!m-0">Security & Password</Title>
                            <Text type="secondary">Keep your account secure with a strong password</Text>
                        </div>
                    </div>

                    <Form
                        form={passwordForm}
                        layout="vertical"
                        onFinish={onUpdatePassword}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Form.Item
                                label="New Password"
                                name="new_password"
                                rules={[
                                    { required: true, message: 'Please enter a new password' },
                                    { min: 6, message: 'Password must be at least 6 characters' }
                                ]}
                            >
                                <Input.Password prefix={<LockOutlined className="text-slate-400" />} placeholder="••••••••" size="large" />
                            </Form.Item>

                            <Form.Item
                                label="Confirm New Password"
                                name="confirm_password"
                                dependencies={['new_password']}
                                rules={[
                                    { required: true, message: 'Please confirm your password' },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('new_password') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error('The two passwords do not match!'));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password prefix={<LockOutlined className="text-slate-400" />} placeholder="••••••••" size="large" />
                            </Form.Item>
                        </div>

                        <Button
                            type="primary"
                            htmlType="submit"
                            icon={<SaveOutlined />}
                            loading={loading}
                            size="large"
                            className="bg-slate-800 border-none hover:bg-slate-700"
                        >
                            Update Password
                        </Button>
                    </Form>
                </Card>
            </Space>
        </div>
    );
}

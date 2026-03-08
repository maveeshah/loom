import { useEffect, useState } from 'react';
import { Card, Typography, Select, message, Tag, Space, Button, Modal, Form, Input, Switch, Avatar } from 'antd';
import { UserOutlined, CheckCircleOutlined, CloseCircleOutlined, EditOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { api } from '../api';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { LoadingState } from '../components/ui/Feedback';

const { } = Typography;

export default function UserManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [form] = Form.useForm();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setLoading(true);
        Promise.all([api.admin.fetchUsers(), api.admin.fetchRoles()])
            .then(([userData, roleData]) => {
                setUsers(userData);
                setRoles(roleData);
            })
            .catch(err => message.error(err.message))
            .finally(() => setLoading(false));
    };

    const handleEdit = (user: any) => {
        setEditingUser(user);
        form.setFieldsValue({
            full_name: user.full_name,
            email: user.email,
            role_id: user.role?.id,
            is_active: user.is_active,
            password: ''
        });
        setEditModalVisible(true);
    };

    const handleUpdate = async (values: any) => {
        try {
            const updateData: any = {
                full_name: values.full_name,
                email: values.email,
                role_id: values.role_id,
                is_active: values.is_active
            };
            if (values.password) {
                updateData.password = values.password;
            }

            await api.admin.updateUser(editingUser.id, updateData);
            message.success('User updated successfully');
            setEditModalVisible(false);
            loadData();
        } catch (err: any) {
            message.error(err.message);
        }
    };

    const columns = [
        {
            title: 'User Profile',
            key: 'user',
            render: (_: any, record: any) => (
                <Space size="middle">
                    <Avatar
                        size={40}
                        icon={<UserOutlined />}
                        className="bg-blue-50 text-blue-500 border border-blue-100 shadow-sm"
                    />
                    <div>
                        <div className="font-bold text-slate-800 leading-tight">{record.full_name}</div>
                        <div className="text-[11px] text-slate-400 font-medium">{record.email}</div>
                    </div>
                </Space>
            ),
        },
        {
            title: 'System Role',
            key: 'role',
            render: (_: any, record: any) => (
                <Tag color="geekblue" bordered={false} className="rounded-full px-3 font-semibold text-[10px] uppercase tracking-wider">
                    {record.role?.name || 'No Role'}
                </Tag>
            ),
        },
        {
            title: 'Account Status',
            dataIndex: 'is_active',
            key: 'status',
            render: (active: boolean) => (
                active ?
                    <Tag icon={<CheckCircleOutlined />} color="success" bordered={false} className="rounded-full px-3 font-medium">Active</Tag> :
                    <Tag icon={<CloseCircleOutlined />} color="default" bordered={false} className="rounded-full px-3 font-medium opacity-60">Inactive</Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'right' as const,
            render: (_: any, record: any) => (
                <Button
                    type="text"
                    icon={<EditOutlined style={{ fontSize: '16px' }} />}
                    onClick={() => handleEdit(record)}
                    className="hover:bg-slate-50 text-slate-400 hover:text-blue-600 rounded-lg h-9 w-9 flex items-center justify-center p-0"
                />
            ),
        },
    ];

    if (loading && users.length === 0) return <div className="max-w-6xl mx-auto"><LoadingState /></div>;

    return (
        <>
            <div className="max-w-6xl mx-auto">
                <PageHeader
                    title="User Directory"
                    subtitle="Manage system access, identity roles, and account security profiles."
                    breadcrumbItems={[
                        { title: 'Administration' },
                        { title: 'User Management' },
                    ]}
                />

                <Card className="premium-card overflow-hidden" bodyStyle={{ padding: 0 }}>
                    <DataTable
                        columns={columns}
                        dataSource={users}
                        loading={loading}
                        rowKey="id"
                        pagination={{ pageSize: 12 }}
                    />
                </Card>

                <Modal
                    title={<div className="text-lg font-extrabold text-slate-800 tracking-tight py-1">User Configuration</div>}
                    open={editModalVisible}
                    onCancel={() => setEditModalVisible(false)}
                    onOk={() => form.submit()}
                    okText="Save Changes"
                    centered
                    width={520}
                    className="premium-modal"
                    bodyStyle={{ padding: '24px 0 0 0' }}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleUpdate}
                        requiredMark="optional"
                        className="px-6"
                    >
                        <div className="grid grid-cols-2 gap-x-6">
                            <Form.Item
                                name="full_name"
                                label={<span className="font-semibold text-slate-700">Display Identity</span>}
                                rules={[{ required: true, message: 'Identity required' }]}
                                className="col-span-2"
                            >
                                <Input prefix={<UserOutlined className="text-slate-300" />} placeholder="e.g. John Doe" className="rounded-xl h-11" />
                            </Form.Item>

                            <Form.Item
                                name="email"
                                label={<span className="font-semibold text-slate-700">Communication Email</span>}
                                rules={[
                                    { required: true, message: 'Email required' },
                                    { type: 'email', message: 'Invalid email format' }
                                ]}
                                className="col-span-2"
                            >
                                <Input prefix={<MailOutlined className="text-slate-300" />} placeholder="identity@domain.com" className="rounded-xl h-11" />
                            </Form.Item>

                            <Form.Item
                                name="role_id"
                                label={<span className="font-semibold text-slate-700">Security Role</span>}
                                rules={[{ required: true, message: 'Role assignment required' }]}
                            >
                                <Select placeholder="Assign Role" className="modern-select rounded-xl h-11">
                                    {roles.map(role => (
                                        <Select.Option key={role.id} value={role.id}>{role.name}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item
                                name="is_active"
                                label={<span className="font-semibold text-slate-700">Account Status</span>}
                                valuePropName="checked"
                                className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100"
                            >
                                <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                                <span className="ml-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Active Access</span>
                            </Form.Item>
                        </div>

                        <div className="mt-6 mb-8 p-5 bg-slate-900 rounded-3xl border border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl -mr-16 -mt-16 rounded-full pointer-events-none"></div>
                            <div className="flex items-center gap-2 mb-4 text-white/40 font-bold text-[10px] uppercase tracking-[0.2em] relative z-10">
                                <LockOutlined className="text-blue-400" /> Security Credential Setup
                            </div>
                            <Form.Item
                                name="password"
                                label={<span className="font-semibold text-white/70">Reset Password</span>}
                                className="mb-0"
                                help={<span className="text-white/30 text-[10px]">Leave blank to maintain current credentials</span>}
                            >
                                <Input.Password placeholder="••••••••" className="rounded-xl h-11 bg-white/5 border-white/10 text-white placeholder:text-white/20" />
                            </Form.Item>
                        </div>
                    </Form>
                </Modal>
            </div>
        </>
    );
}

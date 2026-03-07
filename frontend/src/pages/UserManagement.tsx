import { useEffect, useState } from 'react';
import { Table, Card, Typography, Select, message, Tag, Space, Breadcrumb, Button, Modal, Form, Input, Switch } from 'antd';
import { UserOutlined, HomeOutlined, CheckCircleOutlined, CloseCircleOutlined, EditOutlined, LockOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api';

const { Title, Text } = Typography;

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
            title: 'User',
            key: 'user',
            render: (_: any, record: any) => (
                <Space>
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                        <UserOutlined />
                    </div>
                    <div>
                        <div className="font-bold text-slate-800">{record.full_name}</div>
                        <div className="text-xs text-slate-400">{record.email}</div>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'is_active',
            key: 'status',
            render: (active: boolean) => (
                active ?
                    <Tag icon={<CheckCircleOutlined />} color="success" className="rounded-full px-3">Active</Tag> :
                    <Tag icon={<CloseCircleOutlined />} color="error" className="rounded-full px-3">Inactive</Tag>
            ),
        },
        {
            title: 'Role',
            key: 'role',
            render: (_: any, record: any) => (
                <Tag color="blue" className="rounded-full px-3 font-medium">
                    {record.role?.name || 'No Role'}
                </Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'right' as const,
            render: (_: any, record: any) => (
                <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(record)}
                    className="hover:text-blue-600"
                >
                    Edit
                </Button>
            ),
        },
    ];

    return (
        <Layout>
            <div className="max-w-6xl mx-auto">
                <div className="mb-8 p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <Breadcrumb
                        style={{ marginBottom: 16 }}
                        items={[
                            { title: <Link to="/"><HomeOutlined /></Link> },
                            { title: 'Administration' },
                            { title: 'User Management' },
                        ]}
                    />
                    <div className="flex justify-between items-end">
                        <div className="">
                            <Title level={2} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.03em' }}>User Management</Title>
                            <Text type="secondary" className="text-lg">Manage system access, roles, and profiles.</Text>
                        </div>
                    </div>
                </div>

                <Card className="premium-card overflow-hidden" bodyStyle={{ padding: 0 }}>
                    <Table
                        columns={columns}
                        dataSource={users}
                        loading={loading}
                        rowKey="id"
                        pagination={{ pageSize: 15 }}
                        className="modern-table"
                    />
                </Card>

                <Modal
                    title={<div className="text-xl font-bold py-2">Edit User Profile</div>}
                    open={editModalVisible}
                    onCancel={() => setEditModalVisible(false)}
                    onOk={() => form.submit()}
                    okText="Save Changes"
                    centered
                    width={500}
                    className="premium-modal"
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleUpdate}
                        className="pt-4"
                    >
                        <Form.Item
                            name="full_name"
                            label="Full Name"
                            rules={[{ required: true, message: 'Please enter full name' }]}
                        >
                            <Input prefix={<UserOutlined className="text-slate-300" />} placeholder="John Doe" />
                        </Form.Item>

                        <Form.Item
                            name="email"
                            label="Email Address"
                            rules={[
                                { required: true, message: 'Please enter email' },
                                { type: 'email', message: 'Please enter a valid email' }
                            ]}
                        >
                            <Input placeholder="john@example.com" />
                        </Form.Item>

                        <div className="grid grid-cols-2 gap-4">
                            <Form.Item
                                name="role_id"
                                label="System Role"
                                rules={[{ required: true, message: 'Please select a role' }]}
                            >
                                <Select placeholder="Select Role">
                                    {roles.map(role => (
                                        <Select.Option key={role.id} value={role.id}>{role.name}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item
                                name="is_active"
                                label="Account Status"
                                valuePropName="checked"
                            >
                                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                            </Form.Item>
                        </div>

                        <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-2 mb-3 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                                <LockOutlined /> Security & Password
                            </div>
                            <Form.Item
                                name="password"
                                label="Reset Password"
                                help="Leave blank to keep current password"
                            >
                                <Input.Password placeholder="••••••••" />
                            </Form.Item>
                        </div>
                    </Form>
                </Modal>
            </div>
        </Layout>
    );
}

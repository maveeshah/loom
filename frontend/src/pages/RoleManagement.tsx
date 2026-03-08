import { useEffect, useState } from 'react';
import { Card, Typography, Button, message, Tag, Space, Modal, Checkbox, Form, Input, Collapse } from 'antd';
import { PlusOutlined, EditOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import Layout from '../components/Layout';
import { api } from '../api';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { LoadingState } from '../components/ui/Feedback';

const { Text } = Typography;
const { Panel } = Collapse;

export default function RoleManagement() {
    const [roles, setRoles] = useState<any[]>([]);
    const [permissions, setPermissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingRole, setEditingRole] = useState<any>(null);
    const [form] = Form.useForm();

    const load = () => {
        setLoading(true);
        Promise.all([api.admin.fetchRoles(), api.admin.fetchPermissions()])
            .then(([roleData, permData]) => {
                setRoles(roleData);
                setPermissions(permData);
            })
            .catch(err => message.error(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const groupedPermissions = permissions.reduce((acc: any, p) => {
        if (!acc[p.module]) acc[p.module] = [];
        acc[p.module].push(p);
        return acc;
    }, {});

    const handleEdit = (role: any) => {
        setEditingRole(role);
        form.setFieldsValue({
            name: role.name,
            permission_ids: role.permissions.map((p: any) => p.id)
        });
        setModalVisible(true);
    };

    const handleCreate = () => {
        setEditingRole(null);
        form.resetFields();
        setModalVisible(true);
    };

    const onFinish = async (values: any) => {
        try {
            if (editingRole) {
                await api.admin.updateRole(editingRole.id, values);
                message.success('Role updated successfully');
            } else {
                await api.admin.createRole(values);
                message.success('Role created successfully');
            }
            setModalVisible(false);
            load();
        } catch (err: any) {
            message.error(err.message);
        }
    };

    const columns = [
        {
            title: 'Role Specification',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => (
                <Space>
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                        <SafetyCertificateOutlined style={{ fontSize: '14px' }} />
                    </div>
                    <Text strong className="text-slate-800">{text}</Text>
                </Space>
            ),
        },
        {
            title: 'Active Privileges',
            key: 'permissions',
            render: (_: any, record: any) => (
                <div className="flex flex-wrap gap-1.5">
                    {record.permissions.slice(0, 4).map((p: any) => (
                        <Tag key={p.id} bordered={false} className="text-[9px] uppercase font-bold tracking-tight bg-slate-100 text-slate-500 rounded-md">
                            {p.code}
                        </Tag>
                    ))}
                    {record.permissions.length > 4 && (
                        <Tag bordered={false} className="text-[9px] uppercase font-bold tracking-tight bg-blue-50 text-blue-500 rounded-md">
                            +{record.permissions.length - 4} More
                        </Tag>
                    )}
                </div>
            ),
        },
        {
            title: 'Actions',
            key: 'action',
            width: 80,
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

    if (loading && roles.length === 0) return <Layout><div className="max-w-6xl mx-auto"><LoadingState /></div></Layout>;

    return (
        <Layout>
            <div className="max-w-6xl mx-auto">
                <PageHeader
                    title="Role Management"
                    subtitle="Define system access levels and fine-tune module-level rbac permissions."
                    breadcrumbItems={[
                        { title: 'Administration' },
                        { title: 'Role Settings' },
                    ]}
                    extra={
                        <Button
                            type="primary"
                            size="large"
                            icon={<PlusOutlined />}
                            onClick={handleCreate}
                            className="rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all font-bold px-6"
                        >
                            Create New Role
                        </Button>
                    }
                />

                <Card className="premium-card overflow-hidden" bodyStyle={{ padding: 0 }}>
                    <DataTable
                        columns={columns}
                        dataSource={roles}
                        loading={loading}
                        rowKey="id"
                        pagination={{ pageSize: 12 }}
                    />
                </Card>

                <Modal
                    title={<div className="text-lg font-extrabold text-slate-800 tracking-tight py-1">{editingRole ? 'Edit Access Role' : 'New Security Role'}</div>}
                    open={modalVisible}
                    onCancel={() => setModalVisible(false)}
                    onOk={() => form.submit()}
                    width={720}
                    className="premium-modal"
                    okText={editingRole ? 'Update Profile' : 'Initialize Role'}
                    centered
                >
                    <Form form={form} layout="vertical" onFinish={onFinish} requiredMark="optional" className="pt-4">
                        <Form.Item
                            name="name"
                            label={<span className="font-semibold text-slate-700">Role Identifier</span>}
                            rules={[{ required: true, message: 'Please provide a role name' }]}
                        >
                            <Input placeholder="e.g. Clinical Administrator" size="large" className="rounded-xl h-11" />
                        </Form.Item>

                        <div className="mb-3 mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <SafetyCertificateOutlined className="text-blue-500" /> Granular Permissions
                        </div>
                        <Form.Item name="permission_ids" valuePropName="value">
                            <Checkbox.Group className="w-full">
                                <Collapse
                                    ghost
                                    expandIconPosition="end"
                                    className="modern-collapse"
                                    defaultActiveKey={[Object.keys(groupedPermissions)[0]]}
                                >
                                    {Object.entries(groupedPermissions).map(([module, perms]: [string, any]) => (
                                        <Panel
                                            header={
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                    <span className="font-bold text-slate-700 capitalize">{module} Module</span>
                                                    <Tag bordered={false} className="bg-slate-100 text-slate-400 text-[9px] rounded-md font-bold px-1.5 ml-auto">
                                                        {perms.length} Actions
                                                    </Tag>
                                                </div>
                                            }
                                            key={module}
                                            className="mb-2 border border-slate-100 rounded-2xl bg-slate-50/30 overflow-hidden"
                                        >
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-4 p-2">
                                                {perms.map((p: any) => (
                                                    <Checkbox key={p.id} value={p.id} className="modern-checkbox">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-slate-700">{p.name}</span>
                                                            <span className="text-[10px] text-slate-400 font-mono leading-none">{p.code}</span>
                                                        </div>
                                                    </Checkbox>
                                                ))}
                                            </div>
                                        </Panel>
                                    ))}
                                </Collapse>
                            </Checkbox.Group>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </Layout>
    );
}

import { useEffect, useState } from 'react';
import { Table, Card, Typography, Button, message, Tag, Space, Breadcrumb, Modal, Checkbox, Form, Input, Collapse } from 'antd';
import { HomeOutlined, PlusOutlined, EditOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api';

const { Title, Text } = Typography;
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
                message.success('Role updated');
            } else {
                await api.admin.createRole(values);
                message.success('Role created');
            }
            setModalVisible(false);
            load();
        } catch (err: any) {
            message.error(err.message);
        }
    };

    const columns = [
        {
            title: 'Role Name',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: 'Permissions',
            key: 'permissions',
            render: (_: any, record: any) => (
                <div className="flex flex-wrap gap-1">
                    {record.permissions.slice(0, 5).map((p: any) => (
                        <Tag key={p.id} color="blue" className="text-[10px]">{p.code}</Tag>
                    ))}
                    {record.permissions.length > 5 && <Tag className="text-[10px]">+{record.permissions.length - 5} more</Tag>}
                </div>
            ),
        },
        {
            title: 'Action',
            key: 'action',
            width: 100,
            render: (_: any, record: any) => (
                <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
            ),
        },
    ];

    return (
        <Layout>
            <div className="max-w-6xl mx-auto">
                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <Breadcrumb
                            style={{ marginBottom: 16 }}
                            items={[
                                { title: <Link to="/"><HomeOutlined /></Link> },
                                { title: 'Administration' },
                                { title: 'Role Management' },
                            ]}
                        />
                        <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Role Management</Title>
                        <Text type="secondary">Define roles and fine-tune their access permissions.</Text>
                    </div>
                    <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleCreate} className="rounded-xl shadow-lg shadow-blue-100">
                        Create Role
                    </Button>
                </div>

                <Card className="premium-card overflow-hidden" bodyStyle={{ padding: 0 }}>
                    <Table
                        columns={columns}
                        dataSource={roles}
                        loading={loading}
                        rowKey="id"
                        pagination={{ pageSize: 15 }}
                        className="modern-table"
                    />
                </Card>

                <Modal
                    title={editingRole ? 'Edit Role' : 'Create New Role'}
                    open={modalVisible}
                    onCancel={() => setModalVisible(false)}
                    onOk={() => form.submit()}
                    width={800}
                    className="premium-modal"
                    okText={editingRole ? 'Update' : 'Create'}
                >
                    <Form form={form} layout="vertical" onFinish={onFinish}>
                        <Form.Item name="name" label="Role Name" rules={[{ required: true }]}>
                            <Input placeholder="e.g. Clinical Staff" size="large" />
                        </Form.Item>

                        <div className="mb-2 font-semibold">Permissions</div>
                        <Form.Item name="permission_ids" valuePropName="value">
                            <Checkbox.Group className="w-full">
                                <Collapse defaultActiveKey={Object.keys(groupedPermissions)[0]}>
                                    {Object.entries(groupedPermissions).map(([module, perms]: [string, any]) => (
                                        <Panel header={<Space><SafetyCertificateOutlined className="text-blue-500" /> {module}</Space>} key={module}>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                {perms.map((p: any) => (
                                                    <Checkbox key={p.id} value={p.id}>
                                                        <span className="text-xs">{p.name}</span>
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

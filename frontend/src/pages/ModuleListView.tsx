import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    Table,
    Button,
    Space,
    Typography,
    Card,
    Breadcrumb,
    Tooltip,
    Popconfirm,
    message,
    Input,
    Tag
} from 'antd';
import {
    PlusOutlined,
    EyeOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    HomeOutlined
} from '@ant-design/icons';
import Layout from '../components/Layout';
import { api } from '../api';

const { Title, Text } = Typography;

export default function ModuleListView() {
    const { module } = useParams<{ module: string }>();
    const navigate = useNavigate();
    const [records, setRecords] = useState<any[]>([]);
    const [definition, setDefinition] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const load = () => {
        if (!module) return;
        setLoading(true);
        Promise.all([api.fetchRecords(module), api.fetchModuleDefinition(module)])
            .then(([recs, def]) => {
                setRecords(recs);
                setDefinition(def);
            })
            .catch(err => message.error(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, [module]);

    const handleDelete = async (id: number) => {
        if (!module) return;
        try {
            await api.deleteRecord(module, id);
            setRecords(prev => prev.filter(r => r.id !== id));
            message.success('Record deleted successfully');
        } catch (err: any) {
            message.error(err.message);
        }
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
            render: (id: number) => <Text code>{id}</Text>,
            sorter: (a: any, b: any) => a.id - b.id,
        },
        ...(definition?.fields?.map((f: any) => ({
            title: f.name.replace(/_/g, ' '),
            dataIndex: f.name,
            key: f.name,
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
                <div style={{ padding: 8 }}>
                    <Input
                        placeholder={`Search ${f.name}`}
                        value={selectedKeys[0]}
                        onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                        onPressEnter={() => confirm()}
                        style={{ width: 188, marginBottom: 8, display: 'block' }}
                    />
                    <Space>
                        <Button
                            type="primary"
                            onClick={() => confirm()}
                            icon={<SearchOutlined />}
                            size="small"
                            style={{ width: 90 }}
                        >
                            Search
                        </Button>
                        <Button onClick={() => clearFilters()} size="small" style={{ width: 90 }}>
                            Reset
                        </Button>
                    </Space>
                </div>
            ),
            filterIcon: (filtered: boolean) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
            onFilter: (value: string, record: any) =>
                record[f.name]
                    ? record[f.name].toString().toLowerCase().includes(value.toLowerCase())
                    : '',
            render: (val: any) => {
                if (val === null || val === undefined) return <Text type="secondary">—</Text>;
                if (typeof val === 'boolean') return <Tag color={val ? 'emerald' : 'default'}>{val ? 'Yes' : 'No'}</Tag>;
                return String(val);
            },
            sorter: (a: any, b: any) => {
                if (typeof a[f.name] === 'number') return a[f.name] - b[f.name];
                return String(a[f.name]).localeCompare(String(b[f.name]));
            },
        })) ?? []),
        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right' as const,
            width: 150,
            render: (_: any, record: any) => (
                <Space size="middle">
                    <Tooltip title="View">
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => navigate(`/app/${module}/${record.id}`)}
                        />
                    </Tooltip>
                    <Tooltip title="Edit">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => navigate(`/app/${module}/${record.id}/edit`)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Delete this record?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Tooltip title="Delete">
                            <Button type="text" danger icon={<DeleteOutlined />} />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const displayName = definition?.name ?? module;

    return (
        <Layout>
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex justify-between items-end">
                    <div>
                        <Breadcrumb
                            style={{ marginBottom: 12 }}
                            items={[
                                { title: <Link to="/"><HomeOutlined /></Link> },
                                { title: 'Applications' },
                                { title: displayName },
                            ]}
                        />
                        <Title level={2} style={{ margin: 0, fontWeight: 800 }}>{displayName}</Title>
                        <Text type="secondary">{records.length} records found in this module</Text>
                    </div>
                    <Button
                        type="primary"
                        size="large"
                        icon={<PlusOutlined />}
                        onClick={() => navigate(`/app/${module}/new`)}
                        className="btn-primary-new"
                    >
                        New {displayName}
                    </Button>
                </div>

                <Card className="premium-card overflow-hidden" bodyStyle={{ padding: 0 }}>
                    <Table
                        columns={columns}
                        dataSource={records}
                        loading={loading}
                        rowKey="id"
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showTotal: (total) => `Total ${total} items`,
                        }}
                        scroll={{ x: 'max-content' }}
                        className="modern-table"
                    />
                </Card>
            </div>
        </Layout>
    );
}

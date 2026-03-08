import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Button,
    Space,
    Typography,
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
    SearchOutlined
} from '@ant-design/icons';
import { api } from '../api';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { useAuth } from '../context/AuthContext';

const { Text } = Typography;

export default function ModuleListView() {
    const { module } = useParams<{ module: string }>();
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
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
            title: f.label || f.name.replace(/_/g, ' '),
            dataIndex: f.name,
            key: f.name,
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
                <div style={{ padding: 8 }}>
                    <Input
                        placeholder={`Search ${f.label || f.name}`}
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
                    {hasPermission(`${module}:update`) && (
                        <Tooltip title="Edit">
                            <Button
                                type="text"
                                icon={<EditOutlined />}
                                onClick={() => navigate(`/app/${module}/${record.id}/edit`)}
                            />
                        </Tooltip>
                    )}
                    {hasPermission(`${module}:delete`) && (
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
                    )}
                </Space>
            ),
        },
    ];

    const displayName = definition?.name ?? module;

    return (
        <>
            <div className="max-w-7xl mx-auto">
                <PageHeader
                    title={displayName || ''}
                    subtitle={`${records.length} records found in this module`}
                    breadcrumbItems={[
                        { title: 'Applications' },
                        { title: displayName },
                    ]}
                    extra={
                        hasPermission(`${module}:create`) && (
                            <Button
                                type="primary"
                                size="large"
                                icon={<PlusOutlined />}
                                onClick={() => navigate(`/app/${module}/new`)}
                            >
                                New {displayName}
                            </Button>
                        )
                    }
                />

                <DataTable
                    columns={columns}
                    dataSource={records}
                    loading={loading}
                    rowKey="id"
                    scroll={{ x: 'max-content' }}
                />
            </div>
        </>
    );
}


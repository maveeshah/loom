import { useEffect, useState, lazy, Suspense } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    Typography,
    Card,
    Tabs,
    Button,
    Space,
    Tag,
    Descriptions,
    Timeline,
    Avatar,
    Input,
    message,
    Skeleton,
    Popconfirm,
    Empty,
    Breadcrumb
} from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
    ArrowLeftOutlined,
    LinkOutlined,
    UserOutlined,
    HomeOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { api } from '../api';
import type { ModuleDefinition } from '../api';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// Pre-scan all custom views for dynamic tab loading
const customViews = import.meta.glob(['./custom/*.tsx', './custom/**/*.tsx']);

function AssociationTab({ view, record, module }: { view: any, record: any, module: string }) {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!view.target) return;
        setLoading(true);
        api.fetchRecords(view.target.toLowerCase(), { [`${module.toLowerCase()}_id`]: record.id })
            .then(setRecords)
            .finally(() => setLoading(false));
    }, [view, record, module]);

    if (!view.target) return <Empty description="Invalid configuration: no target set." />;

    return (
        <div className="py-4">
            <div className="flex justify-between items-center mb-6">
                <Title level={4} style={{ margin: 0 }}>{view.name}</Title>
                <Link to={`/app/${view.target.toLowerCase()}/new?${module.toLowerCase()}_id=${record.id}`}>
                    <Button type="primary" icon={<LinkOutlined />}>
                        Add {view.target}
                    </Button>
                </Link>
            </div>
            {loading ? (
                <Skeleton active />
            ) : records.length > 0 ? (
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">ID</th>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Details</th>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {records.map(r => (
                                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4"><Text code>#{r.id}</Text></td>
                                    <td className="px-6 py-4">
                                        <Text strong>
                                            {Object.entries(r).find(([k, v]) => typeof v === 'string' && !k.endsWith('_id') && k !== 'id')?.[1] as string || 'Record Details'}
                                        </Text>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link to={`/app/${view.target.toLowerCase()}/${r.id}`}>
                                            <Button type="link">View</Button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={`No associated ${view.target.toLowerCase()} found.`}
                />
            )}
        </div>
    );
}

function CommentsTab({ record, module }: { record: any, module: string }) {
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [posting, setPosting] = useState(false);

    const loadComments = () => {
        setLoading(true);
        api.fetchRecords('comment', { model_name: module, record_id: record.id })
            .then(setComments)
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadComments(); }, [record, module]);

    const handlePost = async () => {
        if (!newComment.trim()) return;
        setPosting(true);
        try {
            await api.createRecord('comment', {
                model_name: module,
                record_id: record.id,
                content: newComment,
                author: "Demo User"
            });
            setNewComment("");
            loadComments();
            message.success('Comment posted');
        } catch (e: any) {
            message.error("Failed to post: " + e.message);
        } finally {
            setPosting(false);
        }
    };

    return (
        <div className="py-4">
            <Title level={4} className="mb-8">Discussion</Title>
            <div className="flex gap-4 mb-10">
                <Avatar size="large" icon={<UserOutlined />} style={{ backgroundColor: '#3b82f6', flexShrink: 0 }} />
                <div className="flex-1">
                    <TextArea
                        placeholder="Add a comment or internal note..."
                        autoSize={{ minRows: 3, maxRows: 6 }}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="mb-3 rounded-xl border-slate-200"
                    />
                    <div className="flex justify-end">
                        <Button
                            type="primary"
                            onClick={handlePost}
                            loading={posting}
                            disabled={!newComment.trim()}
                        >
                            Post Comment
                        </Button>
                    </div>
                </div>
            </div>

            {loading ? <Skeleton active avatar /> : (
                <div className="space-y-8">
                    {comments.map(c => (
                        <div key={c.id} className="flex gap-4">
                            <Avatar size="large" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}>
                                {c.author.charAt(0)}
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Text strong>{c.author}</Text>
                                    <Text type="secondary" className="text-[10px]">
                                        {new Date(c.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                    </Text>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl rounded-tl-none border border-slate-100">
                                    <Paragraph className="text-slate-600 m-0 whitespace-pre-wrap">{c.content}</Paragraph>
                                </div>
                            </div>
                        </div>
                    ))}
                    {comments.length === 0 && <Empty description="No comments yet." image={Empty.PRESENTED_IMAGE_SIMPLE} />}
                </div>
            )}
        </div>
    );
}

function HistoryTab({ record, module }: { record: any, module: string }) {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.fetchRecords('auditlog', { model_name: module, record_id: record.id })
            .then(data => setLogs(data.reverse()))
            .finally(() => setLoading(false));
    }, [record, module]);

    return (
        <div className="py-4">
            <Title level={4} className="mb-8">Audit Trail</Title>
            {loading ? <Skeleton active /> : (
                <Timeline
                    items={logs.map(log => ({
                        color: log.action === 'create' ? 'green' : log.action === 'delete' ? 'red' : 'blue',
                        children: (
                            <div className="pb-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <Text strong className="capitalize">{log.action}</Text>
                                        <Text type="secondary" className="text-xs">by {log.actor}</Text>
                                    </div>
                                    <Text type="secondary" className="text-[10px]">
                                        {new Date(log.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                    </Text>
                                </div>
                                {log.changes && (
                                    <div className="bg-slate-900 rounded-lg p-3 mt-2 overflow-x-auto shadow-inner">
                                        <pre className="text-[10px] text-emerald-400 m-0 leading-relaxed font-mono">
                                            {(() => {
                                                try {
                                                    return JSON.stringify(JSON.parse(log.changes), null, 2);
                                                } catch (e) {
                                                    return log.changes;
                                                }
                                            })()}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        )
                    }))}
                />
            )}
            {!loading && logs.length === 0 && <Empty description="No history found." image={Empty.PRESENTED_IMAGE_SIMPLE} />}
        </div>
    );
}

export default function RecordView() {
    const { module, id } = useParams<{ module: string; id: string }>();
    const navigate = useNavigate();
    const [record, setRecord] = useState<any>(null);
    const [definition, setDefinition] = useState<ModuleDefinition | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('');

    useEffect(() => {
        if (!module || !id) return;
        setLoading(true);
        Promise.all([api.fetchRecord(module, Number(id)), api.fetchModuleDefinition(module)])
            .then(([rec, def]) => {
                setRecord(rec);
                setDefinition(def);

                // Initialize active tab
                if (def.ui?.default_view) {
                    const view = def.views?.find((v: any) => v.type === def.ui?.default_view) || def.views?.[0];
                    if (view) setActiveTab(view.name);
                    else setActiveTab('Overview');
                } else {
                    setActiveTab('Overview');
                }
            })
            .catch(err => {
                message.error(err.message);
                navigate(`/app/${module}`);
            })
            .finally(() => setLoading(false));
    }, [module, id, navigate]);

    const handleDelete = async () => {
        if (!module || !id) return;
        setDeleting(true);
        try {
            await api.deleteRecord(module, Number(id));
            message.success('Record deleted successfully');
            navigate(`/app/${module}`);
        } catch (err: any) {
            message.error(err.message);
            setDeleting(false);
        }
    };

    if (loading) return <Layout><div className="p-8"><Skeleton active /></div></Layout>;
    if (!record || !definition) return <Layout><Empty className="py-20" description="Record not found" /></Layout>;

    const displayName = definition?.name ?? module;
    const fields: any[] = (definition as any)?.fields ?? [];
    const views = definition?.views ?? [];

    const tabItems = [
        {
            key: 'Overview',
            label: 'Overview',
            children: (
                <div className="py-4">
                    <Descriptions
                        bordered
                        column={{ xxl: 3, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
                        className="modern-descriptions"
                    >
                        {fields.map(field => (
                            <Descriptions.Item key={field.name} label={field.name.replace(/_/g, ' ')}>
                                {record[field.name] === null || record[field.name] === undefined ? (
                                    <Text type="secondary" italic>Not set</Text>
                                ) : field.type === 'Boolean' ? (
                                    <Tag color={record[field.name] ? 'blue' : 'default'}>{record[field.name] ? 'Yes' : 'No'}</Tag>
                                ) : (
                                    <Text strong>{String(record[field.name])}</Text>
                                )}
                            </Descriptions.Item>
                        ))}
                    </Descriptions>
                </div>
            )
        },
        ...views.map(view => ({
            key: view.name,
            label: view.name,
            children: (() => {
                if (view.type === 'association') return <AssociationTab view={view} record={record} module={module!} />;
                if (view.type === 'comments') return <CommentsTab record={record} module={module!} />;
                if (view.type === 'history') return <HistoryTab record={record} module={module!} />;
                if (view.type === 'summary') return <div className="py-4"><Title level={4}>Summary</Title><Paragraph>Quick view of {displayName} status.</Paragraph></div>;
                if (view.type === 'custom') {
                    const overrideKey = `frontend_${view.name.toLowerCase().replace(/ /g, '_')}`;
                    const overridePathRaw = (definition?.overrides as any)?.[overrideKey];
                    const overridePath = overridePathRaw ? overridePathRaw.replace('pages/', './') : undefined;

                    if (overridePath && customViews[overridePath]) {
                        const CustomTabComponent = lazy(customViews[overridePath] as any);
                        return (
                            <div className="py-4">
                                <Suspense fallback={<Skeleton active />}>
                                    <CustomTabComponent />
                                </Suspense>
                            </div>
                        );
                    }
                    return <Empty description="Custom component not found" />;
                }
                return null;
            })()
        }))
    ];

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="mb-8">
                    <Breadcrumb
                        style={{ marginBottom: 16 }}
                        items={[
                            { title: <Link to="/"><HomeOutlined /></Link> },
                            { title: <Link to={`/app/${module}`}>{displayName}</Link> },
                            { title: `#${record.id}` },
                        ]}
                    />

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <Space align="center" size={16}>
                            <motion.div whileHover={{ x: -4 }}>
                                <Link to={`/app/${module}`}>
                                    <Button shape="circle" icon={<ArrowLeftOutlined />} size="large" className="shadow-sm" />
                                </Link>
                            </motion.div>
                            <div>
                                <Title level={2} style={{ margin: 0, fontWeight: 800 }}>
                                    {displayName} <span className="text-slate-300 ml-2">#{record.id}</span>
                                </Title>
                                <Space split={<Text type="secondary">·</Text>} className="mt-1">
                                    <Tag color="processing" bordered={false} className="rounded-full px-3">{module}</Tag>
                                    <Text type="secondary" className="text-xs">Modified {new Date().toLocaleDateString()}</Text>
                                </Space>
                            </div>
                        </Space>

                        <Space>
                            <Link to={`/app/${module}/${record.id}/edit`}>
                                <Button size="large" icon={<EditOutlined />} className="rounded-xl font-semibold">
                                    Edit Record
                                </Button>
                            </Link>
                            <Popconfirm
                                title="Delete this record?"
                                description="This action cannot be undone."
                                onConfirm={handleDelete}
                                okText="Delete"
                                cancelText="Cancel"
                                okButtonProps={{ danger: true, loading: deleting }}
                            >
                                <Button size="large" danger icon={<DeleteOutlined />} className="rounded-xl shadow-sm shadow-rose-100" />
                            </Popconfirm>
                        </Space>
                    </div>
                </div>

                {/* Main Content */}
                <Card className="premium-card" bodyStyle={{ padding: '0 24px' }}>
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        items={tabItems}
                        className="modern-tabs"
                        size="large"
                        tabBarGutter={32}
                    />
                </Card>
            </div>
        </Layout>
    );
}

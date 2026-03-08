import { useEffect, useState, Suspense } from 'react';
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
    Popconfirm,
    Empty
} from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
    LinkOutlined,
    UserOutlined
} from '@ant-design/icons';
import { api } from '../api';
import type { ModuleDefinition } from '../api';
import { pluginRegistry } from '../framework/pluginRegistry';
import { PageHeader } from '../components/ui/PageHeader';
import { LoadingState, EmptyState } from '../components/ui/Feedback';
import { useAuth } from '../context/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

function AssociationTab({ view, record, module }: { view: any, record: any, module: string }) {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { hasPermission } = useAuth();

    useEffect(() => {
        if (!view.target) return;
        setLoading(true);
        api.fetchRecords(view.target.toLowerCase(), { [`${module.toLowerCase()}_id`]: record.id })
            .then(res => setRecords(Array.isArray(res) ? res : res.data || []))
            .finally(() => setLoading(false));
    }, [view, record, module]);

    if (!view.target) return <Empty description="Invalid configuration: no target set." />;

    return (
        <div className="py-4">
            <div className="flex justify-between items-center mb-6">
                <Title level={4} className="!m-0 font-bold">{view.name}</Title>
                {hasPermission(`${view.target.toLowerCase()}:create`) && (
                    <Link to={`/app/${view.target.toLowerCase()}/new?${module.toLowerCase()}_id=${record.id}`}>
                        <Button type="primary" icon={<LinkOutlined />}>
                            Add {view.target}
                        </Button>
                    </Link>
                )}
            </div>
            {loading ? (
                <LoadingState />
            ) : records.length > 0 ? (
                <div className="border border-slate-100 rounded-2xl overflow-hidden">
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
                                        <Text strong className="text-slate-800">
                                            {Object.entries(r).find(([k, v]) => typeof v === 'string' && !k.endsWith('_id') && k !== 'id')?.[1] as string || 'Record Details'}
                                        </Text>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link to={`/app/${view.target.toLowerCase()}/${r.id}`}>
                                            <Button type="link" className="font-semibold">View Details</Button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <EmptyState message={`No associated ${view.target.toLowerCase()} found.`} />
            )}
        </div>
    );
}

function CommentsTab({ record, module }: { record: any, module: string }) {
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [posting, setPosting] = useState(false);
    const { user } = useAuth();

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
                author: user?.full_name || "Unknown User"
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
            <Title level={4} className="mb-8 font-bold">Discussion</Title>
            <div className="flex gap-4 mb-12">
                <Avatar size={48} icon={<UserOutlined />} className="bg-blue-600 shadow-lg shadow-blue-500/20 shrink-0" />
                <div className="flex-1">
                    <TextArea
                        placeholder="Add a comment or internal note..."
                        autoSize={{ minRows: 3, maxRows: 6 }}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="mb-4 rounded-2xl border-slate-200 p-4"
                    />
                    <div className="flex justify-end">
                        <Button
                            type="primary"
                            onClick={handlePost}
                            loading={posting}
                            disabled={!newComment.trim()}
                            size="large"
                        >
                            Post Comment
                        </Button>
                    </div>
                </div>
            </div>

            {loading ? <LoadingState /> : (
                <div className="space-y-10">
                    {comments.map(c => (
                        <div key={c.id} className="flex gap-4">
                            <Avatar size={40} className="bg-slate-100 text-slate-400 font-bold shrink-0">
                                {c.author.charAt(0)}
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <Text strong className="text-slate-900">{c.author}</Text>
                                    <Text type="secondary" className="text-[10px] font-medium uppercase tracking-wider opacity-60">
                                        {new Date(c.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                    </Text>
                                </div>
                                <div className="bg-slate-50 p-5 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm shadow-slate-200/50">
                                    <Paragraph className="text-slate-600 m-0 whitespace-pre-wrap leading-relaxed">{c.content}</Paragraph>
                                </div>
                            </div>
                        </div>
                    ))}
                    {comments.length === 0 && <EmptyState message="No comments yet." />}
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
            .then((data: any[]) => setLogs(data.reverse()))
            .finally(() => setLoading(false));
    }, [record, module]);

    return (
        <div className="py-4">
            <Title level={4} className="mb-8 font-bold">Audit Trail</Title>
            {loading ? <LoadingState /> : (
                <Timeline
                    className="mt-8"
                    items={logs.map(log => ({
                        color: log.action === 'create' ? 'green' : log.action === 'delete' ? 'red' : 'blue',
                        children: (
                            <div className="pb-8 pl-2">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${log.action === 'create' ? 'bg-emerald-50 text-emerald-600' :
                                            log.action === 'delete' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                                            }`}>
                                            {log.action}
                                        </div>
                                        <Text type="secondary" className="text-xs font-semibold">by {log.actor}</Text>
                                    </div>
                                    <Text type="secondary" className="text-[10px] font-medium">
                                        {new Date(log.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                    </Text>
                                </div>
                                {log.changes && (
                                    <div className="bg-slate-900 rounded-xl p-4 mt-2 overflow-x-auto shadow-xl border border-white/10">
                                        <pre className="text-xs text-blue-400 m-0 leading-relaxed font-mono">
                                            {(() => {
                                                try {
                                                    const changes = JSON.parse(log.changes);
                                                    return JSON.stringify(changes, null, 2);
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
            {!loading && logs.length === 0 && <EmptyState message="No history found." />}
        </div>
    );
}

export default function RecordView() {
    const { module, id } = useParams<{ module: string; id: string }>();
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
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

    if (loading) return <div className="max-w-7xl mx-auto"><LoadingState /></div>;
    if (!record || !definition) return <div className="max-w-7xl mx-auto"><EmptyState message="Record not found" /></div>;

    const displayName = definition?.name ?? module;
    const fields: any[] = (definition as any)?.fields ?? [];
    const views = definition?.views ?? [];

    const tabItems = [
        {
            key: 'Overview',
            label: 'Overview',
            children: (
                <div className="py-6">
                    <Descriptions
                        bordered
                        column={{ xxl: 3, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
                        className="premium-descriptions"
                    >
                        {fields.map(field => (
                            <Descriptions.Item key={field.name} label={field.label || field.name.replace(/_/g, ' ')}>
                                {record[field.name] === null || record[field.name] === undefined ? (
                                    <Text type="secondary" italic className="opacity-50">Not set</Text>
                                ) : field.type === 'Boolean' ? (
                                    <Tag color={record[field.name] ? 'blue' : 'default'} bordered={false} className="rounded-full px-3">{record[field.name] ? 'Yes' : 'No'}</Tag>
                                ) : (
                                    <Text strong className="text-slate-800">{String(record[field.name])}</Text>
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
                if (view.type === 'summary') return <div className="py-4"><Title level={4} className="font-bold">Summary</Title><Paragraph className="text-slate-500">Quick view of {displayName} status.</Paragraph></div>;
                if (view.type === 'custom') {
                    const fallbackPath = `frontend_${view.name.toLowerCase().replace(/ /g, '_')}`;
                    const explicitId = view.id || fallbackPath;

                    const CustomTabComponent = pluginRegistry.getView(module!, 'tab', explicitId);

                    if (CustomTabComponent) {
                        return (
                            <div className="py-4">
                                <Suspense fallback={<LoadingState />}>
                                    <CustomTabComponent />
                                </Suspense>
                            </div>
                        );
                    }
                    return <EmptyState message="Custom plugin component not found in registry" />;
                }
                return null;
            })()
        }))
    ].filter(Boolean);


    return (
        <>
            <div className="max-w-7xl mx-auto">
                <PageHeader
                    title={`${displayName} #${record.id}`}
                    subtitle={`Comprehensive view of ${displayName.toLowerCase()} details and relations.`}
                    breadcrumbItems={[
                        { title: displayName, path: `/app/${module}` },
                        { title: `#${record.id}` },
                    ]}
                    extra={
                        <Space size={12}>
                            {hasPermission(`${module}:update`) && (
                                <Link to={`/app/${module}/${record.id}/edit`}>
                                    <Button size="large" icon={<EditOutlined />} className="font-semibold shadow-sm rounded-xl">
                                        Edit Record
                                    </Button>
                                </Link>
                            )}
                            {hasPermission(`${module}:delete`) && (
                                <Popconfirm
                                    title="Delete this record?"
                                    description="This action cannot be undone."
                                    onConfirm={handleDelete}
                                    okText="Delete"
                                    cancelText="Cancel"
                                    okButtonProps={{ danger: true, loading: deleting }}
                                >
                                    <Button size="large" danger icon={<DeleteOutlined />} className="shadow-sm rounded-xl" />
                                </Popconfirm>
                            )}
                        </Space>
                    }
                />

                <Card className="premium-card overflow-hidden" bodyStyle={{ padding: '0 24px' }}>
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
        </>
    );
}


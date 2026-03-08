import { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, List, Avatar, Tag, Space } from 'antd';
import {
    DashboardOutlined,
    TeamOutlined,
    SafetyCertificateOutlined,
    AppstoreOutlined,
    UserOutlined,
    CheckCircleOutlined,
    ArrowRightOutlined
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { LoadingState } from '../components/ui/Feedback';

const { } = Typography;

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        userCount: 0,
        roleCount: 0,
        permCount: 0,
        moduleCount: 0
    });
    const [recentUsers, setRecentUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        Promise.all([
            api.admin.fetchUsers(),
            api.admin.fetchRoles(),
            api.admin.fetchPermissions(),
            api.fetchModules()
        ]).then(([users, roles, perms, modules]) => {
            setStats({
                userCount: users.length,
                roleCount: roles.length,
                permCount: perms.length,
                moduleCount: Object.values(modules).flat().length
            });
            setRecentUsers(users.slice(-5).reverse());
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);

    if (loading) return <Layout><div className="max-w-7xl mx-auto"><LoadingState /></div></Layout>;

    return (
        <Layout>
            <div className="max-w-7xl mx-auto">
                <PageHeader
                    title="Admin Dashboard"
                    subtitle="System overview and administrative controls."
                    breadcrumbItems={[
                        { title: 'Administration' },
                        { title: 'Dashboard' },
                    ]}
                />

                <Row gutter={[24, 24]} className="mb-12">
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            title="Total Users"
                            value={stats.userCount}
                            icon={<TeamOutlined />}
                            onClick={() => navigate('/admin/users')}
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            title="Defined Roles"
                            value={stats.roleCount}
                            icon={<SafetyCertificateOutlined />}
                            onClick={() => navigate('/admin/roles')}
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            title="App Modules"
                            value={stats.moduleCount}
                            icon={<AppstoreOutlined />}
                            onClick={() => navigate('/')}
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            title="Permissions"
                            value={stats.permCount}
                            icon={<DashboardOutlined />}
                        />
                    </Col>
                </Row>

                <Row gutter={[32, 32]}>
                    <Col xs={24} lg={12}>
                        <Card
                            title={<span className="font-bold text-slate-800">Quick Management</span>}
                            className="premium-card h-full"
                            bodyStyle={{ padding: '24px' }}
                        >
                            <div className="space-y-4">
                                <Link to="/admin/users">
                                    <div className="p-5 rounded-2xl bg-blue-50/50 hover:bg-blue-50 transition-all cursor-pointer border border-blue-100/50 group flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm border border-blue-50">
                                                <TeamOutlined style={{ fontSize: '20px' }} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800">User Directory</div>
                                                <div className="text-xs text-slate-500">Manage access and account status</div>
                                            </div>
                                        </div>
                                        <ArrowRightOutlined className="text-blue-300 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                </Link>
                                <Link to="/admin/roles">
                                    <div className="p-5 rounded-2xl bg-purple-50/50 hover:bg-purple-50 transition-all cursor-pointer border border-purple-100/50 group flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-purple-600 shadow-sm border border-purple-50">
                                                <SafetyCertificateOutlined style={{ fontSize: '20px' }} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800">Role & RBAC</div>
                                                <div className="text-xs text-slate-500">Fine-tune module-level permissions</div>
                                            </div>
                                        </div>
                                        <ArrowRightOutlined className="text-purple-300 group-hover:text-purple-500 transition-colors" />
                                    </div>
                                </Link>
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                        <Card
                            title={<span className="font-bold text-slate-800">Recent Users</span>}
                            className="premium-card h-full"
                        >
                            <List
                                itemLayout="horizontal"
                                dataSource={recentUsers}
                                renderItem={user => (
                                    <List.Item className="px-0">
                                        <List.Item.Meta
                                            avatar={<Avatar icon={<UserOutlined />} className="bg-slate-100 text-slate-400" />}
                                            title={<span className="font-semibold text-slate-800">{user.full_name}</span>}
                                            description={<span className="text-xs">{user.email}</span>}
                                        />
                                        <Space>
                                            <Tag color="blue" bordered={false} className="rounded-full px-3 text-[10px] uppercase font-bold tracking-tight">
                                                {user.role?.name || 'No Role'}
                                            </Tag>
                                            {user.is_active && <CheckCircleOutlined className="text-emerald-500" />}
                                        </Space>
                                    </List.Item>
                                )}
                            />
                        </Card>
                    </Col>
                </Row>
            </div>
        </Layout>
    );
}

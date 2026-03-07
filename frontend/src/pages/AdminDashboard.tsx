import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Breadcrumb, List, Avatar, Tag } from 'antd';
import {
    DashboardOutlined,
    TeamOutlined,
    SafetyCertificateOutlined,
    AppstoreOutlined,
    HomeOutlined,
    UserOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api';

const { Title, Text } = Typography;

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        userCount: 0,
        roleCount: 0,
        permCount: 0,
        moduleCount: 0
    });
    const [recentUsers, setRecentUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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

    return (
        <Layout>
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <Breadcrumb
                        style={{ marginBottom: 16 }}
                        items={[
                            { title: <Link to="/"><HomeOutlined /></Link> },
                            { title: 'Administration' },
                            { title: 'Dashboard' },
                        ]}
                    />
                    <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Admin Dashboard</Title>
                    <Text type="secondary">System overview and administrative controls.</Text>
                </div>

                <Row gutter={[24, 24]} className="mb-8">
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="premium-card">
                            <Statistic
                                title="Total Users"
                                value={stats.userCount}
                                prefix={<TeamOutlined className="text-blue-500 mr-2" />}
                                loading={loading}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="premium-card">
                            <Statistic
                                title="Defined Roles"
                                value={stats.roleCount}
                                prefix={<SafetyCertificateOutlined className="text-purple-500 mr-2" />}
                                loading={loading}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="premium-card">
                            <Statistic
                                title="App Modules"
                                value={stats.moduleCount}
                                prefix={<AppstoreOutlined className="text-emerald-500 mr-2" />}
                                loading={loading}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="premium-card">
                            <Statistic
                                title="Permissions"
                                value={stats.permCount}
                                prefix={<DashboardOutlined className="text-orange-500 mr-2" />}
                                loading={loading}
                            />
                        </Card>
                    </Col>
                </Row>

                <Row gutter={[24, 24]}>
                    <Col xs={24} lg={12}>
                        <Card title="Quick Actions" className="premium-card h-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Link to="/admin/users">
                                    <div className="p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer border border-blue-100 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm">
                                            <TeamOutlined />
                                        </div>
                                        <div>
                                            <div className="font-bold text-blue-900 text-sm">Manage Users</div>
                                            <div className="text-[10px] text-blue-600 font-medium">ASSIGN ROLES & ACCESS</div>
                                        </div>
                                    </div>
                                </Link>
                                <Link to="/admin/roles">
                                    <div className="p-4 rounded-2xl bg-purple-50 hover:bg-purple-100 transition-colors cursor-pointer border border-purple-100 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-purple-600 shadow-sm">
                                            <SafetyCertificateOutlined />
                                        </div>
                                        <div>
                                            <div className="font-bold text-purple-900 text-sm">Manage Roles</div>
                                            <div className="text-[10px] text-purple-600 font-medium">FINE-TUNE RBAC</div>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                        <Card title="Recently Joined Users" className="premium-card h-full">
                            <List
                                loading={loading}
                                itemLayout="horizontal"
                                dataSource={recentUsers}
                                renderItem={user => (
                                    <List.Item>
                                        <List.Item.Meta
                                            avatar={<Avatar icon={<UserOutlined />} className="bg-slate-100 text-slate-400" />}
                                            title={user.full_name}
                                            description={user.email}
                                        />
                                        <Tag color="blue">{user.role?.name || 'No Role'}</Tag>
                                        {user.is_active && <CheckCircleOutlined className="text-emerald-500 ml-2" />}
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

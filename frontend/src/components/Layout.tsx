import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout as AntLayout, Menu, Button, Avatar, Space, Typography, Tooltip } from 'antd';
import {
    DashboardOutlined,
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    ArrowLeftOutlined,
    LogoutOutlined,
    BlockOutlined,
    SettingOutlined,
    TeamOutlined,
    SafetyCertificateOutlined
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';
import type { ModuleDefinition } from '../api';
import { useAuth } from '../context/AuthContext';

const { Header, Sider, Content } = AntLayout;
const { Text, Title } = Typography;

interface ModuleGroup {
    [group: string]: ModuleDefinition[];
}

interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const [modules, setModules] = useState<ModuleGroup>({});
    const [collapsed, setCollapsed] = useState(false);
    const { user, logout, hasPermission } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        api.fetchModules().then(setModules).catch(err => {
            console.error("Failed to fetch modules:", err);
        });
    }, []);


    const menuItems = [
        {
            key: 'dashboard',
            icon: <DashboardOutlined />,
            label: <Link to="/">Dashboard</Link>,
        },
        ...Object.entries(modules).map(([group, items]) => {
            const visibleItems = items.filter(item => {
                if (item.ui?.show_in_sidebar === false) return false;
                return hasPermission(`${item.slug}:read`);
            });

            if (visibleItems.length === 0) return null;

            return {
                key: group,
                label: group,
                icon: <BlockOutlined />,
                children: visibleItems.map(item => ({
                    key: item.slug,
                    label: <Link to={`/app/${item.slug}`}>{item.name}</Link>,
                })),
            };
        }).filter(Boolean),
        ...(hasPermission('admin:user:read') || hasPermission('admin:role:read') || hasPermission('*:*') ? [{
            key: 'admin',
            label: 'Administration',
            icon: <SettingOutlined />,
            children: [
                { key: 'admin-dashboard', label: <Link to="/admin/dashboard">Admin Dashboard</Link>, icon: <DashboardOutlined /> },
                { key: 'users', label: <Link to="/admin/users">User Management</Link>, icon: <TeamOutlined /> },
                { key: 'roles', label: <Link to="/admin/roles">Role Management</Link>, icon: <SafetyCertificateOutlined /> }
            ]
        }] : [])
    ];

    const getSelectedKeys = () => {
        if (location.pathname === '/') return ['dashboard'];
        const parts = location.pathname.split('/');
        if (parts[2]) return [parts[2]];
        return [];
    };

    return (
        <AntLayout style={{ minHeight: '100vh' }}>
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                width={280}
                className="glass-effect"
                style={{
                    zIndex: 10,
                    position: 'sticky',
                    top: 0,
                    height: '100vh',
                }}
            >
                <div className="flex flex-col h-full bg-white/50 backdrop-blur-xl">
                    <div className="p-8 pb-6 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
                            <span className="text-white font-black text-xl tracking-tighter">V</span>
                        </div>
                        {!collapsed && (
                            <Title level={4} className="!m-0 text-xl font-black tracking-tight text-slate-800">
                                Viemed
                            </Title>
                        )}
                    </div>

                    <Menu
                        mode="inline"
                        defaultOpenKeys={Object.keys(modules)}
                        selectedKeys={getSelectedKeys()}
                        items={menuItems as any}
                        style={{ flex: 1, borderRight: 0, padding: '0 16px' }}
                    />

                    <div className="p-6 border-t border-slate-100">
                        <div className="flex flex-col gap-4">
                            {!collapsed && (
                                <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                                    <Avatar size="large" className="bg-blue-600 shadow-sm">{user?.full_name?.charAt(0)}</Avatar>
                                    <div className="flex-1 min-w-0">
                                        <Text strong className="block text-sm truncate text-slate-900">{user?.full_name}</Text>
                                        <Text type="secondary" className="block text-xs truncate font-medium uppercase tracking-wider opacity-60">{user?.role?.name}</Text>
                                    </div>
                                </div>
                            )}
                            <Button
                                type="text"
                                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                                onClick={() => setCollapsed(!collapsed)}
                                block
                                className="h-12 rounded-xl hover:bg-slate-50 text-slate-500 font-semibold"
                            >
                                {!collapsed && "Collapse Sidebar"}
                            </Button>
                        </div>
                    </div>
                </div>
            </Sider>

            <AntLayout className="bg-[#f8fafc]">
                <Header className="px-8 bg-white/70 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between h-20">
                    <Space size={20}>
                        {location.pathname !== '/' && (
                            <Button
                                icon={<ArrowLeftOutlined />}
                                onClick={() => navigate(-1)}
                                type="text"
                                className="w-10 h-10 rounded-xl hover:bg-slate-100"
                            />
                        )}
                        <Title level={5} className="!m-0 text-slate-400 font-medium">
                            {location.pathname === '/' ? 'Dashboard' : ''}
                        </Title>
                    </Space>

                    <Space size={20}>
                        <Tooltip title="Logout">
                            <Button
                                type="text"
                                shape="circle"
                                icon={<LogoutOutlined />}
                                onClick={() => logout()}
                                danger
                                className="w-10 h-10 hover:bg-rose-50"
                            />
                        </Tooltip>
                        <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
                            <Text strong className="hidden sm:block text-slate-700">{user?.full_name}</Text>
                            <Avatar
                                size="large"
                                className="bg-blue-50 text-blue-600 font-bold border-2 border-white shadow-sm"
                            >
                                {user?.full_name?.charAt(0)}
                            </Avatar>
                        </div>
                    </Space>
                </Header>

                <Content className="p-8 md:p-12 min-h-[280px] max-w-[1600px] mx-auto w-full">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.3, ease: 'circOut' }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </Content>
            </AntLayout>
        </AntLayout>
    );
}


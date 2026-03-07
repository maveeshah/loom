import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout as AntLayout, Menu, Button, Avatar, Space, Typography, Tooltip } from 'antd';
import {
    DashboardOutlined,
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    ArrowLeftOutlined,
    LogoutOutlined,
    BlockOutlined
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
                width={260}
                style={{
                    boxShadow: '4px 0 24px rgba(0,0,0,0.02)',
                    zIndex: 10,
                    background: '#fff'
                }}
            >
                <div className="flex flex-col h-full">
                    <div className="p-6 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
                            <span className="text-white font-bold text-lg">V</span>
                        </div>
                        {!collapsed && (
                            <Title level={4} style={{ margin: 0, fontSize: '1.1rem', letterSpacing: '-0.02em', fontWeight: 800 }}>
                                Loom
                            </Title>
                        )}
                    </div>

                    <Menu
                        mode="inline"
                        defaultOpenKeys={Object.keys(modules)}
                        selectedKeys={getSelectedKeys()}
                        items={menuItems as any}
                        style={{ flex: 1, borderRight: 0, padding: '0 12px' }}
                    />

                    <div className="p-4 border-t border-slate-100">
                        <div className="flex flex-col gap-3">
                            {!collapsed && (
                                <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                                    <Avatar size="small" style={{ backgroundColor: '#3b82f6' }}>{user?.full_name?.charAt(0)}</Avatar>
                                    <div className="flex-1 min-w-0">
                                        <Text strong className="block text-xs truncate">{user?.full_name}</Text>
                                        <Text type="secondary" className="block text-[10px] truncate">{user?.role?.name}</Text>
                                    </div>
                                </div>
                            )}
                            <Button
                                type="text"
                                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                                onClick={() => setCollapsed(!collapsed)}
                                block
                                style={{ height: 40, borderRadius: 10 }}
                            >
                                {!collapsed && "Collapse"}
                            </Button>
                        </div>
                    </div>
                </div>
            </Sider>

            <AntLayout>
                <Header style={{
                    padding: '0 24px',
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(8px)',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: 64,
                    position: 'sticky',
                    top: 0,
                    zIndex: 9,
                }}>
                    <Space size={16}>
                        {location.pathname !== '/' && (
                            <Button
                                icon={<ArrowLeftOutlined />}
                                onClick={() => navigate(-1)}
                                type="text"
                                style={{ borderRadius: 8 }}
                            />
                        )}
                        <Text strong style={{ fontSize: 16 }}>
                            {location.pathname === '/' ? 'Dashboard' : ''}
                        </Text>
                    </Space>

                    <Space size={16}>
                        <Tooltip title="Logout">
                            <Button
                                type="text"
                                shape="circle"
                                icon={<LogoutOutlined />}
                                onClick={() => logout()}
                                danger
                            />
                        </Tooltip>
                        <Avatar
                            style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontWeight: 600 }}
                        >
                            {user?.full_name?.charAt(0)}
                        </Avatar>
                    </Space>
                </Header>

                <Content style={{ padding: '32px', minHeight: 280, maxWidth: 1600, margin: '0 auto', width: '100%' }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </Content>
            </AntLayout>
        </AntLayout>
    );
}

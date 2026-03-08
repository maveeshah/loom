import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Button, Avatar, Space, Typography, Dropdown, Tag } from 'antd';
import {
    DashboardOutlined,
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    ArrowLeftOutlined,
    LogoutOutlined,
    BlockOutlined,
    SettingOutlined,
    TeamOutlined,
    SafetyCertificateOutlined,
    UserOutlined,
    SearchOutlined
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';
import type { ModuleDefinition } from '../api';
import { useAuth } from '../context/AuthContext';
import { QuickSearch } from './ui/QuickSearch';

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
    const [quickSearchVisible, setQuickSearchVisible] = useState(false);
    const { user, logout, hasPermission } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setQuickSearchVisible(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

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

    const getPageInfo = () => {
        const path = location.pathname;
        if (path === '/') return { title: 'Dashboard', parent: null };

        const parts = path.split('/');

        if (parts[1] === 'admin') {
            const adminTitles: Record<string, string> = {
                'dashboard': 'Admin Dashboard',
                'users': 'User Management',
                'roles': 'Role Management'
            };
            return { title: adminTitles[parts[2]] || 'Administration', parent: 'Administration' };
        }

        if (parts[1] === 'app' && parts[2]) {
            const slug = parts[2];
            let moduleName = slug;

            Object.values(modules).flat().forEach(m => {
                if (m.slug === slug) moduleName = m.name;
            });

            if (parts[3] === 'new') return { title: `New ${moduleName}`, parent: moduleName };
            if (parts[4] === 'edit') return { title: `Edit ${moduleName}`, parent: moduleName };
            if (parts[3]) return { title: `View ${moduleName}`, parent: moduleName };

            return { title: moduleName, parent: 'Modules' };
        }

        return { title: '', parent: null };
    };

    const { title: pageTitle, parent: pageParent } = getPageInfo();

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
                        <motion.div
                            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0 animate-float"
                        >
                            <span className="text-white font-black text-xl tracking-tighter">V</span>
                        </motion.div>
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
                <Header className="px-8 premium-glass sticky top-0 z-20 flex items-center justify-between h-20">
                    <Space size={20}>
                        {location.pathname !== '/' && (
                            <Button
                                icon={<ArrowLeftOutlined />}
                                onClick={() => navigate(-1)}
                                type="text"
                                className="w-10 h-10 rounded-xl hover:bg-slate-100"
                            />
                        )}
                        <div className="flex flex-col leading-tight">
                            {pageParent && (
                                <Text className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                                    {pageParent}
                                </Text>
                            )}
                            <Title level={5} className="!m-0 text-slate-800 font-bold tracking-tight">
                                {pageTitle}
                            </Title>
                        </div>
                    </Space>

                    <div className="flex items-center gap-4">
                        <Button
                            icon={<SearchOutlined />}
                            className="bg-slate-100/50 border-none hover:bg-slate-100 flex items-center gap-2 pr-4 text-slate-400 font-medium rounded-xl h-10"
                            onClick={() => setQuickSearchVisible(true)}
                        >
                            <span className="hidden md:inline">Quick Search...</span>
                            <Tag bordered={false} className="m-0 text-[10px] font-bold bg-white/50 text-slate-400">⌘K</Tag>
                        </Button>
                    </div>

                    <Space size={20}>
                        <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
                            <Dropdown
                                menu={{
                                    items: [
                                        {
                                            key: 'profile',
                                            label: 'Profile Settings',
                                            icon: <UserOutlined />,
                                            disabled: true,
                                        },
                                        {
                                            key: 'settings',
                                            label: 'System Settings',
                                            icon: <SettingOutlined />,
                                            disabled: !hasPermission('*:*'),
                                        },
                                        {
                                            type: 'divider',
                                        },
                                        {
                                            key: 'logout',
                                            label: 'Logout',
                                            icon: <LogoutOutlined />,
                                            danger: true,
                                            onClick: () => logout(),
                                        },
                                    ]
                                }}
                                placement="bottomRight"
                                trigger={['click']}
                            >
                                <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 pr-3 rounded-xl transition-colors group">
                                    <Avatar
                                        size="large"
                                        className="bg-blue-50 text-blue-600 font-bold border-2 border-white shadow-sm"
                                    >
                                        {user?.full_name?.charAt(0)}
                                    </Avatar>
                                    <div className="hidden sm:flex flex-col items-start leading-none">
                                        <Text strong className="text-slate-700 text-sm group-hover:text-blue-600 transition-colors">{user?.full_name}</Text>
                                        <Text className="text-[10px] uppercase font-bold tracking-tight text-slate-400 group-hover:text-slate-500 transition-colors">{user?.role?.name}</Text>
                                    </div>
                                </div>
                            </Dropdown>
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
            <QuickSearch
                visible={quickSearchVisible}
                onClose={() => setQuickSearchVisible(false)}
                modules={modules}
            />
        </AntLayout>
    );
}

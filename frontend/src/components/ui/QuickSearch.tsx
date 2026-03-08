import React, { useState, useMemo } from 'react';
import type { ModuleDefinition } from '../../api';
import { Modal, Input, List, Typography, Tag } from 'antd';
import { SearchOutlined, AppstoreOutlined, SettingOutlined, RightOutlined, ThunderboltFilled, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const { Text } = Typography;

interface SearchItem {
    id: string;
    name: string;
    path: string;
    group: 'Main' | 'Administration' | 'Modules' | 'User';
    icon: React.ReactNode;
}

interface QuickSearchProps {
    visible: boolean;
    onClose: () => void;
    modules: Record<string, ModuleDefinition[]>;
}

export function QuickSearch({ visible, onClose, modules }: QuickSearchProps) {
    const { hasPermission } = useAuth();
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    const searchItems = useMemo(() => {
        const items: SearchItem[] = [
            { id: 'dashboard', name: 'Dashboard', path: '/', group: 'Main', icon: <AppstoreOutlined /> },
            { id: 'profile', name: 'Profile Settings', path: '/profile', group: 'User', icon: <UserOutlined /> },
        ];

        // Admin checks
        if (hasPermission('admin:user:read') || hasPermission('admin:role:read') || hasPermission('*:*')) {
            items.push({ id: 'admin-dashboard', name: 'Admin Dashboard', path: '/admin/dashboard', group: 'Administration', icon: <SettingOutlined /> });
        }
        if (hasPermission('admin:user:read') || hasPermission('*:*')) {
            items.push({ id: 'users', name: 'User Management', path: '/admin/users', group: 'Administration', icon: <SettingOutlined /> });
        }
        if (hasPermission('admin:role:read') || hasPermission('*:*')) {
            items.push({ id: 'roles', name: 'Role Management', path: '/admin/roles', group: 'Administration', icon: <SettingOutlined /> });
        }
        if (hasPermission('*:*')) {
            items.push({ id: 'system-settings', name: 'System Settings', path: '/admin/settings', group: 'Administration', icon: <SettingOutlined /> });
        }

        if (modules && typeof modules === 'object') {
            Object.entries(modules).forEach(([_, groupModules]) => {
                groupModules.forEach(m => {
                    if (hasPermission(`${m.slug}:read`)) {
                        items.push({
                            id: m.slug,
                            name: m.name,
                            path: `/app/${m.slug}`,
                            group: 'Modules',
                            icon: <ThunderboltFilled className="text-amber-500" />
                        });
                    }
                });
            });
        }

        return items;
    }, [modules, hasPermission]);

    const filteredItems = useMemo(() => {
        if (!search) return searchItems.slice(0, 8);
        const lowerSearch = search.toLowerCase();
        return searchItems.filter(item =>
            item.name.toLowerCase().includes(lowerSearch) ||
            item.group.toLowerCase().includes(lowerSearch)
        ).slice(0, 10);
    }, [search, searchItems]);

    const handleSelect = (path: string) => {
        navigate(path);
        onClose();
        setSearch('');
    };

    return (
        <Modal
            open={visible}
            onCancel={onClose}
            footer={null}
            closable={false}
            width={650}
            className="quick-search-modal"
            bodyStyle={{ padding: 0 }}
            centered
        >
            <div className="p-4 border-b border-slate-100">
                <Input
                    prefix={<SearchOutlined className="text-xl text-slate-400 mr-2" />}
                    placeholder="Search for modules, settings, or pages..."
                    variant="borderless"
                    autoFocus
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="text-lg h-12"
                    onKeyDown={e => {
                        if (e.key === 'Enter' && filteredItems.length > 0) {
                            handleSelect(filteredItems[0].path);
                        }
                    }}
                />
            </div>

            <div className="max-h-[450px] overflow-y-auto p-2">
                <List
                    dataSource={filteredItems}
                    renderItem={item => (
                        <List.Item
                            className="px-4 py-3 cursor-pointer hover:bg-slate-50 rounded-xl transition-all group border-none"
                            onClick={() => handleSelect(item.path)}
                        >
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                        {item.icon}
                                    </div>
                                    <div className="flex flex-col">
                                        <Text strong className="text-[14px] group-hover:text-blue-600 transition-colors">
                                            {item.name}
                                        </Text>
                                        <Text className="text-[10px] uppercase font-bold tracking-tight text-slate-400">
                                            {item.group}
                                        </Text>
                                    </div>
                                </div>
                                <RightOutlined className="text-slate-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                            </div>
                        </List.Item>
                    )}
                />
            </div>

            <div className="p-3 bg-slate-50 rounded-b-lg border-t border-slate-100 flex items-center justify-between px-6">
                <div className="flex gap-4">
                    <Text className="text-[11px] text-slate-400">
                        <Tag className="mr-1 py-0 px-1.5 text-[10px] bg-white border-slate-200">ENTER</Tag> to select
                    </Text>
                    <Text className="text-[11px] text-slate-400">
                        <Tag className="mr-1 py-0 px-1.5 text-[10px] bg-white border-slate-200">ESC</Tag> to close
                    </Text>
                </div>
                <Text className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">
                    Quick Search
                </Text>
            </div>
        </Modal>
    );
}

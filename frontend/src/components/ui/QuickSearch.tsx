import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Input, List, Typography, Tag } from 'antd';
import { SearchOutlined, AppstoreOutlined, SettingOutlined, RightOutlined, ThunderboltFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

interface QuickSearchProps {
    visible: boolean;
    onClose: () => void;
    modules: Record<string, any[]>;
}

interface SearchItem {
    id: string;
    name: string;
    group: string;
    path: string;
    icon: React.ReactNode;
}

export const QuickSearch: React.FC<QuickSearchProps> = ({ visible, onClose, modules }) => {
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    const searchItems = useMemo(() => {
        const items: SearchItem[] = [
            { id: 'dashboard', name: 'Dashboard', group: 'Navigation', path: '/', icon: <AppstoreOutlined /> },
            { id: 'admin-dashboard', name: 'Admin Dashboard', group: 'Admin', path: '/admin/dashboard', icon: <SettingOutlined /> },
            { id: 'users', name: 'User Management', group: 'Admin', path: '/admin/users', icon: <SettingOutlined /> },
            { id: 'roles', name: 'Role Management', group: 'Admin', path: '/admin/roles', icon: <SettingOutlined /> },
        ];

        Object.entries(modules).forEach(([group, groupModules]) => {
            groupModules.forEach(m => {
                items.push({
                    id: m.slug,
                    name: m.name,
                    group: group,
                    path: `/app/${m.slug}`,
                    icon: <ThunderboltFilled className="text-blue-500" />
                });
            });
        });

        return items;
    }, [modules]);

    const filteredItems = useMemo(() => {
        if (!search) return searchItems.slice(0, 8);
        return searchItems.filter(item =>
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.group.toLowerCase().includes(search.toLowerCase())
        );
    }, [search, searchItems]);

    const handleSelect = (path: string) => {
        navigate(path);
        onClose();
        setSearch('');
    };

    return (
        <Modal
            visible={visible}
            onCancel={onClose}
            footer={null}
            closable={false}
            width={600}
            className="quick-search-modal"
            bodyStyle={{ padding: 0 }}
            maskStyle={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.4)' }}
            destroyOnClose
        >
            <div className="p-6 border-b border-slate-100 flex items-center gap-4">
                <SearchOutlined className="text-blue-500 text-xl" />
                <Input
                    placeholder="Search for modules, tools, or settings..."
                    variant="borderless"
                    className="text-lg font-medium p-0 focus:ring-0"
                    autoFocus
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onPressEnter={() => filteredItems[0] && handleSelect(filteredItems[0].path)}
                />
                <div className="flex items-center gap-1">
                    <Tag bordered={false} className="m-0 text-[10px] font-bold uppercase tracking-tighter opacity-50 bg-slate-100">ESC to close</Tag>
                </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto p-2">
                <List
                    dataSource={filteredItems}
                    renderItem={item => (
                        <div
                            onClick={() => handleSelect(item.path)}
                            className="flex items-center justify-between p-4 rounded-xl hover:bg-blue-50/50 cursor-pointer group transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:shadow-md transition-all">
                                    {item.icon}
                                </div>
                                <div className="flex flex-col">
                                    <Text strong className="text-slate-800 group-hover:text-blue-600">{item.name}</Text>
                                    <Text type="secondary" className="text-[10px] uppercase font-bold tracking-widest opacity-60">
                                        {item.group}
                                    </Text>
                                </div>
                            </div>
                            <RightOutlined className="text-slate-200 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0" />
                        </div>
                    )}
                />
                {filteredItems.length === 0 && (
                    <div className="p-12 text-center">
                        <Text type="secondary" className="block mb-2">No results found for "{search}"</Text>
                        <Text type="secondary" className="text-xs">Try searching for "Dashboard" or "Clinical"</Text>
                    </div>
                )}
            </div>

            <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center rounded-b-3xl">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 opacity-50">
                        <Tag bordered={false} className="m-0 text-[10px] font-black h-5 flex items-center bg-white shadow-sm">↵</Tag>
                        <Text className="text-[10px] font-bold uppercase tracking-tight">Select</Text>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 opacity-50">
                    <Text className="text-[10px] font-bold uppercase tracking-tight">Viemed Command Palette</Text>
                </div>
            </div>
        </Modal>
    );
};

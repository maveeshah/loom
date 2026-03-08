import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Typography } from 'antd';
import {
    AppstoreOutlined,
    DatabaseOutlined,
    DeploymentUnitOutlined,
    GlobalOutlined,
    RightOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { api } from '../api';
import type { ModuleDefinition } from '../api';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/ui/StatCard';
import { PageHeader } from '../components/ui/PageHeader';
import { LoadingState, EmptyState } from '../components/ui/Feedback';

const { Title, Text } = Typography;

export default function Dashboard() {
    const [modules, setModules] = useState<Record<string, ModuleDefinition[]>>({});
    const [loading, setLoading] = useState(true);
    const { hasPermission } = useAuth();

    useEffect(() => {
        api.fetchModules().then(data => {
            setModules(data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemAnim = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    const groupIcons: Record<string, React.ReactNode> = {
        Clinical: <AppstoreOutlined />,
        Admin: <DeploymentUnitOutlined />,
    };

    const allModuleGroups = Object.entries(modules);
    const visibleModuleCount = allModuleGroups.reduce((acc, [_, items]) => {
        return acc + items.filter(item => {
            if (item.ui?.show_in_sidebar === false) return false;
            return hasPermission(`${item.slug}:read`);
        }).length;
    }, 0);

    return (
        <div className="max-w-7xl mx-auto">
            <PageHeader
                title="Module Dashboard"
                subtitle="A unified toolkit for managing your platform's data domains and modules."
            />

            <Row gutter={[24, 24]} className="mb-12">
                <Col xs={24} sm={12} md={8}>
                    <StatCard
                        title="Accessible Modules"
                        value={visibleModuleCount}
                        icon={<AppstoreOutlined />}
                        trend={{ value: '12%', isUp: true }}
                    />
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <StatCard
                        title="Environment"
                        value="Production"
                        icon={<GlobalOutlined />}
                        description="Viemed Live Infrastructure"
                    />
                </Col>
            </Row>

            {loading ? (
                <LoadingState />
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                >
                    {allModuleGroups.map(([group, items]) => {
                        const visibleItems = items.filter(item => {
                            if (item.ui?.show_in_sidebar === false) return false;
                            return hasPermission(`${item.slug}:read`);
                        });
                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={group} className="mb-12">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-slate-900 shadow-lg shadow-slate-200 flex items-center justify-center text-white text-xl">
                                        {groupIcons[group] || <DatabaseOutlined />}
                                    </div>
                                    <div>
                                        <Title level={4} className="!m-0 font-bold">{group}</Title>
                                        <Text type="secondary" className="text-xs uppercase tracking-widest font-bold opacity-50">
                                            {visibleItems.length} Available
                                        </Text>
                                    </div>
                                </div>

                                <Row gutter={[24, 24]}>
                                    {visibleItems.map(item => (
                                        <Col xs={24} sm={12} lg={8} xl={6} key={item.slug}>
                                            <motion.div variants={itemAnim} whileHover={{ y: -5 }} transition={{ type: 'spring', stiffness: 300 }}>
                                                <Link to={`/app/${item.slug}`}>
                                                    <div className="premium-card p-6 h-full flex flex-col cursor-pointer">
                                                        <div className="flex justify-between items-start mb-6">
                                                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 text-2xl font-black">
                                                                {item.name.charAt(0)}
                                                            </div>
                                                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 text-slate-300">
                                                                <RightOutlined style={{ fontSize: 12 }} />
                                                            </div>
                                                        </div>
                                                        <Title level={5} className="!m-0 mb-2 font-bold">
                                                            {item.name}
                                                        </Title>
                                                        <Text type="secondary" className="text-sm line-clamp-2 leading-relaxed">
                                                            Comprehensive management of {item.name.toLowerCase()} assets and records.
                                                        </Text>
                                                    </div>
                                                </Link>
                                            </motion.div>
                                        </Col>
                                    ))}
                                </Row>
                            </div>
                        );
                    })}

                    {visibleModuleCount === 0 && (
                        <EmptyState message="No modules are currently accessible with your permissions." />
                    )}
                </motion.div>
            )}
        </div>
    );
}


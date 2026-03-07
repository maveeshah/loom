import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Typography, Row, Col, Card, Skeleton, Statistic, Empty } from 'antd';
import {
    RightOutlined,
    AppstoreOutlined,
    DatabaseOutlined,
    DeploymentUnitOutlined,
    GlobalOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { api } from '../api';
import type { ModuleDefinition } from '../api';
import { useAuth } from '../context/AuthContext';

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
        <Layout>
            <div className="max-w-7xl mx-auto">
                <div className="mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Title level={2} style={{ fontWeight: 800, marginBottom: 8 }}>
                            Module Dashboard
                        </Title>
                        <Text type="secondary" style={{ fontSize: 16 }}>
                            A unified toolkit for managing your platform's data domains and modules.
                        </Text>
                    </motion.div>

                    <Row gutter={[24, 24]} className="mt-8">
                        <Col xs={24} sm={12} md={8}>
                            <Card className="glass-card" bordered={false}>
                                <Statistic
                                    title="Accessible Modules"
                                    value={visibleModuleCount}
                                    prefix={<AppstoreOutlined className="text-blue-500 mr-2" />}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Card className="glass-card" bordered={false}>
                                <Statistic
                                    title="Environment"
                                    value="Production"
                                    prefix={<GlobalOutlined className="text-emerald-500 mr-2" />}
                                />
                            </Card>
                        </Col>
                    </Row>
                </div>

                {loading ? (
                    <Row gutter={[24, 24]}>
                        {[1, 2, 3].map(i => (
                            <Col xs={24} key={i}>
                                <Skeleton active round />
                            </Col>
                        ))}
                    </Row>
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
                                            <Title level={4} style={{ margin: 0, fontWeight: 700 }}>{group}</Title>
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
                                                        <Card
                                                            hoverable
                                                            className="premium-card h-full"
                                                            bodyStyle={{ padding: '28px' }}
                                                        >
                                                            <div className="flex justify-between items-start mb-6">
                                                                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 text-2xl font-black">
                                                                    {item.name.charAt(0)}
                                                                </div>
                                                                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                                    <RightOutlined style={{ fontSize: 12 }} />
                                                                </div>
                                                            </div>
                                                            <Title level={5} style={{ margin: '0 0 8px 0', fontWeight: 700 }}>
                                                                {item.name}
                                                            </Title>
                                                            <Text type="secondary" className="text-sm line-clamp-2 leading-relaxed">
                                                                Comprehensive management of {item.name.toLowerCase()} assets and records.
                                                            </Text>
                                                        </Card>
                                                    </Link>
                                                </motion.div>
                                            </Col>
                                        ))}
                                    </Row>
                                </div>
                            );
                        })}

                        {visibleModuleCount === 0 && (
                            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                                <Empty
                                    description="No modules are currently accessible with your permissions."
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                />
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </Layout>
    );
}

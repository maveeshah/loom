import React from 'react';
import { Card, Typography } from 'antd';
import { motion } from 'framer-motion';

const { Text } = Typography;

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    description?: string;
    trend?: {
        value: string;
        isUp: boolean;
    };
    loading?: boolean;
    onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, description, trend, loading, onClick }) => {
    return (
        <motion.div
            whileHover={onClick ? { y: -8, scale: 1.02 } : { y: -5 }}
            transition={{ type: 'spring', stiffness: 300 }}
            onClick={onClick}
            className={onClick ? 'cursor-pointer' : ''}
        >
            <Card className={`premium-card ${onClick ? 'hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300' : ''}`} loading={loading}>
                <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 text-2xl">
                        {icon}
                    </div>
                    {trend && (
                        <div className={`px-2 py-1 rounded-full text-xs font-bold ${trend.isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            {trend.isUp ? '↑' : '↓'} {trend.value}
                        </div>
                    )}
                </div>
                <div className="flex flex-col">
                    <Text type="secondary" className="text-sm font-semibold uppercase tracking-wider mb-1">
                        {title}
                    </Text>
                    <div className="stat-value">
                        {value}
                    </div>
                    {description && (
                        <Text type="secondary" className="text-xs mt-2 italic">
                            {description}
                        </Text>
                    )}
                </div>
            </Card>
        </motion.div>
    );
};

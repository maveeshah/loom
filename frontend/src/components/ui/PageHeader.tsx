import React from 'react';
import { Typography, Breadcrumb, Space } from 'antd';
import { Link } from 'react-router-dom';
import { HomeOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    breadcrumbItems?: { title: React.ReactNode; path?: string }[];
    extra?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, breadcrumbItems, extra }) => {
    return (
        <div className="mb-8">
            {breadcrumbItems && (
                <Breadcrumb
                    className="mb-4"
                    items={[
                        { title: <Link to="/"><HomeOutlined /></Link> },
                        ...breadcrumbItems.map(item => ({
                            title: item.path ? <Link to={item.path}>{item.title}</Link> : item.title
                        }))
                    ]}
                />
            )}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <Title level={2} className="page-title !m-0">
                        {title}
                    </Title>
                    {subtitle && (
                        <Text type="secondary" className="text-base">
                            {subtitle}
                        </Text>
                    )}
                </div>
                {extra && (
                    <Space size={12}>
                        {extra}
                    </Space>
                )}
            </div>
        </div>
    );
};

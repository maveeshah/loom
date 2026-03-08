import React from 'react';
import { ConfigProvider, theme } from 'antd';

interface ThemeConfigProps {
    children: React.ReactNode;
}

export const ThemeConfig: React.FC<ThemeConfigProps> = ({ children }) => {
    return (
        <ConfigProvider
            theme={{
                algorithm: theme.defaultAlgorithm,
                token: {
                    colorPrimary: '#2563eb', // Blue 600
                    borderRadius: 12,
                    fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
                    colorBgLayout: '#f8fafc',
                    colorTextBase: '#0f172a',
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                },
                components: {
                    Button: {
                        controlHeight: 40,
                        fontWeight: 600,
                        borderRadius: 10,
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    },
                    Card: {
                        borderRadiusLG: 16,
                        boxShadowTertiary: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                    },
                    Layout: {
                        headerBg: 'rgba(255, 255, 255, 0.8)',
                        siderBg: '#ffffff',
                    },
                    Menu: {
                        itemBorderRadius: 10,
                        itemSelectedBg: '#eff6ff',
                        itemSelectedColor: '#2563eb',
                    },
                    Table: {
                        borderRadius: 16,
                        headerBg: '#f8fafc',
                        headerColor: '#64748b',
                    },
                    Typography: {
                        fontWeightStrong: 700,
                    }
                },
            }}
        >
            {children}
        </ConfigProvider>
    );
};

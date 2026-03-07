export interface ThemeConfig {
    colorPrimary: string;
    borderRadius: number;
    fontFamily: string;
}

export interface AppConfig {
    env: string;
    theme: ThemeConfig;
    layout: {
        sidebarPosition: 'left' | 'right';
    };
    features: {
        enableComments: boolean;
        enableHistory: boolean;
    };
}

export const config: AppConfig = {
    env: import.meta.env.MODE,
    theme: {
        colorPrimary: '#3b82f6',
        borderRadius: 12,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
    },
    layout: {
        sidebarPosition: 'left',
    },
    features: {
        enableComments: true,
        enableHistory: true,
    }
};

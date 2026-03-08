import React from 'react';
import { Skeleton, Empty, Result, Button } from 'antd';

export const LoadingState: React.FC = () => (
    <div className="py-12">
        <Skeleton active avatar paragraph={{ rows: 4 }} />
    </div>
);

export const EmptyState: React.FC<{ message?: string }> = ({ message }) => (
    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
        <Empty
            description={message || "No data available"}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
    </div>
);

export const ErrorState: React.FC<{ error: string; onRetry?: () => void }> = ({ error, onRetry }) => (
    <Result
        status="error"
        title="Execution Failed"
        subTitle={error}
        extra={onRetry && [
            <Button type="primary" key="retry" onClick={onRetry}>
                Try Again
            </Button>
        ]}
    />
);

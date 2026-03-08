import React from 'react';
import { Table, Card } from 'antd';
import type { TableProps } from 'antd';

interface DataTableProps<T> extends Omit<TableProps<T>, 'title'> {
    title?: React.ReactNode;
}

export const DataTable = <T extends object>({ columns, dataSource, loading, pagination, title, ...rest }: DataTableProps<T>) => {
    return (
        <Card className="premium-card overflow-hidden" bodyStyle={{ padding: 0 }} title={title}>
            <Table
                columns={columns}
                dataSource={dataSource}
                loading={loading}
                pagination={pagination ?? {
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} items`,
                }}
                className="modern-table"
                {...rest}
            />
        </Card>
    );
};

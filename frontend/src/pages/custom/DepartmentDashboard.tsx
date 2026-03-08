import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Statistic, Row, Col, Typography, Progress, Alert } from 'antd';
import { PieChartOutlined, TeamOutlined, DollarOutlined } from '@ant-design/icons';
import { api } from '../../api';

const { Title, Text, Paragraph } = Typography;

export default function DepartmentDashboard() {
    const { id } = useParams<{ id: string }>();
    const [department, setDepartment] = useState<any>(null);
    const [employees, setEmployees] = useState<any[]>([]);

    useEffect(() => {
        if (!id) return;
        api.fetchRecord('department', Number(id)).then(setDepartment);
        api.fetchRecords('employee', { department_id: Number(id) })
            .then(res => setEmployees(Array.isArray(res) ? res : res.data || []));
    }, [id]);

    if (!department) return null;

    const activeCount = employees.filter(e => e.is_active).length;
    const totalBudget = department.budget || 0;

    return (
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl">
            <Alert
                message="Welcome to the Custom Plugin View!"
                description="This entire dashboard is a custom React component dynamically loaded via React.lazy(). It demonstrates how you can override the default generic views in the YAML blueprint to provide complex, domain-specific dashboards while still relying on the framework for routing, auth, and layout."
                type="info"
                showIcon
                className="mb-8 rounded-xl border-blue-200 bg-blue-50"
            />

            <Row gutter={[24, 24]}>
                <Col xs={24} md={8}>
                    <Card className="rounded-xl shadow-sm border-slate-100 h-full">
                        <Statistic
                            title={<span className="font-semibold text-slate-500">Department Name</span>}
                            value={department.name}
                            prefix={<PieChartOutlined className="text-blue-500 mr-2" />}
                            valueStyle={{ fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card className="rounded-xl shadow-sm border-slate-100 h-full">
                        <Statistic
                            title={<span className="font-semibold text-slate-500">Active Employees</span>}
                            value={activeCount}
                            suffix={`/ ${employees.length}`}
                            prefix={<TeamOutlined className="text-emerald-500 mr-2" />}
                            valueStyle={{ fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card className="rounded-xl shadow-sm border-slate-100 h-full">
                        <Statistic
                            title={<span className="font-semibold text-slate-500">Operating Budget</span>}
                            value={totalBudget}
                            precision={2}
                            prefix={<DollarOutlined className="text-amber-500 mr-2" />}
                            valueStyle={{ fontWeight: 700 }}
                        />
                        <div className="mt-4">
                            <div className="flex justify-between text-xs mb-1">
                                <Text type="secondary">Budget Utilization</Text>
                                <Text strong>65%</Text>
                            </div>
                            <Progress percent={65} showInfo={false} strokeColor="#f59e0b" size="small" />
                        </div>
                    </Card>
                </Col>
            </Row>

            <div className="mt-8">
                <Title level={4} className="mb-4">Recent Team Members</Title>
                <Paragraph type="secondary" className="mb-6">
                    This section demonstrates fetching related models within a custom plugin. These are the employees associated with this department.
                </Paragraph>
                <div className="flex flex-wrap gap-4">
                    {employees.slice(0, 5).map(emp => (
                        <div key={emp.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 w-64">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                                {emp.first_name[0]}{emp.last_name[0]}
                            </div>
                            <div>
                                <div className="font-semibold text-slate-800">{emp.first_name} {emp.last_name}</div>
                                <div className="text-xs text-slate-500">{emp.title || 'Team Member'}</div>
                            </div>
                        </div>
                    ))}
                    {employees.length === 0 && <Text type="secondary" italic>No employees found.</Text>}
                </div>
            </div>
        </div>
    );
}

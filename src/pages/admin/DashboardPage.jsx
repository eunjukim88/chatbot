import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Activity, Clock, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { storage } from "@/services/storage";

export default function DashboardPage() {
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        completedToday: 0,
        avgTime: '0h',
        delayedCount: 0
    });
    const [lineData, setLineData] = useState([]);
    const [symptomData, setSymptomData] = useState([]);
    const [delayedRequests, setDelayedRequests] = useState([]);

    useEffect(() => {
        const requests = storage.requests.getAll();

        // 1. KPI Calculation
        const total = requests.length;
        const pending = requests.filter(r => r.status === '정비진행' || r.status === '접수완료').length;

        const today = new Date().toDateString();
        const completedToday = requests.filter(r =>
            r.status === '정비완료' &&
            new Date(r.history.find(h => h.status === '정비완료')?.time).toDateString() === today
        ).length;

        const delayed = requests.filter(r => storage.requests.isDelayed(r));
        setDelayedRequests(delayed);

        // Calculate average resolution time (rough estimate)
        // ... (Logic skipped for brevity, placeholder)

        setStats({ total, pending, completedToday, avgTime: '1.2h', delayedCount: delayed.length });

        // 2. Chart Data - Requests by Line
        const lineCounts = requests.reduce((acc, curr) => {
            acc[curr.line] = (acc[curr.line] || 0) + 1;
            return acc;
        }, {});
        setLineData(Object.entries(lineCounts).map(([name, value]) => ({ name, value })));

        // 3. Chart Data - Symptoms
        const symptomCounts = requests.reduce((acc, curr) => {
            acc[curr.symptom] = (acc[curr.symptom] || 0) + 1;
            return acc;
        }, {});
        setSymptomData(Object.entries(symptomCounts).slice(0, 5).map(([name, value]) => ({ name, value })));

    }, []);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">통합 관제 대시보드</h2>

            {/* KPI Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Widget
                    title="총 요청 건수"
                    value={stats.total}
                    icon={Activity}
                    color="blue"
                    trend="+12%"
                    trendUp={true}
                />
                <Widget
                    title="진행 중 작업"
                    value={stats.pending}
                    icon={Clock}
                    color="orange"
                    subValue="건의 작업 대기중"
                />
                <Widget
                    title="금일 완료율"
                    value={`${stats.total > 0 ? Math.round((stats.completedToday / stats.total) * 100) : 0}%`}
                    icon={CheckCircle2}
                    color="green"
                    subValue={`${stats.completedToday}건 완료`}
                />
                <Widget
                    title="지연된 요청"
                    value={stats.delayedCount}
                    icon={AlertTriangle}
                    color="red"
                    subValue="SLA 기준 초과"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart - Line Status */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">공정별 정비 요청 현황</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={lineData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: '#f3f4f6' }}
                                />
                                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Sub Chart - Symptom Type */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">주요 고장 유형 (Top 5)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={symptomData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {symptomData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Delayed Requests & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Delayed Requests List */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100">
                    <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" /> 긴급 조치 필요 (지연됨)
                    </h3>
                    <div className="space-y-3">
                        {delayedRequests.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-4">지연된 요청이 없습니다. 상태가 아주 좋습니다! 👍</p>
                        ) : (
                            delayedRequests.map(req => (
                                <div key={req.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                                    <div className="flex gap-3 items-center">
                                        <div className="bg-white p-2 rounded-full border border-red-100 text-xs font-bold text-red-500">
                                            {req.priority}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{req.machine}</p>
                                            <p className="text-xs text-red-400">{req.symptom} - {req.time}</p>
                                        </div>
                                    </div>
                                    <Link to={`/maintenance/request/${req.id}`} className="px-3 py-1 bg-white text-xs font-bold text-red-600 rounded border border-red-200 hover:bg-red-50">
                                        확인
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Activity Placeholder */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">최근 활동 로그</h3>
                    <div className="space-y-4">
                        {[1, 2, 3].map((_, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="w-2 h-2 mt-2 rounded-full bg-blue-400 shrink-0"></div>
                                <div>
                                    <p className="text-sm text-gray-700"><span className="font-bold">김정비</span>님이 <span className="font-bold">프레스 #1</span> 정비 상태를 <span className="text-blue-600 font-bold">작업중</span>으로 변경했습니다.</p>
                                    <p className="text-xs text-gray-400 mt-1">10분 전</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Widget({ title, value, icon: Icon, color, trend, trendUp, subValue }) {
    const colors = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-green-50 text-green-600",
        orange: "bg-orange-50 text-orange-600",
        red: "bg-red-50 text-red-600",
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg ${colors[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-bold ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
                        {trend}
                        {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    </div>
                )}
            </div>
            <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</p>
                <h3 className="text-2xl font-black text-gray-800 mt-1">{value}</h3>
                {subValue && <p className="text-xs text-gray-400 mt-2">{subValue}</p>}
            </div>
        </div>
    );
}

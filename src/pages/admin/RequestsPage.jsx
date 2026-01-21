import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, MoreVertical, FileText, ChevronLeft, ChevronRight, AlertCircle, ArrowUpDown } from "lucide-react";
import { storage } from "@/services/storage";
import { cn } from "@/lib/utils";

export default function RequestsPage() {
    const [originalRequests, setOriginalRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);

    // Filters & States
    const [statusTab, setStatusTab] = useState("ALL"); // ALL, OPEN, PROCESS, DONE, DELAYED
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: 'time', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8; // 페이지네이션

    useEffect(() => {
        // Load Data
        const data = storage.requests.getAll();
        setOriginalRequests(data);
    }, []);

    useEffect(() => {
        let result = [...originalRequests];

        // 1. Status Filter (Tab)
        if (statusTab === 'OPEN') result = result.filter(r => r.status === '접수완료');
        if (statusTab === 'PROCESS') result = result.filter(r => r.status === '정비진행');
        if (statusTab === 'DONE') result = result.filter(r => r.status === '정비완료');
        if (statusTab === 'DELAYED') result = result.filter(r => storage.requests.isDelayed(r));

        // 2. Search
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(r =>
                r.id.toLowerCase().includes(lower) ||
                r.machine.toLowerCase().includes(lower) ||
                r.symptom.toLowerCase().includes(lower) ||
                (r.applicant && r.applicant.toLowerCase().includes(lower))
            );
        }

        // 3. Sort
        result.sort((a, b) => {
            let aVal = a[sortConfig.key];
            let bVal = b[sortConfig.key];
            if (sortConfig.key === 'time') {
                aVal = new Date(a.time).getTime();
                bVal = new Date(b.time).getTime();
            }
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        setFilteredRequests(result);
        setCurrentPage(1); // Reset page on filter change
    }, [originalRequests, statusTab, searchTerm, sortConfig]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
    const paginatedItems = filteredRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-800">요청 관리</h2>
                <div className="flex gap-2">
                    <button onClick={() => alert('엑셀 다운로드 기능은 준비중입니다.')} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 shadow-sm transition-colors">
                        <FileText className="w-4 h-4" /> 엑셀 내보내기
                    </button>
                </div>
            </div>

            {/* Tabs & Search Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                    {/* Tabs */}
                    <div className="flex p-1 bg-gray-100 rounded-lg self-start">
                        {[
                            { id: 'ALL', label: '전체' },
                            { id: 'OPEN', label: '접수완료', color: 'text-red-600' },
                            { id: 'PROCESS', label: '정비진행', color: 'text-blue-600' },
                            { id: 'DONE', label: '정비완료', color: 'text-green-600' },
                            { id: 'DELAYED', label: '지연됨', icon: AlertCircle, color: 'text-orange-600' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setStatusTab(tab.id)}
                                className={cn(
                                    "px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-1.5",
                                    statusTab === tab.id ? "bg-white shadow-sm text-slate-900" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50",
                                    (statusTab !== tab.id && tab.color) && tab.color
                                )}
                            >
                                {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="티켓번호, 설비명, 증상 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                        />
                    </div>
                </div>

                {/* Optional Filters Row (Placeholder for more complex filters) */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Filter className="w-3 h-3" />
                    <span className="font-bold">빠른 필터:</span>
                    <button onClick={() => setSearchTerm('A 라인')} className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">A 라인</button>
                    <button onClick={() => setSearchTerm('프레스')} className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">프레스</button>
                    <button onClick={() => setSearchTerm('긴급')} className="px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 font-bold">긴급건</button>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th onClick={() => handleSort('id')} className="p-4 text-xs font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors select-none group">
                                    <div className="flex items-center gap-1">티켓번호 <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50" /></div>
                                </th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">상태</th>
                                <th onClick={() => handleSort('priority')} className="p-4 text-xs font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors select-none group">
                                    <div className="flex items-center gap-1">긴급도 <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50" /></div>
                                </th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">설비명 (라인)</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">증상</th>
                                <th onClick={() => handleSort('time')} className="p-4 text-xs font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors select-none group">
                                    <div className="flex items-center gap-1">접수 시간 <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50" /></div>
                                </th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedItems.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-12 text-center text-gray-400">
                                        검색 결과가 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                paginatedItems.map((req) => (
                                    <tr
                                        key={req.id}
                                        className="hover:bg-blue-50/50 transition-colors group"
                                    >
                                        <td className="p-4 text-sm font-bold text-slate-700">
                                            <Link to={`/maintenance/request/${req.id}`} className="hover:underline text-blue-600">
                                                {req.id}
                                            </Link>
                                        </td>
                                        <td className="p-4">
                                            <span className={cn(
                                                "px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide",
                                                req.status === '정비완료' ? 'bg-green-100 text-green-700' :
                                                    req.status === '정비진행' ? 'bg-blue-100 text-blue-700' :
                                                        req.status === '접수완료' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                                            )}>
                                                {req.status}
                                            </span>
                                            {storage.requests.isDelayed(req) && (
                                                <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
                                                    <AlertCircle className="w-3 h-3" /> 지연
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className={cn(
                                                "text-xs font-bold",
                                                req.priority?.includes('높음') ? "text-red-500" : "text-gray-600"
                                            )}>
                                                {req.priority}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-800">
                                            <div className="font-bold">{req.machine}</div>
                                            <div className="text-xs text-gray-400">{req.line}</div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 truncate max-w-[150px]">
                                            {req.symptom}
                                        </td>
                                        <td className="p-4 text-xs font-medium text-gray-500">
                                            {req.time}
                                            <div className="text-[10px] text-gray-300">{req.applicant}</div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <Link to={`/maintenance/request/${req.id}`} className="p-2 hover:bg-gray-100 rounded-full inline-block text-gray-400 hover:text-blue-600 transition-colors">
                                                <MoreVertical className="w-4 h-4" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="border-t border-gray-100 bg-gray-50 p-3 flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                            총 <span className="font-bold">{filteredRequests.length}</span>개 중 <span className="font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-bold">{Math.min(currentPage * itemsPerPage, filteredRequests.length)}</span> 표시
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded-md hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                                <ChevronLeft className="w-4 h-4 text-gray-600" />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setCurrentPage(p)}
                                    className={cn(
                                        "w-7 h-7 flex items-center justify-center rounded-md text-xs font-bold transition-all",
                                        currentPage === p ? "bg-white border border-gray-200 shadow-sm text-blue-600" : "text-gray-500 hover:bg-white hover:text-gray-700"
                                    )}
                                >
                                    {p}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded-md hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                                <ChevronRight className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

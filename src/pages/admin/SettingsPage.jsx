import { useState, useEffect } from "react";
import { Save, Users, Calendar, ChevronLeft, ChevronRight, AlertTriangle, PaintBucket, Clock } from "lucide-react";
import { storage } from "@/services/storage";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("SYSTEM"); // SYSTEM, STAFF

    const [settings, setSettings] = useState({
        sla: { high: 1, medium: 4, low: 24 },
        notifications: { dndEnabled: true, emailEnabled: false },
        shiftHours: {
            MORNING: { start: 6, end: 14 },
            AFTERNOON: { start: 14, end: 22 },
            NIGHT: { start: 22, end: 6 }
        }
    });

    // Staff & Schedule State
    const [staffList, setStaffList] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());

    // Drag & Drop State
    const [selectedTool, setSelectedTool] = useState("MORNING");
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(null);
    const [dragCurrent, setDragCurrent] = useState(null);

    useEffect(() => {
        const saved = localStorage.getItem("chatbot_settings");
        if (saved) {
            const parsed = JSON.parse(saved);
            // Ensure shiftHours structure exists even if old settings are loaded
            if (!parsed.shiftHours) {
                parsed.shiftHours = {
                    MORNING: { start: 6, end: 14 },
                    AFTERNOON: { start: 14, end: 22 },
                    NIGHT: { start: 22, end: 6 }
                };
            }
            setSettings(parsed);
        }
        loadStaff();
    }, []);

    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (isDragging) applyDrag();
        };
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, [isDragging, dragStart, dragCurrent]);

    const loadStaff = () => {
        setStaffList(storage.staff.getAll());
    };

    const handleSaveSettings = () => {
        localStorage.setItem("chatbot_settings", JSON.stringify(settings));
        alert("시스템 설정이 저장되었습니다.");
    };

    const handleShiftHourChange = (shift, type, value) => {
        setSettings(prev => ({
            ...prev,
            shiftHours: {
                ...prev.shiftHours,
                [shift]: {
                    ...prev.shiftHours[shift],
                    [type]: parseInt(value)
                }
            }
        }));
    };

    // Schedule Logic
    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

    const applyDrag = () => {
        if (!isDragging || !dragStart || !dragCurrent) {
            setIsDragging(false);
            setDragStart(null);
            setDragCurrent(null);
            return;
        }

        if (dragStart.staffId !== dragCurrent.staffId) {
            setIsDragging(false);
            setDragStart(null);
            setDragCurrent(null);
            return;
        }

        const startDay = Math.min(dragStart.day, dragCurrent.day);
        const endDay = Math.max(dragStart.day, dragCurrent.day);
        const staffId = dragStart.staffId;

        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');

        const newStaffList = staffList.map(staff => {
            if (staff.id === staffId) {
                const updatedSchedule = { ...staff.monthlySchedule };
                for (let d = startDay; d <= endDay; d++) {
                    const dayStr = String(d).padStart(2, '0');
                    const dateKey = `${year}-${month}-${dayStr}`;
                    updatedSchedule[dateKey] = selectedTool;
                }
                return { ...staff, monthlySchedule: updatedSchedule };
            }
            return staff;
        });

        setStaffList(newStaffList);
        storage.staff.save(newStaffList);

        setIsDragging(false);
        setDragStart(null);
        setDragCurrent(null);
    };

    const handleMouseDown = (staffId, day) => {
        setIsDragging(true);
        setDragStart({ staffId, day });
        setDragCurrent({ staffId, day });
    };

    const handleMouseEnter = (staffId, day) => {
        if (isDragging) {
            if (dragStart?.staffId === staffId) {
                setDragCurrent({ staffId, day });
            }
        }
    };

    const isCellSelected = (staffId, day) => {
        if (!isDragging || !dragStart || !dragCurrent) return false;
        if (staffId !== dragStart.staffId) return false;
        const start = Math.min(dragStart.day, dragCurrent.day);
        const end = Math.max(dragStart.day, dragCurrent.day);
        return day >= start && day <= end;
    };

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const dayArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const TOOLS = [
        { id: 'MORNING', label: `오전 (${settings.shiftHours.MORNING.start}-${settings.shiftHours.MORNING.end})`, color: 'bg-blue-200 text-blue-700', ring: 'ring-blue-400' },
        { id: 'AFTERNOON', label: `오후 (${settings.shiftHours.AFTERNOON.start}-${settings.shiftHours.AFTERNOON.end})`, color: 'bg-orange-200 text-orange-700', ring: 'ring-orange-400' },
        { id: 'NIGHT', label: `야간 (${settings.shiftHours.NIGHT.start}-${settings.shiftHours.NIGHT.end})`, color: 'bg-purple-200 text-purple-700', ring: 'ring-purple-400' },
        { id: 'OFF', label: '휴무', color: 'bg-gray-100 text-gray-400', ring: 'ring-gray-300' },
    ];

    const getShiftColor = (shift) => {
        switch (shift) {
            case 'MORNING': return 'bg-blue-200 text-blue-700';
            case 'AFTERNOON': return 'bg-orange-200 text-orange-700';
            case 'NIGHT': return 'bg-purple-200 text-purple-700';
            default: return 'bg-white text-gray-300';
        }
    };

    return (
        <div className="space-y-6 max-w-[95vw] select-none">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <SettingsIcon /> 설정 및 관리
            </h2>

            {/* Top Tabs */}
            <div className="flex gap-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab("SYSTEM")}
                    className={cn("pb-3 px-2 text-sm font-bold transition-all border-b-2", activeTab === "SYSTEM" ? "text-blue-600 border-blue-600" : "text-gray-400 border-transparent hover:text-gray-600")}
                >
                    시스템 설정
                </button>
                <button
                    onClick={() => setActiveTab("STAFF")}
                    className={cn("pb-3 px-2 text-sm font-bold transition-all border-b-2", activeTab === "STAFF" ? "text-blue-600 border-blue-600" : "text-gray-400 border-transparent hover:text-gray-600")}
                >
                    직원 및 근무표 관리
                </button>
            </div>

            {/* SYSTEM TAB */}
            {activeTab === "SYSTEM" && (
                <div className="max-w-4xl space-y-6 animate-in fade-in">

                    {/* Shift Hours Settings */}
                    <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-green-600" /> 교대 근무 시간 설정
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">각 근무조의 시작(Start) 및 종료(End) 시간을 설정합니다. (0~24 시)</p>

                        <div className="grid md:grid-cols-3 gap-6">
                            {/* Morning */}
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-3">
                                <div className="font-bold text-blue-800 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> 오전 (MORNING)
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number" min="0" max="23"
                                        value={settings.shiftHours?.MORNING.start}
                                        onChange={(e) => handleShiftHourChange('MORNING', 'start', e.target.value)}
                                        className="w-full border p-2 rounded text-center font-mono"
                                    />
                                    <span className="text-gray-400">~</span>
                                    <input
                                        type="number" min="0" max="24"
                                        value={settings.shiftHours?.MORNING.end}
                                        onChange={(e) => handleShiftHourChange('MORNING', 'end', e.target.value)}
                                        className="w-full border p-2 rounded text-center font-mono"
                                    />
                                </div>
                            </div>

                            {/* Afternoon */}
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 space-y-3">
                                <div className="font-bold text-orange-800 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-orange-500"></span> 오후 (AFTERNOON)
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number" min="0" max="23"
                                        value={settings.shiftHours?.AFTERNOON.start}
                                        onChange={(e) => handleShiftHourChange('AFTERNOON', 'start', e.target.value)}
                                        className="w-full border p-2 rounded text-center font-mono"
                                    />
                                    <span className="text-gray-400">~</span>
                                    <input
                                        type="number" min="0" max="24"
                                        value={settings.shiftHours?.AFTERNOON.end}
                                        onChange={(e) => handleShiftHourChange('AFTERNOON', 'end', e.target.value)}
                                        className="w-full border p-2 rounded text-center font-mono"
                                    />
                                </div>
                            </div>

                            {/* Night */}
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 space-y-3">
                                <div className="font-bold text-purple-800 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-purple-500"></span> 야간 (NIGHT)
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number" min="0" max="23"
                                        value={settings.shiftHours?.NIGHT.start}
                                        onChange={(e) => handleShiftHourChange('NIGHT', 'start', e.target.value)}
                                        className="w-full border p-2 rounded text-center font-mono"
                                    />
                                    <span className="text-gray-400">~</span>
                                    <input
                                        type="number" min="0" max="24"
                                        value={settings.shiftHours?.NIGHT.end}
                                        onChange={(e) => handleShiftHourChange('NIGHT', 'end', e.target.value)}
                                        className="w-full border p-2 rounded text-center font-mono"
                                    />
                                </div>
                                <p className="text-[10px] text-purple-600/70">* 종료 시간이 시작 시간보다 작으면 익일로 처리됩니다.</p>
                            </div>
                        </div>
                    </section>

                    {/* SLA Settings */}
                    <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-orange-500" /> SLA (서비스 수준) 임계값
                        </h3>
                        <p className="text-sm text-gray-500">긴급도별 응답 제한 시간을 설정합니다. (단위: 시간)</p>
                        <div className="grid grid-cols-3 gap-4 mt-4">
                            {['high', 'medium', 'low'].map(level => (
                                <div key={level} className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-gray-500">{level}</label>
                                    <input
                                        type="number"
                                        value={settings.sla?.[level]}
                                        onChange={e => setSettings({ ...settings, sla: { ...settings.sla, [level]: parseInt(e.target.value) } })}
                                        className="w-full border p-2 rounded text-center font-mono"
                                    />
                                </div>
                            ))}
                        </div>
                    </section>
                    <button onClick={handleSaveSettings} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold w-full shadow-lg hover:bg-slate-800 transition-all">설정 저장하기</button>
                </div>
            )}

            {/* STAFF SCHEDULE TAB */}
            {activeTab === "STAFF" && (
                <div className="space-y-6 animate-in fade-in">
                    {/* Control Bar */}
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 gap-6">
                        {/* Month Nav */}
                        <div className="flex items-center gap-4">
                            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft className="w-5 h-5" /></button>
                            <h3 className="text-xl font-black text-gray-800 flex items-center gap-2 w-32 justify-center">
                                {year}. {String(month + 1).padStart(2, '0')}
                            </h3>
                            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight className="w-5 h-5" /></button>
                        </div>

                        {/* Paint Tools */}
                        <div className="flex-1 flex flex-wrap items-center gap-3">
                            <div className="text-xs font-bold text-gray-400 flex items-center gap-1 mr-2">
                                <PaintBucket className="w-4 h-4" /> 근무 형태 선택:
                            </div>
                            {TOOLS.map(tool => (
                                <button
                                    key={tool.id}
                                    onClick={() => setSelectedTool(tool.id)}
                                    className={cn(
                                        "px-4 py-2 rounded-full text-xs font-bold transition-all border-2",
                                        tool.color,
                                        selectedTool === tool.id
                                            ? `border-current ring-2 ring-offset-1 ${tool.ring}`
                                            : "border-transparent opacity-60 hover:opacity-100"
                                    )}
                                >
                                    {tool.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto relative pb-2">
                        <table className="w-full text-center border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
                                    <th className="p-3 font-bold sticky left-0 bg-gray-50 z-10 w-32 border-r shadow-[1px_0_5px_rgba(0,0,0,0.05)]">직원</th>
                                    {dayArray.map(day => {
                                        const date = new Date(year, month, day);
                                        const dayName = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
                                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                        return (
                                            <th key={day} className={cn("min-w-[32px] border-r border-gray-100 py-2", isWeekend && "text-red-500 bg-red-50/30")}>
                                                <div className="text-[10px] opacity-70 mb-0.5">{dayName}</div>
                                                <div className="text-sm">{day}</div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {staffList.map(staff => (
                                    <tr key={staff.id} className="border-b border-gray-50 hover:bg-gray-50/30">
                                        <td className="p-3 sticky left-0 bg-white z-10 border-r border-gray-100 text-left shadow-[1px_0_5px_rgba(0,0,0,0.05)]">
                                            <div className="font-bold text-sm text-gray-800">{staff.name}</div>
                                            <div className="text-xs text-gray-400">{staff.role === 'MAINTENANCE' ? '정비' : '생산'}</div>
                                        </td>
                                        {dayArray.map(day => {
                                            const dayStr = String(day).padStart(2, '0');
                                            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${dayStr}`;
                                            const shift = staff.monthlySchedule?.[dateKey] || 'OFF';
                                            const isSelected = isCellSelected(staff.id, day);

                                            // Determine visual appearance
                                            // If selected (dragging), show Selected Tool color lightly
                                            // If not selected, show actual Shift color

                                            let cellClass = getShiftColor(shift);

                                            // Override if dragging over this cell
                                            if (isSelected) {
                                                const tool = TOOLS.find(t => t.id === selectedTool);
                                                cellClass = tool.color.split(' ')[0] + " opacity-80 ring-inset ring-2 " + tool.ring;
                                            }

                                            return (
                                                <td
                                                    key={day}
                                                    onMouseDown={() => handleMouseDown(staff.id, day)}
                                                    onMouseEnter={() => handleMouseEnter(staff.id, day)}
                                                    className={cn(
                                                        "p-0 border-r border-gray-100 h-12 relative cursor-pointer transition-colors",
                                                        cellClass
                                                    )}
                                                >
                                                    {/* Shorthand Label */}
                                                    <span className="text-[10px] font-bold opacity-60">
                                                        {shift === 'MORNING' && '오전'}
                                                        {shift === 'AFTERNOON' && '오후'}
                                                        {shift === 'NIGHT' && '야간'}
                                                    </span>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-xs text-gray-400 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Tip: 상단에서 근무 형태를 선택한 후, 표에서 드래그하여 한 번에 여러 날짜를 설정하세요.
                    </p>
                </div>
            )}
        </div>
    );
}

function SettingsIcon() {
    return (
        <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );
}

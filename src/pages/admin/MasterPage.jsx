import { useState, useEffect } from "react";
import { Plus, Trash, Edit, Save, X } from "lucide-react";
import { storage } from "@/services/storage";
import { cn } from "@/lib/utils";

export default function MasterPage() {
    const [activeTab, setActiveTab] = useState("EQUIPMENT");
    const [data, setData] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editItem, setEditItem] = useState(null); // Item being edited or created

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = () => {
        if (activeTab === "EQUIPMENT") setData(storage.equipment.getAll());
        if (activeTab === "PARTS") setData(storage.parts.getAll());
        if (activeTab === "LINES") setData(storage.lines.getAll().map(l => ({ name: l }))); // Convert string array to object for uniform handling
    };

    const handleDelete = (item) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;

        let newData = [];
        if (activeTab === "EQUIPMENT") {
            newData = data.filter(d => d.code !== item.code);
            storage.set('chatbot_equipment', newData);
        } else if (activeTab === "PARTS") {
            newData = data.filter(d => d.code !== item.code);
            storage.set('chatbot_parts', newData);
        } else if (activeTab === "LINES") {
            newData = data.filter(d => d.name !== item.name);
            storage.set('chatbot_lines', newData.map(d => d.name));
        }
        setData(newData);
    };

    const handleSave = () => {
        let newData = [...data];

        if (activeTab === "LINES") {
            // Handle String Array Logic
            const existingIdx = data.findIndex(d => d.name === editItem.originalName);
            if (existingIdx > -1) {
                newData[existingIdx] = { name: editItem.name }; // Update
            } else {
                newData.push({ name: editItem.name }); // Create
            }
            storage.set('chatbot_lines', newData.map(d => d.name));
        } else {
            // Handle Object Array Logic (Equipment, Parts) which have unique 'code'
            const existingIdx = data.findIndex(d => d.code === editItem.code);

            // Check for duplicate code on create
            if (existingIdx === -1 && data.some(d => d.code === editItem.code)) {
                alert("이미 존재하는 코드입니다.");
                return;
            }

            if (existingIdx > -1) {
                newData[existingIdx] = editItem; // Update
            } else {
                newData.push(editItem); // Create
            }

            if (activeTab === "EQUIPMENT") storage.set('chatbot_equipment', newData);
            if (activeTab === "PARTS") storage.set('chatbot_parts', newData);
        }

        setData(newData);
        setIsEditing(false);
        setEditItem(null);
    };

    const openModal = (item = null) => {
        if (item) {
            setEditItem({ ...item, originalName: item.name }); // originalName used for Lines updates logic
        } else {
            // Default empty templates
            if (activeTab === "EQUIPMENT") setEditItem({ name: "", code: "", line: "A 라인" });
            if (activeTab === "PARTS") setEditItem({ name: "", code: "", category: "소모품" });
            if (activeTab === "LINES") setEditItem({ name: "" });
        }
        setIsEditing(true);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">마스터 데이터 관리</h2>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200">
                {["EQUIPMENT", "PARTS", "LINES"].map(tab => (
                    <button
                        key={tab}
                        onClick={() => { setActiveTab(tab); setIsEditing(false); }}
                        className={cn(
                            "pb-3 px-1 text-sm font-bold transition-all relative top-[1px]",
                            activeTab === tab ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-400 hover:text-gray-600"
                        )}
                    >
                        {tab === "EQUIPMENT" && "설비 관리"}
                        {tab === "PARTS" && "부품 관리"}
                        {tab === "LINES" && "공정(라인) 관리"}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase">Total: {data.length} items</span>
                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-sm transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" /> 신규 등록
                    </button>
                </div>

                <table className="w-full text-left">
                    <thead className="bg-white border-b border-gray-100">
                        <tr>
                            {activeTab !== "LINES" && <th className="p-4 text-xs font-bold text-gray-400 uppercase">코드</th>}
                            <th className="p-4 text-xs font-bold text-gray-400 uppercase">명칭</th>
                            {activeTab === "EQUIPMENT" && <th className="p-4 text-xs font-bold text-gray-400 uppercase">소속 라인</th>}
                            {activeTab === "PARTS" && <th className="p-4 text-xs font-bold text-gray-400 uppercase">카테고리</th>}
                            <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {data.map((item, idx) => (
                            <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                                {activeTab !== "LINES" && <td className="p-4 text-sm font-bold text-gray-600">{item.code}</td>}
                                <td className="p-4 text-sm font-bold text-gray-800">{item.name}</td>
                                {activeTab === "EQUIPMENT" && <td className="p-4 text-sm text-gray-500">{item.line}</td>}
                                {activeTab === "PARTS" && <td className="p-4 text-sm text-gray-500">{item.category}</td>}
                                <td className="p-4 flex justify-end gap-2">
                                    <button onClick={() => openModal(item)} className="p-2 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600">
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(item)} className="p-2 hover:bg-gray-100 rounded text-gray-400 hover:text-red-600">
                                        <Trash className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit/Create Modal Overlay */}
            {isEditing && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6 animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center border-b pb-4">
                            <h3 className="text-lg font-bold text-gray-800">
                                {editItem.code || editItem.originalName ? "정보 수정" : "신규 등록"}
                            </h3>
                            <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {activeTab !== "LINES" && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">식별 코드</label>
                                    <input
                                        type="text"
                                        value={editItem.code}
                                        onChange={(e) => setEditItem({ ...editItem, code: e.target.value })}
                                        className="w-full border rounded-lg p-2.5 bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-blue-100"
                                        placeholder="예: EQ-001"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">명칭</label>
                                <input
                                    type="text"
                                    value={editItem.name}
                                    onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                                    className="w-full border rounded-lg p-2.5 bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            {activeTab === "EQUIPMENT" && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">소속 라인</label>
                                    <select
                                        value={editItem.line}
                                        onChange={(e) => setEditItem({ ...editItem, line: e.target.value })}
                                        className="w-full border rounded-lg p-2.5 bg-white outline-none"
                                    >
                                        {storage.lines.getAll().map(l => (
                                            <option key={l} value={l}>{l}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {activeTab === "PARTS" && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">카테고리</label>
                                    <select
                                        value={editItem.category}
                                        onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
                                        className="w-full border rounded-lg p-2.5 bg-white outline-none"
                                    >
                                        <option value="소모품">소모품</option>
                                        <option value="기계부품">기계부품</option>
                                        <option value="전기부품">전기부품</option>
                                        <option value="유압부품">유압부품</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="flex-1 py-3 rounded-xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                            >
                                저장하기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Camera, Send, MoreVertical, Search, AlertCircle, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import ChatBubble from "@/components/chat/ChatBubble";
import PhotoUpload from "@/components/PhotoUpload";
import { cn } from "@/lib/utils";
import { storage } from "@/services/storage";
import { imageService } from "@/services/imageService";

const STEPS = {
    // PRODUCTION STEPS
    INIT: {
        id: "INIT",
        message: "정비요청을 진행합니다.\n다음 정보를 입력해주세요.\n\n공정명을 선택해주세요.",
        getOptions: () => storage.lines.getAll(),
        next: "EQUIPMENT"
    },
    EQUIPMENT: {
        id: "EQUIPMENT",
        message: "설비명을 선택하세요.",
        getOptions: (prevData) => storage.equipment.getByLine(prevData.line).map(e => e.name),
        next: "SYMPTOM"
    },
    SYMPTOM: {
        id: "SYMPTOM",
        message: "고장 증상을 입력해주세요.",
        getOptions: () => storage.symptoms.getAll(),
        next: "SYMPTOM_CATEGORY"
    },
    SYMPTOM_CATEGORY: {
        id: "SYMPTOM_CATEGORY",
        message: "증상 카테고리를 선택해주세요.\n(더 정확한 분류를 위해)",
        getOptions: () => storage.symptomCategories.getAll(),
        next: "URGENCY"
    },
    URGENCY: {
        id: "URGENCY",
        message: "정비 긴급도를 선택해주세요.",
        getOptions: () => ["높음 (1시간)", "보통 (4시간)", "낮음 (당일)"],
        next: "PHOTO"
    },
    PHOTO: {
        id: "PHOTO",
        message: "현장 사진을 찍어 첨부하거나,\n상세 내용을 입력 후 전송해주세요.",
        type: "input",
        next: "SUMMARY"
    },
    SUMMARY: {
        id: "SUMMARY",
        message: "입력 정보를 확인하세요.",
        type: "summary",
        next: "CONFIRM"
    },
    CONFIRM: {
        id: "CONFIRM",
        message: "요청이 접수되었습니다!",
        type: "end"
    },

    // MAINTENANCE STEPS
    M_INIT: {
        id: "M_INIT",
        message: "정비팀 모드입니다.\n원하시는 작업을 선택해주세요.",
        getOptions: () => ["접수완료 요청 확인", "전체 요청 목록", "QR 스캔 (준비중)"],
        next: (opt) => opt === "접수완료 요청 확인" ? "M_NEW" : opt === "전체 요청 목록" ? "M_LIST" : "M_INIT"
    },
    M_NEW: {
        id: "M_NEW",
        message: "처리 대기 중인 접수완료 요청들입니다.\n상세 정보가 필요한 항목을 선택하세요.",
        getOptions: () => storage.requests.getAll().filter(r => r.status === '접수완료').map(r => `[${r.id}] ${r.machine}`),
        next: "M_DETAIL"
    },
    M_LIST: {
        id: "M_LIST",
        message: "현재 진행 중인 모든 요청입니다.",
        getOptions: () => storage.requests.getAll().slice(0, 5).map(r => `[${r.id}] ${r.machine} (${r.status})`),
        next: "M_DETAIL"
    },
    M_DETAIL: {
        id: "M_DETAIL",
        message: (prevData) => {
            const id = prevData.selectedId;
            const req = storage.requests.getById(id);
            if (!req) return "유효하지 않은 요청입니다.";
            return `[요청 상세]\n번호: ${req.id}\n설비: ${req.machine}\n증상: ${req.symptom}\n내용: ${req.description}\n상태: ${req.status}\n\n상태를 변경하시겠습니까?`;
        },
        getImage: (prevData) => {
            const req = storage.requests.getById(prevData.selectedId);
            return req?.image;
        },
        getOptions: () => ["정비진행", "정비완료", "목록으로"],
        next: "M_STATUS_CHANGE"
    }
};

export default function WorkerPage() {
    const [role, setRole] = useState("PRODUCTION");
    const [messages, setMessages] = useState([]);
    const [currentStep, setCurrentStep] = useState("INIT");
    const [formData, setFormData] = useState({});
    const [photos, setPhotos] = useState([]);
    const [inputText, setInputText] = useState("");
    const [notification, setNotification] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        const step = role === "PRODUCTION" ? "INIT" : "M_INIT";
        setCurrentStep(step);
        setMessages([{
            type: "system",
            message: STEPS[step].message,
            time: getCurrentTime()
        }]);
    }, [role]);

    useEffect(() => {
        const handleNoti = (e) => {
            const noti = e.detail;
            if (noti.to === role) {
                setNotification(noti);
                setTimeout(() => setNotification(null), 8000);
                setMessages(prev => [...prev, {
                    type: "system",
                    message: `📢 알림톡: ${noti.message}`,
                    link: noti.link,
                    time: getCurrentTime(),
                    isAlert: true
                }]);
            }
        };
        window.addEventListener('new_notification', handleNoti);
        return () => window.removeEventListener('new_notification', handleNoti);
    }, [role]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    function getCurrentTime() {
        const now = new Date();
        return `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    }

    const handleOptionClick = (option) => {
        const newMessages = [...messages, { type: "user", message: option, time: getCurrentTime() }];
        let newData = { ...formData };
        let nextStep = "";

        if (currentStep === "INIT") newData.line = option;
        if (currentStep === "EQUIPMENT") newData.machine = option;
        if (currentStep === "SYMPTOM") newData.symptom = option;
        if (currentStep === "SYMPTOM_CATEGORY") newData.symptomCategory = option;
        if (currentStep === "URGENCY") newData.priority = option;

        if (currentStep === "M_INIT") {
            if (option === "신규 요청 확인") nextStep = "M_NEW";
            if (option === "전체 요청 목록") nextStep = "M_LIST";
            if (option.includes("QR 스캔")) {
                setIsScanning(true);
                setTimeout(() => {
                    setIsScanning(false);
                    const mockScanned = storage.requests.getAll()[0]; // 최신 하나 선택 시뮬레이션
                    if (mockScanned) {
                        newData.selectedId = mockScanned.id;
                        nextStep = "M_DETAIL";
                        setMessages(prev => [...prev, { type: "system", message: `[QR 스캔 완료] ${mockScanned.machine} 설비가 인식되었습니다.`, time: getCurrentTime() }]);
                        setFormData(newData);
                        handleOptionClick(`[${mockScanned.id}] ${mockScanned.machine}`);
                    }
                }, 2000);
                return;
            }
        }

        if (currentStep === "M_NEW" || currentStep === "M_LIST") {
            const match = option.match(/\[(.*?)\]/);
            if (match) {
                newData.selectedId = match[1];
                nextStep = "M_DETAIL";
            }
        }

        if (currentStep === "M_DETAIL") {
            if (option === "목록으로") {
                nextStep = "M_INIT";
            } else {
                storage.requests.updateStatus(formData.selectedId, option);
                nextStep = "M_INIT";
                setMessages(prev => [...prev, { type: "system", message: `상태가 [${option}]으로 변경되었습니다. 알림톡이 전송되었습니다.`, time: getCurrentTime() }]);
            }
        }

        const stepObj = STEPS[currentStep];
        if (!nextStep && stepObj.next) {
            nextStep = typeof stepObj.next === 'function' ? stepObj.next(option) : stepObj.next;
        }

        setFormData(newData);
        setMessages(newMessages);

        if (nextStep) {
            setTimeout(() => {
                const nextStepObj = STEPS[nextStep];
                let sysMsg = typeof nextStepObj.message === 'function' ? nextStepObj.message(newData) : nextStepObj.message;
                let sysImg = nextStepObj.getImage ? nextStepObj.getImage(newData) : null;

                setMessages(prev => [
                    ...prev,
                    {
                        type: "system",
                        message: sysMsg,
                        image: sysImg,
                        isSummary: nextStep === "SUMMARY",
                        time: getCurrentTime()
                    }
                ]);
                setCurrentStep(nextStep);
            }, 500);
        }
    };

    const handleSend = () => {
        if (!inputText.trim() && currentStep !== "PHOTO") return;

        if (currentStep === "PHOTO") {
            // 사진이 최소 1장 이상 있어야 함
            if (photos.length < 1) {
                alert("최소 1장 이상의 사진을 첨부해주세요.");
                return;
            }

            const newMessages = [...messages, {
                type: "user",
                message: inputText || "사진 첨부 완료",
                time: getCurrentTime()
            }];
            setMessages(newMessages);
            setFormData(prev => ({ ...prev, description: inputText, images: photos }));
            setInputText("");

            setTimeout(() => {
                setMessages(prev => [
                    ...prev,
                    {
                        type: "system",
                        message: STEPS.SUMMARY.message,
                        isSummary: true,
                        time: getCurrentTime()
                    }
                ]);
                setCurrentStep("SUMMARY");
            }, 500);
        } else {
            const newMessages = [...messages, { type: "user", message: inputText, time: getCurrentTime() }];
            setMessages(newMessages);
            setInputText("");
        }
    };

    const handleSubmit = async () => {
        // 검증: 사진 1~3장
        if (!formData.images || formData.images.length < 1 || formData.images.length > 3) {
            alert("사진은 1~3장까지 첨부 가능합니다.");
            return;
        }

        // 검증: 긴급도 필수
        if (!formData.priority) {
            alert("긴급도를 선택해주세요.");
            return;
        }

        try {
            // 사용자 액션 메시지 추가
            setMessages(prev => [
                ...prev,
                { type: "user", message: "제출하기", time: getCurrentTime() }
            ]);

            // 티켓 번호 미리 가져오기
            const nextId = storage.requests.getNextId();

            // 처리 중 메시지 추가
            setMessages(prev => [...prev, {
                type: "system",
                message: "📸 사진에 워터마크를 삽입하고 요청을 처리 중입니다...",
                time: getCurrentTime()
            }]);

            // 모든 사진에 워터마크 삽입
            const watermarkedImages = await Promise.all(
                formData.images.map(img => imageService.addWatermark(img, nextId))
            );

            const finalRequest = {
                ...formData,
                id: nextId,
                images: watermarkedImages,
                applicant: "이동근 (A라인)"
            };
            const saved = storage.requests.save(finalRequest);

            setTimeout(() => {
                setMessages(prev => [
                    ...prev,
                    {
                        type: "system",
                        message: `✅ 요청이 접수되었습니다!\n\n접수번호: ${saved.id}\n접수시간: ${new Date().toLocaleString()}\n긴급도: ${formData.priority}\n첨부 사진: ${formData.images.length}장\n\n담당자가 확인 중입니다.\n진행상황은 실시간으로 공유됩니다.`,
                        time: getCurrentTime()
                    }
                ]);
                setCurrentStep("CONFIRM");
            }, 800);
        } catch (error) {
            console.error("Submission failed:", error);
            alert("요청 처리 중 오류가 발생했습니다.");
        }
    };

    const currentStepObj = STEPS[currentStep];
    const options = currentStepObj?.getOptions ? currentStepObj.getOptions(formData) : null;

    return (
        <div className="min-h-screen bg-gray-100 flex justify-center font-sans font-medium text-slate-800">
            <div className="w-full max-w-sm bg-[#bacee0] shadow-xl min-h-screen flex flex-col relative overflow-hidden">

                {/* Header */}
                <header className="bg-[#A9BDCE] bg-opacity-95 backdrop-blur-md text-black p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm border-b border-black/5">
                    <div className="flex items-center gap-3">
                        <ArrowLeft className="w-5 h-5 cursor-pointer hover:opacity-70 transition-opacity" />
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="text-xs bg-white/60 hover:bg-white/80 transition-colors border border-black/10 rounded-full px-2 py-0.5 outline-none font-bold cursor-pointer"
                        >
                            <option value="PRODUCTION">생산팀 (요청자)</option>
                            <option value="MAINTENANCE">정비팀 (담당자)</option>
                        </select>
                    </div>
                    <h1 className="text-sm font-bold tracking-tight">{role === "PRODUCTION" ? "정비요청 챗봇" : "정비팀 (김정비)"}</h1>
                    <div className="flex gap-4">
                        <Search className="w-5 h-5 opacity-70" />
                        <MoreVertical className="w-5 h-5 opacity-70" />
                    </div>
                </header>

                {/* QR Scanner Simulation Overlay */}
                {isScanning && (
                    <div className="absolute inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center p-6 text-white">
                        <div className="w-64 h-64 border-2 border-dashed border-yellow-400 rounded-3xl relative overflow-hidden flex items-center justify-center">
                            <div className="absolute inset-0 bg-yellow-400/10 animate-pulse"></div>
                            <div className="w-full h-1 bg-yellow-400 absolute top-0 animate-[scan_2s_infinite]"></div>
                            <Camera className="w-12 h-12 text-yellow-400 opacity-50" />
                        </div>
                        <p className="mt-8 font-black text-xl tracking-tighter">QR 코드를 스캔 중입니다...</p>
                        <p className="mt-2 text-sm text-gray-400">설비의 QR 코드를 사각형 안에 맞춰주세요.</p>
                        <button onClick={() => setIsScanning(false)} className="mt-12 px-8 py-3 bg-white/10 hover:bg-white/20 rounded-full text-xs font-bold">취소하기</button>
                        <style>{`
                            @keyframes scan {
                                0% { top: 0; }
                                50% { top: 100%; }
                                100% { top: 0; }
                            }
                        `}</style>
                    </div>
                )}

                {/* Notification Toast */}
                {notification && (
                    <div className="absolute top-20 left-4 right-4 z-[60] bg-white/95 backdrop-blur shadow-2xl border-l-4 border-[#fee500] p-4 rounded-xl animate-in slide-in-from-top duration-300">
                        <div className="flex items-start gap-3">
                            <div className="bg-[#fee500] p-2 rounded-lg">
                                <Send className="w-4 h-4 text-black" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">KakaoTalk Notification</p>
                                <p className="text-sm font-semibold leading-snug">{notification.message}</p>
                                {notification.link && (
                                    <Link
                                        to={notification.link}
                                        className="inline-block mt-2 text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                                        onClick={() => setNotification(null)}
                                    >
                                        상세보기 페이지 열기 &rarr;
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Chat Area */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4 pb-48 custom-scrollbar">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={cn("flex flex-col animate-in fade-in slide-in-from-bottom-2", msg.type === "user" ? "items-end" : "items-start")}>
                            {msg.isAlert && (
                                <div className="w-full flex justify-center my-4 animate-in zoom-in duration-500">
                                    <div className="bg-black/10 backdrop-blur-sm px-4 py-2 rounded-2xl text-[11px] text-gray-700 font-bold border border-black/5 flex flex-col items-center">
                                        <span>{msg.message}</span>
                                        {msg.link && (
                                            <Link to={msg.link} className="mt-1 text-blue-600 underline">상세정보 확인</Link>
                                        )}
                                    </div>
                                </div>
                            )}
                            {!msg.isAlert && msg.isSummary ? (
                                <div className="flex flex-col w-full mb-4 items-start">
                                    <div className="bg-white p-5 rounded-2xl rounded-tl-none shadow-md w-[90%] border border-slate-100">
                                        <h3 className="text-sm font-bold text-slate-800 border-b pb-2 mb-3">요청 요약 확인</h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-400">공정명</span>
                                                <span className="font-bold">{formData.line}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-400">설비명</span>
                                                <span className="font-bold">{formData.machine}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-400">증상</span>
                                                <span className="font-bold">{formData.symptom}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-400">긴급도</span>
                                                <span className="font-bold text-red-500">🚨 {formData.priority}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-400">사진</span>
                                                <span className="font-bold">{formData.images?.length || 0}장 첨부됨</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-5">
                                            <button
                                                onClick={() => setCurrentStep("INIT")}
                                                className="flex-1 py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200"
                                            >
                                                수정하기
                                            </button>
                                            <button
                                                onClick={handleSubmit}
                                                className="flex-2 py-2 rounded-lg bg-[#fee500] text-black text-xs font-bold hover:bg-yellow-400 shadow-sm"
                                            >
                                                제출하기
                                            </button>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-gray-400 mt-1 ml-1">{msg.time}</span>
                                </div>
                            ) : !msg.isAlert && (
                                <ChatBubble type={msg.type} message={msg.message} time={msg.time} image={msg.image} />
                            )}
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="fixed bottom-0 w-full max-w-sm bg-white/95 backdrop-blur-md border-t border-black/5 p-3 pb-6 safe-area-bottom">
                    {/* Photo Upload for PHOTO step */}
                    {currentStep === "PHOTO" && role === "PRODUCTION" && (
                        <div className="mb-4 px-1">
                            <PhotoUpload photos={photos} onChange={setPhotos} minPhotos={1} maxPhotos={3} />
                        </div>
                    )}

                    {options && (
                        <div className="flex flex-wrap gap-2 mb-4 px-1 max-h-40 overflow-y-auto">
                            {options.map((opt) => (
                                <button
                                    key={opt}
                                    onClick={() => handleOptionClick(opt)}
                                    className="px-4 py-2 bg-[#fee500] hover:bg-yellow-300 active:scale-95 text-black text-[13px] font-bold rounded-full shadow-sm transition-all border border-black/5"
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-3 px-1">
                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                            <Camera className="w-7 h-7" />
                        </button>
                        <div className="flex-1 bg-gray-100 rounded-2xl flex items-center px-4 py-2.5 shadow-inner border border-black/5">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder={currentStep === "PHOTO" ? "추가 설명 (선택사항)..." : "메시지 입력..."}
                                className="bg-transparent w-full text-sm outline-none placeholder:text-gray-400"
                                disabled={currentStep === "CONFIRM" || currentStep === "SUMMARY"}
                            />
                        </div>
                        <button
                            onClick={handleSend}
                            className={cn("p-2.5 rounded-full transition-all active:scale-90",
                                (inputText || (currentStep === "PHOTO" && photos.length > 0))
                                    ? "bg-[#fee500] text-black shadow-md"
                                    : "bg-gray-200 text-gray-400 shadow-none"
                            )}
                            disabled={!inputText && !(currentStep === "PHOTO" && photos.length > 0)}
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Clock, Wrench, CheckCircle2, Camera, Activity, AlertCircle, User, Calendar } from "lucide-react";
import { storage } from "@/services/storage";
import { imageService } from "@/services/imageService";
import PhotoUpload from "@/components/PhotoUpload";
import { cn } from "@/lib/utils";

export default function RequestDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [request, setRequest] = useState(null);
    const [note, setNote] = useState("");
    const [status, setStatus] = useState("");

    // Completion Report Fields
    const [actionDetails, setActionDetails] = useState("");
    const [selectedParts, setSelectedParts] = useState([]);
    const [workDuration, setWorkDuration] = useState("");
    const [afterPhotos, setAfterPhotos] = useState([]);
    const [updaterName, setUpdaterName] = useState("김정비");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const data = storage.requests.getById(id);
        if (data) {
            setRequest(data);
            setStatus(data.status);
        }
    }, [id]);

    const handleUpdate = async () => {
        if (!status) return;

        setIsSubmitting(true);
        try {
            let resultPhotosArr = request.resultPhotos?.after || [];
            let completionDataResult = null;

            if (status === "작업완료") {
                // Validation for completion
                if (!actionDetails || !workDuration) {
                    alert("완료 시에는 조치 내용과 작업 소요시간을 입력해주세요.");
                    setIsSubmitting(false);
                    return;
                }

                if (afterPhotos.length < 1) {
                    alert("조치 후 사진을 최소 1장 첨부해주세요.");
                    setIsSubmitting(false);
                    return;
                }

                // 모든 사진에 워터마크 삽입
                const watermarkedAfterPhotos = await Promise.all(
                    afterPhotos.map(img => imageService.addWatermark(img, request.id))
                );

                resultPhotosArr = watermarkedAfterPhotos;
                completionDataResult = {
                    actionDetails,
                    parts: selectedParts,
                    workDuration,
                };
            }

            storage.requests.updateStatus(id, status, note, updaterName, resultPhotosArr, completionDataResult);

            const updated = storage.requests.getById(id);
            setRequest(updated);
            setNote("");
            setActionDetails("");
            setSelectedParts([]);
            setWorkDuration("");
            setAfterPhotos([]);
            alert("정비 상태가 업데이트 되었습니다. 생산팀에 알림이 전송되었습니다.");
        } catch (error) {
            console.error("Update failed:", error);
            alert("상태 업데이트 중 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!request) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 font-sans">
            <div className="animate-pulse flex flex-col items-center">
                <div className="w-12 h-12 bg-slate-200 rounded-full mb-4"></div>
                <div className="h-4 w-48 bg-slate-200 rounded"></div>
            </div>
            <p className="mt-4 text-slate-500 font-medium">요청 정보를 불러오는 중...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 pb-24">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-50 px-4 py-4 flex items-center justify-between shadow-sm">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-lg font-bold tracking-tight text-slate-800">요청 상세</h1>
                <div className="w-9 text-right text-xs text-blue-600 font-bold">{request.status}</div>
            </header>

            <main className="max-w-md mx-auto p-4 space-y-5">
                {/* ID & Global Status Card */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
                    <div className="relative z-10 flex flex-col gap-1">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-lg">REQ-NUMBER</span>
                            <div className={cn(
                                "px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-tighter shadow-sm",
                                request.status === "접수완료" ? "bg-red-500 text-white" :
                                    request.status === "정비완료" ? "bg-green-500 text-white" : "bg-blue-600 text-white"
                            )}>{request.status}</div>
                        </div>
                        <h2 className="text-2xl font-black tracking-tighter text-slate-800">{request.id}</h2>
                    </div>
                </div>

                {/* Core Info Info Card */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">요청자</p>
                            <div className="flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-sm font-bold text-slate-700">{request.applicant}</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">설비명</p>
                            <div className="flex items-center gap-2">
                                <Activity className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-sm font-bold text-slate-700">{request.machine}</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">접수시간</p>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-sm font-bold text-slate-700">{request.time}</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">긴급도</p>
                            <div className="flex items-center gap-2">
                                <AlertCircle className={cn(
                                    "w-3.5 h-3.5",
                                    request.priority?.includes("높음") ? "text-red-500" : "text-slate-400"
                                )} />
                                <span className={cn(
                                    "text-sm font-bold",
                                    request.priority?.includes("높음") ? "text-red-600" : "text-slate-700"
                                )}>{request.priority}</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-50">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">고장 내용 및 증상</p>
                            {!request.additionalInfo && request.status !== '작업완료' && (
                                <button
                                    onClick={() => {
                                        const link = `${window.location.origin}/additional-info/${request.id}`;
                                        navigator.clipboard.writeText(link);
                                        alert(`추가정보 요청 링크가 복사되었습니다!\n\n실제 운영시에는 작업자에게 카카오 알림톡으로 자동 발송됩니다.\n\n링크: ${link}`);
                                    }}
                                    className="text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full transition-colors"
                                >
                                    추가정보 요청
                                </button>
                            )}
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-sm font-bold text-slate-800 leading-snug">{request.symptom}</p>
                            {request.symptomCategory && (
                                <p className="text-xs text-blue-600 font-bold mt-1">카테고리: {request.symptomCategory}</p>
                            )}
                            <p className="text-xs text-slate-500 mt-2 leading-relaxed">{request.description}</p>
                        </div>

                        {/* Display Additional Info if exists */}
                        {request.additionalInfo && (
                            <div className="mt-4 p-4 bg-amber-50 rounded-2xl border-l-4 border-amber-400">
                                <p className="text-xs font-black text-amber-900 uppercase tracking-widest mb-2">추가 정보 (제출됨)</p>
                                {request.additionalInfo.symptoms?.length > 0 && (
                                    <div className="mb-2">
                                        <p className="text-[10px] font-bold text-amber-700 mb-1">추가 증상:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {request.additionalInfo.symptoms.map((s, idx) => (
                                                <span key={idx} className="text-[10px] bg-white px-2 py-0.5 rounded-full text-amber-800 font-medium">
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {request.additionalInfo.text && (
                                    <p className="text-xs text-amber-800 leading-relaxed">{request.additionalInfo.text}</p>
                                )}
                                <p className="text-[10px] text-amber-600 mt-2">제출시간: {request.additionalInfo.submittedAt}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* History Timeline - Redesigned to match uploaded_image_2 */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                    <h2 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" /> 처리 이력
                    </h2>
                    <div className="space-y-8 ml-2">
                        {request.history.map((item, idx) => (
                            <div key={idx} className="flex gap-4 relative">
                                {idx !== request.history.length - 1 && (
                                    <div className="absolute left-[7px] top-6 bottom-[-32px] w-[2px] bg-blue-100"></div>
                                )}
                                <div className={cn(
                                    "w-4 h-4 rounded-full mt-1 z-10 flex items-center justify-center border-2 border-white shadow-sm ring-4 ring-blue-50/50",
                                    idx === request.history.length - 1 ? "bg-blue-600" : "bg-blue-300"
                                )}></div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className={cn(
                                            "text-sm font-black",
                                            idx === request.history.length - 1 ? "text-blue-700" : "text-slate-700"
                                        )}>{item.status}</p>
                                        <p className="text-[10px] font-bold text-slate-400">{item.time}</p>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                        {item.note || `${item.updater || '담당자'} 확인 중`}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Work Results - Photo Comparison */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                    <h2 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2">
                        <Camera className="w-4 h-4 text-slate-600" /> 작업 결과
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Before</p>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                                {request.resultPhotos?.before?.length > 0 ? (
                                    request.resultPhotos.before.map((img, idx) => (
                                        <div key={idx} className="flex-shrink-0 w-full h-32 bg-slate-100 rounded-2xl overflow-hidden border border-slate-50">
                                            <img src={img} alt={`Before ${idx + 1}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))
                                ) : (
                                    <div className="w-full h-32 bg-slate-100 rounded-2xl flex items-center justify-center">
                                        <Camera className="w-6 h-6 text-slate-300" />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">After</p>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                                {request.resultPhotos?.after?.length > 0 ? (
                                    request.resultPhotos.after.map((img, idx) => (
                                        <div key={idx} className="flex-shrink-0 w-full h-32 bg-slate-100 rounded-2xl overflow-hidden border border-slate-50">
                                            <img src={img} alt={`After ${idx + 1}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))
                                ) : (
                                    <div className="w-full h-32 bg-slate-100 rounded-2xl flex items-center justify-center">
                                        <div className="flex flex-col items-center opacity-30">
                                            <CheckCircle2 className="w-6 h-6 text-slate-400" />
                                            <span className="text-[8px] font-bold mt-1 uppercase">Pending</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Update Form */}
                {request.status !== "작업완료" && (
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 space-y-6">
                        <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                            <Wrench className="w-4 h-4 text-blue-600" /> 상태 변경하기
                        </h2>

                        <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100">
                            {["작업중", "작업완료"].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStatus(s)}
                                    className={cn(
                                        "flex-1 py-3 rounded-xl text-xs font-black transition-all",
                                        status === s
                                            ? "bg-white text-blue-600 shadow-sm border border-slate-100"
                                            : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>

                        {/* Completion Report Fields (shown only when status is '작업완료') */}
                        {status === "작업완료" && (
                            <div className="space-y-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                <p className="text-xs font-black text-blue-700 uppercase tracking-widest">완료보고 (필수)</p>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">조치 후 사진 * (최소 1장)</label>
                                    <PhotoUpload photos={afterPhotos} onChange={setAfterPhotos} minPhotos={1} maxPhotos={3} />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">조치 내용 *</label>
                                    <textarea
                                        value={actionDetails}
                                        onChange={(e) => setActionDetails(e.target.value)}
                                        className="w-full bg-white border border-blue-100 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 min-h-[100px] placeholder:text-slate-400"
                                        placeholder="수행한 작업 내용을 상세히 입력하세요. (예: 베어링 교체, 청소 및 점검 완료)"
                                    ></textarea>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">사용 부품 (선택)</label>
                                    <select
                                        multiple
                                        value={selectedParts}
                                        onChange={(e) => setSelectedParts(Array.from(e.target.selectedOptions, option => option.value))}
                                        className="w-full bg-white border border-blue-100 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                                    >
                                        {storage.parts.getAll().map((part) => (
                                            <option key={part.code} value={part.code}>{part.name} ({part.code})</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-slate-400 italic">Ctrl+클릭으로 여러 개 선택 가능</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">작업 소요시간 *</label>
                                    <input
                                        type="text"
                                        value={workDuration}
                                        onChange={(e) => setWorkDuration(e.target.value)}
                                        className="w-full bg-white border border-blue-100 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                                        placeholder="예: 1시간 30분"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">처리자 이름 *</label>
                                    <input
                                        type="text"
                                        value={updaterName}
                                        onChange={(e) => setUpdaterName(e.target.value)}
                                        className="w-full bg-white border border-blue-100 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                                        placeholder="이름 입력"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">작업 메모 (선택)</label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 min-h-[100px] placeholder:text-slate-400 font-medium"
                                placeholder="추가적인 특이사항이나 전달사항을 입력하세요."
                            ></textarea>
                        </div>

                        <button
                            onClick={handleUpdate}
                            disabled={!status || isSubmitting}
                            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? "처리 중..." : "변경 사항 저장 및 알림 발송"}
                        </button>
                    </div>
                )}
            </main>

            {/* Float Bottom Navigation */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-2 py-2 bg-white/80 backdrop-blur-xl border border-white rounded-full shadow-2xl z-50">
                <Link to="/" className="px-6 py-2.5 rounded-full text-xs font-black text-slate-600 hover:bg-white transition-all">
                    챗봇
                </Link>
                <div className="w-[1px] h-4 bg-slate-200 mx-1"></div>
                <Link to="/admin" className="px-6 py-2.5 rounded-full text-xs font-black bg-slate-900 text-white shadow-lg active:scale-95 transition-all">
                    통합 관제
                </Link>
            </div>
        </div>
    );
}

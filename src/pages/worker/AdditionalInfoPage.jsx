import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { storage } from "@/services/storage";
import { imageService } from "@/services/imageService";
import { cn } from "@/lib/utils";
import PhotoUpload from "@/components/PhotoUpload";

export default function AdditionalInfoPage() {
    const { requestId } = useParams();
    const navigate = useNavigate();
    const [request, setRequest] = useState(null);
    const [additionalSymptoms, setAdditionalSymptoms] = useState([]);
    const [additionalText, setAdditionalText] = useState("");
    const [photos, setPhotos] = useState([]);
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const data = storage.requests.getById(requestId);
        if (data) {
            setRequest(data);
            // Check if already submitted
            if (data.additionalInfo) {
                setSubmitted(true);
            }
        }
    }, [requestId]);

    const handleSubmit = async () => {
        if (!additionalSymptoms.length && !additionalText.trim() && !photos.length) {
            alert("추가 증상, 상세 내용, 사진 중 하나는 입력해주세요.");
            return;
        }

        setIsSubmitting(true);
        try {
            // 모든 사진에 워터마크 삽입
            const watermarkedPhotos = await Promise.all(
                photos.map(img => imageService.addWatermark(img, requestId))
            );

            const additionalInfo = {
                symptoms: additionalSymptoms,
                text: additionalText,
                photos: watermarkedPhotos,
                submittedAt: new Date().toLocaleString()
            };

            storage.requests.addAdditionalInfo(requestId, additionalInfo);
            setSubmitted(true);
        } catch (error) {
            console.error("Submission failed:", error);
            alert("요청 처리 중 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!request) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <p className="text-slate-500">요청 정보를 찾을 수 없습니다.</p>
            </div>
        );
    }

    if (submitted || request.additionalInfo) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-6 font-sans">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-800">제출 완료!</h1>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        추가 정보가 정비팀에게 전달되었습니다.<br />
                        진행 상황은 카카오톡 알림으로 안내됩니다.
                    </p>
                    <div className="pt-4">
                        <p className="text-xs text-slate-400 font-mono">요청번호: {request.id}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 pb-20">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-50 px-4 py-4 flex items-center justify-between shadow-sm">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-lg font-bold tracking-tight text-slate-800">추가 정보 제출</h1>
                <div className="w-9"></div>
            </header>

            <main className="max-w-md mx-auto p-6 space-y-6">
                {/* Request Info Card */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-6 text-white shadow-xl">
                    <p className="text-xs font-bold opacity-80 uppercase tracking-widest mb-2">요청번호</p>
                    <h2 className="text-2xl font-black mb-4">{request.id}</h2>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-xs opacity-70">설비</p>
                            <p className="font-bold">{request.machine}</p>
                        </div>
                        <div>
                            <p className="text-xs opacity-70">증상</p>
                            <p className="font-bold">{request.symptom}</p>
                        </div>
                    </div>
                </div>

                {/* Additional Info Notice */}
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-xl">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-bold text-amber-900">정비팀이 추가 정보를 요청했습니다</p>
                            <p className="text-xs text-amber-700 mt-1">
                                더 정확한 진단을 위해 아래 정보를 입력해주세요.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-6">
                    <div className="space-y-3">
                        <label className="text-sm font-black text-slate-700">추가 증상 체크 (선택)</label>
                        <div className="space-y-2">
                            {storage.symptomCategories.getAll().map((symptom) => (
                                <label key={symptom} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={additionalSymptoms.includes(symptom)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setAdditionalSymptoms([...additionalSymptoms, symptom]);
                                            } else {
                                                setAdditionalSymptoms(additionalSymptoms.filter(s => s !== symptom));
                                            }
                                        }}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-200"
                                    />
                                    <span className="text-sm font-medium text-slate-700">{symptom}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-black text-slate-700">상세 내용 추가 (선택)</label>
                        <textarea
                            value={additionalText}
                            onChange={(e) => setAdditionalText(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 min-h-[150px] placeholder:text-slate-400"
                            placeholder="추가로 발견한 증상이나 특이사항을 자유롭게 입력하세요."
                        ></textarea>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-black text-slate-700">추가 사진 (최대 3장)</label>
                        <PhotoUpload photos={photos} onChange={setPhotos} minPhotos={0} maxPhotos={3} />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                처리 중...
                            </span>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                제출하기
                            </>
                        )}
                    </button>
                </div>
            </main>
        </div>
    );
}

import { useState } from "react";
import { Camera, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PhotoUpload({ photos, onChange, minPhotos = 1, maxPhotos = 3 }) {
    const [error, setError] = useState("");

    const addWatermark = (dataUrl) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = dataUrl;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                // Watermark Style
                const fontSize = Math.max(24, img.width / 25);
                ctx.font = `bold ${fontSize}px sans-serif`;

                // Shadow/Outline for visibility
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.lineWidth = fontSize / 6;
                ctx.lineJoin = 'round';

                const now = new Date();
                const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                const text = `[현장사진] ${timestamp}`;

                const x = 20;
                const y = img.height - 25;

                ctx.strokeText(text, x, y);
                ctx.fillStyle = 'rgba(255, 255, 0, 0.9)'; // Yellow text for high visibility
                ctx.fillText(text, x, y);

                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
        });
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);

        if (photos.length + files.length > maxPhotos) {
            setError(`최대 ${maxPhotos}장까지 첨부 가능합니다.`);
            return;
        }

        setError("");

        files.forEach((file) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const watermarked = await addWatermark(event.target.result);
                onChange([...photos, watermarked]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleRemove = (index) => {
        const updated = photos.filter((_, i) => i !== index);
        onChange(updated);
        setError("");
    };

    const isValid = photos.length >= minPhotos && photos.length <= maxPhotos;

    return (
        <div className="space-y-3">
            {/* Photo Grid */}
            <div className="grid grid-cols-3 gap-2">
                {photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square bg-slate-100 rounded-xl overflow-hidden border-2 border-slate-200">
                        <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                            onClick={() => handleRemove(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                        <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                            {index + 1}
                        </div>
                    </div>
                ))}

                {/* Add Photo Button */}
                {photos.length < maxPhotos && (
                    <label className="aspect-square bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-blue-400 transition-colors">
                        <Camera className="w-6 h-6 text-slate-400 mb-1" />
                        <span className="text-[10px] font-bold text-slate-500">사진 추가</span>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </label>
                )}
            </div>

            {/* Info and Error */}
            <div className="space-y-1">
                <div className={cn(
                    "text-[11px] font-medium flex items-center justify-between",
                    isValid ? "text-green-600" : "text-slate-500"
                )}>
                    <span>
                        {photos.length < minPhotos
                            ? `최소 ${minPhotos}장 이상 필요합니다`
                            : `${photos.length}/${maxPhotos}장`}
                    </span>
                    {isValid && <span className="text-green-600">✓ 완료</span>}
                </div>
                {error && (
                    <p className="text-[11px] font-medium text-red-500 flex items-center gap-1">
                        ⚠️ {error}
                    </p>
                )}
            </div>
        </div>
    );
}

/**
 * 이미지에 워터마크를 추가하는 서비스
 */
export const imageService = {
    /**
     * 이미지 데이터 URL에 워터마크를 삽입합니다.
     * @param {string} imageDataUrl - 원본 이미지 데이터 URL
     * @param {string} ticketId - 티켓 번호
     * @param {string} companyName - 회사명 (옵션)
     * @returns {Promise<string>} - 워터마크가 삽입된 이미지 데이터 URL
     */
    addWatermark: async (imageDataUrl, ticketId, companyName = "Guro Maintenance System") => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                canvas.width = img.width;
                canvas.height = img.height;

                // 원본 그리기
                ctx.drawImage(img, 0, 0);

                // 워터마크 설정
                const timestamp = new Date().toLocaleString();

                // 폰트 크기: 이미지 폭의 3% 대략 (최소 24px)
                const fontSize = Math.max(24, Math.floor(canvas.width * 0.035));
                ctx.font = `bold ${fontSize}px sans-serif`;

                // 텍스트 준비 (2줄)
                const line1 = companyName; // "Guro Maintenance System"
                const line2 = `ID: ${ticketId}  |  ${timestamp}`;

                const measure1 = ctx.measureText(line1);
                const measure2 = ctx.measureText(line2);

                const maxWidth = Math.max(measure1.width, measure2.width);
                const lineHeight = fontSize * 1.4;
                const totalHeight = lineHeight * 2;
                const padding = fontSize * 0.6;
                const margin = fontSize; // 우측 하단 여백

                // 배경 박스 (우측 하단)
                const boxX = canvas.width - maxWidth - (padding * 2) - margin;
                const boxY = canvas.height - totalHeight - (padding * 2) - margin;
                const boxW = maxWidth + (padding * 2);
                const boxH = totalHeight + (padding * 2);

                ctx.fillStyle = "rgba(0, 0, 0, 0.65)"; // 더 진한 배경
                ctx.fillRect(boxX, boxY, boxW, boxH);

                // 테두리 (선택사항, 노란색 포인트)
                ctx.strokeStyle = "#FFD700";
                ctx.lineWidth = 2;
                ctx.strokeRect(boxX, boxY, boxW, boxH);

                // 텍스트 그리기
                ctx.textAlign = "left";
                ctx.textBaseline = "top";

                // Line 1: 회사명 (노란색 강조)
                ctx.fillStyle = "#FFD700";
                ctx.fillText(line1, boxX + padding, boxY + padding);

                // Line 2: 정보 (흰색)
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText(line2, boxX + padding, boxY + padding + lineHeight);

                resolve(canvas.toDataURL("image/jpeg", 0.85));
            };
            img.onerror = reject;
            img.src = imageDataUrl;
        });
    }
};

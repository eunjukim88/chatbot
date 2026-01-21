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

                // 원본 이미지 그리기
                ctx.drawImage(img, 0, 0);

                // 워터마크 스타일 설정
                const timestamp = new Date().toLocaleString();
                const watermarkText = `${companyName} / ${ticketId} / ${timestamp}`;

                // 이미지 크기에 따라 폰트 크기 조절
                const fontSize = Math.max(20, Math.floor(canvas.width / 40));
                ctx.font = `bold ${fontSize}px sans-serif`;

                // 텍스트 배경 (가독성을 위해)
                const textWidth = ctx.measureText(watermarkText).width;
                const padding = fontSize * 0.5;

                ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
                ctx.fillRect(
                    canvas.width - textWidth - padding * 2 - 20,
                    canvas.height - fontSize - padding * 2 - 20,
                    textWidth + padding * 2,
                    fontSize + padding * 2
                );

                // 텍스트 그리기
                ctx.fillStyle = "white";
                ctx.textAlign = "right";
                ctx.fillText(
                    watermarkText,
                    canvas.width - 20 - padding,
                    canvas.height - 20 - padding - fontSize * 0.2
                );

                resolve(canvas.toDataURL("image/jpeg", 0.8));
            };
            img.onerror = reject;
            img.src = imageDataUrl;
        });
    }
};

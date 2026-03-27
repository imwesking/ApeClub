/* ============================================
   APECLUB — CHROMA KEY (Green Screen Removal)
   Renders video to canvas with green pixels
   replaced by transparency in real-time.
   ============================================ */

const ApeChromaKey = (() => {
    let video, canvas, ctx;
    let animFrameId = null;
    let isRunning = false;

    // Chroma key thresholds — tune if needed
    const GREEN_MIN_R = 0;
    const GREEN_MAX_R = 130;
    const GREEN_MIN_G = 80;
    const GREEN_MAX_G = 255;
    const GREEN_MIN_B = 0;
    const GREEN_MAX_B = 130;
    // How much greener G must be vs R and B
    const GREEN_DOMINANCE = 1.2;

    function init() {
        video = document.getElementById('nanaVideo');
        canvas = document.getElementById('nanaCanvas');
        if (!video || !canvas) return;

        ctx = canvas.getContext('2d', { willReadFrequently: true });

        // Ensure video starts from beginning
        video.currentTime = 0;

        // Clear canvas until video is ready
        video.addEventListener('loadeddata', () => {
            resizeCanvas();
            // Seek to 0 and draw the first frame immediately
            video.currentTime = 0;
        });

        video.addEventListener('seeked', function onFirstSeek() {
            // Process the very first frame before playback
            processFrame();
            video.removeEventListener('seeked', onFirstSeek);
        });

        video.addEventListener('playing', () => {
            resizeCanvas();
            start();
        });

        // If video is already loaded and playing (cached)
        if (video.readyState >= 2) {
            video.currentTime = 0;
            resizeCanvas();
            start();
        }
    }

    function resizeCanvas() {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    }

    function start() {
        if (isRunning) return;
        isRunning = true;
        processFrame();
    }

    function processFrame() {
        if (!isRunning) return;
        animFrameId = requestAnimationFrame(processFrame);

        if (video.paused || video.ended) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = frame.data;
        const len = data.length;

        for (let i = 0; i < len; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Check if this pixel is "green screen"
            if (
                g > GREEN_MIN_G &&
                g > r * GREEN_DOMINANCE &&
                g > b * GREEN_DOMINANCE &&
                r < GREEN_MAX_R &&
                b < GREEN_MAX_B
            ) {
                // Make fully transparent
                data[i + 3] = 0;
            } else {
                // Edge softening: partially green pixels get partial transparency
                const greenRatio = g / (r + g + b + 1);
                if (greenRatio > 0.4 && g > 60) {
                    const alpha = Math.max(0, 1 - (greenRatio - 0.4) * 4);
                    data[i + 3] = Math.round(alpha * 255);
                }
            }
        }

        ctx.putImageData(frame, 0, 0);
    }

    function destroy() {
        isRunning = false;
        if (animFrameId) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        }
    }

    return { init, destroy };
})();

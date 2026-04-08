/* ============================================
   APECLUB — CHROMA KEY (Green Screen Removal)
   Renders video to canvas with green pixels
   replaced by transparency in real-time.
   Uses requestVideoFrameCallback when available
   to avoid processing duplicate frames, and
   renders at half resolution for performance.
   ============================================ */

const ApeChromaKey = (() => {
    let video, canvas, ctx;
    let isRunning = false;
    let rvfcHandle = null;
    let rafHandle = null;
    const supportsRVFC = 'requestVideoFrameCallback' in HTMLVideoElement.prototype;

    // Chroma key thresholds — tune if needed
    const GREEN_MIN_G = 80;
    const GREEN_MAX_R = 130;
    const GREEN_MAX_B = 130;
    const GREEN_DOMINANCE = 1.2;

    function init() {
        video = document.getElementById('nanaVideo');
        canvas = document.getElementById('nanaCanvas');
        if (!video || !canvas) return;

        ctx = canvas.getContext('2d', { willReadFrequently: true });
        video.currentTime = 0;

        video.addEventListener('loadeddata', () => {
            resizeCanvas();
            video.currentTime = 0;
        });

        video.addEventListener('seeked', function onFirstSeek() {
            processFrame();
            video.removeEventListener('seeked', onFirstSeek);
        });

        video.addEventListener('playing', () => {
            resizeCanvas();
            start();
        });

        if (video.readyState >= 2) {
            video.currentTime = 0;
            resizeCanvas();
            start();
        }
    }

    function resizeCanvas() {
        // Half resolution — processed at 50%, CSS scales up visually
        canvas.width = Math.floor(video.videoWidth / 2);
        canvas.height = Math.floor(video.videoHeight / 2);
    }

    function start() {
        if (isRunning) return;
        isRunning = true;
        scheduleFrame();
    }

    function scheduleFrame() {
        if (!isRunning) return;
        if (supportsRVFC) {
            rvfcHandle = video.requestVideoFrameCallback(processFrame);
        } else {
            rafHandle = requestAnimationFrame(processFrame);
        }
    }

    function processFrame() {
        if (!isRunning) return;

        if (!video.paused && !video.ended) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = frame.data;
            const len = data.length;

            for (let i = 0; i < len; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                if (
                    g > GREEN_MIN_G &&
                    g > r * GREEN_DOMINANCE &&
                    g > b * GREEN_DOMINANCE &&
                    r < GREEN_MAX_R &&
                    b < GREEN_MAX_B
                ) {
                    data[i + 3] = 0;
                } else {
                    const greenRatio = g / (r + g + b + 1);
                    if (greenRatio > 0.4 && g > 60) {
                        const alpha = Math.max(0, 1 - (greenRatio - 0.4) * 4);
                        data[i + 3] = Math.round(alpha * 255);
                    }
                }
            }

            ctx.putImageData(frame, 0, 0);
        }

        scheduleFrame();
    }

    function destroy() {
        isRunning = false;
        if (supportsRVFC && rvfcHandle !== null) {
            video.cancelVideoFrameCallback(rvfcHandle);
            rvfcHandle = null;
        }
        if (rafHandle !== null) {
            cancelAnimationFrame(rafHandle);
            rafHandle = null;
        }
    }

    return { init, destroy };
})();

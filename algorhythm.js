/* =========================================
   ALGORITHM VISUALIZER DYNAMIC MODULE
========================================= */

(function () {
    "use strict";

    const ALGO_CONFIG = {
        sensitivity: 1.1,
        smoothing: 0.75,
        palette: ["#8b5cf6", "#ec4899", "#f97316"]
    };

    let audioCtx = null;
    let analyser = null;
    let dataArray = null;
    let audioSource = null;
    let animationId = null;
    let canvas = null;
    let ctx = null;
    let gradient = null;
    let isRunning = false;

    const fullscreenEvents = [
        "fullscreenchange",
        "webkitfullscreenchange"
    ];

    fullscreenEvents.forEach(event => {
        document.addEventListener(event, handleFullscreenChange);
    });

    function handleFullscreenChange() {
        const isFullscreen =
            document.fullscreenElement ||
            document.webkitFullscreenElement;

        const fullscreenUI = document.querySelector(".fullscreen-ui");

        if (isFullscreen && fullscreenUI) {
            createCanvas(fullscreenUI);
            startVisualizer();
        } else {
            stopVisualizer();
            removeCanvas();
        }
    }

    function createCanvas(container) {
        canvas = document.getElementById("algoCanvas");

        if (!canvas) {
            canvas = document.createElement("canvas");
            canvas.id = "algoCanvas";

            canvas.style.cssText = [
                "width: 90vw",
                "max-width: 750px",
                "height: 120px",
                "border-radius: 16px",
                "background: rgba(0, 0, 0, 0.4)",
                "margin: 12px 0",
                "display: block"
            ].join(";");

            const artistName = document.getElementById("artistName");

            if (artistName && artistName.parentNode) {
                artistName.parentNode.insertBefore(
                    canvas,
                    artistName.nextSibling
                );
            } else {
                container.appendChild(canvas);
            }
        }

        ctx = canvas.getContext("2d");

        if (!ctx) {
            console.error("Unable to initialize canvas context.");
            return;
        }

        resizeCanvas();
    }

    function resizeCanvas() {
        if (!canvas || !ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        if (!width || !height) return;

        const pixelWidth = Math.round(width * dpr);
        const pixelHeight = Math.round(height * dpr);

        // Only resize when dimensions actually change.
        if (
            canvas.width !== pixelWidth ||
            canvas.height !== pixelHeight
        ) {
            canvas.width = pixelWidth;
            canvas.height = pixelHeight;
        }

        // Reset transform instead of repeatedly scaling it.
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, ALGO_CONFIG.palette[0]);
        gradient.addColorStop(0.5, ALGO_CONFIG.palette[1]);
        gradient.addColorStop(1, ALGO_CONFIG.palette[2]);
    }

    function setupAudio() {
        const audioElement =
            window.audio instanceof HTMLMediaElement
                ? window.audio
                : document.querySelector("audio");

        if (!audioElement) {
            console.warn("No audio element found.");
            return false;
        }

        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) {
            console.warn("Web Audio API is not supported.");
            return false;
        }

        try {
            if (!audioCtx) {
                audioCtx = new AudioContextClass();

                analyser = audioCtx.createAnalyser();
                analyser.fftSize = 128;
                analyser.smoothingTimeConstant =
                    ALGO_CONFIG.smoothing;

                dataArray = new Uint8Array(
                    analyser.frequencyBinCount
                );
            }

            // A media element can only have one MediaElementSource
            // connection during its lifetime. Reuse this source.
            if (!audioSource) {
                audioSource =
                    audioCtx.createMediaElementSource(audioElement);

                audioSource.connect(analyser);
                analyser.connect(audioCtx.destination);
            }

            return true;
        } catch (error) {
            console.error("Web Audio API error:", error);
            return false;
        }
    }

    async function startVisualizer() {
        if (isRunning) return;

        if (!canvas || !ctx) return;
        if (!setupAudio()) return;

        try {
            if (audioCtx.state === "suspended") {
                await audioCtx.resume();
            }
        } catch (error) {
            console.error("Unable to resume audio context:", error);
            return;
        }

        // The visualizer may have been stopped while resuming.
        if (!canvas || !ctx || isRunning) return;

        isRunning = true;
        resizeCanvas();
        render();
    }

    function stopVisualizer() {
        isRunning = false;

        if (animationId !== null) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }

    function removeCanvas() {
        const existingCanvas = document.getElementById("algoCanvas");

        if (existingCanvas) {
            existingCanvas.remove();
        }

        canvas = null;
        ctx = null;
        gradient = null;
    }

    function render() {
        if (!isRunning || !canvas || !ctx || !analyser) {
            animationId = null;
            return;
        }

        animationId = requestAnimationFrame(render);

        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        if (!width || !height) return;

        // Handle resizing without resetting the transform every frame.
        const dpr = window.devicePixelRatio || 1;

        if (
            canvas.width !== Math.round(width * dpr) ||
            canvas.height !== Math.round(height * dpr)
        ) {
            resizeCanvas();
        }

        ctx.clearRect(0, 0, width, height);
        analyser.getByteFrequencyData(dataArray);

        const bufferLength = analyser.frequencyBinCount;
        const slotWidth = width / bufferLength;
        const barWidth = Math.max(1, slotWidth * 0.8);

        for (let i = 0; i < bufferLength; i++) {
            const magnitude = dataArray[i] / 255;

            const barHeight = Math.min(
                height,
                magnitude * height * ALGO_CONFIG.sensitivity
            );

            if (barHeight <= 0) continue;

            const x = i * slotWidth;
            const y = height - barHeight;

            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barWidth, barHeight);
        }
    }

    // Keep the canvas crisp when the window or display changes size.
    window.addEventListener("resize", resizeCanvas);

    // Also clean up if the page is unloaded.
    window.addEventListener("pagehide", stopVisualizer);
})();

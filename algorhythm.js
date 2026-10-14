/* =========================================
   ALGORHYTHM VISUALIZER DYNAMIC MODULE
========================================= */

(function () {
    const ALGO_CONFIG = {
        sensitivity: 1.1,
        smoothing: 0.75,
        palette: ['#8b5cf6', '#ec4899', '#f97316'] // Sunset gradient
    };

    let audioCtx = null;
    let analyser = null;
    let dataArray = null;
    let sourceConnected = false;
    let animationId = null;
    let canvas = null;
    let ctx = null;

    // Listen for fullscreen changes to inject or remove the canvas dynamically
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    function handleFullscreenChange() {
        const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
        const fullscreenUI = document.querySelector('.fullscreen-ui');

        if (isFullscreen && fullscreenUI) {
            // Inject Canvas if it doesn't already exist in fullscreen view
            if (!document.getElementById("algoCanvas")) {
                canvas = document.createElement("canvas");
                canvas.id = "algoCanvas";
                canvas.style.cssText = "width: min(85vw, 400px); height: 90px; border-radius: 12px; background: rgba(0, 0, 0, 0.3); margin: 10px 0;";
                
                // Insert canvas right below the artist name / metadata
                const artistNameEl = document.getElementById("artistName");
                if (artistNameEl && artistNameEl.parentNode) {
                    artistNameEl.parentNode.insertBefore(canvas, artistNameEl.nextSibling);
                } else {
                    fullscreenUI.appendChild(canvas);
                }
            }

            ctx = canvas.getContext("2d");
            startVisualizer();
        } else {
            // Remove Canvas and stop rendering loop when leaving fullscreen
            stopVisualizer();
            if (canvas && canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
                canvas = null;
            }
        }
    }

    function startVisualizer() {
        if (!window.audio && !document.querySelector("audio")) return;
        const audioElement = window.audio || document.querySelector("audio");

        if (!audioCtx) {
            try {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                audioCtx = new AudioContextClass();
                analyser = audioCtx.createAnalyser();
                analyser.fftSize = 64;
                analyser.smoothingTimeConstant = ALGO_CONFIG.smoothing;

                if (audioElement && !sourceConnected) {
                    const source = audioCtx.createMediaElementSource(audioElement);
                    source.connect(analyser);
                    analyser.connect(audioCtx.destination);
                    sourceConnected = true;
                }
            } catch (e) {
                console.error("Web Audio API error:", e);
            }
        }

        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        if (analyser && !dataArray) {
            dataArray = new Uint8Array(analyser.frequencyBinCount);
        }

        render();
    }

    function stopVisualizer() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }

    function render() {
        if (!canvas || !analyser) return;

        animationId = requestAnimationFrame(render);

        canvas.width = canvas.clientWidth * window.devicePixelRatio;
        canvas.height = canvas.clientHeight * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        ctx.clearRect(0, 0, width, height);
        analyser.getByteFrequencyData(dataArray);

        const bufferLength = analyser.frequencyBinCount;
        const barWidth = (width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            let barHeight = (dataArray[i] / 255) * height * ALGO_CONFIG.sensitivity;

            let gradient = ctx.createLinearGradient(0, height, 0, 0);
            gradient.addColorStop(0, ALGO_CONFIG.palette[0]);
            gradient.addColorStop(0.5, ALGO_CONFIG.palette[1]);
            gradient.addColorStop(1, ALGO_CONFIG.palette[2]);

            ctx.fillStyle = gradient;
            ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight);

            x += barWidth + 1;
        }
    }
})();

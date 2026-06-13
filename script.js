document.addEventListener("DOMContentLoaded", () => {
    // Data is available in global `dinosaurs` array from data.js

    const dinoSelect = document.getElementById("dino-select");
    const infoPanel = document.getElementById("info-panel");
    const dinoNameEl = document.getElementById("dino-name");
    const dinoCategoryEl = document.getElementById("dino-category");
    const dinoLengthEl = document.getElementById("dino-length");
    const dinoHeightEl = document.getElementById("dino-height");
    const dinoExtractEl = document.getElementById("dino-extract");
    
    const canvas = document.getElementById("canvas");
    const yAxis = document.getElementById("y-axis");
    const xAxis = document.getElementById("x-axis");
    
    const humanEl = document.getElementById("human");
    const dinoEl = document.getElementById("dinosaur");
    const dinoSvgContainer = document.getElementById("dino-svg-container");
    
    const dinoImg = document.getElementById("dino-img");
    const dinoLoading = document.getElementById("dino-loading");
    const dinoFallback = document.getElementById("dino-fallback");
    const dinoVisualLabel = document.getElementById("dino-visual-label");

    // Constants
    const HUMAN_HEIGHT_M = 1.8;
    const HUMAN_WIDTH_M = 0.6; // Approximate width for placement
    const DINO_GAP_M = 0.2; // Gap between human and dinosaur
    
    // Sort dinosaurs alphabetically
    const sortedDinosaurs = [...dinosaurs].sort((a, b) => a.name.localeCompare(b.name));

    // Populate Select
    sortedDinosaurs.forEach((dino, index) => {
        const option = document.createElement("option");
        option.value = index; // Store index in sorted array
        option.textContent = dino.name;
        dinoSelect.appendChild(option);
    });

    // Resize handler to recalculate scaling when window changes
    let currentDino = null;
    window.addEventListener("resize", () => {
        if (currentDino) {
            renderVisualization(currentDino);
        } else {
            // Render just the human initially
            renderVisualization(null);
        }
    });

    // Handle Selection
    dinoSelect.addEventListener("change", async (e) => {
        const selectedIndex = e.target.value;
        if (selectedIndex !== "") {
            currentDino = sortedDinosaurs[selectedIndex];
            
            // 1. Update Info Panel Base Data
            dinoNameEl.textContent = currentDino.name;
            dinoCategoryEl.textContent = currentDino.kategori || "Unknown";
            dinoLengthEl.textContent = `${currentDino.length}m`;
            dinoHeightEl.textContent = `${currentDino.height}m`;
            infoPanel.classList.remove("hidden");
            
            // 2. Render SVG Silhouette and Grid bounds
            const svgMarkup = getCategorySVG(currentDino.kategori);
            dinoSvgContainer.innerHTML = svgMarkup;
            renderVisualization(currentDino);
            
            // 3. Fetch Wikipedia Image & Extract
            dinoExtractEl.textContent = "Loading details from Wikipedia...";
            dinoImg.classList.add("hidden");
            dinoFallback.classList.add("hidden");
            dinoLoading.classList.remove("hidden");

            try {
                const wikiTitle = currentDino.name.replace(/ /g, '_');
                const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${wikiTitle}`);
                
                if (!response.ok) {
                    throw new Error("Wikipedia page not found");
                }
                
                const data = await response.json();
                
                // Update Extract
                if (data.extract) {
                    dinoExtractEl.textContent = data.extract;
                } else {
                    dinoExtractEl.textContent = "No description available.";
                }

                // Update Image
                if (data.thumbnail && data.thumbnail.source) {
                    dinoImg.src = data.thumbnail.source;
                    dinoImg.onload = () => {
                        dinoLoading.classList.add("hidden");
                        dinoImg.classList.remove("hidden");
                    };
                    dinoImg.onerror = () => {
                        showFallback();
                    };
                } else {
                    showFallback();
                }

            } catch (error) {
                console.error("Error fetching Wikipedia data:", error);
                dinoExtractEl.textContent = "Failed to load details.";
                showFallback();
            }
        }
    });

    function showFallback() {
        dinoLoading.classList.add("hidden");
        dinoFallback.classList.remove("hidden");
    }

    function renderVisualization(dino) {
        // Clear old ticks
        document.querySelectorAll('.tick, .tick-label').forEach(el => el.remove());

        const canvasWidthPx = canvas.clientWidth;
        const canvasHeightPx = canvas.clientHeight;

        if (canvasWidthPx === 0 || canvasHeightPx === 0) return;

        let maxReqHeightM = HUMAN_HEIGHT_M;
        let maxReqWidthM = HUMAN_WIDTH_M + DINO_GAP_M;

        if (dino) {
            maxReqHeightM = Math.max(HUMAN_HEIGHT_M, dino.height);
            maxReqWidthM = HUMAN_WIDTH_M + DINO_GAP_M + dino.length;
        }

        // Add padding
        maxReqHeightM *= 1.2;
        maxReqWidthM *= 1.1;

        maxReqHeightM = Math.max(maxReqHeightM, 3);
        maxReqWidthM = Math.max(maxReqWidthM, 5);

        const pxPerMeterY = canvasHeightPx / maxReqHeightM;
        const pxPerMeterX = canvasWidthPx / maxReqWidthM;

        const pxPerMeter = Math.min(pxPerMeterX, pxPerMeterY);

        // Render Human
        const humanHeightPx = HUMAN_HEIGHT_M * pxPerMeter;
        const humanWidthPx = HUMAN_WIDTH_M * pxPerMeter;
        humanEl.style.height = `${humanHeightPx}px`;
        humanEl.style.width = `${humanWidthPx}px`;
        humanEl.style.left = `0px`;

        // Render Dinosaur
        if (dino) {
            const dinoHeightPx = dino.height * pxPerMeter;
            const dinoWidthPx = dino.length * pxPerMeter;
            const dinoLeftPx = (HUMAN_WIDTH_M + DINO_GAP_M) * pxPerMeter;

            dinoEl.style.height = `${dinoHeightPx}px`;
            dinoEl.style.width = `${dinoWidthPx}px`;
            dinoEl.style.left = `${dinoLeftPx}px`;
            dinoVisualLabel.textContent = dino.name;
            dinoEl.classList.remove("hidden");
        } else {
            dinoEl.classList.add("hidden");
        }

        drawTicks(pxPerMeter, maxReqWidthM, maxReqHeightM);
    }

    function drawTicks(pxPerMeter, maxReqWidthM, maxReqHeightM) {
        let step = 1;
        if (maxReqWidthM > 20 || maxReqHeightM > 20) step = 5;
        if (maxReqWidthM > 50 || maxReqHeightM > 50) step = 10;

        for (let i = 0; i <= maxReqWidthM; i += step) {
            const xPx = i * pxPerMeter;
            const tick = document.createElement("div");
            tick.className = "tick tick-x";
            tick.style.left = `${xPx}px`;
            xAxis.appendChild(tick);

            if (i > 0) {
                const label = document.createElement("div");
                label.className = "tick-label tick-label-x";
                label.style.left = `${xPx}px`;
                label.textContent = `${i}m`;
                xAxis.appendChild(label);
            }
        }

        for (let i = 0; i <= maxReqHeightM; i += step) {
            const yPx = i * pxPerMeter;
            const tick = document.createElement("div");
            tick.className = "tick tick-y";
            tick.style.bottom = `${yPx}px`;
            yAxis.appendChild(tick);

            if (i > 0) {
                const label = document.createElement("div");
                label.className = "tick-label tick-label-y";
                label.style.bottom = `${yPx}px`;
                label.textContent = `${i}m`;
                yAxis.appendChild(label);
            }
        }
    }

    function getCategorySVG(category) {
        // Generic minimalist silhouettes representing the categories
        // viewBox matches typical proportions (width:length, height:height)
        switch(category) {
            case "Theropoda":
                // Bipedal carnivore
                return `<svg viewBox="0 0 100 40" preserveAspectRatio="none">
                            <path d="M10,20 Q30,20 40,10 Q50,0 70,5 Q90,10 95,20 Q100,30 90,30 Q70,30 50,20 L45,40 L35,40 L40,25 Q20,30 10,20 Z" />
                        </svg>`;
            case "Sauropoda":
                // Quadrupedal long neck
                return `<svg viewBox="0 0 100 60" preserveAspectRatio="none">
                            <path d="M5,40 Q10,20 30,5 Q40,0 45,5 Q40,20 50,30 Q70,30 90,40 Q95,45 90,50 L80,60 L70,60 L75,50 Q60,55 40,50 L35,60 L25,60 L30,45 Q15,45 5,40 Z" />
                        </svg>`;
            case "Ceratopsia":
                // Quadrupedal horned, large head
                return `<svg viewBox="0 0 100 45" preserveAspectRatio="none">
                            <path d="M10,20 Q20,10 40,5 Q50,0 55,10 Q60,20 80,25 Q95,30 90,40 Q70,45 50,40 L45,45 L35,45 L40,35 Q20,40 10,20 Z" />
                        </svg>`;
            case "Ornithopoda":
                // Bipedal/Quadrupedal herbivore
                return `<svg viewBox="0 0 100 40" preserveAspectRatio="none">
                            <path d="M15,25 Q30,15 45,10 Q60,5 75,15 Q90,25 85,35 Q70,40 50,35 L45,40 L35,40 L40,30 Q25,35 15,25 Z" />
                        </svg>`;
            case "Thyreophora":
                // Quadrupedal armored
                return `<svg viewBox="0 0 100 35" preserveAspectRatio="none">
                            <path d="M5,25 Q20,10 50,5 Q80,10 95,25 Q90,30 80,35 L70,35 L75,25 Q50,30 30,25 L25,35 L15,35 L20,20 Q10,25 5,25 Z" />
                        </svg>`;
            default:
                // Generic blocky biped
                return `<svg viewBox="0 0 100 50" preserveAspectRatio="none">
                            <rect x="10" y="10" width="80" height="30" rx="10" />
                            <rect x="30" y="30" width="10" height="20" />
                            <rect x="60" y="30" width="10" height="20" />
                        </svg>`;
        }
    }

    // Initial render for just the human
    setTimeout(() => {
        renderVisualization(null);
    }, 50);
});

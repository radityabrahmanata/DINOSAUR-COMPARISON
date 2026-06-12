document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize Animations
    AOS.init({
        once: true,
        offset: 50,
        duration: 800,
        easing: 'ease-out-cubic',
    });

    // 2. Sticky Navbar & Mobile Menu
    const navbar = document.getElementById("navbar");
    window.addEventListener("scroll", () => {
        if (window.scrollY > 50) {
            navbar.classList.add("scrolled");
        } else {
            navbar.classList.remove("scrolled");
        }
    });

    const mobileMenuBtn = document.getElementById("mobile-menu-btn");
    const mobileMenu = document.getElementById("mobile-menu");
    
    mobileMenuBtn.addEventListener("click", () => {
        mobileMenu.classList.toggle("hidden");
    });
    
    // Close mobile menu on link click
    mobileMenu.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            mobileMenu.classList.add("hidden");
        });
    });

    // 3. Database & Search Logic
    // Sort dinosaurs alphabetically
    const sortedDinosaurs = [...dinosaurs].sort((a, b) => a.name.localeCompare(b.name));
    
    const searchInput = document.getElementById("dino-search");
    const searchResults = document.getElementById("search-results");
    const dbCount = document.getElementById("db-count");
    
    dbCount.textContent = `${sortedDinosaurs.length} RECORDS`;

    function renderSearchResults(results) {
        searchResults.innerHTML = "";
        if (results.length === 0) {
            searchResults.innerHTML = `<div class="p-4 text-gray-500 font-mono text-sm">NO RECORDS FOUND</div>`;
        } else {
            results.forEach(dino => {
                const div = document.createElement("div");
                div.className = "p-4 border-b border-glassBorder cursor-pointer search-result-item flex justify-between items-center";
                div.innerHTML = `
                    <span class="font-heading font-bold text-white">${dino.name}</span>
                    <span class="font-mono text-xs text-tealAccent">${dino.kategori || 'UNKNOWN'}</span>
                `;
                div.addEventListener("click", () => {
                    searchInput.value = dino.name;
                    searchResults.classList.add("hidden");
                    selectSpecimen(dino);
                });
                searchResults.appendChild(div);
            });
        }
        searchResults.classList.remove("hidden");
    }

    function handleSearch() {
        const query = searchInput.value.toLowerCase();
        if (query.trim() === "") {
            searchResults.classList.add("hidden");
            return;
        }
        const filtered = sortedDinosaurs.filter(d => d.name.toLowerCase().includes(query));
        renderSearchResults(filtered);
    }

    searchInput.addEventListener("input", handleSearch);
    searchInput.addEventListener("focus", handleSearch);


    // Hide search results when clicking outside
    document.addEventListener("click", (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.add("hidden");
        }
    });

    // 4. Lab Interface Logic
    const dinoNameEl = document.getElementById("dino-name");
    const dinoCategoryEl = document.getElementById("dino-category");
    const dinoExtractEl = document.getElementById("dino-extract");
    const dinoImg = document.getElementById("dino-img");
    const dinoLoading = document.getElementById("dino-loading");
    const dinoFallback = document.getElementById("dino-fallback");

    // Stats
    const statLength = document.getElementById("stat-length");
    const barLength = document.getElementById("bar-length");
    const statHeight = document.getElementById("stat-height");
    const barHeight = document.getElementById("bar-height");
    const statWeight = document.getElementById("stat-weight");
    const barWeight = document.getElementById("bar-weight");
    const statEra = document.getElementById("stat-era");
    const statDiet = document.getElementById("stat-diet");

    // Viewer
    const canvas = document.getElementById("canvas");
    const dinoEl = document.getElementById("dinosaur");
    const dinoSvgContainer = document.getElementById("dino-svg-container");
    const humanEl = document.getElementById("human");
    const xAxis = document.getElementById("x-axis");
    const yAxis = document.getElementById("y-axis");

    const HUMAN_HEIGHT_M = 1.8;
    const HUMAN_WIDTH_M = 0.6;
    const DINO_GAP_M = 0.5;

    // Derived Data Generators (Mocking extended data)
    function deriveDiet(kategori) {
        if (kategori === "Theropoda") return "CARNIVORE";
        if (kategori === "Unknown") return "OMNIVORE";
        return "HERBIVORE";
    }

    function deriveEra(name) {
        const hash = name.length % 3;
        if (hash === 0) return "LATE CRETACEOUS";
        if (hash === 1) return "EARLY JURASSIC";
        return "LATE JURASSIC";
    }

    function deriveWeightKg(length) {
        // Very rough cubic estimation relative to length
        return Math.round(Math.pow(length, 2.5) * 15);
    }

    async function selectSpecimen(dino) {
        // UI Updates
        dinoNameEl.textContent = dino.name;
        dinoCategoryEl.textContent = dino.kategori || "UNKNOWN CLADE";
        
        const weight = deriveWeightKg(dino.length);
        const diet = deriveDiet(dino.kategori);
        const era = deriveEra(dino.name);

        // Animate numbers
        statLength.textContent = dino.length.toFixed(1);
        statHeight.textContent = dino.height.toFixed(1);
        statWeight.textContent = weight.toLocaleString();
        statEra.textContent = era;
        statDiet.textContent = diet;

        // Progress bars (max limits for 100% width)
        const maxLength = 40; // Max length in dataset approx
        const maxHeight = 20; // Max height in dataset approx
        const maxWeight = 100000; // 100 tons approx

        barLength.style.width = `${Math.min((dino.length / maxLength) * 100, 100)}%`;
        barHeight.style.width = `${Math.min((dino.height / maxHeight) * 100, 100)}%`;
        barWeight.style.width = `${Math.min((weight / maxWeight) * 100, 100)}%`;

        // Fetch Wiki Data
        dinoExtractEl.innerHTML = `<span class="text-tealAccent animate-pulse">DOWNLOADING ARCHIVAL DATA...</span>`;
        dinoImg.classList.add("hidden");
        dinoFallback.classList.add("hidden");
        dinoLoading.classList.remove("hidden");

        try {
            const wikiTitle = dino.name.replace(/ /g, '_');
            const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${wikiTitle}`);
            if (!response.ok) throw new Error("Not found");
            const data = await response.json();
            
            dinoExtractEl.innerHTML = data.extract ? data.extract : "DATA CORRUPTED. NO TEXTUAL RECORDS FOUND.";
            
            if (data.thumbnail && data.thumbnail.source) {
                dinoImg.src = data.thumbnail.source;
                dinoImg.onload = () => {
                    dinoLoading.classList.add("hidden");
                    dinoImg.classList.remove("hidden");
                };
                dinoImg.onerror = () => showFallback();
            } else {
                showFallback();
            }
        } catch (error) {
            dinoExtractEl.innerHTML = "<span class='text-red-500'>ERROR 404: ARCHIVAL DATA NOT FOUND.</span>";
            showFallback();
        }

        // Render Hologram
        dinoSvgContainer.innerHTML = getCategorySVG(dino.kategori);
        renderVisualization(dino);
    }

    function showFallback() {
        dinoLoading.classList.add("hidden");
        dinoFallback.classList.remove("hidden");
    }

    function renderVisualization(dino) {
        const canvasWidthPx = canvas.clientWidth;
        const canvasHeightPx = canvas.clientHeight;
        if (canvasWidthPx === 0 || canvasHeightPx === 0) return;

        let maxReqHeightM = HUMAN_HEIGHT_M;
        let maxReqWidthM = HUMAN_WIDTH_M + DINO_GAP_M;

        if (dino) {
            maxReqHeightM = Math.max(HUMAN_HEIGHT_M, dino.height);
            maxReqWidthM = HUMAN_WIDTH_M + DINO_GAP_M + dino.length;
        }

        maxReqHeightM *= 1.2;
        maxReqWidthM *= 1.2;

        const pxPerMeterY = canvasHeightPx / maxReqHeightM;
        const pxPerMeterX = canvasWidthPx / maxReqWidthM;
        const pxPerMeter = Math.min(pxPerMeterX, pxPerMeterY);

        // Human
        humanEl.style.height = `${HUMAN_HEIGHT_M * pxPerMeter}px`;
        humanEl.style.width = `${HUMAN_WIDTH_M * pxPerMeter}px`;
        
        // Dino
        if (dino) {
            dinoEl.style.height = `${dino.height * pxPerMeter}px`;
            dinoEl.style.width = `${dino.length * pxPerMeter}px`;
            dinoEl.style.left = `${(HUMAN_WIDTH_M + DINO_GAP_M) * pxPerMeter}px`;
            dinoEl.classList.remove("hidden");
        }
    }

    window.addEventListener("resize", () => {
        // Just re-render human if no dino is selected yet, we check if style height exists
        const isDinoVisible = !dinoEl.classList.contains("hidden");
        if (isDinoVisible) {
            const currentName = dinoNameEl.textContent;
            const currentDino = sortedDinosaurs.find(d => d.name === currentName);
            if (currentDino) renderVisualization(currentDino);
        } else {
            renderVisualization(null);
        }
    });

    function getCategorySVG(category) {
        // Reused stylized blocky/abstract representations
        switch(category) {
            case "Theropoda":
                return `<svg viewBox="0 0 100 40" preserveAspectRatio="none"><path d="M10,20 Q30,20 40,10 Q50,0 70,5 Q90,10 95,20 Q100,30 90,30 Q70,30 50,20 L45,40 L35,40 L40,25 Q20,30 10,20 Z" /></svg>`;
            case "Sauropoda":
                return `<svg viewBox="0 0 100 60" preserveAspectRatio="none"><path d="M5,40 Q10,20 30,5 Q40,0 45,5 Q40,20 50,30 Q70,30 90,40 Q95,45 90,50 L80,60 L70,60 L75,50 Q60,55 40,50 L35,60 L25,60 L30,45 Q15,45 5,40 Z" /></svg>`;
            case "Ceratopsia":
                return `<svg viewBox="0 0 100 45" preserveAspectRatio="none"><path d="M10,20 Q20,10 40,5 Q50,0 55,10 Q60,20 80,25 Q95,30 90,40 Q70,45 50,40 L45,45 L35,45 L40,35 Q20,40 10,20 Z" /></svg>`;
            case "Ornithopoda":
                return `<svg viewBox="0 0 100 40" preserveAspectRatio="none"><path d="M15,25 Q30,15 45,10 Q60,5 75,15 Q90,25 85,35 Q70,40 50,35 L45,40 L35,40 L40,30 Q25,35 15,25 Z" /></svg>`;
            case "Thyreophora":
                return `<svg viewBox="0 0 100 35" preserveAspectRatio="none"><path d="M5,25 Q20,10 50,5 Q80,10 95,25 Q90,30 80,35 L70,35 L75,25 Q50,30 30,25 L25,35 L15,35 L20,20 Q10,25 5,25 Z" /></svg>`;
            default:
                return `<svg viewBox="0 0 100 50" preserveAspectRatio="none"><rect x="10" y="10" width="80" height="30" rx="10" /><rect x="30" y="30" width="10" height="20" /><rect x="60" y="30" width="10" height="20" /></svg>`;
        }
    }

    // Initial render
    setTimeout(() => { renderVisualization(null); }, 100);
});

// ================================
// MyFotobox
// by David Richter
// ================================


// ── Hamburger-Menü ────────────────────────────────────────
(function () {
    const btn = document.getElementById('hamburger');
    const nav = document.getElementById('mainNav');

    btn.addEventListener('click', () => {
        const open = nav.classList.toggle('open');
        btn.classList.toggle('open', open);
        btn.setAttribute('aria-expanded', open);
    });

    // Menü schließen wenn ein Link geklickt wird
    nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('open');
            btn.classList.remove('open');
            btn.setAttribute('aria-expanded', false);
        });
    });
})();


// ── Fade-In Animation ──────────────────────────────────────
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("show");
        }
    });
}, { threshold: .12 });

document.querySelectorAll("section").forEach(section => {
    section.classList.add("hidden");
    observer.observe(section);
});


// ── Karten Hover-Tilt ──────────────────────────────────────
document.querySelectorAll(".card").forEach(card => {
    card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.transform =
            `rotateY(${(x - rect.width / 2) / 25}deg)
             rotateX(${-(y - rect.height / 2) / 25}deg)
             translateY(-12px)`;
    });
    card.addEventListener("mouseleave", () => {
        card.style.transform = "";
    });
});


// ── Fahrtkosten ────────────────────────────────────────────
document.getElementById("berechnen").addEventListener("click", berechnen);
document.getElementById("adresse").addEventListener("keydown", (e) => {
    if (e.key === "Enter") berechnen();
});

const START = { lat: 51.3659, lon: 10.7894 };
const START_NAME = "Schernberg, 99706 Sondershausen";

async function berechnen() {

    const adresse = document.getElementById("adresse").value.trim();
    if (adresse === "") {
        alert("Bitte einen Veranstaltungsort eingeben.");
        return;
    }

    const btn = document.getElementById("berechnen");
    btn.textContent = "⏳ Lädt...";
    btn.disabled = true;

    try {

        // 1. Adresse geocodieren
        const geo = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(adresse)}&limit=1`,
            { headers: { "Accept-Language": "de" } }
        );
        const geoData = await geo.json();

        if (geoData.length === 0) {
            alert("Ort nicht gefunden. Bitte genauer eingeben (z. B. \"Erfurt, Domplatz\").");
            return;
        }

        const zielLat = geoData[0].lat;
        const zielLon = geoData[0].lon;
        const zielName = geoData[0].display_name;

        // 2. Route berechnen (OSRM)
        const route = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${START.lon},${START.lat};${zielLon},${zielLat}?overview=false`
        );
        const routeData = await route.json();

        if (!routeData.routes || routeData.routes.length === 0) {
            alert("Route konnte nicht berechnet werden.");
            return;
        }

        const km       = routeData.routes[0].distance / 1000; // einfache Strecke in km
        const gesamt   = km * 2;                              // Hin + Zurück
        const preis    = gesamt * 0.35;                       // 0,35 € pro km

        // 3. Anzeige aktualisieren
        document.getElementById("ziel").textContent    = zielName;
        document.getElementById("strecke").textContent = km.toFixed(1) + " km";
        document.getElementById("gesamt").textContent  = gesamt.toFixed(1) + " km";
        document.getElementById("preis").textContent   = preis.toFixed(2).replace(".", ",") + " €";

        // 4. Google Maps Link
        const mapsRow  = document.getElementById("mapsRow");
        const mapsLink = document.getElementById("mapsLink");
        mapsLink.href  = `https://www.google.com/maps/dir/${encodeURIComponent(START_NAME)}/${encodeURIComponent(zielName)}`;
        mapsRow.style.display = "flex";

    } catch (e) {
        console.error(e);
        alert("Fehler beim Berechnen. Bitte Internetverbindung prüfen.");
    } finally {
        btn.textContent = "Berechnen";
        btn.disabled    = false;
    }
}


// ── Drucker-Medien Upload ──────────────────────────────────
function handleMedia(input, stepId) {
    const file = input.files[0];
    if (!file) return;

    const placeholder = document.getElementById('mediaPlaceholder' + stepId);
    const preview     = document.getElementById('mediaPreview' + stepId);
    const url         = URL.createObjectURL(file);

    preview.innerHTML = '';

    if (file.type.startsWith('video/')) {
        const vid = document.createElement('video');
        vid.src      = url;
        vid.controls = true;
        vid.style.cssText = 'width:100%;max-height:340px;border-radius:16px;object-fit:contain;';
        preview.appendChild(vid);
    } else {
        const img = document.createElement('img');
        img.src = url;
        img.alt = 'Schritt ' + stepId;
        img.style.cssText = 'width:100%;max-height:340px;border-radius:16px;object-fit:contain;';
        preview.appendChild(img);
    }

    // Ändern-Button
    const changeBtn       = document.createElement('button');
    changeBtn.textContent = '🔄 Bild/Video ändern';
    changeBtn.className   = 'mediaChangeBtn';
    changeBtn.onclick     = () => input.click();
    preview.appendChild(changeBtn);

    placeholder.style.display = 'none';
    preview.style.display     = 'block';
}


// ── Drucker-Anleitung (Stepper) ───────────────────────────
(function () {
    const steps     = document.querySelectorAll(".druckerStep");
    const prevBtn   = document.getElementById("prevStep");
    const nextBtn   = document.getElementById("nextStep");
    const bar       = document.getElementById("progressBar");
    const countEl   = document.getElementById("stepCount");
    const dotsEl    = document.getElementById("druckerDots");
    const total     = steps.length;
    let current     = 0;

    // Dots erstellen
    steps.forEach((_, i) => {
        const dot = document.createElement("span");
        dot.className = "dot" + (i === 0 ? " active" : "");
        dot.addEventListener("click", () => goTo(i));
        dotsEl.appendChild(dot);
    });

    function goTo(index) {
        steps[current].classList.remove("active");
        dotsEl.children[current].classList.remove("active");
        current = index;
        steps[current].classList.add("active");
        dotsEl.children[current].classList.add("active");

        // Progress Bar
        bar.style.width = ((current + 1) / total * 100) + "%";
        countEl.textContent = `Schritt ${current + 1} von ${total}`;

        // Buttons
        prevBtn.disabled = current === 0;
        nextBtn.textContent = current === total - 1 ? "✓ Fertig" : "Weiter →";
        nextBtn.disabled = false;
    }

    prevBtn.addEventListener("click", () => { if (current > 0) goTo(current - 1); });
    nextBtn.addEventListener("click", () => { if (current < total - 1) goTo(current + 1); });

    // Initialisierung
    goTo(0);
})();



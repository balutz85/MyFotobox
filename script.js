// ================================
// MyFotobox – by David Richter
// ================================


// ── Hamburger-Menü ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('hamburger');
    var nav = document.getElementById('mainNav');

    btn.addEventListener('click', function () {
        var isOpen = nav.classList.toggle('open');
        btn.classList.toggle('open', isOpen);
        btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Menü schließen wenn Link angeklickt wird
    nav.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
            nav.classList.remove('open');
            btn.classList.remove('open');
            btn.setAttribute('aria-expanded', 'false');
        });
    });
});


// ── Fade-In beim Scrollen ─────────────────────────────────
var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('section').forEach(function (section) {
    section.classList.add('hidden');
    observer.observe(section);
});


// ── Karten Hover-Tilt (nur Desktop) ──────────────────────
if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.card').forEach(function (card) {
        card.addEventListener('mousemove', function (e) {
            var rect = card.getBoundingClientRect();
            var x = e.clientX - rect.left;
            var y = e.clientY - rect.top;
            card.style.transform =
                'rotateY(' + ((x - rect.width / 2) / 25) + 'deg) ' +
                'rotateX(' + (-(y - rect.height / 2) / 25) + 'deg) ' +
                'translateY(-12px)';
        });
        card.addEventListener('mouseleave', function () {
            card.style.transform = '';
        });
    });
}


// ── Fahrtkosten ────────────────────────────────────────────
document.getElementById('berechnen').addEventListener('click', berechnen);
document.getElementById('adresse').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') berechnen();
});

var START = { lat: 51.3659, lon: 10.7894 };
var START_NAME = 'Schernberg, 99706 Sondershausen';

async function berechnen() {
    var adresse = document.getElementById('adresse').value.trim();
    if (!adresse) {
        alert('Bitte einen Veranstaltungsort eingeben.');
        return;
    }

    var btn = document.getElementById('berechnen');
    btn.textContent = '⏳ Lädt...';
    btn.disabled = true;

    try {
        // Geocoding
        var geoRes = await fetch(
            'https://nominatim.openstreetmap.org/search?format=json&q=' +
            encodeURIComponent(adresse) + '&limit=1',
            { headers: { 'Accept-Language': 'de' } }
        );
        var geoData = await geoRes.json();

        if (!geoData.length) {
            alert('Ort nicht gefunden. Bitte genauer eingeben.');
            return;
        }

        var zielLat  = geoData[0].lat;
        var zielLon  = geoData[0].lon;
        var zielName = geoData[0].display_name;
        var zielKurz = zielName.split(',').slice(0, 2).join(',').trim();

        // Route
        var routeRes = await fetch(
            'https://router.project-osrm.org/route/v1/driving/' +
            START.lon + ',' + START.lat + ';' + zielLon + ',' + zielLat +
            '?overview=false'
        );
        var routeData = await routeRes.json();

        if (!routeData.routes || !routeData.routes.length) {
            alert('Route konnte nicht berechnet werden.');
            return;
        }

        var km     = routeData.routes[0].distance / 1000;
        var gesamt = km * 2;
        var preis  = gesamt * 0.35;

        document.getElementById('ziel').textContent    = zielKurz;
        document.getElementById('strecke').textContent = km.toFixed(1) + ' km';
        document.getElementById('gesamt').textContent  = gesamt.toFixed(1) + ' km';
        document.getElementById('preis').textContent   = preis.toFixed(2).replace('.', ',') + ' €';

        var mapsRow  = document.getElementById('mapsRow');
        var mapsLink = document.getElementById('mapsLink');
        mapsLink.href = 'https://www.google.com/maps/dir/' +
            encodeURIComponent(START_NAME) + '/' + encodeURIComponent(zielKurz);
        mapsRow.style.display = 'flex';

    } catch (e) {
        console.error(e);
        alert('Fehler beim Berechnen. Bitte Internetverbindung prüfen.');
    } finally {
        btn.textContent = 'Berechnen';
        btn.disabled    = false;
    }
}

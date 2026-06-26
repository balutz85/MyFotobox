// ================================
// MyFotobox
// by David Richter
// ================================


// Fade-In Animation

const observer = new IntersectionObserver((entries)=>{

    entries.forEach(entry=>{

        if(entry.isIntersecting){

            entry.target.classList.add("show");

        }

    });

},{
    threshold:.15
});

document.querySelectorAll("section").forEach(section=>{

    section.classList.add("hidden");

    observer.observe(section);

});


// Karten leicht schweben lassen

document.querySelectorAll(".card").forEach(card=>{

    card.addEventListener("mousemove",(e)=>{

        const rect=card.getBoundingClientRect();

        const x=e.clientX-rect.left;

        const y=e.clientY-rect.top;

        card.style.transform=

        `rotateY(${(x-rect.width/2)/25}deg)
         rotateX(${-(y-rect.height/2)/25}deg)
         translateY(-12px)`;

    });

    card.addEventListener("mouseleave",()=>{

        card.style.transform="";

    });

});


// Button Fahrtkosten

document
.getElementById("berechnen")
.addEventListener("click",berechnen);


const START = {
    lat: 51.3659,
    lon: 10.7894
};

async function berechnen() {

    const adresse = document
        .getElementById("adresse")
        .value
        .trim();

    if (adresse === "") {
        alert("Bitte einen Veranstaltungsort eingeben.");
        return;
    }

    try {

        // Adresse suchen
        const geo = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(adresse)}`
        );

        const geoData = await geo.json();

        if (geoData.length === 0) {
            alert("Ort nicht gefunden.");
            return;
        }

        const zielLat = geoData[0].lat;
        const zielLon = geoData[0].lon;

        // Route berechnen
        const route = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${START.lon},${START.lat};${zielLon},${zielLat}?overview=false`
        );

        const routeData = await route.json();

        const km = routeData.routes[0].distance / 1000;

        const gesamt = km * 4;

        const preis = gesamt * 0.35;

        document.getElementById("ziel").innerHTML = geoData[0].display_name;

        document.getElementById("strecke").innerHTML =
            km.toFixed(1) + " km";

        document.getElementById("gesamt").innerHTML =
            gesamt.toFixed(1) + " km";

        document.getElementById("preis").innerHTML =
            preis.toFixed(2).replace(".", ",") + " €";

    } catch (e) {

        console.log(e);

        alert("Fehler beim Berechnen.");

    }

}
.hidden{

opacity:0;

transform:translateY(80px);

transition:1s;

}

.show{

opacity:1;

transform:translateY(0);

}
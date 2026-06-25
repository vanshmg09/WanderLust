var map = L.map('map').setView([20.0, 0.0], 2);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

function addMapMarker(lat, lng, popupText) {
    map.setView([lat, lng], 13);
    L.marker([lat, lng]).addTo(map).bindPopup(popupText || 'Listing location').openPopup();
}

function geocodeAddress(address, popupText) {
    const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(address);
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (Array.isArray(data) && data.length > 0) {
                const result = data[0];
                const lat = parseFloat(result.lat);
                const lng = parseFloat(result.lon);
                addMapMarker(lat, lng, popupText || address);
            } else {
                console.warn('Map geocoding returned no results for:', address);
            }
        })
        .catch(error => {
            console.error('Map geocoding error:', error);
        });
}

try {
    if (typeof listingCoords !== 'undefined' && Array.isArray(listingCoords) && listingCoords.length === 2) {
        const lat = listingCoords[1];
        const lng = listingCoords[0];
        addMapMarker(lat, lng, listingTitle);
    } else if (typeof listingLocation !== 'undefined' && listingLocation) {
        geocodeAddress(listingLocation, listingTitle);
    }
} catch (e) {
    console.error('Map initialization error:', e);
}
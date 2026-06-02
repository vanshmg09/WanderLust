var map = L.map('map').setView([28.644800, 77.216721], 13);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// If server injected coordinates for this listing, add a marker
try{
    if(typeof listingCoords !== 'undefined' && listingCoords){
        // listingCoords expected in [lng, lat]
        const lat = listingCoords[1];
        const lng = listingCoords[0];
        map.setView([lat, lng], 13);
        L.marker([lat, lng]).addTo(map);
    }
} catch(e){
    // ignore if listingCoords not defined in other pages
}
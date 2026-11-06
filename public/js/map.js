const hasMapToken = typeof mapToken === "string" && mapToken.trim().length > 0;
const hasCoordinates =
    listing &&
    listing.geometry &&
    Array.isArray(listing.geometry.coordinates) &&
    listing.geometry.coordinates.length === 2;

if (hasMapToken && hasCoordinates) {
    mapboxgl.accessToken = mapToken;

    const map = new mapboxgl.Map({
        container: "map",
        center: listing.geometry.coordinates,
        zoom: 9,
    });

    new mapboxgl.Marker({ color: "red" })
        .setLngLat(listing.geometry.coordinates)
        .addTo(map);
} else {
    const mapContainer = document.getElementById("map");
    if (mapContainer) {
        mapContainer.innerHTML = "Map unavailable. Add MAP_TOKEN in .env to enable map.";
        mapContainer.style.display = "flex";
        mapContainer.style.alignItems = "center";
        mapContainer.style.justifyContent = "center";
        mapContainer.style.minHeight = "200px";
    }
}


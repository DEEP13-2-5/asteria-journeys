(() => {
  const el = document.getElementById("package-map");
  if (!el) return;

  let coordinates = [76.2673, 9.9312];
  try {
    if (el.dataset.coordinates) {
      const parsed = JSON.parse(el.dataset.coordinates);
      if (Array.isArray(parsed) && parsed.length >= 2) coordinates = parsed;
    }
  } catch (_) {}

  // If Mapbox token is present, use Mapbox GL
  if (window.mapToken && typeof mapboxgl !== "undefined" && window.mapToken.startsWith("pk.")) {
    try {
      mapboxgl.accessToken = window.mapToken;
      const map = new mapboxgl.Map({
        container: el,
        style: "mapbox://styles/mapbox/outdoors-v12",
        center: coordinates,
        zoom: 8
      });
      new mapboxgl.Marker({ color: "#14382c" }).setLngLat(coordinates).addTo(map);
      return;
    } catch (err) {
      console.warn("Mapbox error, falling back to interactive OSM:", err);
    }
  }

  // Fallback: Embed interactive OpenStreetMap centered on package destination
  const lng = coordinates[0] || 76.2673;
  const lat = coordinates[1] || 9.9312;
  const bbox = `${lng - 0.35},${lat - 0.25},${lng + 0.35},${lat + 0.25}`;
  el.innerHTML = `<iframe width="100%" height="100%" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}" style="border:0; border-radius:8px; width:100%; height:100%;"></iframe>`;
})();

const map = L.map('map').setView([20.5937, 78.9629], 5); // Initialize map centered on India

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const form = document.getElementById('location-form');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const startInput = document.getElementById('start').value;
    const destInput = document.getElementById('destination').value;

    if (!startInput || !destInput) {
        alert('Please enter both starting point and destination!');
        return;
    }

    // Geocode locations
    const startCoords = await geocode(startInput);
    const destCoords = await geocode(destInput);

    if (startCoords && destCoords) {
        // Add markers for start and destination
        const startMarker = L.marker([startCoords.lat, startCoords.lon]).addTo(map)
            .bindPopup(`Starting Point: ${startInput}`).openPopup();
        const destMarker = L.marker([destCoords.lat, destCoords.lon]).addTo(map)
            .bindPopup(`Destination: ${destInput}`).openPopup();

        // Find and display nearest bus stations
        const startBusStations = await findNearbyPlaces(startCoords, 'bus_station');
        const destBusStations = await findNearbyPlaces(destCoords, 'bus_station');

        if (startBusStations.length > 0) {
            L.marker([startBusStations[0].lat, startBusStations[0].lon]).addTo(map)
                .bindPopup(`Nearest Bus Station to Start: ${startBusStations[0].name}`).openPopup();
        }

        if (destBusStations.length > 0) {
            L.marker([destBusStations[0].lat, destBusStations[0].lon]).addTo(map)
                .bindPopup(`Nearest Bus Station to Destination: ${destBusStations[0].name}`).openPopup();
        }

        // Fit map bounds to show all points
        const bounds = L.latLngBounds([
            [startCoords.lat, startCoords.lon],
            [destCoords.lat, destCoords.lon]
        ]);
        map.fitBounds(bounds);
    } else {
        alert('Unable to find one or both locations.');
    }
});

// Function to geocode a location using Nominatim (OpenStreetMap)
async function geocode(query) {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
    const data = await response.json();
    if (data.length > 0) {
        return { lat: data[0].lat, lon: data[0].lon };
    }
    return null;
}

// Function to find nearby places (bus stations in this case)
async function findNearbyPlaces(coords, type) {
    const radius = 5000; // 5 km radius
    const response = await fetch(`https://overpass-api.de/api/interpreter?data=[out:json];node(around:${radius},${coords.lat},${coords.lon})[amenity=${type}];out;`);
    const data = await response.json();

    if (data.elements && data.elements.length > 0) {
        return data.elements.map(place => ({
            lat: place.lat,
            lon: place.lon,
            name: place.tags.name || 'Unnamed'
        }));
    }

    return [];
}

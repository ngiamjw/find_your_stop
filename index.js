import { getLocationAtDuration } from './places.js';

let map;
let marker;
let destination;
let infoWindow;
let directionsService;
let directionsRenderer;
let waypoints = [];

async function initMap() {
    // Request needed libraries.
    const [{ Map }, { AdvancedMarkerElement }] = await Promise.all([
        google.maps.importLibrary("marker"),
        google.maps.importLibrary("places"),
    ]);

    // Initialize the map.
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 40.749933, lng: -73.98633 }, // New York coordinates
        zoom: 13,
        mapId: "4504f8b37365c3d0",
        mapTypeControl: false,
        fullscreenControl: false
    });

    // Initialize Directions Service and Renderer
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({ map });

    // [START maps_place_autocomplete_map_add]
    const originAutocomplete = new google.maps.places.PlaceAutocompleteElement();
    originAutocomplete.id = "origin-autocomplete-input";
    const originCard = document.getElementById("origin-autocomplete-card");
    originCard.appendChild(originAutocomplete);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(originCard);
    
    // Create PlaceAutocompleteElement for destination
    const destinationAutocomplete = new google.maps.places.PlaceAutocompleteElement();
    destinationAutocomplete.id = "destination-autocomplete-input";
    const destinationCard = document.getElementById("destination-autocomplete-card");
    destinationCard.appendChild(destinationAutocomplete);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(destinationCard);
    // [END maps_place_autocomplete_map_add]

    // Create the marker and infowindow
    marker = new google.maps.marker.AdvancedMarkerElement({
        map,
    });
    infoWindow = new google.maps.InfoWindow({});

    // [START maps_place_autocomplete_map_listener]
    // Add the listener to handle the place selection.
    originAutocomplete.addEventListener("gmp-placeselect", async ({ place }) => {
        await place.fetchFields({
            fields: ["displayName", "formattedAddress", "location"],
        });
    
        // Set the marker position for origin
        console.log(place.location)
        marker.position = place.location;
        map.setCenter(place.location);
});
    
    // Listener for destination autocomplete
    destinationAutocomplete.addEventListener("gmp-placeselect", async ({ place }) => {
        await place.fetchFields({
            fields: ["location"],
        });

        destination = place.location
    
        // Calculate and display route to the selected destination
        calculateAndDisplayRoute(marker.position, place.location);
    });
    // [END maps_place_autocomplete_map_listener]
}

function callRoute(request) {
    directionsService.route(request, function (result, status) {
        if (status === 'OK') {
            directionsRenderer.setDirections(result); // Show the route on the map
            console.log(result)

                        // Extract the route steps
            const routeSteps = result.routes[0].legs[0].steps.map(step => ({
                start_location: {
                    lat: step.start_location.lat(),
                    lng: step.start_location.lng(),
                },
                end_location: {
                    lat: step.end_location.lat(),
                    lng: step.end_location.lng(),
                },
                polyline: step.polyline,
                duration: {
                    value: step.duration.value,  // in seconds
                }
            }));

            console.log("Extracted route steps:", routeSteps);

            routesteps = routeSteps;

            const travelTime = result.routes[0].legs[0].duration.text;

            const travelTimeSeconds = result.routes[0].legs[0].duration.value;

            document.getElementById('travel-time-box').innerHTML = `Estimated travel time: ${travelTime}`;
            slider.max = travelTimeSeconds;
            sliderMax.textContent = formatTime(slider.max)
        } else {
            console.error('Directions request failed due to ' + status);
        }
    });
}

// Calculate and display route from origin to destination
function calculateAndDisplayRoute(origin, destination) {
    const request = {
        origin: origin,
        destination: destination,
        travelMode: 'DRIVING', // Can be DRIVING, WALKING, BICYCLING, TRANSIT
    };
    
    callRoute(request)

}

function calculateAndDisplayNewRoute(origin, destination, waypoints) {
    console.log("waypoints", waypoints)
    const request = {
        origin: origin,
        destination: destination,
        waypoints: waypoints,
        travelMode: 'DRIVING', // Can be DRIVING, WALKING, BICYCLING, TRANSIT
    };

    callRoute(request)

}

function placeMarkerAtLocation(locationAtTime) {
    marker.position = locationAtTime;  // This should update the marker's position
    console.log("Updated marker position:", locationAtTime);
}


function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours} hr ${minutes} min`;
}

// Helper function to create and display an info window.
function updateInfoWindow(content, center) {
    infoWindow.setContent(content);
    infoWindow.setPosition(center);
    infoWindow.open({
        map,
        anchor: marker,
        shouldFocus: false,
    });
}

// Function to search for nearby restaurants
function searchNearbyRestaurants(location) {
    const service = new google.maps.places.PlacesService(map);

    const request = {
        location: location,
        radius: 1000, // Radius in meters (1000m = 1km)
        type: 'restaurant'
    };

    service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {

            clearMarkers();
            const placesList = document.getElementById("recommended-places");
            placesList.innerHTML = '';

            results.forEach(place => {
                // Create a marker for each restaurant
                const marker = new google.maps.Marker({
                    map: map,
                    position: place.geometry.location,
                    title: place.name
                });

                // Create place item element
                const placeItem = document.createElement("div");
                placeItem.className = "place-item";

                // Add click event to the place item
                placeItem.addEventListener("click", () => {
                    console.log("Location:", place.geometry.location.toString());
                    const waypoint = { location: place.geometry.location, stopover: true};
                    waypoints.push(waypoint);
                    calculateAndDisplayNewRoute(marker.position, destination, waypoints)
                    // You can also trigger any other function here with the location
                });

                // Create image element
                const image = document.createElement("img");
                image.className = "place-image";
                image.src = place.photos ? place.photos[0].getUrl({ maxWidth: 80, maxHeight: 80 }) : 'default-image-url.jpg'; // Use a default image if no photo
                placeItem.appendChild(image);

                // Create info container
                const infoContainer = document.createElement("div");
                infoContainer.className = "place-info";

                // Add place name
                const name = document.createElement("h4");
                name.textContent = place.name;
                infoContainer.appendChild(name);

                // Add rating and number of ratings
                const rating = document.createElement("div");
                const ratingText = `Rating: ${place.rating ? place.rating : 'N/A'} (${place.user_ratings_total || 0} ratings)`;
                rating.className = "place-rating";
                rating.textContent = ratingText;
                infoContainer.appendChild(rating);

                // Add type of food
                const type = document.createElement("div");
                type.className = "place-type";
                type.textContent = place.types.join(', '); // Join types into a string
                infoContainer.appendChild(type);

                // Add price level
                const price = document.createElement("div");
                price.className = "place-price";
                price.textContent = place.price_level ? '$'.repeat(place.price_level) : 'N/A'; // Represent price level with $ signs
                infoContainer.appendChild(price);

                // // Add closing time (if available)
                // const closingTime = document.createElement("div");
                // closingTime.className = "place-closing-time";
                // const closingTimeText = (place.opening_hours && place.opening_hours.periods && place.opening_hours.periods.length > 0)
                // ? `Closes at: ${place.opening_hours.periods[place.opening_hours.periods.length - 1].close.hours}`
                // : 'Open 24 hours';
                // console.log(closingTimeText)
                // infoContainer.appendChild(closingTime.textContent);

                // Append info container to place item
                placeItem.appendChild(infoContainer);

                // Append the place item to the places list
                placesList.appendChild(placeItem);

                markers.push(marker);
            });
        } else {
            console.error("Nearby search failed:", status);
        }
    });
}

function clearMarkers() {
    markers.forEach(marker => marker.setMap(null)); // Remove each marker from the map
    markers = []; // Reset the markers array
}



const drawerButton = document.getElementById('drawerButton');
const drawer = document.getElementById('drawer');

// Function to toggle the drawer
let isDrawerOpen = false;

// Function to toggle the drawer
drawerButton.addEventListener('click', () => {
    isDrawerOpen = !isDrawerOpen; // Toggle state
    drawer.style.right = isDrawerOpen ? '0' : '-40%'; // Open/Close drawer
});

const slider = document.getElementById('slider');
const sliderValue = document.getElementById('sliderValue');
const sliderMax = document.getElementById('maxValue')

slider.max = 3600; // e.g., default of 1 hour in seconds
slider.value = 1;// Starting value
sliderValue.textContent = formatTime(slider.value);
sliderMax.textContent = formatTime(slider.max) // Update display

let routesteps = [];

let markers = [];


// Event listener to show formatted time as slider adjusts
slider.addEventListener('input', () => {
    sliderValue.textContent = formatTime(slider.value);
    console.log(slider.value)
    const locationAtTime = getLocationAtDuration(routesteps, slider.value);
    console.log("Location after 15 minutes:", locationAtTime["lat"], locationAtTime['lng']);
    placeMarkerAtLocation(locationAtTime);

    searchNearbyRestaurants(locationAtTime)
});

initMap();
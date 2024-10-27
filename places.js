function interpolateLocation(start, end, timeFraction) {
    const lat = start.lat + (end.lat - start.lat) * timeFraction;
    const lng = start.lng + (end.lng - start.lng) * timeFraction;
    return  { lat: lat, lng: lng };
}

export function getLocationAtDuration(routeSteps, desiredTime) {
    let cumulativeTime = 0;

    for (let step of routeSteps) {
        const stepDuration = step.duration.value; // duration in seconds
        const stepWaypoints = decodePolyline(step.polyline.points); // Decode polyline

        if (cumulativeTime + stepDuration >= desiredTime) {
            // The desired time is within this step
            const timeInStep = desiredTime - cumulativeTime;
            const timeFraction = timeInStep / stepDuration;

            // Find the location within the polyline of this step
            return interpolateAlongPolyline(stepWaypoints, timeFraction);
        }

        // Move to the next step
        cumulativeTime += stepDuration;
    }

    // If the desired time is beyond the route duration, return the last location
    return routeSteps[routeSteps.length - 1].end_location;
}

// Function to interpolate along a decoded polyline
function interpolateAlongPolyline(waypoints, timeFraction) {
    const segmentFraction = timeFraction * (waypoints.length - 1);
    const segmentIndex = Math.floor(segmentFraction);
    const segmentStart = waypoints[segmentIndex];
    const segmentEnd = waypoints[segmentIndex + 1];
    const fractionInSegment = segmentFraction - segmentIndex;

    return interpolateLocation(segmentStart, segmentEnd, fractionInSegment);
}

// Decodes a polyline to a list of lat/lng waypoints
function decodePolyline(encoded) {
    let points = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
        let b, shift = 0, result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
        lat += dlat;

        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
        lng += dlng;

        points.push({ lat: lat / 1e5, lng: lng / 1e5 });
    }

    return points;
}
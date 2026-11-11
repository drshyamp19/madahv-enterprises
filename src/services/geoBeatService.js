// Geolocation, 100m Geofencing, and Beat Route Planner

export class GeoBeatService {
  // Haversine formula to compute distance in meters between two GPS coordinates
  static calculateDistanceMeters(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 999999;

    const R = 6371e3; // Earth's radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10; // Distance in meters
  }

  // Verify if rep is within 100m of the client location
  static verifyClientGeofence(repLat, repLng, clientLat, clientLng) {
    const distanceMeters = this.calculateDistanceMeters(repLat, repLng, clientLat, clientLng);
    const isWithin100m = distanceMeters <= 100;

    return {
      distanceMeters,
      isWithin100m,
      channel: isWithin100m ? "FIELD_VISIT" : "PHONE_CALL",
      statusMessage: isWithin100m
        ? `Verified Field Visit (${distanceMeters}m from shop)`
        : `Outside 100m boundary (${distanceMeters}m away) - Logged as Phone / Remote Order`
    };
  }

  // Get current device GPS location
  static getCurrentPosition() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        // Fallback simulated GPS coordinates for MIDC Bhosari, Pune
        resolve({
          latitude: 18.6274,
          longitude: 73.8439,
          accuracy: 10,
          isSimulated: true
        });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            isSimulated: false
          });
        },
        () => {
          // Fallback location on permission decline or indoor weak GPS
          resolve({
            latitude: 18.6272,
            longitude: 73.8436,
            accuracy: 15,
            isSimulated: true
          });
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 10000 }
      );
    });
  }
}

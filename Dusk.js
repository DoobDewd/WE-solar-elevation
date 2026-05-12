'use strict';
import * as WEMath from 'WEMath';
// ==================== SunCalc.js Goes HERE ====================

// =================================================================
let sun;
let latitude = 45.52;
let longitude = -122.68;
let sunsetOffset = 0;
let previousElevation = null;
let lastLoggedSecond = -1;

export function init() {
    sun = new SunCalc(new Vec3(latitude, longitude, 0));
}

export function applyUserProperties(changedProperties) {
    if (changedProperties.latitude !== undefined) latitude = changedProperties.latitude;
    if (changedProperties.longitude !== undefined) longitude = changedProperties.longitude;
    if (changedProperties.sunsetoffset !== undefined) sunsetOffset = changedProperties.sunsetoffset;
    if (sun) sun.setLocation(new Vec3(latitude, longitude, 0));

    // Reset elevation tracking when location changes so jump-detection doesn't misfire
    previousElevation = null;
}

export function update(value) {
    if (!sun) {
        sun = new SunCalc(new Vec3(latitude, longitude, 0));
    }
    sun.setDateTime(new Date());
    const now = engine.timeOfDay;
    const sunPos = sun.getSunPosition();
    let elevation = sunPos.y;

    // Ignore unnatural jumps in sun elevation calculations. Normal movement is ~0.1°, so 2.5° threshold catches anomalies
    if (previousElevation !== null && Math.abs(elevation - previousElevation) > 2.5) {
        elevation = previousElevation;
    }
    previousElevation = elevation;

    const sunsetRaw = sun.getSunset();
    let sunset = getNormalized(sunsetRaw);

    // Handle day wrapping - only bump sunset if it crosses midnight
    if (sunset < now - 0.5) sunset += 1;

    // Artistic dusk fade (only show after sunset, adjustable via sunsetOffset):
    // Fade in from upper threshold to middle threshold (reaches 1.0)
    // Fully visible between middle thresholds
    // Fade out to lower threshold
    // Invisible below lower threshold until next day
    const duskFadeInTop = 11 + sunsetOffset;
    const duskFadeInBottom = 5.06 + sunsetOffset;
    const duskFullyVisible = 2.61 + sunsetOffset;
    const duskFadeOutBottom = -6.98 + sunsetOffset;
    let blend;
    if ((now > sunset || elevation <= duskFadeInTop) && now > 0.5) {
        // Show dusk after sunset or during dusk elevation, but only after noon
        if (elevation > (duskFadeInTop - 2)) {
            blend = 0; // Above fade-in point, no dusk
        } else if (elevation >= duskFadeInBottom) {
            blend = 1.0 - WEMath.smoothStep(duskFadeInBottom, duskFadeInTop, elevation); // Fade in
        } else if (elevation >= duskFullyVisible) {
            blend = 1.0; // Fully visible dusk
        } else if (elevation >= duskFadeOutBottom) {
            blend = WEMath.smoothStep(duskFadeOutBottom, duskFullyVisible, elevation); // Fade out
        } else {
            blend = 0; // Below fade-out point, stay at 0 until next day
        }
    } else {
        blend = 0; // Before sunset, no dusk
    }

    const currentSecond = new Date().getSeconds();
    if (currentSecond !== lastLoggedSecond) {
        lastLoggedSecond = currentSecond;
        console.log(`[Date] ${new Date().toLocaleDateString()}`);
        console.log(`[Dusk] ${new Date().toTimeString().replace(/GMT[^\s]* /, '')} | Elev: ${elevation.toFixed(2)}° | Blend: ${blend.toFixed(4)}`);
    }

    return blend;
}

function getNormalized(date) {
    if (!date) return 0;
    return (date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()) / 86400;
}

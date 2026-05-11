'use strict';
import * as WEMath from 'WEMath';
// ==================== SunCalc.js Goes HERE ====================

// =================================================================
let sun;
let latitude = 45.52;
let longitude = -122.68;
let previousElevation = null;
let lastLoggedSecond = -1;

export function init() {
    sun = new SunCalc(new Vec3(latitude, longitude, 0));
}

export function applyUserProperties(changedProperties) {
    if (changedProperties.latitude !== undefined) latitude = changedProperties.latitude;
    if (changedProperties.longitude !== undefined) longitude = changedProperties.longitude;
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
    let elevation = sunPos.y; // elevation is y component of Vec2

    // Ignore unnatural jumps (SunCalc wrap-around). Normal movement is ~0.1°, so 2.5° threshold catches wraps but smooths oscillations
    if (previousElevation !== null && Math.abs(elevation - previousElevation) > 2.5) {
        elevation = previousElevation;
    }
    previousElevation = elevation;

    // Fade in from -6° (civil dawn) to 0° (sunrise)
    // Stay at 1.0 until day is fully visible at +5°
    // Then cut to 0 (only show in morning hours with dawn elevation, not at night)
    let blend;
    if (elevation >= -6 && elevation <= 5 && now < 0.5) {
        // Show dawn only if dawn elevation AND morning hours (avoids day wrapping issues)
        if (elevation >= 5) {
            blend = 0; // Sharp cutoff once day reaches full brightness
        } else {
            blend = WEMath.smoothStep(-6, 0, elevation);
        }
    } else {
        blend = 0; // Outside morning hours or wrong elevation, no dawn
    }

    const currentSecond = new Date().getSeconds();
    if (currentSecond !== lastLoggedSecond) {
        lastLoggedSecond = currentSecond;
        console.log(`[Dawn] ${new Date().toTimeString().replace(/GMT[^\s]* /, '')} | Elev: ${elevation.toFixed(2)}° | Blend: ${blend.toFixed(4)}`);
    }

    return blend;
}

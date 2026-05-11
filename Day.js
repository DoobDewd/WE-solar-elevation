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
    const sunPos = sun.getSunPosition();
    let elevation = sunPos.y; // elevation is y component of Vec2

    // Ignore unnatural jumps (SunCalc wrap-around). Normal movement is ~0.1°, so 2.5° threshold catches wraps but smooths oscillations
    if (previousElevation !== null && Math.abs(elevation - previousElevation) > 2.5) {
        elevation = previousElevation;
    }
    previousElevation = elevation;

    // Full brightness at 6:30am (~5° elevation)
    // Fade in from 0° (sunrise) to 5°, stay at 1.0 above that
    // Cut to 0 once dusk is fully visible (-6°)
    let blend;
    if (elevation < -6) {
        blend = 0; // Dusk is fully visible, day is off
    } else {
        blend = WEMath.smoothStep(0, 5, elevation);
    }

    const currentSecond = new Date().getSeconds();
    if (currentSecond !== lastLoggedSecond) {
        lastLoggedSecond = currentSecond;
        console.log(`[Day]  ${new Date().toTimeString().replace(/GMT[^\s]* /, '')} | Elev: ${elevation.toFixed(2)}° | Blend: ${blend.toFixed(4)}`);
    }

    return blend;
}

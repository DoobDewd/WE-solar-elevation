'use strict';
import * as WEMath from 'WEMath';
// ==================== SunCalc.js Goes HERE ====================

// =================================================================
let sun;
let latitude = 45.52;
let longitude = -122.68;
let sunriseOffset = 0;
let previousElevation = null;
let lastLoggedSecond = -1;

export function init() {
    sun = new SunCalc(new Vec3(latitude, longitude, 0));
}

export function applyUserProperties(changedProperties) {
    if (changedProperties.latitude !== undefined) latitude = changedProperties.latitude;
    if (changedProperties.longitude !== undefined) longitude = changedProperties.longitude;
    if (changedProperties.sunriseoffset !== undefined) sunriseOffset = changedProperties.sunriseoffset;
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
    let elevation = sunPos.y;

    // Ignore unnatural jumps in sun elevation calculations. Normal movement is ~0.1°, so 2.5° threshold catches anomalies
    if (previousElevation !== null && Math.abs(elevation - previousElevation) > 2.5) {
        elevation = previousElevation;
    }
    previousElevation = elevation;

    // Fade in from sunrise (0° elevation) to full brightness (5° elevation)
    // Cut to 0 when dusk becomes fully visible (adjustable via sunriseOffset)
    const duskCutoff = -6 + sunriseOffset;
    let blend;
    if (elevation < duskCutoff) {
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

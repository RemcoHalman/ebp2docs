/**
 * Component Decoder Module
 * Decodes NMEA 2000 component information from EBP files
 */

import { N2kDirection } from './enums.js';

// Fluid types for Fluid Level component (PGN 127505)
const FLUID_TYPES = [
    'fuel',
    'fresh water',
    'waste water',
    'live well',
    'oil',
    'black water'
];

// Temperature sources for Temperature component (PGN 130312)
const TEMPERATURE_SOURCES = [
    'sea',
    'outside',
    'inside',
    'engine room',
    'main cabin',
    'live well',
    'bait well',
    'refridgeration',
    'heating system',
    'dew point',
    'wind chill apparent',
    'wind chill theoretical',
    'heat index',
    'freezer'
];

// J1939 PGN types
const J1939_PGNS = [
    65014, 65027, 65011, 65008,
    65024, 65021, 65017, 65030,
    65004, 65003, 65002, 65001
];

/**
 * Component decoder configurations
 * Maps component IDs to their decoder functions
 */
const COMPONENT_DECODERS = new Map([
    [1283, decodeFluidLevel],           // Fluid Level
    [1281, decodeBinarySwitch],         // Binary Switch
    [1282, decodeBinaryIndicator],      // Binary Indicator
    [1285, decodeTemperature],          // Temperature
    [1291, decodeSwitchControl],        // Switch Control
    [1376, decodeJ1939AcPgn],           // J1939 AC PGN
    [1361, decodeProprietaryPgn]        // Proprietary PGN
]);

/**
 * Decode a component into NMEA 2000 information
 * @param {Object} component - Component object
 * @param {Array} properties - Component properties array
 * @returns {Object} Decoded component information
 */
export function decodeComponent(component, properties) {
    const decoder = COMPONENT_DECODERS.get(component.componentId);

    if (!decoder) {
        return createEmptyResult();
    }

    const propertyMap = createPropertyMap(properties);
    return decoder(propertyMap);
}

/**
 * Create a Map from properties array for easier lookup
 * @param {Array} properties - Properties array
 * @returns {Map} Property ID to value map
 */
function createPropertyMap(properties) {
    const map = new Map();
    properties?.forEach(prop => {
        const value = parseInt(prop.value);
        map.set(prop.id, isNaN(value) ? null : value);
    });
    return map;
}

/**
 * Get property value with null for missing/invalid values
 * @param {Map} props - Property map
 * @param {number} id - Property ID
 * @returns {number|null} Property value or null
 */
function getProperty(props, id) {
    return props.get(id) ?? null;
}

/**
 * Create empty result object
 * @returns {Object} Empty result
 */
function createEmptyResult() {
    return {
        name: '',
        pgn: 0,
        instance: null,
        id: '',
        direction: N2kDirection.NONE,
        device: null
    };
}

/**
 * Decode Fluid Level component (1283)
 */
function decodeFluidLevel(props) {
    const fluidType = getProperty(props, 1);
    const fluidName = fluidType !== null && fluidType < FLUID_TYPES.length
        ? FLUID_TYPES[fluidType]
        : 'unknown';

    return {
        name: 'Fluid Level',
        pgn: 127505,
        instance: getProperty(props, 0),
        id: fluidName,
        direction: N2kDirection.fromId(getProperty(props, 2)),
        device: null
    };
}

/**
 * Decode Binary Switch component (1281)
 */
function decodeBinarySwitch(props) {
    const switchNumber = getProperty(props, 1);

    return {
        name: 'Binary Switch',
        pgn: 127501,
        instance: getProperty(props, 0),
        id: switchNumber !== null ? String(switchNumber + 1) : '',
        direction: N2kDirection.fromId(getProperty(props, 5)),
        device: null
    };
}

/**
 * Decode Binary Indicator component (1282)
 */
function decodeBinaryIndicator(props) {
    const indicatorNumber = getProperty(props, 1);

    return {
        name: 'Binary Indicator',
        pgn: 127501,
        instance: getProperty(props, 0),
        id: indicatorNumber !== null ? String(indicatorNumber + 1) : '',
        direction: N2kDirection.fromId(getProperty(props, 2)),
        device: null
    };
}

/**
 * Decode Temperature component (1285)
 */
function decodeTemperature(props) {
    const sourceType = getProperty(props, 1);
    const sourceName = sourceType !== null && sourceType < TEMPERATURE_SOURCES.length
        ? TEMPERATURE_SOURCES[sourceType]
        : 'unknown';

    return {
        name: 'Temperature',
        pgn: 130312,
        instance: getProperty(props, 0),
        id: sourceName,
        direction: N2kDirection.fromId(getProperty(props, 5)),
        device: null
    };
}

/**
 * Decode Switch Control component (1291)
 */
function decodeSwitchControl(props) {
    const switchNumber = getProperty(props, 2);

    return {
        name: 'Switch Control',
        pgn: 127502,
        instance: getProperty(props, 1),
        id: switchNumber !== null ? String(switchNumber + 1) : '',
        direction: N2kDirection.fromId(getProperty(props, 0)),
        device: null
    };
}

/**
 * Decode J1939 AC PGN component (1376)
 */
function decodeJ1939AcPgn(props) {
    const pgnType = getProperty(props, 1);
    const pgn = pgnType !== null && pgnType < J1939_PGNS.length
        ? J1939_PGNS[pgnType]
        : 0;

    return {
        name: 'J1939 AC PGN',
        pgn,
        instance: null,
        id: '',
        direction: N2kDirection.NONE,
        device: getProperty(props, 0)
    };
}

/**
 * Decode Proprietary PGN component (1361)
 */
function decodeProprietaryPgn(props) {
    return {
        name: 'Proprietary PGN',
        pgn: 65280,
        instance: getProperty(props, 2),
        id: '',
        direction: N2kDirection.fromId(getProperty(props, 0)),
        device: null
    };
}

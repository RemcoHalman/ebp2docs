/**
 * Channel Decoder Module
 * Decodes channel settings for EBP units
 */

// Input main channel settings
const INPUT_MAIN_SETTINGS = new Map([
    [1, { type: 'digital input', subtype: 'standard' }],
    [57, { type: 'digital input', subtypeMap: new Map([
        [1, 'closes to minus'],
        [2, 'closes to plus'],
        [4, 'closes to common'],
        [6, 'closes to plus weak pulldown'],
        [7, 'measure input frequency']
    ])}],
    [64, { type: 'analog input', subtypeMap: new Map([
        [1, 'voltage signal'],
        [2, '4-20 mA'],
        [4, '0-1500 Ohm'],
        [5, 'multiswitch'],
        [6, 'firealarm (constant power)'],
        [7, 'multiswitch (68Ohm +/- 1%)'],
        [8, 'dual fixed multiswitch'],
        [9, 'temp sensor ohm']
    ])}],
    [54, { type: 'window wiper feedback', subtypeMap: new Map([
        [1, 'closes to minus in parking'],
        [2, 'open in parking']
    ])]}
]);

// Output main channel settings
const OUTPUT_MAIN_SETTINGS = new Map([
    [1, { type: 'digital output', subtype: 'standard' }],
    [48, { type: 'digital output +', subtypeMap: new Map([
        [1, 'normal'],
        [2, 'open load detection'],
        [3, 'open load detection at turn on']
    ])}],
    [49, { type: 'digital output -', subtypeMap: new Map([
        [1, 'normal']
    ])}],
    [52, { type: 'commonline', subtypeMap: new Map([
        [0, 'normal']
    ])}],
    [53, { type: 'half bridge output +/-', subtypeMap: new Map([
        [0, 'normal half bridge']
    ])}],
    [55, { type: 'window wiper', subtypeMap: new Map([
        [1, 'connection #1 with diode'],
        [2, 'connection #1 no diode'],
        [3, 'connection #2 with diode'],
        [4, 'connection #2 no diode']
    ])}],
    [65, { type: 'signal drive (max 50mA)', subtypeMap: new Map([
        [0, 'positive drive'],
        [1, 'negative drive']
    ])]}
]);

/**
 * Decode channel settings into human-readable format
 * @param {Object} channel - Channel object with setting IDs
 * @returns {Object} Decoded channel settings
 */
export function decodeChannelSettings(channel) {
    const mainInId = parseInt(channel.inMainChannelSettingId) || 0;
    const subInId = parseInt(channel.inChannelSettingId) || 0;
    const mainOutId = parseInt(channel.outMainChannelSettingId) || -1;
    const subOutId = parseInt(channel.outChannelSettingId) || -1;

    return {
        input: decodeInputSettings(mainInId, subInId),
        output: decodeOutputSettings(mainOutId, subOutId)
    };
}

/**
 * Decode input channel settings
 * @param {number} mainId - Main channel setting ID
 * @param {number} subId - Sub channel setting ID
 * @returns {Object} Decoded input settings
 */
function decodeInputSettings(mainId, subId) {
    const config = INPUT_MAIN_SETTINGS.get(mainId);

    if (!config) {
        return {
            type: `:unknown:${mainId}`,
            subtype: `:unknown:${subId}`
        };
    }

    // If config has a fixed subtype, use it
    if (config.subtype) {
        return {
            type: config.type,
            subtype: config.subtype
        };
    }

    // Otherwise, look up the subtype in the map
    const subtype = config.subtypeMap?.get(subId);
    return {
        type: config.type,
        subtype: subtype || `:unknown:${subId}`
    };
}

/**
 * Decode output channel settings
 * @param {number} mainId - Main channel setting ID
 * @param {number} subId - Sub channel setting ID
 * @returns {Object} Decoded output settings
 */
function decodeOutputSettings(mainId, subId) {
    // Handle -1 (not set)
    if (mainId === -1) {
        return {
            type: ':unknown:',
            subtype: ':unknown:'
        };
    }

    const config = OUTPUT_MAIN_SETTINGS.get(mainId);

    if (!config) {
        return {
            type: `:unknown:${mainId}`,
            subtype: `:unknown:${subId}`
        };
    }

    // If config has a fixed subtype, use it
    if (config.subtype) {
        return {
            type: config.type,
            subtype: config.subtype
        };
    }

    // Otherwise, look up the subtype in the map
    const subtype = config.subtypeMap?.get(subId);
    return {
        type: config.type,
        subtype: subtype || `:unknown:${subId}`
    };
}

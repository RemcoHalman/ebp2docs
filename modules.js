/**
 * Modules Variable File
 * Maps product numbers (unit names) to their standard unit variant numbers
 *
 * This file serves as a lookup table for generating Bill of Materials (BOM)
 * and enriching unit data with product information.
 */

/**
 * Module definition
 * @typedef {Object} Module
 * @property {string} productNumber - The product number (unit name)
 * @property {string} standardUnitVariantNumber - The standard unit variant number
 * @property {string} description - Optional description of the module
 */

/**
 * All available modules from EBP files
 * @type {Module[]}
 */
export const MODULES = [
    // From connect50_v-1+.ebp
    { productNumber: "010-02575-10_mcuv2", standardUnitVariantNumber: "100257510", description: "MCU v2" },
    { productNumber: "010-02223-11_mcu100", standardUnitVariantNumber: "2051011", description: "MCU 100" },
    { productNumber: "010-02225-10", standardUnitVariantNumber: "2110110", description: "" },
    { productNumber: "010-02225-16", standardUnitVariantNumber: "2110115", description: "" },
    { productNumber: "010-02225-17", standardUnitVariantNumber: "2110116", description: "" },
    { productNumber: "010-02225-18", standardUnitVariantNumber: "2110117", description: "" },
    { productNumber: "010-02275-01", standardUnitVariantNumber: "0152", description: "" },
    { productNumber: "010-02275-02", standardUnitVariantNumber: "0151", description: "" },
    { productNumber: "010-02225-19", standardUnitVariantNumber: "2110118", description: "" },
    { productNumber: "010-02275-03", standardUnitVariantNumber: "0152", description: "" },
    { productNumber: "010-02225-05", standardUnitVariantNumber: "2110103", description: "" },
    { productNumber: "010-02225-06", standardUnitVariantNumber: "2110104", description: "" },
    { productNumber: "010-02225-07", standardUnitVariantNumber: "2110105", description: "" },
    { productNumber: "010-02279-02", standardUnitVariantNumber: "2210102", description: "" },
    { productNumber: "010-02279-03", standardUnitVariantNumber: "2210103", description: "" },

    // From connect50 v2_v-1+.ebp
    { productNumber: "010-02575-10", standardUnitVariantNumber: "100257510", description: "MCU v2" },
    { productNumber: "MFD / WDU", standardUnitVariantNumber: "88888888", description: "MFD / WDU" },
    { productNumber: "010-02225-30", standardUnitVariantNumber: "100222530", description: "" },
    { productNumber: "010-02225-31", standardUnitVariantNumber: "100222531", description: "" },
    { productNumber: "010-02278-21", standardUnitVariantNumber: "100227821", description: "" },
    { productNumber: "010-02279-20", standardUnitVariantNumber: "100227920", description: "" },
    { productNumber: "010-02279-21", standardUnitVariantNumber: "100227921", description: "" },

    // From DCM.ebp
    { productNumber: "MCU v2", standardUnitVariantNumber: "100257510", description: "MCU v2" },
    { productNumber: "010-02219-01", standardUnitVariantNumber: "11", description: "" },
    { productNumber: "010-02219-02", standardUnitVariantNumber: "12", description: "" },
    { productNumber: "010-02219-03", standardUnitVariantNumber: "13", description: "" },
    { productNumber: "010-02219-04", standardUnitVariantNumber: "14", description: "" },
    { productNumber: "010-02219-05", standardUnitVariantNumber: "15", description: "" },
    { productNumber: "010-02219-55", standardUnitVariantNumber: "55", description: "" },
    { productNumber: "010-02220-06", standardUnitVariantNumber: "16", description: "" },
    { productNumber: "010-02220-07", standardUnitVariantNumber: "17", description: "" },
    { productNumber: "010-02220-08", standardUnitVariantNumber: "18", description: "" },
    { productNumber: "010-02220-09", standardUnitVariantNumber: "19", description: "" },
    { productNumber: "010-02220-10", standardUnitVariantNumber: "20", description: "" },
    { productNumber: "010-02221-08", standardUnitVariantNumber: "28", description: "" },
    { productNumber: "010-02222-10", standardUnitVariantNumber: "30", description: "" }
];

/**
 * Create a lookup map for quick access by product number
 * @type {Map<string, Module>}
 */
export const MODULE_MAP = new Map(
    MODULES.map(module => [module.productNumber, module])
);

/**
 * Create a reverse lookup map by standard unit variant number
 * @type {Map<string, Module[]>}
 */
export const VARIANT_MAP = MODULES.reduce((map, module) => {
    const variant = module.standardUnitVariantNumber;
    if (!map.has(variant)) {
        map.set(variant, []);
    }
    map.get(variant).push(module);
    return map;
}, new Map());

/**
 * Get module information by product number
 * @param {string} productNumber - The product number to look up
 * @returns {Module|undefined} The module information or undefined if not found
 */
export function getModuleByProductNumber(productNumber) {
    return MODULE_MAP.get(productNumber);
}

/**
 * Get module(s) by standard unit variant number
 * @param {string} variantNumber - The variant number to look up
 * @returns {Module[]} Array of modules with this variant number
 */
export function getModulesByVariantNumber(variantNumber) {
    return VARIANT_MAP.get(variantNumber) || [];
}

/**
 * Generate a Bill of Materials from an array of units
 * @param {Array} units - Array of unit objects with name and standardUnitVariantNumber
 * @returns {Array} BOM entries with product number, variant number, and quantity
 */
export function generateBOM(units) {
    const bomMap = new Map();

    units.forEach(unit => {
        const key = `${unit.name}|${unit.standardUnitVariantNumber || ''}`;

        if (bomMap.has(key)) {
            bomMap.get(key).quantity++;
        } else {
            bomMap.set(key, {
                productNumber: unit.name,
                standardUnitVariantNumber: unit.standardUnitVariantNumber || 'N/A',
                quantity: 1,
                serial: unit.serial || '0',
                unitTypeId: unit.unitTypeId || 'N/A'
            });
        }
    });

    return Array.from(bomMap.values()).sort((a, b) =>
        a.productNumber.localeCompare(b.productNumber)
    );
}

/**
 * Get unique modules from the MODULES array
 * Removes duplicates based on product number and variant number combination
 * @returns {Module[]} Array of unique modules
 */
export function getUniqueModules() {
    const uniqueMap = new Map();

    MODULES.forEach(module => {
        const key = `${module.productNumber}|${module.standardUnitVariantNumber}`;
        if (!uniqueMap.has(key)) {
            uniqueMap.set(key, module);
        }
    });

    return Array.from(uniqueMap.values()).sort((a, b) =>
        a.productNumber.localeCompare(b.productNumber)
    );
}

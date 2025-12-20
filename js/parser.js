/**
 * EBP Parser Module
 * Handles parsing of EBP/XML files
 */

import { Direction } from './enums.js';
import { decodeChannelSettings } from './channel-decoder.js';
import { decodeComponent } from './component-decoder.js';

/**
 * Parse basic unit information from EBP file
 * @param {string} xmlString - XML content as string
 * @returns {Array} Array of unit objects
 */
export function parseUnits(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    // Check for parsing errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
        throw new Error('Invalid XML format');
    }

    const units = [];

    // Get the units container first to avoid finding nested units
    const unitsContainer = xmlDoc.querySelector('units');
    if (!unitsContainer) {
        throw new Error('No units container found in the EBP file');
    }

    // Only get direct children unit elements, not nested ones
    const unitElements = Array.from(unitsContainer.children).filter(el => el.tagName === 'unit');

    console.log(`Found ${unitElements.length} unit elements`);

    for (let i = 0; i < unitElements.length; i++) {
        const unit = unitElements[i];
        const unitData = {
            id: unit.getAttribute('id') || 'N/A',
            serial: unit.getAttribute('serial') || 'N/A',
            name: unit.getAttribute('name') || 'N/A',
            unitTypeId: unit.getAttribute('unitTypeId') || 'N/A',
            standardUnitVariantNumber: unit.getAttribute('standardUnitVariantNumber') || 'N/A',
            channels: parseChannels(unit)
        };
        console.log(`Unit ${i + 1}:`, unitData.name, 'ID:', unitData.id, 'TypeID:', unitData.unitTypeId);
        units.push(unitData);
    }

    if (units.length === 0) {
        throw new Error('No units found in the EBP file');
    }

    console.log(`Returning ${units.length} units`);
    return units;
}

/**
 * Parse channel information for a unit
 * @param {Element} unitElement - Unit XML element
 * @returns {Array} Array of channel groups
 */
function parseChannels(unitElement) {
    const channelGroups = [];
    const groupElements = unitElement.getElementsByTagName('unitChannelGroup');

    for (let i = 0; i < groupElements.length; i++) {
        const group = groupElements[i];
        const channels = [];
        const channelElements = group.getElementsByTagName('channel');

        for (let j = 0; j < channelElements.length; j++) {
            const channel = channelElements[j];
            channels.push({
                number: channel.getAttribute('number') || 'N/A',
                name: channel.getAttribute('name') || 'N/A',
                direction: channel.getAttribute('direction') || 'N/A',
                inMainChannelSettingId: channel.getAttribute('inMainChannelSettingId') || '',
                inChannelSettingId: channel.getAttribute('inChannelSettingId') || '',
                outMainChannelSettingId: channel.getAttribute('outMainChannelSettingId') || '',
                outChannelSettingId: channel.getAttribute('outChannelSettingId') || ''
            });
        }

        channelGroups.push({
            groupId: group.getAttribute('channelGroupId') || 'N/A',
            channels: channels
        });
    }

    return channelGroups;
}

/**
 * Parse alarm information from schemas
 * Looks for components with componentId="1292" in all schema sections and extracts:
 * - property id="4" for alarm ID
 * - property id="31" for alarm name
 * @param {string} xmlString - XML content as string
 * @returns {Array} Array of alarm objects sorted by alarm ID
 */
export function parseAlarms(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    const alarms = [];

    // Get all schema elements
    const schemaElements = xmlDoc.getElementsByTagName('schema');

    for (let s = 0; s < schemaElements.length; s++) {
        const schema = schemaElements[s];
        const schemaName = schema.getAttribute('name') || 'Unknown';

        // Get components within this schema
        const componentsContainer = schema.querySelector('components');
        if (!componentsContainer) continue;

        const componentElements = componentsContainer.getElementsByTagName('component');

        for (let i = 0; i < componentElements.length; i++) {
            const component = componentElements[i];
            const componentId = component.getAttribute('componentId');

            // Only process components with componentId="1292"
            if (componentId === '1292') {
                const componentRevision = component.getAttribute('componentRevision') || 'N/A';
                const id = component.getAttribute('id') || 'N/A';

                // Get the properties container
                const propertiesElement = component.querySelector('properties');
                if (propertiesElement) {
                    const propertyElements = propertiesElement.getElementsByTagName('property');

                    let alarmId = 'N/A';
                    let alarmName = 'N/A';

                    // Extract both alarm ID (property 4) and alarm name (property 31)
                    for (let j = 0; j < propertyElements.length; j++) {
                        const property = propertyElements[j];
                        const propertyId = property.getAttribute('id');

                        if (propertyId === '4') {
                            alarmId = property.getAttribute('value') || 'N/A';
                        } else if (propertyId === '31') {
                            alarmName = property.getAttribute('value') || 'N/A';
                        }
                    }

                    // Only add if we found at least one of the properties
                    if (alarmId !== 'N/A' || alarmName !== 'N/A') {
                        alarms.push({
                            schemaName: schemaName,
                            componentId: componentId,
                            componentRevision: componentRevision,
                            componentInstanceId: id,
                            alarmId: alarmId,
                            alarmName: alarmName
                        });
                    }
                }
            }
        }
    }

    // Sort alarms by alarm ID (numeric sort)
    alarms.sort((a, b) => {
        const idA = parseInt(a.alarmId) || 0;
        const idB = parseInt(b.alarmId) || 0;
        return idA - idB;
    });

    console.log(`Found ${alarms.length} alarms across all schemas`);
    return alarms;
}

/**
 * Parse project metadata
 * @param {string} xmlString - XML content as string
 * @returns {Object} Project metadata
 */
export function parseProjectMetadata(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    const project = xmlDoc.querySelector('project');
    
    if (!project) {
        return null;
    }

    return {
        firmware: project.getAttribute('firmware') || 'N/A',
        fileFormatVersion: project.getAttribute('fileFormatVersion') || 'N/A',
        savedAtUtc: project.getAttribute('savedAtUtc') || 'N/A',
        formatVersion: project.getAttribute('formatVersion') || 'N/A',
        studioVersion: project.getAttribute('studioVersion') || 'N/A'
    };
}

/**
 * Validate EBP file structure
 * @param {string} xmlString - XML content as string
 * @returns {Object} Validation result with isValid and errors
 */
export function validateEBP(xmlString) {
    const errors = [];

    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

        // Check for XML parsing errors
        const parseError = xmlDoc.querySelector('parsererror');
        if (parseError) {
            errors.push('Invalid XML format');
            return { isValid: false, errors };
        }

        // Check for project element
        const project = xmlDoc.querySelector('project');
        if (!project) {
            errors.push('Missing project root element');
        }

        // Check for units element
        const units = xmlDoc.querySelector('units');
        if (!units) {
            errors.push('Missing units element');
        }

        // Check if any units exist
        const unitElements = xmlDoc.getElementsByTagName('unit');
        if (unitElements.length === 0) {
            errors.push('No units found in file');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    } catch (error) {
        errors.push(`Parsing error: ${error.message}`);
        return { isValid: false, errors };
    }
}

/**
 * Parse schemas from EBP file
 * @param {string} xmlString - XML content as string
 * @returns {Array} Array of schema objects
 */
export function parseSchemas(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    const schemas = [];
    const schemaElements = xmlDoc.querySelectorAll('schemas > schema');

    schemaElements.forEach(schema => {
        schemas.push({
            id: parseInt(schema.getAttribute('id')) || 0,
            name: schema.getAttribute('name') || '',
            sortIndex: parseInt(schema.getAttribute('sortIndex')) || 0
        });
    });

    return schemas.sort((a, b) => a.sortIndex - b.sortIndex);
}

/**
 * Parse components from EBP file
 * @param {string} xmlString - XML content as string
 * @returns {Array} Array of component objects
 */
export function parseComponents(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    const components = [];
    const masterModuleBusId = findMasterModuleBusId(xmlDoc);

    const schemaElements = xmlDoc.querySelectorAll('schema');

    schemaElements.forEach(schema => {
        const tabName = schema.getAttribute('name') || '';
        const componentElements = schema.querySelectorAll('components > component');

        componentElements.forEach(componentNode => {
            const componentId = parseInt(componentNode.getAttribute('componentId'));

            // Skip special component types (alerts and memory)
            if (componentId === 1292 || componentId === 2304) return;

            const component = {
                componentId,
                channelId: parseInt(componentNode.getAttribute('channelId')) || null,
                unitId: parseInt(componentNode.getAttribute('unitId')) || null
            };

            const properties = parseProperties(componentNode);
            const decoded = decodeComponent(component, properties);

            if (decoded.name) {
                components.push({
                    name: decoded.name,
                    pgn: decoded.pgn,
                    device: decoded.device ?? masterModuleBusId,
                    instance: decoded.instance,
                    id: decoded.id,
                    direction: decoded.direction.name,
                    tabName
                });
            }
        });
    });

    // Sort components
    return components.sort((a, b) => {
        if (a.pgn !== b.pgn) return a.pgn - b.pgn;
        if (a.device !== b.device) return a.device - b.device;
        if (a.instance !== b.instance) return (a.instance ?? 0) - (b.instance ?? 0);

        // Try to sort by ID if numeric
        const aId = parseInt(a.id);
        const bId = parseInt(b.id);
        if (!isNaN(aId) && !isNaN(bId)) {
            return aId - bId;
        }

        return String(a.id).localeCompare(String(b.id));
    });
}

/**
 * Parse memory from EBP file
 * @param {string} xmlString - XML content as string
 * @returns {Array} Array of memory objects
 */
export function parseMemory(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    const MEMORY_TYPES = new Map([
        [0, { name: 'Bit (1 Bit)', bits: 1 }],
        [1, { name: 'UByte (8 Bit)', bits: 8 }],
        [2, { name: 'UWord (16 Bit)', bits: 16 }],
        [3, { name: 'UDWord (32 Bit)', bits: 32 }]
    ]);

    const memory = [];
    const componentElements = xmlDoc.querySelectorAll('component');

    componentElements.forEach(componentNode => {
        const componentId = parseInt(componentNode.getAttribute('componentId'));

        if (componentId === 2304) { // Memory Stored Value component
            const properties = parseProperties(componentNode);
            const propertyMap = new Map();

            properties.forEach(prop => {
                propertyMap.set(prop.id, parseInt(prop.value) || null);
            });

            const memType = propertyMap.get(0);
            const memLocation = propertyMap.get(1);
            const type = MEMORY_TYPES.get(memType) || { name: 'unknown', bits: 1 };

            memory.push({
                type: type.name,
                location: memLocation,
                bits: type.bits
            });
        }
    });

    return memory.sort((a, b) => a.location - b.location);
}

/**
 * Find the master module bus ID
 * @param {Document} xmlDoc - Parsed XML document
 * @returns {number} Master module bus ID or -1 if not found
 */
function findMasterModuleBusId(xmlDoc) {
    const unitElements = xmlDoc.querySelectorAll('units > unit');

    for (const unit of unitElements) {
        const unitTypeId = parseInt(unit.getAttribute('unitTypeId')) || 0;

        // Master module types: 101, 100
        if (unitTypeId === 101 || unitTypeId === 100) {
            return parseInt(unit.getAttribute('id')) || -1;
        }

        // Check for master module in properties (unitTypeId 20, 1, 16, 4)
        if ([20, 1, 16, 4].includes(unitTypeId)) {
            const properties = parseProperties(unit);
            for (const prop of properties) {
                if (prop.id === 2 && prop.value === '2') {
                    return parseInt(unit.getAttribute('id')) || -1;
                }
            }
        }
    }

    return -1;
}

/**
 * Parse properties from an XML element
 * @param {Element} element - XML element
 * @returns {Array} Array of property objects
 */
function parseProperties(element) {
    const properties = [];
    const propertyElements = element.querySelectorAll('properties > property');

    propertyElements.forEach(prop => {
        properties.push({
            id: parseInt(prop.getAttribute('id')) || -1,
            value: prop.getAttribute('value') || ''
        });
    });

    return properties;
}
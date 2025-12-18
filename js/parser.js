/**
 * EBP Parser Module
 * Handles parsing of EBP/XML files
 */

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
            channels: parseChannels(unit),
            alarms: parseAlarms(unit)
        };
        console.log(`Unit ${i + 1}:`, unitData.name, 'ID:', unitData.id, 'TypeID:', unitData.unitTypeId, 'Alarms:', unitData.alarms.length);
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
 * Parse alarm information for a unit
 * Looks for components with componentId="1292" and extracts:
 * - property id="4" for alarm ID
 * - property id="31" for alarm name
 * @param {Element} unitElement - Unit XML element
 * @returns {Array} Array of alarm objects sorted by alarm ID
 */
function parseAlarms(unitElement) {
    const alarms = [];
    const componentElements = unitElement.getElementsByTagName('component');

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

    // Sort alarms by alarm ID (numeric sort)
    alarms.sort((a, b) => {
        const idA = parseInt(a.alarmId) || 0;
        const idB = parseInt(b.alarmId) || 0;
        return idA - idB;
    });

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
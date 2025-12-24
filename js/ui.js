/**
 * UI Module
 * Handles all UI rendering and interactions
 */

import { escapeHtml, getDirectionIcon, getDirectionColor } from './utils.js';

/**
 * Display units in the results container
 * @param {Array} units - Array of unit objects
 * @param {HTMLElement} container - Container element
 * @param {Object} metadata - Optional project metadata to display
 * @param {boolean} hasSearch - Whether search is active (auto-expands sections)
 * @param {Array} alarms - Optional array of alarm objects (no longer displayed here)
 */
export function displayUnits(units, container, metadata = null, hasSearch = false, alarms = []) {
    container.style.display = 'block';

    let html = '';

    // Add metadata if provided
    if (metadata) {
        html += renderMetadata(metadata, units.length);
    }

    // Alarms are now displayed in their own tab, not here

    units.forEach((unit) => {
        html += renderUnitCard(unit, hasSearch);
    });

    container.innerHTML = html;

    // Attach event listeners for expandable sections
    attachExpandListeners(container);
}

/**
 * Render a single unit card
 * @param {Object} unit - Unit object
 * @param {boolean} hasSearch - Whether search is active
 * @returns {string} HTML string
 */
function renderUnitCard(unit, hasSearch = false) {
    return `
        <div class="unit-card">
            <div class="unit-header">
                <div class="unit-name">${escapeHtml(unit.name)}</div>
                <div class="unit-id">ID: ${escapeHtml(unit.id)}</div>
            </div>

            <div class="unit-details">
                <div class="detail-item">
                    <div class="detail-label">Serial Number</div>
                    <div class="detail-value">${escapeHtml(unit.serial)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Unit Type ID</div>
                    <div class="detail-value">${escapeHtml(unit.unitTypeId)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Product Number</div>
                    <div class="detail-value">${escapeHtml(unit.productNumber || 'Unknown')}</div>
                </div>
            </div>

            ${renderChannels(unit.channels, unit.unitTypeId, hasSearch)}
        </div>
    `;
}

/**
 * Render project-level alarms section
 * @param {Array} alarms - Array of alarm objects from all schemas
 * @param {boolean} autoExpand - Whether to auto-expand the section
 * @returns {string} HTML string
 */
function renderProjectAlarms(alarms, autoExpand = false) {
    if (!alarms || alarms.length === 0) {
        return '';
    }

    // Auto-expand when search is active
    const displayStyle = autoExpand ? 'block' : 'none';
    const iconSymbol = autoExpand ? '▲' : '▼';

    let html = `
        <div class="alarms-card">
            <div class="alarms-header">
                <h3>🔔 Alarms</h3>
                <span class="alarms-count">${alarms.length} alarm${alarms.length !== 1 ? 's' : ''} found</span>
            </div>
            <div class="alarms-table-container">
                <table class="alarms-table">
                    <thead>
                        <tr>
                            <th>Alarm ID</th>
                            <th>Alarm Name</th>
                            <th>Schema</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    alarms.forEach((alarm) => {
        html += `
                        <tr>
                            <td class="alarm-id-cell">${escapeHtml(alarm.alarmId)}</td>
                            <td class="alarm-name-cell">${escapeHtml(alarm.alarmName)}</td>
                            <td class="alarm-schema-cell">${escapeHtml(alarm.schemaName)}</td>
                        </tr>
        `;
    });

    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;

    return html;
}

/**
 * Render channels section
 * @param {Array} channelGroups - Array of channel groups
 * @param {string} unitTypeId - The unit type ID
 * @param {boolean} autoExpand - Whether to auto-expand the section
 * @returns {string} HTML string
 */
function renderChannels(channelGroups, unitTypeId, autoExpand = false) {
    if (!channelGroups || channelGroups.length === 0) {
        return '';
    }

    // For specific unit types, only show the desired channel groups
    let groupsToRender;
    if (unitTypeId === '16' || unitTypeId === '20') {
        // Connect 50: show only group 1
        groupsToRender = channelGroups.slice(0, 1);
    } else if (unitTypeId === '101') {
        // MCUv1 : show no channels
        groupsToRender = [];
    } else if (unitTypeId === '105') {
        // MCUv2: show groups 1 and 2
        groupsToRender = channelGroups.slice(0, 2);
    } else {
        // All other units: show all groups
        groupsToRender = channelGroups;
    }

    let totalChannels = 0;
    groupsToRender.forEach(group => {
        totalChannels += group.channels.length;
    });

    // If no channels to display, don't render the section at all
    if (totalChannels === 0) {
        return '';
    }

    // Auto-expand when search is active
    const displayStyle = autoExpand ? 'block' : 'none';
    const iconSymbol = autoExpand ? '▲' : '▼';

    let html = `
        <div class="expandable-section">
            <div class="section-header" data-section="channels">
                <span class="section-title">📡 Channels (${totalChannels})</span>
                <span class="expand-icon">${iconSymbol}</span>
            </div>
            <div class="section-content" style="display: ${displayStyle};">
    `;

    groupsToRender.forEach((group, groupIndex) => {
        html += `
            <div class="channel-group">
                <div class="channel-group-id">Group ${groupIndex + 1}</div>
                <div class="channels-grid">
        `;

        group.channels.forEach(channel => {
            // Capitalize the direction name (input -> Input, output -> Output)
            const directionName = channel.direction.name.charAt(0).toUpperCase() + channel.direction.name.slice(1);
            const directionColor = getDirectionColor(directionName);
            const directionIcon = getDirectionIcon(directionName);

            // Get the correct type/subtype based on actual direction
            let channelType = '';
            let channelSubtype = '';

            if (channel.direction.id === 1) { // INPUT
                channelType = channel.sInMainChannelSettingId;
                channelSubtype = channel.sInChannelSettingId;
            } else if (channel.direction.id === 2) { // OUTPUT
                channelType = channel.sOutMainChannelSettingId;
                channelSubtype = channel.sOutChannelSettingId;
            }

            html += `
                <div class="channel-item" style="border-left: 4px solid ${directionColor}">
                    <div class="channel-header">
                        <span class="channel-number">#${escapeHtml(channel.number)}</span>
                        <span class="channel-direction" style="color: ${directionColor}">
                            ${directionIcon} ${directionName}
                        </span>
                    </div>
                    <div class="channel-name">${escapeHtml(channel.name)}</div>
                    ${channelType ? `<div class="channel-type" style="font-size: 12px; color: #666; margin-top: 4px;">${escapeHtml(channelType)}</div>` : ''}
                    ${channelSubtype ? `<div class="channel-subtype" style="font-size: 11px; color: #888; margin-top: 2px;">${escapeHtml(channelSubtype)}</div>` : ''}
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    html += `
            </div>
        </div>
    `;

    return html;
}

/**
 * Display error message
 * @param {string} message - Error message
 * @param {HTMLElement} container - Container element
 */
export function displayError(message, container) {
    container.style.display = 'block';
    container.innerHTML = `
        <div class="error">
            <strong>❌ Error:</strong> ${escapeHtml(message)}
        </div>
    `;
}

/**
 * Render project metadata HTML
 * @param {Object} metadata - Project metadata object
 * @param {number} unitCount - Number of units found
 * @returns {string} HTML string
 */
function renderMetadata(metadata, unitCount = 0) {
    if (!metadata) return '';

    return `
        <div class="metadata-card">
            <h3>📋 Project Information</h3>
            <div class="metadata-grid">
                <div class="metadata-item">
                    <span class="metadata-label">Units Found:</span>
                    <span class="metadata-value">${unitCount}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Firmware:</span>
                    <span class="metadata-value">${escapeHtml(metadata.firmware)}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Studio Version:</span>
                    <span class="metadata-value">${escapeHtml(metadata.studioVersion)}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Format Version:</span>
                    <span class="metadata-value">${escapeHtml(metadata.formatVersion)}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Saved:</span>
                    <span class="metadata-value">${formatDate(metadata.savedAtUtc)}</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Display project metadata
 * @param {Object} metadata - Project metadata object
 * @param {HTMLElement} container - Container element
 * @deprecated Use displayUnits with metadata parameter instead
 */
export function displayMetadata(metadata, container) {
    if (!metadata) return;
    container.insertAdjacentHTML('afterbegin', renderMetadata(metadata));
}

/**
 * Attach click listeners for expandable sections
 * @param {HTMLElement} container - Container element
 */
function attachExpandListeners(container) {
    const headers = container.querySelectorAll('.section-header');
    
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const icon = header.querySelector('.expand-icon');
            
            if (content.style.display === 'none') {
                content.style.display = 'block';
                icon.textContent = '▲';
            } else {
                content.style.display = 'none';
                icon.textContent = '▼';
            }
        });
    });
}

/**
 * Format UTC date string
 * @param {string} utcString - UTC date string
 * @returns {string} Formatted date
 */
function formatDate(utcString) {
    try {
        const date = new Date(utcString);
        return date.toLocaleString();
    } catch {
        return utcString;
    }
}

/**
 * Display NMEA 2000 components in a table
 * @param {Array} components - Array of component objects
 * @param {HTMLElement} container - Container element
 * @param {Object} metadata - Optional project metadata
 */
export function displayComponents(components, container, metadata = null) {
    container.style.display = 'block';

    let html = '';

    if (metadata) {
        html += renderMetadata(metadata);
    }

    html += '<div class="content-card" style="padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">';
    html += '<h3>📡 NMEA 2000 Components</h3>';
    html += `<p style="margin-bottom: 15px; color: #666;">Found ${components.length} component${components.length !== 1 ? 's' : ''}</p>`;
    html += '<div style="overflow-x: auto;"><table><thead><tr>';
    html += '<th>PGN Name</th><th>PGN Number</th><th>Device</th><th>Instance</th><th>ID</th><th>Direction</th><th>Tab</th>';
    html += '</tr></thead><tbody>';

    components.forEach(comp => {
        const device = comp.device !== null && comp.device !== -1 ? comp.device : '';
        const instance = comp.instance !== null && comp.instance !== -1 ? comp.instance : '';

        html += '<tr>';
        html += `<td>${escapeHtml(comp.name)}</td>`;
        html += `<td>${comp.pgn}</td>`;
        html += `<td>${device}</td>`;
        html += `<td>${instance}</td>`;
        html += `<td>${escapeHtml(comp.id)}</td>`;
        html += `<td>${escapeHtml(comp.direction)}</td>`;
        html += `<td>${escapeHtml(comp.tabName)}</td>`;
        html += '</tr>';
    });

    html += '</tbody></table></div></div>';

    container.innerHTML = html;
}

/**
 * Display alerts in a detailed table
 * @param {Array} alerts - Array of alert objects
 * @param {HTMLElement} container - Container element
 * @param {Object} metadata - Optional project metadata
 */
export function displayAlertsDetailed(alerts, container, metadata = null) {
    container.style.display = 'block';

    let html = '';

    if (metadata) {
        html += renderMetadata(metadata);
    }

    html += '<div class="alarms-card"><div class="alarms-header">';
    html += '<h3>🔔 Alarms</h3>';
    html += `<span class="alarms-count">${alerts.length} alarm${alerts.length !== 1 ? 's' : ''}</span>`;
    html += '</div><div style="overflow-x: auto;"><table class="alarms-table"><thead><tr>';
    html += '<th>Alarm ID</th><th>Alarm Name</th><th>Schema</th>';
    html += '</tr></thead><tbody>';

    alerts.forEach(alert => {
        html += '<tr>';
        html += `<td class="alarm-id-cell">${escapeHtml(alert.alarmId)}</td>`;
        html += `<td class="alarm-name-cell">${escapeHtml(alert.alarmName)}</td>`;
        html += `<td class="alarm-schema-cell">${escapeHtml(alert.schemaName)}</td>`;
        html += '</tr>';
    });

    html += '</tbody></table></div></div>';

    container.innerHTML = html;
}

/**
 * Display memory allocations in a table
 * @param {Array} memory - Array of memory objects
 * @param {HTMLElement} container - Container element
 * @param {Object} metadata - Optional project metadata
 */
export function displayMemory(memory, container, metadata = null) {
    container.style.display = 'block';

    let html = '';

    if (metadata) {
        html += renderMetadata(metadata);
    }

    html += '<div style="padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">';
    html += '<h3>💾 Memory Allocations</h3>';
    html += `<p style="margin-bottom: 15px; color: #666;">Found ${memory.length} memory allocation${memory.length !== 1 ? 's' : ''}</p>`;
    html += '<div style="overflow-x: auto;"><table><thead><tr>';
    html += '<th>Schema</th><th>Memory Location</th><th>Bits</th>';
    html += '</tr></thead><tbody>';

    memory.forEach(mem => {
        html += '<tr>';
        html += `<td>${mem.tabName}</td>`;
        html += `<td>${mem.location}</td>`;
        html += `<td>${mem.bits}</td>`;
        html += '</tr>';
    });

    html += '</tbody></table></div></div>';

    container.innerHTML = html;
}

/**
 * Display modules with product numbers and variant numbers
 * @param {Array} units - Array of unit objects
 * @param {HTMLElement} container - Container element
 * @param {Object} metadata - Optional project metadata
 * @param {Array} modulesList - Array of module definitions from modules.js
 */
export function displayModules(units, container, metadata = null, modulesList = []) {
    container.style.display = 'block';

    let html = '';

    if (metadata) {
        html += renderMetadata(metadata);
    }

    // Create a lookup map from the modules list - MATCH ON VARIANT NUMBER
    const moduleLookup = new Map();
    modulesList.forEach(module => {
        moduleLookup.set(module.standardUnitVariantNumber, module);
    });

    // Enrich units with product numbers from modules.js based on variant number
    const enrichedUnits = units.map(unit => {
        const variantNumber = unit.standardUnitVariantNumber;
        const moduleInfo = moduleLookup.get(variantNumber);

        return {
            ...unit,
            productNumber: moduleInfo ? moduleInfo.productNumber : 'Unknown',
            moduleDescription: moduleInfo ? moduleInfo.description : ''
        };
    });

    // Generate Bill of Materials from enriched units
    const bom = generateBOMFromUnits(enrichedUnits);

    // Bill of Materials Section - showing what's actually used in the loaded file
    html += '<div style="padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">';
    html += '<h3>📋 Bill of Materials</h3>';
    html += `<p style="margin-bottom: 15px; color: #666;">Total items: ${bom.reduce((sum, item) => sum + item.quantity, 0)} | Unique products: ${bom.length}</p>`;
    html += '<div style="overflow-x: auto;"><table><thead><tr>';
    html += '<th>Quantity</th><th>Product Number</th>';
    html += '</tr></thead><tbody>';

    bom.forEach(item => {
        html += '<tr>';
        html += `<td style="text-align: center; font-weight: bold;">${item.quantity}</td>`;
        html += `<td>${escapeHtml(item.productNumber)}</td>`;
        html += '</tr>';
    });

    html += '</tbody></table></div></div>';

    container.innerHTML = html;
}

/**
 * Get unique modules from units array
 * @param {Array} units - Array of unit objects
 * @returns {Array} Array of unique modules
 */
function getUniqueModulesFromUnits(units) {
    const uniqueMap = new Map();

    units.forEach(unit => {
        const key = `${unit.name}|${unit.standardUnitVariantNumber || 'N/A'}`;
        if (!uniqueMap.has(key)) {
            uniqueMap.set(key, {
                productNumber: unit.name,
                variantNumber: unit.standardUnitVariantNumber || 'N/A',
                unitTypeId: unit.unitTypeId || 'N/A'
            });
        }
    });

    return Array.from(uniqueMap.values()).sort((a, b) =>
        a.productNumber.localeCompare(b.productNumber)
    );
}

/**
 * Generate Bill of Materials from units array
 * @param {Array} units - Array of unit objects (can be enriched with productNumber)
 * @returns {Array} BOM entries with product number, variant number, unit type, and quantity
 */
function generateBOMFromUnits(units) {
    const bomMap = new Map();

    units.forEach(unit => {
        // Use variant number as the key for proper aggregation
        const key = unit.standardUnitVariantNumber || unit.name;

        if (bomMap.has(key)) {
            bomMap.get(key).quantity++;
        } else {
            bomMap.set(key, {
                productNumber: unit.productNumber || 'Unknown',
                variantNumber: unit.standardUnitVariantNumber || 'N/A',
                unitName: unit.name,
                unitTypeId: unit.unitTypeId || 'N/A',
                quantity: 1
            });
        }
    });

    return Array.from(bomMap.values()).sort((a, b) =>
        (a.productNumber || 'Unknown').localeCompare(b.productNumber || 'Unknown')
    );
}
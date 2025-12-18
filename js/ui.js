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
 * @param {Array} alarms - Optional array of alarm objects
 */
export function displayUnits(units, container, metadata = null, hasSearch = false, alarms = []) {
    container.style.display = 'block';

    let html = '';

    // Add metadata if provided
    if (metadata) {
        html += renderMetadata(metadata, units.length);
    }

    // Add project-level alarms if provided
    if (alarms && alarms.length > 0) {
        html += renderProjectAlarms(alarms, hasSearch);
    }

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
                    <div class="detail-label">Variant Number</div>
                    <div class="detail-value">${escapeHtml(unit.standardUnitVariantNumber)}</div>
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
            const directionColor = getDirectionColor(channel.direction);
            const directionIcon = getDirectionIcon(channel.direction);

            html += `
                <div class="channel-item" style="border-left: 4px solid ${directionColor}">
                    <div class="channel-header">
                        <span class="channel-number">#${escapeHtml(channel.number)}</span>
                        <span class="channel-direction" style="color: ${directionColor}">
                            ${directionIcon} ${escapeHtml(channel.direction)}
                        </span>
                    </div>
                    <div class="channel-name">${escapeHtml(channel.name)}</div>
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
/**
 * Print Module
 * Builds the dense, one-row-per-channel table used for print/PDF export.
 * Kept separate from ui.js since it targets a different DOM container
 * with no interactivity (no expand/collapse, no event listeners).
 */

import { escapeHtml } from './utils.js';
import { getVisibleChannelGroups } from './ui.js';

/**
 * Render the full print table: header + one row per visible channel.
 * @param {Array} units - Array of unit objects (productNumber-enriched)
 * @param {Object} metadata - Project metadata
 * @param {Object} exportDetails - Optional { boatName, boatType, locationsByUnitId }
 * @returns {string} HTML string
 */
export function renderPrintTable(units, metadata, exportDetails = {}) {
    const { boatName = '', boatType = '', locationsByUnitId = {}, logoDataUrl = '' } = exportDetails;

    // WDU/MFD units (unitTypeId 200), MCUv1 units (unitTypeId 101), and MCUv2 units (unitTypeId 105) have no physical channels worth documenting - exclude them.
    const printableUnits = units.filter(unit => 
        unit.unitTypeId !== '200' && 
        unit.unitTypeId !== '101' && 
        unit.unitTypeId !== '105'
    );

    let html = renderCoverPage(boatName, boatType, metadata, printableUnits.length, logoDataUrl);

    printableUnits.forEach(unit => {
        html += renderUnitPage(unit, locationsByUnitId[String(unit.id)] || '');
    });

    return html;
}

/**
 * Render the cover/title page: boat identity and project metadata.
 * Always gets its own printed page, even if boat name/type are blank.
 * @param {string} boatName
 * @param {string} boatType
 * @param {Object} metadata - Project metadata
 * @param {number} unitCount - Number of units included in the report
 * @returns {string} HTML string
 */
function renderCoverPage(boatName, boatType, metadata, unitCount, logoDataUrl = '') {
    const today = new Date().toLocaleDateString();

    let html = '<div class="print-unit-page print-cover-page">';
    html += '<div class="print-cover-title">';
    if (logoDataUrl) {
        html += `<img class="print-cover-logo" src="${escapeHtml(logoDataUrl)}" alt="Logo">`;
    }
    if (boatType) html += `<div class="print-cover-boat-type">${escapeHtml(boatType)}</div>`;
    html += `<h1 class="print-cover-boat-name">${escapeHtml(boatName || 'Channel & Wiring Documentation')}</h1>`;
    if (boatName) html += '<div class="print-cover-subtitle">EmpirBus Channel &amp; IO Documentation</div>';
    html += '</div>';

    html += '<div class="print-cover-details">';
    html += `<div><span>Generated</span><span>${escapeHtml(today)}</span></div>`;
    html += `<div><span>Units</span><span>${escapeHtml(unitCount)}</span></div>`;
    if (metadata) {
        html += `<div><span>Firmware</span><span>${escapeHtml(metadata.firmware)}</span></div>`;
    }
    html += '</div>';

    html += '</div>';
    return html;
}

/**
 * Render a single unit's print page: header + its own channel table.
 * Every unit page breaks onto its own printed page.
 * @param {Object} unit - Unit object
 * @param {string} location - Location for this unit/module
 * @returns {string} HTML string
 */
function renderUnitPage(unit, location) {
    const rows = renderPrintRows(unit);

    // Skip units with no visible channels entirely (e.g. MCUv1).
    if (!rows) {
        return '';
    }

    const locationSuffix = location ? ` - Location: ${escapeHtml(location)}` : '';

    return `
        <div class="print-unit-page">
            <h3>Unit ID: ${escapeHtml(unit.id)}${locationSuffix}</h3>
            <table class="print-channel-table">
                <thead>
                    <tr>
                        <th>Ch. no</th>
                        <th>Channel Name</th>
                        <th>Input/Output</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
}

/**
 * Render one <tr> per visible channel for a single unit.
 * @param {Object} unit - Unit object
 * @returns {string} HTML string of table rows
 */
function renderPrintRows(unit) {
    let html = '';
    const groups = getVisibleChannelGroups(unit.channels, unit.unitTypeId);

    groups.forEach(group => {
        group.channels.forEach(channel => {
            const directionName = channel.direction.name
                ? channel.direction.name.charAt(0).toUpperCase() + channel.direction.name.slice(1)
                : '';

            html += `
                <tr>
                    <td>${escapeHtml(channel.number)}</td>
                    <td>${escapeHtml(channel.name)}</td>
                    <td>${escapeHtml(directionName)}</td>
                </tr>
            `;
        });
    });

    return html;
}

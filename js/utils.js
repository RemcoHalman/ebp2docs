/**
 * Utility Functions
 * Helper functions used throughout the application
 */

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Get icon for channel direction
 * @param {string} direction - Channel direction (Input/Output/Both)
 * @returns {string} Icon character
 */
export function getDirectionIcon(direction) {
    const icons = {
        'Input': '⬇',
        'Output': '⬆',
        'Both': '⬍'
    };
    return icons[direction] || '•';
}

/**
 * Get color for channel direction
 * @param {string} direction - Channel direction
 * @returns {string} Color hex code
 */
export function getDirectionColor(direction) {
    const colors = {
        'Input': '#4CAF50',   // Green
        'Output': '#2196F3',  // Blue
        'Both': '#FF9800'     // Orange
    };
    return colors[direction] || '#999';
}

/**
 * Generate and download PDF report
 * Uses browser's print to PDF functionality
 * @param {Object} metadata - Project metadata
 */
export function downloadPDF(metadata) {
    // Store original title
    const originalTitle = document.title;
    
    // Set document title for PDF
    if (metadata && metadata.firmware) {
        document.title = `EBP Report - Firmware ${metadata.firmware}`;
    }
    
    // Add print-specific class to body
    document.body.classList.add('print-mode');
    
    // Expand all sections before printing
    const allSections = document.querySelectorAll('.section-content');
    const expandIcons = document.querySelectorAll('.expand-icon');
    
    allSections.forEach(section => {
        section.style.display = 'block';
    });
    
    expandIcons.forEach(icon => {
        icon.textContent = '▲';
    });
    
    // Trigger print dialog
    window.print();
    
    // Restore after print
    setTimeout(() => {
        document.body.classList.remove('print-mode');
        document.title = originalTitle;
    }, 100);
}

/**
 * Format file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Debounce function to limit rate of function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Get statistics from units array
 * @param {Array} units - Array of units
 * @returns {Object} Statistics object
 */
export function getStatistics(units) {
    let totalChannels = 0;
    let inputChannels = 0;
    let outputChannels = 0;
    let bothChannels = 0;

    units.forEach(unit => {
        unit.channels.forEach(group => {
            group.channels.forEach(channel => {
                totalChannels++;
                if (channel.direction === 'Input') inputChannels++;
                else if (channel.direction === 'Output') outputChannels++;
                else if (channel.direction === 'Both') bothChannels++;
            });
        });
    });

    return {
        totalUnits: units.length,
        totalChannels,
        inputChannels,
        outputChannels,
        bothChannels
    };
}

/**
 * Filter units by search term
 * @param {Array} units - Array of units
 * @param {string} searchTerm - Search term
 * @returns {Array} Filtered units
 */
export function filterUnits(units, searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
        return units;
    }

    const term = searchTerm.toLowerCase();

    return units.filter(unit => {
        // Search in basic unit properties
        if (unit.name.toLowerCase().includes(term) ||
            unit.id.toLowerCase().includes(term) ||
            unit.serial.toLowerCase().includes(term)) {
            return true;
        }

        // Search in channel names
        for (const group of unit.channels) {
            for (const channel of group.channels) {
                if (channel.name.toLowerCase().includes(term)) {
                    return true;
                }
            }
        }

        return false;
    });
}

/**
 * Store data in localStorage
 * @param {string} key - Storage key
 * @param {*} data - Data to store
 */
export function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
        return false;
    }
}

/**
 * Retrieve data from localStorage
 * @param {string} key - Storage key
 * @returns {*} Retrieved data or null
 */
export function loadFromLocalStorage(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (error) {
        console.error('Failed to load from localStorage:', error);
        return null;
    }
}
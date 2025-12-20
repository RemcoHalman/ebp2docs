# EBP Parser Modules

Modern, idiomatic JavaScript modules for parsing EmpirBus Project (.ebp) files.

## Architecture

The parser is organized into focused, single-responsibility modules:

### Core Modules

#### `parser.js`
Main parsing module that handles XML parsing and data extraction.

**Exports:**
- `parseUnits(xmlString)` - Parse unit information
- `parseAlarms(xmlString)` - Parse alarm definitions
- `parseProjectMetadata(xmlString)` - Parse project metadata
- `parseSchemas(xmlString)` - Parse schema information
- `parseComponents(xmlString)` - Parse NMEA 2000 components
- `parseMemory(xmlString)` - Parse memory allocations
- `validateEBP(xmlString)` - Validate EBP file structure

#### `enums.js`
Type-safe enumerations for EBP data types.

**Exports:**
- `Direction` - Channel direction (INPUT, OUTPUT, BOTH, NONE)
- `N2kDirection` - NMEA 2000 direction (TRANSMIT, RECEIVE, NONE)

**Example:**
```javascript
import { Direction, N2kDirection } from './enums.js';

const dir = Direction.fromString('input');
console.log(dir.name); // 'input'
console.log(dir.id);   // 1

const n2k = N2kDirection.fromId(0);
console.log(n2k.name); // 'transmit'
```

#### `channel-decoder.js`
Decodes channel settings using efficient Map-based lookups.

**Exports:**
- `decodeChannelSettings(channel)` - Decode channel configuration

**Example:**
```javascript
import { decodeChannelSettings } from './channel-decoder.js';

const channel = {
    inMainChannelSettingId: 57,
    inChannelSettingId: 2,
    outMainChannelSettingId: 48,
    outChannelSettingId: 1
};

const decoded = decodeChannelSettings(channel);
console.log(decoded.input.type);    // 'digital input'
console.log(decoded.input.subtype); // 'closes to plus'
console.log(decoded.output.type);   // 'digital output +'
```

#### `component-decoder.js`
Decodes NMEA 2000 component information.

**Exports:**
- `decodeComponent(component, properties)` - Decode component data

**Supported Components:**
- 1283: Fluid Level (PGN 127505)
- 1281: Binary Switch (PGN 127501)
- 1282: Binary Indicator (PGN 127501)
- 1285: Temperature (PGN 130312)
- 1291: Switch Control (PGN 127502)
- 1376: J1939 AC PGN
- 1361: Proprietary PGN

**Example:**
```javascript
import { decodeComponent } from './component-decoder.js';

const component = { componentId: 1283, channelId: 5, unitId: 1 };
const properties = [
    { id: 0, value: '0' },  // instance
    { id: 1, value: '0' },  // fluid type (fuel)
    { id: 2, value: '1' }   // direction (receive)
];

const decoded = decodeComponent(component, properties);
console.log(decoded.name);      // 'Fluid Level'
console.log(decoded.pgn);       // 127505
console.log(decoded.id);        // 'fuel'
console.log(decoded.instance);  // 0
```

### UI Modules

#### `ui.js`
Handles all UI rendering and interactions.

#### `utils.js`
Utility functions for HTML escaping, filtering, and data manipulation.

## Design Principles

### 1. Modern JavaScript
- ES6+ features (classes, Maps, optional chaining, nullish coalescing)
- Module imports/exports
- Const/let instead of var
- Arrow functions where appropriate

### 2. No Java-isms
- ❌ No `Integer.MIN_VALUE` → ✅ Use `null` or `undefined`
- ❌ No verbose switch statements → ✅ Use Map-based lookups
- ❌ No Java-style comments → ✅ Clean JSDoc
- ❌ No foreign language variable names → ✅ English only

### 3. Functional Patterns
- Pure functions where possible
- Immutable data transformations
- Map/filter/reduce over loops
- No side effects in utility functions

### 4. Type Safety via JSDoc
```javascript
/**
 * @param {string} xmlString - XML content
 * @returns {Array<Object>} Parsed units
 */
export function parseUnits(xmlString) { ... }
```

## Performance Considerations

- **Map lookups**: O(1) average case vs O(n) for switch statements
- **Single DOM parse**: Parse XML once, query multiple times
- **Lazy evaluation**: Only parse what's needed
- **Efficient sorting**: Native sort with custom comparators

## Migration from Java Port

The original codebase was ported from Java. This refactored version:

1. **Replaces** Java enums with ES6 classes
2. **Eliminates** Integer.MIN_VALUE with null/undefined
3. **Simplifies** verbose switch statements with Maps
4. **Modernizes** naming (naam → name)
5. **Removes** all Java-related comments and patterns

## Testing

```javascript
import { parseUnits, validateEBP } from './parser.js';

// Validate before parsing
const validation = validateEBP(xmlContent);
if (validation.isValid) {
    const units = parseUnits(xmlContent);
    console.log(`Found ${units.length} units`);
}
```

## Browser Compatibility

- Requires ES6+ support (all modern browsers)
- Uses native DOMParser (no external dependencies)
- ES modules (type="module" required)

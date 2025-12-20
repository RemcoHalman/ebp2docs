/**
 * Enums Module
 * Type-safe enumerations for EBP data
 */

/**
 * Channel direction enumeration
 */
export class Direction {
    static NONE = new Direction('', -1);
    static BOTH = new Direction('both', 0);
    static INPUT = new Direction('input', 1);
    static OUTPUT = new Direction('output', 2);

    constructor(name, id) {
        this.name = name;
        this.id = id;
    }

    static fromString(str) {
        const normalized = str?.toLowerCase() || '';
        switch (normalized) {
            case 'both': return Direction.BOTH;
            case 'input': return Direction.INPUT;
            case 'output': return Direction.OUTPUT;
            default: return Direction.NONE;
        }
    }

    static fromId(id) {
        switch (id) {
            case 0: return Direction.BOTH;
            case 1: return Direction.INPUT;
            case 2: return Direction.OUTPUT;
            default: return Direction.NONE;
        }
    }

    toString() {
        return this.name;
    }
}

/**
 * NMEA 2000 direction enumeration
 */
export class N2kDirection {
    static NONE = new N2kDirection('', -1);
    static TRANSMIT = new N2kDirection('transmit', 0);
    static RECEIVE = new N2kDirection('receive', 1);

    constructor(name, id) {
        this.name = name;
        this.id = id;
    }

    static fromId(id) {
        switch (id) {
            case 0: return N2kDirection.TRANSMIT;
            case 1: return N2kDirection.RECEIVE;
            default: return N2kDirection.NONE;
        }
    }

    toString() {
        return this.name;
    }
}

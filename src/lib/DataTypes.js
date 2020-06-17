"use strict"

module.exports = class DataTypes {

    static varchar(size = 255) { return `VARCHAR(${size})`; }
    static char(size = 1) { return `CHAR(${size})`; }

    static binary(size = 1) { return `BINARY(${size})`; }
    static varbinary(size = 10) { return `VARBINARY(${size})`; }

    static tinyblob() { return 'TINYBLOB' };
    static blob() { return 'BLOB' };
    static longblob() { return 'LONGBLOB' };

    static tinytext() { return 'TINYTEXT' };
    static mediumtext() { return 'MEDIUMTEXT' };
    static text() { return 'TEXT' };
    static longtext() { return 'LONGTEXT' };


    static bit(size = 1) { return `BIT(${size})`; }
    static tinyint(size = 4) { return `TINYINT(${size})`; }
    static smallint(size = 6) { return `SMALLINT(${size})`; }
    static mediumint(size = 9) { return `MEDIUMINT(${size})`; }
    static int(size = 11) { return `INT(${size})`; }
    static bigint(size = 20) { return `BIGINT(${size})`; }


    static float() { return `FLOAT`; }
    static double() { return `DOUBLE`; }
    static decimal(size = 10, d = 0) { return `DECIMAL(${size}, ${d})`; }

    static datetime() { return `DATETIME`; }
    static timestamp() { return `TIMESTAMP`; }
    static date() { return `DATE`; }
    static time() { return `TIME`; }
    static year() { return `YEAR`; }

    static enum() {
        let result = '';
        for (let i = 0; i < arguments.length; i++) {
            result += `"${arguments[i]}"${(arguments.length - i) == 1 ? '' : ', '}`;
        }

        return `ENUM(${result})`;
    }

    static set() {
        let result = '';
        for (let i = 0; i < arguments.length; i++) {
            result += `"${arguments[i]}"${(arguments.length - i) == 1 ? '' : ', '}`;
        }

        return `SET(${result})`;
    }
}
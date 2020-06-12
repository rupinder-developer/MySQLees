"use strict"

import Store from './Store';

module.exports = class Database {
    constructor(options) {
        this._options = () => {
            return options;
        }
    }
}
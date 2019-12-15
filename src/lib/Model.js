"use strict"

import Database from './Database';

module.exports =  class Model extends Database {
    constructor(options) {
        super(options);
        return this;
    }
}
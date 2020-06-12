"use strict"

import Database from './Database';
import Store    from './Store';

module.exports =  class Model extends Database {
    constructor(options) {
        super(options);
    } 
}
"use strict"

class Store {
    constructor() {
        this.connection = null;
        this.config = null;

        this.created_models = {};
        
    }
}

module.exports = new Store();
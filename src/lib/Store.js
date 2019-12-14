"use strict"

class Store {
    constructor() {
        this.connection = null;
        this.config = null;

        this.created_models = {};
        this.pending_fk_queries = []; // Pending Foreign Keys Queries
    }
}

module.exports = new Store();
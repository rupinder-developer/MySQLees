"use strict"

import Database from './Database';

// Private Variables
const store = new WeakMap();
const model_name = new WeakMap();

module.exports =  class Model extends Database {

    constructor(_model_name, _schema, _store) {
        super();
        store.set(this, _store);
        model_name.set(this, _model_name);

        this.createSchema(_model_name, _schema, _store);
        return this;
    } 

    createSchema(_model_name, _schema, _store) {
        if (`${_model_name}`.trim()) {
            _store.connection.query(`SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = N'${_model_name}' AND TABLE_SCHEMA='${_store.config.database}' LIMIT 1`, function(err, result) {
                _store.created_models[_model_name] = 1;  
                if (result) {
                    if (result[0].count === 0) {
                        // Installing Schema
                        _schema.parseSchema(_model_name, _store);
                        _schema.installSchema(_store);  
                    } else {
                        // Updating Schema
                    }
                }
            }.bind(this)); 
        }           
    }
}
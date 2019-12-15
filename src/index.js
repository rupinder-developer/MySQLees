"use strict"

import Store from './lib/Store';
import Schema from './lib/Schema';
import Model from './lib/Model';

class MySQLees {
    connect(mysql, config) {
        Store.created_models = {};
        Store.pending_fk_queries = []; // Pending Foreign Keys Queries
        Store.config = config;
        Store.connection = mysql.createConnection({...config, multipleStatements: true});
        Store.connection.connect(function(err) {
            if (err) console.log(err);
        }); 
        return Store.connection;
    }

    model(model_name, schema) {
        return new Model(model_name, schema, Store);
    }

    schema(schema, options = {}) {
        return new Schema(schema, options);
    } 
}

module.exports = new MySQLees();
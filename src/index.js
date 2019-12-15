"use strict"

import Store from './lib/Store';
import Schema from './lib/Schema';
import Model from './lib/Model';

class MySQLees {
    connect(mysql, config) {
        Store.db_connection = true;
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
        if (Store.db_connection) {
            return new Model(model_name, schema, Store);
        } else {
            console.log('Error: Database Connection is missing!!')
            process.exit();
        }
    }

    schema(schema, options = {}) {
        return new Schema(schema, options);
    }
}

module.exports = new MySQLees();
"use strict"

import Store from './lib/Store';
import Schema from './lib/Schema';
import Model from './lib/Model';

class MySQLees {
    connect(mysql, config) {
        Store.isConnected = true;
        Store.createdModels = {};
        Store.pendingFkQueries = []; // Pending Foreign Keys Queries
        Store.config = config;
        Store.connection = mysql.createConnection({...config, multipleStatements: true});
        Store.connection.connect(function(err) {
            if (err) console.log(err);
        }); 
        return Store.connection;
    }

    model(modelName, schema) {
        if (Store.isConnected) {
            schema.implementSchema(modelName, Store);
            return new Model();
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
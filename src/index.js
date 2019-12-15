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
        if (Store.isConnected && Store.config.database) {
            schema.implementSchema(modelName, Store);
            return new Model({
                isConnected: Store.isConnected,
                connection: Store.connection,
                config: Store.config,
                schema: schema.schema,
                modelName
            });
        } else {
            if (Store.isConnected && !Store.config.database) {
                console.log('Error: Failed to connect to database!! (Database not found)');
            } else {
                console.log('Error: Failed to connect to database!!, Please use connect() method to establish database connectivity!!');
            }
            process.exit();
        }
    }

    schema(schema, options = {}) {
        return new Schema(schema, options);
    }
}

module.exports = new MySQLees();
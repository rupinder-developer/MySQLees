"use strict"

// Inbuilt Modules
import cluster from 'cluster';

// Classes
import Model  from './lib/Model';
import Store  from './lib/Store';
import Schema from './lib/Schema';

class MySQLees {
    static connect(mysql, config) {
        
        Store.pendingFkQueries = []; // Pending Foreign Keys Queries
        Store.dropFkQueries    = ''; // This Variable contains the queries which helps to drop all the present Foreign Keys in the database while updating schema.
        Store.createdModels    = {};
        
        Store.isConnected = true;
        Store.options     = {};
        Store.config      = config;
        Store.connection  = mysql.createConnection({...config, multipleStatements: true});
        
        Store.connection.connect(function(err) {
            if (err) console.log(err);
        }); 

        return Store.connection;
    }

    static getConnection() {
        return Store.connection;
    }

    static model(modelName, schema) {
        if (Store.isConnected && Store.config.database) {
            if (cluster.isMaster) {
                schema.implementSchema(modelName);
            }
            return new Model({
                schema: schema.schema,
                modelName
            });
        }
        if (Store.isConnected && !Store.config.database) {
            console.log('Error: Failed to connect to database!! (Database not found)');
        } else {
            console.log('Error: Failed to connect to database!!, Please use connect() method to establish database connectivity!!');
        }
        process.exit();
    }

    static schema(schema, options = {}) {
        return new Schema(schema, options);
    }

    static options(options = {}) {
        Store.options = options;
    }
}

module.exports = MySQLees;
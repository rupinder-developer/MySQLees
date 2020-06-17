"use strict"

// Inbuilt Modules
import cluster from 'cluster';

// Classes
import Model  from './lib/Model';
import Store  from './lib/Store';
import Schema from './lib/Schema';
import DataTypes from './lib/DataTypes';

class MySQLees {
    static bind(mysql) {
        // Initializing variables for schema implementation
        Store.pendingFkQueries   = []; // Pending Foreign Keys Queries
        Store.dropFkQueries      = ''; // This Variable contains the queries which helps to drop all the present Foreign Keys in the database while updating schema.
        Store.createdModels      = {};
        Store.implementedModels  = [];
        Schema.connectionTimeout = null;
        Schema.connection        = null; // Connection variable of schema implementation 

        // Binding official MySQL package
        Store.mysql = mysql; 
    }
    
    static connect(config) {
        if (!Store.mysql) {
            console.error('Error: Failed to bind MySQL!!');
            process.exit();
        }
        
        // MySQL Connection Variables
        Store.isConnected = true;
        Store.isPool      = false;
        Store.options     = {};
        Store.config      = config;
        Store.connection  = Store.mysql.createConnection(config);
        
        Store.connection.connect(function(err) {
            if (err) console.error(err);
        }); 

        return Store.connection;
    }

    static createPool(config) {
        if (!Store.mysql) {
            console.error('Error: Failed to bind MySQL!!');
            process.exit();
        }
        
        // MySQL Connection Variables
        Store.isConnected = true;
        Store.isPool      = true;
        Store.options     = {};
        Store.config      = config;
        Store.connection  = Store.mysql.createPool(config);
    
        return Store.connection;
    }

    static connection() {
        return Store.connection;
    }

    static mysql() {
        return Store.mysql;
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
            console.error('Error: Failed to connect to database!! (Database not found)');
        } else {
            console.error('Error: Failed to connect to database!!, Please use connect() method to establish database connectivity!!');
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

// Satic Variables for MySQLess
MySQLees.dataType = DataTypes;

module.exports = MySQLees;
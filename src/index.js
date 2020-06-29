"use strict"

// Dependencies
import regeneratorRuntime from "./dependencies/runtime";

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
        Store.createdModels      = {};
        Store.implementedModels  = [];

        Schema.connectionTimeout = null;
        Schema.connection        = null; // Connection variable of schema implementation 
        
        Store.models = new Map();
        
        // Binding official MySQL package
        Store.mysql = mysql; 
    }
    
    static createConnection(config) {
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

    static model(modelName, schema) {
        if (Store.isConnected && Store.config.database) {
            if (cluster.isMaster) {
                schema.implementSchema(modelName);
            }
            const model = new Model();
            model.modelName = modelName;
            model.schema = schema.schema;
            return model;
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

    static connection() {
        if (Store.isPool) {
            return null;
        }
        return Store.connection;
    }

    static pool() {
        if (Store.isPool) {
            return Store.connection;
        }
        return null;
    }

    static mysql() {
        return Store.mysql;
    }
    
    /**
    * Pull connection from MySQL Pool
    * 
    * @return {Promise} - Pool Connection
    */
    static getConnection() {
        return new Promise((resolve, reject) => {
            if (Store.isPool) {
                Store.connection.getConnection((err, connection) => {
                    if (err) reject(err);

                    resolve(connection);
                });
            } else {
                reject(new Error('Failed to get connection from pool, please use createPool() method for connection pooling.'));
            }
        });
    }
}

// Satic Variables for MySQLess
MySQLees.dataType = DataTypes;

module.exports = MySQLees;
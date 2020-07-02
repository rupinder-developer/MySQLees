"use strict"

// Dependencies
import regeneratorRuntime from "./dependencies/runtime";

// Inbuilt Modules
import cluster      from 'cluster';
import EventEmitter from 'events';

// Classes
import Model     from './lib/Model';
import Store     from './lib/Store';
import Schema    from './lib/Schema';
import DataTypes from './lib/DataTypes';

class MySQLees {
    static bind(mysql) {
        // Initializing variables for schema implementation
        Store.pendingFkQueries  = []; // Pending Foreign Keys Queries
        Store.createdModels     = {};
        Store.implementedModels = [];

        Schema.shouldProceed = true;
        Schema.connection    = null; // Connection variable of schema implementation 
        
        Store.models = new Map();

        // Initializing Emit
        Store.eventEmitter = new EventEmitter(); 
        
        // Binding official MySQL package
        Store.mysql = mysql; 
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
            console.error('Error: Failed to connect to database!!, Please use createConnection() or createPool() method to establish database connectivity!!');
        }
        process.exit();
    }

    static schema(schema, options = {}) {
        return new Schema(schema, options);
    }

    static options(options = {}) {
        Store.options = options;
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

    static getConnection() {
        return new Promise((resolve, reject) => {
            if (Store.isPool) {
                // Pull connection from connection pool
                Store.connection.getConnection((err, connection) => {
                    if (err) reject(err);

                    resolve(connection);
                });
            } else {
                reject(new Error('Failed to get connection from pool, please use createPool() method for connection pooling.'));
            }
        });
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

    static escape(value) {
        return Store.mysql.escape(value);
    }

    static escapeId(value, param = null) {
        if (param) {
            return Store.mysql.escapeId(value, param);
        }
        return Store.mysql.escapeId(value);
    }

    static query(stmt, params = [], connection = null) {
        return new Promise((resolve, reject) => {
            if (!connection) {
                connection = Store.connection;
            }
            connection.query(stmt, params, (error, result) => {
                if (error) reject(error);

                resolve(result);
            })
        });
    }

    static on(event, callback) {
        Store.eventEmitter.on(event, callback);
    }
}

// Satic Variables for MySQLess
MySQLees.dataType = DataTypes;
MySQLees.Model    = Model;

module.exports = MySQLees;
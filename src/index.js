"use strict"

// Dependencies
const mysql = require('mysql');

// Classes
const Model     = require('./lib/Model');
const Store     = require('./lib/Store');
const Schema    = require('./lib/Schema');
const DataTypes = require('./lib/DataTypes');

class MySQLees {
    static init() {
        if (!Store.init) {
            Store.init    = true;
            Store.options = {};
            Store.models  = new Map(); 
    
            // Satic Variables for MySQLess
            MySQLees.dataType = DataTypes;
            MySQLees.Model    = Model;
    
            // Binding official MySQL package
            Store.mysql = mysql; 
        }

    }

    static model(modelName, schema) {
        const model = new Model(schema);

        model.modelName = modelName;
        model.schema    = schema.schema;

        return model;
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
}

MySQLees.init();

module.exports = MySQLees;
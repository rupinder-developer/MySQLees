"use strict"

// Classes
import QueryBuilder from './QueryBuilder';
import Store        from './Store';

module.exports =  class Model extends QueryBuilder {
    /**
     * Model Constructor
     * 
     * @param {Object} obj 
     */
    constructor() {
        super();

        /**
         * Private Variables
         * 
         * 1. _$schema {Object} 
         * 
         * 2. _$modelName {String}
         * 
         * 3. _$primaryKeys {Object} -> {
         *          string: 'key1, key2', 
         *          array: ['key1', 'key2'], 
         *          object: { key1: 1, key2: 1 }
         *    } 
         * 
         * 4. _$aiField {String} - AUTO_INCREMENT
         * 
         * 5. _$connection {Object} - MySQL Connection 
         * 
         */
        this._$schema      = () => null;
        this._$modelName   = () => null;
        this._$primaryKeys = () => null;
        this._$aiField     = () => null; // AUTO_INCREMENT Field
        this._$connection  = () => Store.connection;
    }

    /**
     * Map data to Model
     * 
     * @param {Object} obj 
     */
    mapObject(obj) {
        // Map obj to Model
        for (let column in this._$schema()) {
            if (obj.hasOwnProperty(column)) {
                this[column] = obj[column];
            }
        }
        
        // Map Timestamps to Model
        if (obj.hasOwnProperty('created_at')) {
            this['created_at'] = obj['created_at'];
        }
        if (obj.hasOwnProperty('updated_at')) {
            this['updated_at'] = obj['updated_at'];
        }
    }

    /**
     * Map one Model to another
     * 
     * @param {Model} - Instance of Model 
     */
    mapModel(model) {
        model._$schema      = this._$schema;
        model._$modelName   = this._$modelName;
        model._$primaryKeys = this._$primaryKeys;
        model._$aiField     = this._$aiField;
        model._$connection  = this._$connection;
    }

    /**
     * Create new instace of Model
     * 
     * @param {Object} obj
     * 
     * @return {Model} - New Instance of Model
     */
    create(obj) {
        const model = new Model();

        // Map all private data to new instace of Model
        this.mapModel(model);

        // Map data to new instace of Model
        model.mapObject(obj);

        return model;
    }

    /**
     * UPSERT data to database
     * 
     * @return {Promise} - Model Instance
     */
    save() {
        return new Promise((resolve, reject) => {
            this._$connection().query(`INSERT INTO ${this._$modelName()} SET ? ON DUPLICATE KEY UPDATE ?`, [this, this], (error, result)  => {
                if (error) reject(error);

                if (result && result.insertId) {
                    this[this._$aiField()] = result.insertId;
                }

                resolve(this);
            });
        });   
    }

    /**
     * Set new connection to Model
     * 
     * @param {Object} connection - MySQL Connection
     * 
     * @return {Model} 
     */
    useConnection(connection) {
        this._$connection = () => connection;
        return this;
    }

    /**
     * Release Pool Connection
     */
    releaseConnection() {
        this._$connection().release();
        this._$connection = () => Store.connection;
    }

    /**
     * Pull connection from MySQL Pool
     * 
     * @return {Promise} - Pool Connection
     */
    getConnection() {
        return new Promise((resolve, reject) => {
            if (Store.isPool) {
                Store.connection.getConnection((err, connection) => {
                    if (err) reject(err);

                    resolve(connection);
                });
            } else {
                resolve(connection);
            }
        });
    }

    
    /**
     * Set & Parse Schema (Generate Final Schema for Model)
     */
    set schema(schema) {
        const finalSchema = {};
        const primaryKeys = {
            string: '',
            array: [],
            object: {} 
        };

        for(let column in schema) {
            // Skip if column is deprecated
            if (schema[column].deprecated) {
                continue;
            }

            // Save Primary Keys
            if (schema[column].primaryKey) {
                primaryKeys.array.push(column);
                primaryKeys.object[column] = 1;
            }

            // Save AUTO_INCREMENT Field
            if (schema[column].autoIncrement) {
                this._$aiField = () => column;
            }

            // Save column if not deprecated
            finalSchema[column] = schema[column];
        }

        primaryKeys.string = primaryKeys.array.join();

        this._$schema      = () => finalSchema;
        this._$primaryKeys = () => primaryKeys;
    }

    /**
     * Set Model Name
     */
    set modelName(modelName) {
        this._$modelName = () => modelName;
    }
}
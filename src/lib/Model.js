"use strict"

// Classes
import QueryHelper from './QueryHelper';
import Store        from './Store';

module.exports =  class Model extends QueryHelper {
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
         * 6. _$where {String} - Projection for SELECT Query
         * 
         * 7. _$project {String} - Projection for SELECT Query
         * 
         * 8. _$limit {String}
         * 
         * 9. _$orderBy {String}
         */

            
        this._$schema    = () => null;
        this._$modelName = () => null;

        this._$primaryKeys = () => null;
        this._$aiField     = () => null; // AUTO_INCREMENT Field

        this._$connection = () => Store.connection;

        // Query Chunks
        this._$where   = () => '';
        this._$project = () => '*';
        this._$limit   = () => '';
        this._$orderBy = () => '';
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
     * @param {Model} model - Instance of Model 
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
     * Upsert data to database
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
     * 
     * @param {Object} data 
     * @param {Object} where 
     * 
     * @return {Promise}
     */
    update(data, where = {}) {
        return new Promise((resolve, reject) => {
            this._$connection().query(`UPDATE ${this._$modelName()} SET ? ${this.where(where)}`, [data], function(error, result) {
                if (error) reject(error);

                resolve(result);
            });
        });
    }

    /**
     * 
     * @param {Object} where 
     * 
     * @return {Promise}
     */
    delete(where = {}) {
        return new Promise((resolve, reject) => {
            this._$connection().query(`DELETE FROM ${this._$modelName()} ${this.where(where)}`, function(error, result) {
                if (error) reject(error);

                resolve(result);
            });
        });
    }

    /**
     * 
     * @param {Array} cols 
     * @param {Array} values 
     * 
     * @return {Promise}
     */
    insertMany(cols, values) {
        return new Promise((resolve, reject) => {
            this._$connection().query(`INSERT INTO ${this._$modelName()}(${cols.join()}) VALUES ?`, [values], function(error, result) {
                if (error) reject(error);

                resolve(result);
            });
        });
    }

    /**
     * Execute SELECT Query
     * 
     * @returns {Promise}
     */
    exec(lean = false) {
        const promise = new Promise((resolve, reject) => {
            this._$connection().query(`SELECT ${this._$project()} FROM ${this._$modelName()} ${this._$where()} ${this._$orderBy()} ${this._$limit()}`, (error, result) => {
                if (error) reject(error);

                if(result.length > 0 && !lean) {
                    const final = result.map((row) => {
                        return this.create(row);
                    });

                    resolve(final);
                } else {
                    resolve(result);
                }
            });
        });
        this.clearChunks(); // Clear Query Chunks
        return promise;
    }

    /**
     * Generate WEHRE Clause Statement
     * 
     * @param {Object} obj  
     * 
     * @return {Model}
     */
    find(where = {}) {
        this._$where = () => this.where(where);
        return this;
    }

    /** 
     * Set projection for SELECT query
     * 
     * @param {Array} arr
     * 
     * @return {Model}
     */
    project(arr = []) {
        if (arr.length > 0) {
            const projection = new Set([...arr, ...(this._$primaryKeys().array)]);
            this._$project = () => [...projection].join();
        }
        
        return this;
    }

    /**
     * Generate LIMIT Clause Statement
     * 
     * @param {Number} limit 
     * @param {Number} [offset] 
     * 
     * @return {Model}
     */
    limit(limit, offset = null) {
        this._$limit = () => `LIMIT ${offset ? `${offset}, ` : ''} ${limit}`;
        return this;
    }

    /**
     * Generate ORDER BY Clause Statement
     * 
     * @param {String} cols 
     * @param {String} [sortBy] 
     * 
     * @return {Model}
     */
    orderBy(cols, sortBy = '') {
        this._$orderBy = () => `ORDER BY ${cols} ${sortBy}`;
        return this;
    }

    /**
     * Clear Query Chunks
     */
    clearChunks() {
        this._$where   = () => '';
        this._$project = () => '*';
        this._$limit   = () => '';
        this._$orderBy = () => '';
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
     * Release Pool Connection
     */
    releaseConnection() {
        this._$connection().release();
        this._$connection = () => Store.connection;
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
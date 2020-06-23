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
    constructor(obj = {}) {
        super();

        // Private Varibales
        this._$schema = () => null;
        this._$modelName = () => null;
        this._$primaryKeys = () => null;
        this._$connection = () => Store.connection;

        // Map obj to Model
        for (let column in obj) {
            if (this._$schema()[column]) {
                this[column] = obj[column];
            }
        }
    }

    /**
     * Create new instace of Model
     * 
     * @param {Object} obj
     * @return {Object} - New Instance of Model
     */
    create(obj) {
        return new Model({...obj, ...this});
    }

    /**
     * UPSERT data to database
     * 
     * @return {Promise} - Model Instance
     */
    save() {
        return new Promise((resolve, reject) => {
            this._$connection().query(`INSERT INTO ${this._$modelName()} SET ? ON DUPLICATE KEY UPDATE ?`, [this, this], (error, result)  => {

            });
        });   
    }

    /**
     * Set new connection to Model
     * 
     * @param {Object} connection - MySQL Connection
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
                    if (err) resolve(err);

                    resolve(connection);
                });
            } else {
                resolve(connection);
            }
        });
    }

    
    /**
     * Set & Parse Schema
     */
    set schema(schema) {
        const finalSchema = {};
        const primaryKeys = {
            string: '',
            array: [],
            object: {} 
        };

        for(let column in schema) {
            if (schema[column].deprecated) {
                continue;
            }

            if (schema[column].primaryKey) {
                primaryKeys.array.push(column);
                primaryKeys.object[column] = 1;
            }

            finalSchema[column] = schema[column];
        }

        primaryKeys.string = primaryKeys.array.join();

        this._$schema = () => finalSchema;
        this._$primaryKeys = () => primaryKeys;
    }

    /**
     * Set Model Name
     */
    set modelName(modelName) {
        this._$modelName = () => modelName;
    }
}
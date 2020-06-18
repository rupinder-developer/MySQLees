"use strict"

// Classes
import QueryBuilder from './QueryBuilder';
import Store        from './Store';

module.exports =  class Model extends QueryBuilder {
    constructor() {
        super();

        // Private Varibales
        this._schema = () => null;
        this._modelName = () => null;
        this._primaryKeys = () => null;
    } 

    set schema(schema) {
        const finalSchema = {};
        const primaryKeys = [];
        for(let column in schema) {
            if (schema[column].deprecated) {
                continue;
            }

            if (schema[column].primaryKey) {
                primaryKeys.push(column);
            }

            finalSchema[column] = schema[column];
        }

        this._schema = () => finalSchema;
        this._primaryKeys = () => primaryKeys;
    }

    set modelName(modelName) {
        this._modelName = () => modelName;
    }
}
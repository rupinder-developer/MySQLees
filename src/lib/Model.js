"use strict"

import Database from './Database';

let model_name = new WeakMap();
let schema = new WeakMap();
let connection = new WeakMap();
let config = new WeakMap();

module.exports =  class Model extends Database {
    
    constructor(_model_name, _schema, _store) {
        super();
        // Private Variables
        model_name.set(this, _model_name);
        schema.set(this, _schema);
        connection.set(this, _store.connection);
        config.set(this, _store.config);

        
        this.validateSchema();
        return this;
    } 

    validateSchema() {
        connection.get(this).query(`SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = N'${model_name.get(this)}' AND TABLE_SCHEMA='${config.get(this).database}' LIMIT 1`, function(err, result) {
            if (result) {
                if (result[0].count === 0) {
                    this.installSchema();
                } else {
                    this.updateSchema();
                }
            }
        }.bind(this));               
    }

    updateSchema() {

    }

    installSchema() {
        if (schema.get(this).columns.length > 0) {
            let alter = `ALTER TABLE ${model_name.get(this)}`;
            let sql = `
                CREATE TABLE IF NOT EXISTS \`${model_name.get(this)}\` (
                    ${schema.get(this).columns.join()}
                );
            `;

            if (schema.get(this).primary_keys) {
                sql += `${alter} ${schema.get(this).primary_keys};`;
            } 

            if (schema.get(this).constraints.add.length > 0) {
                sql += `${alter} ${this.constraints.add.join()};`;
            }

            if (schema.get(this).constraints.modify.length > 0) {
                sql += `${alter} ${schema.get(this).constraints.modify.join()};`;
            }

            if (schema.get(this).constraints.alter.length > 0) {
                sql += `${alter} ${this.constraints.alter.join()};`;
            }
            
            if (schema.get(this).indexes.length > 0) {
                for(const index of schema.get(this).indexes) {
                    sql += `CREATE ${index.is_unique?'UNIQUE':''} INDEX ${index.index_name} ON ${model_name.get(this)} (${index.columns});`;
                }
            }

            if (schema.get(this).foreign_keys.length > 0) {
                for(const foreign_key of schema.get(this).foreign_keys) {
                    sql += `${alter} ${foreign_key};`;
                }
            }
            connection.get(this).query(sql, function(err, result) {});
        } 
    }
}
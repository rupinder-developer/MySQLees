"use strict"

import Database from './Database';

module.exports =  class Model extends Database {
    constructor(model_name, schema) {
        super();
        this.model_name = model_name;
        this.schema = schema;
        this.validateSchema();
        return this;
    } 

    validateSchema() {
        global.connection.query(`SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = N'${this.model_name}' AND TABLE_SCHEMA='${global.config.database}' LIMIT 1`, function(err, result) {
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
        if (this.schema.columns.length > 0) {
            let alter = `ALTER TABLE ${this.model_name}`;
            let sql = `
                CREATE TABLE IF NOT EXISTS \`${this.model_name}\` (
                    ${this.schema.columns.join()}
                );
            `;

            if (this.schema.primary_keys) {
                sql += `${alter} ${this.schema.primary_keys};`;
            } 

            if (this.schema.constraints.add.length > 0) {
                sql += `${alter} ${this.constraints.add.join()};`;
            }

            if (this.schema.constraints.modify.length > 0) {
                sql += `${alter} ${this.schema.constraints.modify.join()};`;
            }

            if (this.schema.constraints.alter.length > 0) {
                sql += `${alter} ${this.constraints.alter.join()};`;
            }
            
            if (this.schema.indexes.length > 0) {
                for(const index of this.schema.indexes) {
                    sql += `CREATE ${index.is_unique?'UNIQUE':''} INDEX ${index.index_name} ON ${this.model_name} (${index.columns});`;
                }
            }

            if (this.schema.foreign_keys.length > 0) {
                for(const foreign_key of this.schema.foreign_keys) {
                    sql += `${alter} ${foreign_key};`;
                }
            }
            global.connection.query(sql, function(err, result) {});
        } 
    }
}
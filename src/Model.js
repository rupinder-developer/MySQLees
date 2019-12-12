"use strict"


module.exports =  class Model {
    constructor(model_name, schema) {
        this.model_name = model_name;
        this.schema = schema;

        return this;
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
            
            if (this.schema.foreign_keys.length > 0) {
                for(const foreign_key of this.schema.foreign_keys) {
                    sql += `${alter} ${foreign_key};`;
                }
            }
        } 
    }
}
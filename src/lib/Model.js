"use strict"

import Database from './Database';

let model_name = new WeakMap();
let schema = new WeakMap();
let connection = new WeakMap();
let config = new WeakMap();
let update_schema_queries = new WeakMap();

module.exports =  class Model extends Database {
    
    constructor(_model_name, _schema, _store) {
        super();
        // Private Variables
        model_name.set(this, _model_name);
        schema.set(this, _schema);
        connection.set(this, _store.connection);
        config.set(this, _store.config);
        update_schema_queries.set(this, []);
        
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
        connection.get(this).query(`DESC \`${model_name.get(this)}\``, function(err, result) {
            let alter = `ALTER TABLE ${model_name.get(this)}`;
            for(let db_col of result) {
                const meta_data = {
                    sql: '',
                    primary_keys: [],
                    pk_should_drop: false
                };
                if (datatype && datatype.name) {
                    const column = schema.get(this).schema[db_col.Field];
                    if (column) {
                        // If column is already present in database
                    
                        // Validate Primary Key 
                        if (column.primary_keys) {
                            if (db_col.Key != 'PRI') {
                                // Adding Primary key
                                meta_data.primary_keys.push(`\`${db_col.Field}\``)
                            }
                        } else if (db_col.Key == 'PRI') {
                            // Removing Primary Key
                            meta_data.pk_should_drop = true;
                        }

                        // Validate NOT NULL & AUTO INCREMENTS
                        if (column.not_null || column.auto_increment) {
                            if (meta_data.pk_should_drop) {
                                meta_data.sql += `${alter} MODIFY \`${db_col.Field}\` ${datatype.name}${datatype.size?`(${datatype.size})`:``} ${not_null?'NOT NULL':''};`;
                            } else {
                                meta_data.sql += `${alter} MODIFY \`${db_col.Field}\` ${datatype.name}${datatype.size?`(${datatype.size})`:``} ${not_null?'NOT NULL':''} ${auto_increment?'AUTO_INCREMENT':''};`;
                            }
                        }

                        // Validate Unique Key
                        if (column.unique && !column.primary_keys) {
                            if (db_col.Key != 'UNI') {
                                // Adding Unique Key
                                meta_data.sql += `${alter} ADD UNIQUE KEY \`${db_col.Field}\` (\`${db_col.Field}\`);`
                            }
                        } else if (db_col.Key == 'UNI') {
                            // Removing Unique Key
                            meta_data.sql += `${alter} DROP INDEX \`${db_col.Field}\`;`;
                        }

                        // Validate Default Value
                        if (typeof column.default_value !== 'undefined') {
                            // Setting Default Value
                            meta_data.sql += `${alter} ALTER \`${db_col.Field}\` SET DEFAULT '${column.default_value}'`
                        } else if (db_col.Default) {
                            // Droping Default Value
                            meta_data.sql += `${alter} ALTER \`${db_col.Field}\` DROP DEFAULT;`
                        }

                        // Validate Foreign Key
                        
                            
                    } else {
                        // If column is not present in database
                        
                    }
                } // end of datatype && datatype.name
            }
        });
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
                sql += `${alter} ${schema.get(this).constraints.add.join()};`;
            }

            if (schema.get(this).constraints.modify.length > 0) {
                sql += `${alter} ${schema.get(this).constraints.modify.join()};`;
            }

            if (schema.get(this).constraints.alter.length > 0) {
                sql += `${alter} ${schema.get(this).constraints.alter.join()};`;
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
            
            connection.get(this).query(sql, function(err, result) {
                if (err) {
                    console.log(err);
                }
            });
        } 
    }
}
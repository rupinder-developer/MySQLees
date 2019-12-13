"use strict"

import Database from './Database';

let model_name = new WeakMap();
let connection = new WeakMap();
let config = new WeakMap();

module.exports =  class Model extends Database {

    constructor(_model_name, _schema, _store) {
        super();
        // Private Variables
        model_name.set(this, _model_name);
        connection.set(this, _store.connection);
        config.set(this, _store.config);
        
        this.validateSchema(_schema);
        return this;
    } 

    validateSchema(_schema) {
        connection.get(this).query(`SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = N'${model_name.get(this)}' AND TABLE_SCHEMA='${config.get(this).database}' LIMIT 1`, function(err, result) {
            if (result) {
                if (result[0].count === 0) {
                    _schema.parseSchema();
                    this.installSchema(_schema);
                } else {
                    this.updateSchema(_schema);
                }
            }
        }.bind(this));               
    }

    updateSchema(_schema) {
        const _model_name = model_name.get(this);
        connection.get(this).query(`DESC \`${_model_name}\``, function(err, result) {
            let alter = `ALTER TABLE ${_model_name}`;
            const meta_data = {
                sql: '',
                primary_keys: [],
                pk_should_drop: false
            };
            for(let db_col of result) {
                if (_schema.options.timestamps) {
                    if (db_col.Field == 'created_at' || db_col.Field == 'updated_at') {
                        continue;
                    }
                }
                
                const column = _schema.schema[db_col.Field];
                if (column) {
                    if (column.datatype && column.datatype.name) {
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
                                meta_data.sql += `${alter} MODIFY \`${db_col.Field}\` ${column.datatype.name}${column.datatype.size?`(${column.datatype.size})`:``} ${column.not_null?'NOT NULL':''};`;
                            } else {
                                meta_data.sql += `${alter} MODIFY \`${db_col.Field}\` ${column.datatype.name}${column.datatype.size?`(${column.datatype.size})`:``} ${column.not_null?'NOT NULL':''} ${column.auto_increment?'AUTO_INCREMENT':''};`;
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
                        
                    } // end of datatype && datatype.name      
                } else {
                    // If column is not present in database
                    
                }
            }
        }.bind(this));
    }

    installSchema(_schema) {
        if (_schema.columns.length > 0) {
            const _model_name = model_name.get(this);
            let alter = `ALTER TABLE \`${_model_name}\``;
            let sql = `
                CREATE TABLE IF NOT EXISTS \`${_model_name}\` (
                    ${_schema.columns.join()}
                );
            `;

            if (_schema.primary_keys) {
                sql += `${alter} ${_schema.primary_keys};`;
            } 

            if (_schema.constraints.add.length > 0) {
                sql += `${alter} ${_schema.constraints.add.join()};`;
            }

            if (_schema.constraints.modify.length > 0) {
                sql += `${alter} ${_schema.constraints.modify.join()};`;
            }

            if (_schema.constraints.alter.length > 0) {
                sql += `${alter} ${_schema.constraints.alter.join()};`;
            }
            
            if (_schema.indexes.length > 0) {
                for(const index of _schema.indexes) {
                    sql += `CREATE ${index.is_unique?'UNIQUE':''} INDEX ${index.index_name} ON ${_model_name} (${index.columns});`;
                }
            }

            if (_schema.foreign_keys.length > 0) {
                for(const foreign_key of _schema.foreign_keys) {
                    sql += `${alter} ${foreign_key};`;
                }
            }
            
            connection.get(this).query(sql, function(err, result) {
                if (err) {
    
                    if (err.sql) delete err.sql;
                    console.log(err);
                }
            }.bind(this));
        } 
    }
}
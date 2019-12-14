"use strict"

const fs = require('fs');

module.exports = class Schema {

    constructor(schema, options = {}) {
        // Raw Schema
        this.schema = schema;
        this.options = options;
        
        // Parsed Schema Data
        this.schema_files = {
            create_table: '', // Contains CREAT TABLE statement
            alter_table: '' // Contains all ALTER TABLE statements
        }; 
        this.indexes = [];
        this.foreign_keys = [];

        return this;
    }

    parseSchema(model_name) {
        // Creating Schema Files
        let create_table, 
            alter_table,
            all_primary_keys = [],
            alter_table_prefix = `ALTER TABLE \`${model_name}\``;

        try {
            this.schema_files.create_table = `${__dirname}/temp/${this.uuid()}.sql`;
            this.schema_files.alter_table = `${__dirname}/temp/${this.uuid()}.sql`;
            create_table = fs.openSync(this.schema_files.create_table, 'a');
            alter_table = fs.openSync(this.schema_files.alter_table, 'a');
            fs.appendFileSync(create_table, `CREATE TABLE IF NOT EXISTS \`${model_name}\` (`, 'utf8');
            // Parsing Schema Data
            for (let column in this.schema) {
                const {
                    ref,
                    unique,
                    datatype,
                    not_null,
                    primary_key,
                    default_value,
                    auto_increment,
                } = this.schema[column];

                if (datatype && datatype.name) {
                
                    // Adding Columns
                    fs.appendFileSync(create_table, `\`${column}\` ${datatype.name}${datatype.size?`(${datatype.size})`:``},`, 'utf8');

                    // Adding NOT NULL || AUTO_INCREMENT
                    if (not_null || auto_increment) {
                        fs.appendFileSync(alter_table, `${alter_table_prefix} MODIFY \`${column}\` ${datatype.name}${datatype.size?`(${datatype.size})`:``} ${not_null?'NOT NULL':''} ${auto_increment?'AUTO_INCREMENT':''};`, 'utf8');
                    }
                    
                    // Adding Primary Key to Temp Variable
                    if (primary_key) {
                        all_primary_keys.push(`\`${column}\``);
                    }

                    // Adding Unique Key
                    if (unique && !primary_key) {
                        fs.appendFileSync(alter_table, `${alter_table_prefix} ADD UNIQUE KEY \`${column}\` (\`${column}\`);`, 'utf8');
                    }
                    
                    // Adding Foreign Key
                    if (ref && ref.to && ref.foreign_field) {
                        this.foreign_keys.push({ref, query: `${alter_table_prefix} ADD CONSTRAINT \`${column}_${ref.to}_${ref.foreign_field}\` FOREIGN KEY (\`${column}\`) REFERENCES \`${ref.to}\`(\`${ref.foreign_field}\`) `});
                    }

                    // Set default value for column
                    if (typeof default_value !== 'undefined') {
                        fs.appendFileSync(alter_table, `${alter_table_prefix} ALTER \`${column}\` SET DEFAULT '${default_value}'`, 'utf8');
                    }
                    
                } // end of datatype && datatype.name
            }

            
            
            // Adding Timestamp
            if (this.options.timestamps) {
                fs.appendFileSync(create_table, `\`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE CURRENT_TIMESTAMP,`, 'utf8');
                fs.appendFileSync(create_table, `\`created_at\` timestamp NOT NULL DEFAULT current_timestamp()`, 'utf8');
            } 

            // Closing Create Table statement
            fs.appendFileSync(create_table, `);`, 'utf8');
           
            // Adding all primary keys
            fs.appendFileSync(create_table, `${alter_table_prefix} ADD PRIMARY KEY (${all_primary_keys.join()})`, 'utf8');

        } catch (err) {
            console.log(err);
        } finally {
            if (create_table !== undefined) {
                fs.closeSync(create_table);
            }
            if (alter_table[0] !== undefined) {
                fs.closeSync(alter_table[0]);
            }
            if (alter_table !== undefined) {
                fs.closeSync(alter_table);
            }
        }
    }

    index(index_name, columns, is_unique = false) {
        this.indexes.push({
            index_name,
            columns,
            is_unique
        });
    }   
    
    uuid() {
        let dt = new Date().getTime();
        let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            let r = (dt + Math.random()*16)%16 | 0;
            dt = Math.floor(dt/16);
            return (c=='x' ? r :(r&0x3|0x8)).toString(16);
        });
        return uuid;
    }
}
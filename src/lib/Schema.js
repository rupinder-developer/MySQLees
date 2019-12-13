"use strict"

module.exports = class Schema {

    constructor(schema, options = {}) {
        // Raw Schema
        this.schema = schema;
        this.options = options;
        
        // Parsed Schema Data
        this.indexes = [];
        this.columns = []; 
        this.constraints = {
            add: [],
            modify: [],
            alter: [],
        };
        this.primary_keys = null;
        this.foreign_keys = [];

        this.parseSchema();

        return this;
    }

    parseSchema() {
        // Parsing Schema Data
        let primary_keys = [];
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

            if (datatype) {
                if (datatype.name) {
                    // Adding Columns
                    this.columns.push(`\`${column}\` ${datatype.name}${datatype.size?`(${datatype.size})`:``}`);

                    // Adding NOT NULL || AUTO_INCREMENT
                    if (not_null || auto_increment) {
                        this.constraints.modify.push(`MODIFY \`${column}\` ${datatype.name}${datatype.size?`(${datatype.size})`:``} ${not_null?'NOT NULL':''} ${auto_increment?'AUTO_INCREMENT':''}`);
                    }
                    
                    // Adding Primary Key to Temp Variable
                    if (primary_key) {
                        primary_keys.push(`\`${column}\``);
                    }

                    // Adding Unique Key
                    if (unique) {
                        this.constraints.add.push(`ADD UNIQUE KEY \`${column}\` (\`${column}\`)`);
                    }
                    
                    // Adding Foreign Key
                    if (ref) {
                        if (ref.to && ref.foreign_field) {
                            this.foreign_keys.push(`ADD CONSTRAINT \`${column}_${ref.to}_${ref.foreign_field}\` FOREIGN KEY (\`${column}\`) REFERENCES \`${ref.to}\`(\`${ref.foreign_field}\`) `);
                        }
                    }

                    // Set default value for column
                    if (typeof default_value !== 'undefined') {
                        this.constraints.alter.push(`ALTER \`${column}\` SET DEFAULT '${default_value}'`);
                    }


                } // end of datatype.name && datatype.size
            } // end of datatype
        }

        // Adding all primary keys
        this.primary_keys = `ADD PRIMARY KEY (${primary_keys.join()})`;

        // Adding Timestamp
        if (this.options.timestamp) {
            this.columns.push(`\`created_at\` timestamp NOT NULL DEFAULT current_timestamp()`);
            this.columns.push(`\`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE CURRENT_TIMESTAMP`);
        }  
    }

    index(index_name, columns, is_unique = false) {
        this.indexes.push({
            index_name,
            columns,
            is_unique
        });
    }    
}
"use strict"

export default class Schema {

    constructor(schema, options) {
        // Raw Schema
        this.schema = schema;
        this.options = options;
        
        // Parsed Schema Data
        this.columns = []; 
        this.constraints = {
            add: [],
            modify: [],
            alter: []
        };

        // Indexing Data
        this.indices = [];

        return this;
    }

    parseSchema() {
        // Parsing Schema Data
        for (let column in this.schema) {
            const {
                unique,
                datatype,
                not_null,
                primary_key,
                default_value,
                auto_increment
            } = this.schema[column];

            if (datatype) {
                if (datatype.name && datatype.size) {
                    // Adding Columns
                    this.columns.push(`\`${column}\` ${datatype.name}(${datatype.size})`);


                    // Adding NOT NULL || AUTO_INCREMENT
                    this.constraints.modify.push(`MODIFY \`${column}\`  ${datatype.name}(${datatype.size}) ${not_null?'NOT NULL':''} ${auto_increment?'AUTO_INCREMENT':''}`);
                    
                    // Adding Primary Key
                    if (primary_key) {
                        this.constraints.add.push(`ADD PRIMARY KEY (\`${column}\`)`);
                    }

                    // Adding Unique Key
                    if (unique) {
                        this.constraints.add.push(`ADD UNIQUE KEY \`${column}\` (\`${column}\`)`);
                    }
                    
                    // Set default value for column
                    if (typeof default_value !== 'undefined') {
                        if (typeof default_value === 'string') {
                            this.constraints.alter.push(`ALTER \`${column}\` SET DEFAULT '${default_value}'`);
                        } else {
                            this.constraints.alter.push(`ALTER \`${column}\` SET DEFAULT ${default_value}`);
                        }
                    }

                } // end of datatype.name && datatype.size
            } // end of datatype
        }

        // Adding Timestamp
        if (this.options.timestamp) {
            this.columns.push(`\`created_at\` timestamp NOT NULL DEFAULT current_timestamp()`);
            this.columns.push(`\`updated_at\` timestamp NOT NULL DEFAULT current_timestamp()`);
        }  
    }

    index(index_name, columns, is_unique) {
        this.indices.push({
            index_name,
            columns,
            is_unique
        });
    }    
}
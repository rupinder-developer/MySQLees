"use strict"

const fs = require('fs');

module.exports = class Schema {

    constructor(schema, options = {}) {
        // Raw Schema
        this.schema = schema;
        this.options = options;
        this.modelName = '';
        this.store = '';

        // Parsed Schema Data
        this.schemaFiles = {
            createTable: '', // Contains CREAT TABLE statement
            alterTable: '' // Contains all ALTER TABLE statements
        }; 
        this.indexes = [];

        return this;
    }

    implementSchema(modelName, store) {
        if (`${modelName}`.trim()) {
            store.connection.query(`SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = N'${modelName}' AND TABLE_SCHEMA='${store.config.database}' LIMIT 1`, function(err, result) {
                store.createdModels[modelName] = 1;  
                if (result) {
                    if (result[0].count === 0) {
                        // Installing Schema
                        this.modelName = modelName;
                        this.store = store;
                        this.parseSchema();
                        this.installSchema();  
                    } else {
                        // Updating Schema
                    }
                }
            }.bind(this)); 
        }           
    }

    parseSchema() {
        if (Object.keys(this.schema).length > 0) {
            // Creating Schema Files
            let createTable, 
                alterTable,
                allPrimaryKeys = [],
                alterTablePrefix = `ALTER TABLE \`${this.modelName}\``;

            try {
                this.schemaFiles.createTable = `${__dirname}/temp/${this.uuid()}.sql`;
                this.schemaFiles.alterTable = `${__dirname}/temp/${this.uuid()}.sql`;
                createTable = fs.openSync(this.schemaFiles.createTable, 'a');
                alterTable = fs.openSync(this.schemaFiles.alterTable, 'a');
                fs.appendFileSync(createTable, `CREATE TABLE IF NOT EXISTS \`${this.modelName}\` (`, 'utf8');
                // Parsing Schema Data
                for (let column in this.schema) {
                    const {
                        ref,
                        unique,
                        datatype,
                        notNull,
                        primaryKey,
                        defaultValue,
                        autoIncrement,
                    } = this.schema[column];

                    if (datatype && datatype.name) {
                    
                        // Adding Columns
                        fs.appendFileSync(createTable, `\`${column}\` ${datatype.name}${datatype.size?`(${datatype.size})`:``},`, 'utf8');

                        // Adding NOT NULL || autoIncrement
                        if (notNull || autoIncrement) {
                            fs.appendFileSync(alterTable, `${alterTablePrefix} MODIFY \`${column}\` ${datatype.name}${datatype.size?`(${datatype.size})`:``} ${notNull?'NOT NULL':''} ${autoIncrement?'autoIncrement':''};`, 'utf8');
                        }
                        
                        // Adding Primary Key to Temp Variable
                        if (primaryKey) {
                            allPrimaryKeys.push(`\`${column}\``);
                        }

                        // Adding Unique Key
                        if (unique && !primaryKey) {
                            fs.appendFileSync(alterTable, `${alterTablePrefix} ADD UNIQUE KEY \`${column}\` (\`${column}\`);`, 'utf8');
                        }
                        
                        // Adding Foreign Key
                        if (ref && ref.to && ref.foreign_field) {
                            this.store.pendingFkQueries.push({ref, query: `${alterTablePrefix} ADD CONSTRAINT \`${column}_${ref.to}_${ref.foreign_field}\` FOREIGN KEY (\`${column}\`) REFERENCES \`${ref.to}\`(\`${ref.foreign_field}\`);`});
                        }

                        // Set default value for column
                        if (typeof defaultValue !== 'undefined') {
                            fs.appendFileSync(alterTable, `${alterTablePrefix} ALTER \`${column}\` SET DEFAULT '${defaultValue}';`, 'utf8');
                        }
                        
                    } else {
                        console.log(`Datatype is missing for column \`${column}\` (Model = ${this.modelName})`);
                    }
                } 
                
                // Adding Timestamp
                if (this.options.timestamps) {
                    fs.appendFileSync(createTable, `\`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE CURRENT_TIMESTAMP,`, 'utf8');
                    fs.appendFileSync(createTable, `\`created_at\` timestamp NOT NULL DEFAULT current_timestamp()`, 'utf8');
                } 

                // Closing Create Table statement
                fs.appendFileSync(createTable, `);`, 'utf8');
            
                // Adding all primary keys
                if (allPrimaryKeys.length > 0) {
                    fs.appendFileSync(createTable, `${alterTablePrefix} ADD PRIMARY KEY (${allPrimaryKeys.join()});`, 'utf8');
                }

            } catch (err) {
                console.log(err);
            } finally {
                if (createTable !== undefined) {
                    fs.closeSync(createTable);
                }
                if (alterTable[0] !== undefined) {
                    fs.closeSync(alterTable[0]);
                }
                if (alterTable !== undefined) {
                    fs.closeSync(alterTable);
                }
            }
        }
    }

    installSchema() {
        if (fs.existsSync(this.schemaFiles.createTable) && fs.existsSync(this.schemaFiles.alterTable)) {
            let fk_queries = '';
            if (this.store.pendingFkQueries.length > 0) {
                for(const fk of this.store.pendingFkQueries) {
                    if (this.store.createdModels[fk.ref.to]) {
                        fk_queries += fk.query;
                    }
                }
            }
            this.store.connection.query(`${fs.readFileSync(this.schemaFiles.createTable)} ${fs.readFileSync(this.schemaFiles.alterTable)} ${this.indexes.join('')} ${fk_queries}`, function(err, result) {
                if (err) {
                    if (err.sql) delete err.sql;
                    console.log(err, ` (Error -> Model = ${this.modelName} )`);
                }

                // Cleaning Resources
                fs.unlink(this.schemaFiles.createTable, function(){});
                fs.unlink(this.schemaFiles.alterTable, function(){});
                delete this.schemaFiles;
                delete this.indexes;
            }.bind(this));
        }
    }

    index(index_name, columns, is_unique = false) {
        if (`${index_name}`.trim() && `${columns}`.trim()) {
            this.indexes.push(`CREATE ${is_unique?'UNIQUE':''} INDEX ${index_name} ON ${this.modelName} (${columns});`);
        }
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
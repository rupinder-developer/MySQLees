"use strict"

const fs = require('fs');

module.exports = class Schema {

    constructor(schema, options = {}) {
        // Raw Schema
        this.schema = schema;
        this.options = options;
        this.modelName = '';
        this.store = '';

        // Schema Temporary files
        this.schemaFiles = {
            createTable: '',
            alterTable: '',
            extra: '',
            updateNewCol: '',
            updateInit: ''
            
        }; 
        this.indexes = [];
        this.indexesObject = [];

        return this;
    }

    implementSchema(modelName, store) {
        if (`${modelName}`.trim()) {
            store.connection.query(`SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = N'${modelName}' AND TABLE_SCHEMA='${store.config.database}' LIMIT 1`, function(err, result) {
                store.createdModels[modelName] = 1;  
                if (result) {
                    // Installing Schema
                    this.modelName = modelName;
                    this.store = store;
                    if (result[0].count === 0) {
                        this.parseIndexes();
                        this.parseSchema();
                        this.installSchema();  
                    } else if(store.options.autoMigration){
                        // Updating Schema
                        this.parseIndexes();
                        this.updateSchema();
                    }
                }
            }.bind(this)); 
        }           
    }

    parseSchema() {
        let schemaLength = Object.keys(this.schema).length;
        if (schemaLength > 0) {
            // Creating Schema Files
            let createTable, 
                alterTable,
                allColumns = [],
                allPrimaryKeys = [],
                alterTablePrefix = `ALTER TABLE \`${this.modelName}\``;

            try {
                if (!fs.existsSync(`${__dirname}/temp`)){
                    fs.mkdirSync(`${__dirname}/temp`);
                }
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
                        deprecated
                    } = this.schema[column];
                
                    if (this.options.timestamps && (column == 'created_at' || column == 'updated_at')) {
                        continue;
                    }

                    if (deprecated) {
                        schemaLength--;
                        if (schemaLength <= 0) {
                            console.log(`Error -> (Model = ${this.modelName}): It is not possible to deprecate all the columns of any Model!!`);
                            process.exit();
                        }
                        continue;
                    }

                    if (datatype && datatype.name && !deprecated) {
                    
                        // Adding Columns
                        allColumns.push(`\`${column}\` ${datatype.name}${datatype.size?`(${datatype.size})`:``}`);

                        // Adding NOT NULL || autoIncrement
                        if (notNull || autoIncrement) {
                            fs.appendFileSync(alterTable, `${alterTablePrefix} MODIFY \`${column}\` ${datatype.name}${datatype.size?`(${datatype.size})`:``} ${notNull?'NOT NULL':''} ${autoIncrement && primaryKey?'AUTO_INCREMENT':''};`, 'utf8');
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
                        if (ref && ref.to && ref.foreignField) {
                            this.store.pendingFkQueries.push({ref, query: `${alterTablePrefix} ADD CONSTRAINT \`${column}\` FOREIGN KEY (\`${column}\`) REFERENCES \`${ref.to}\`(\`${ref.foreignField}\`);`});
                        }

                        // Set default value for column
                        if (typeof defaultValue !== 'undefined') {
                            fs.appendFileSync(alterTable, `${alterTablePrefix} ALTER \`${column}\` SET DEFAULT '${defaultValue}';`, 'utf8');
                        }
                        
                    } else {
                        console.log(`Datatype is missing for column \`${column}\` (Model = ${this.modelName})`);
                    }
                } 
                
                // Adding All Columns
                fs.appendFileSync(createTable, allColumns.join(','), 'utf8');

                // Adding Timestamps
                if (this.options.timestamps) {
                    fs.appendFileSync(createTable, `,\`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE CURRENT_TIMESTAMP,`, 'utf8');
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
                if (alterTable !== undefined) {
                    fs.closeSync(alterTable);
                }
            }
        }
    }

    installSchema() {
        if (fs.existsSync(this.schemaFiles.createTable) && fs.existsSync(this.schemaFiles.alterTable)) {
            let fkQueries = '';
            if (this.store.pendingFkQueries.length > 0) {
                for(const fk of this.store.pendingFkQueries) {
                    if (this.store.createdModels[fk.ref.to]) {
                        fkQueries += fk.query;
                    }
                }
            }

            this.store.connection.query(`${fs.readFileSync(this.schemaFiles.createTable)} ${fs.readFileSync(this.schemaFiles.alterTable)} ${this.indexes.join('')} ${fkQueries}`, function(err, result) {
                if (err) {
                    if (err.sql) delete err.sql;
                    console.log(err, ` (Error -> Model = ${this.modelName} )`);
                }

                // Cleaning Resources
                fs.unlink(this.schemaFiles.createTable, function(){});
                fs.unlink(this.schemaFiles.alterTable, function(){});
                delete this.schemaFiles;
                delete this.indexes;
                delete this.indexesObject;
            }.bind(this));
        }
    }
    
    updateSchema() {
        this.store.connection.query(`DESC \`${this.modelName}\``, function(err, result) {
            if (!err) {
                let primaryKeys,
                    alterTable,
                    updateNewCol,
                    updateInit,
                    allPrimaryKeys = [],
                    pkShouldDrop = false,
                    updatedColumns = {},
                    droppedFks = {},
                    alterTablePrefix = `ALTER TABLE \`${this.modelName}\``;
                try {
                    this.schemaFiles.extra = `${__dirname}/temp/${this.uuid()}.sql`;
                    this.schemaFiles.alterTable = `${__dirname}/temp/${this.uuid()}.sql`;
                    this.schemaFiles.updateNewCol = `${__dirname}/temp/${this.uuid()}.sql`;
                    this.schemaFiles.updateInit = `${__dirname}/temp/${this.uuid()}.sql`;
                    updateNewCol = fs.openSync(this.schemaFiles.updateNewCol, 'a');
                    updateInit = fs.openSync(this.schemaFiles.updateInit, 'a');
                    alterTable = fs.openSync(this.schemaFiles.alterTable, 'a');
                    primaryKeys = fs.openSync(this.schemaFiles.extra, 'a');

                    // Updating existing columns in the database
                    for (let dbCol of result) {
                        let column = this.schema[dbCol.Field], aiShouldDrop = false;

                        if (this.options.timestamps && (dbCol.Field == 'created_at' || dbCol.Field == 'updated_at')) {    
                            continue;
                        }
                        
                        if (column) {
                            if (column.deprecated) {
                                // If column is no more needed in DB stucture
                                if (dbCol.Key == 'PRI') {
                                    if (column.autoIncrement) {
                                        fs.appendFileSync(updateInit, `${alterTablePrefix} MODIFY \`${dbCol.Field}\` ${column.datatype.name}${column.datatype.size?`(${column.datatype.size})`:``};`, 'utf8');
                                    }
                                    pkShouldDrop = true;
                                }
                                fs.appendFileSync(alterTable, `${alterTablePrefix} DROP COLUMN \`${dbCol.Field}\`;`, 'utf8');   
                                
                            } else if (column.datatype && column.datatype.name) {
                                // Validate Primary Key
                                if (column.primaryKey) {
                                    allPrimaryKeys.push(`\`${dbCol.Field}\``);
                                    if (dbCol.Key == 'PRI') {
                                        if (column.autoIncrement) {
                                            fs.appendFileSync(updateInit, `${alterTablePrefix} MODIFY \`${dbCol.Field}\` ${column.datatype.name}${column.datatype.size?`(${column.datatype.size})`:``};`, 'utf8');
                                        }
                                        pkShouldDrop = true;
                                    }
                                } else if (!column.primaryKey && dbCol.Key == 'PRI') {
                                    pkShouldDrop = true;
                                    aiShouldDrop = true;
                                }

                                // Validate Not Null & Auto Increment
                                if (column.notNull || column.autoIncrement) {
                                    if (aiShouldDrop) {
                                        fs.appendFileSync(alterTable, `${alterTablePrefix} MODIFY \`${dbCol.Field}\` ${column.datatype.name}${column.datatype.size?`(${column.datatype.size})`:``} ${column.notNull?'NOT NULL':''};`, 'utf8');
                                    } else {
                                        fs.appendFileSync(alterTable, `${alterTablePrefix} MODIFY \`${dbCol.Field}\` ${column.datatype.name}${column.datatype.size?`(${column.datatype.size})`:``} ${column.notNull?'NOT NULL':''} ${column.autoIncrement && column.primaryKey?'AUTO_INCREMENT':''};`, 'utf8');
                                    }
                                } else {
                                    // Modifing only datatype
                                    fs.appendFileSync(updateInit, `${alterTablePrefix} MODIFY \`${dbCol.Field}\` ${column.datatype.name}${column.datatype.size?`(${column.datatype.size})`:``};`, 'utf8');
                                }

                                // Validate Unique Key
                                if (column.unique && !column.primaryKey && dbCol.Key != 'UNI') {
                                    // Adding Unique Key
                                    fs.appendFileSync(alterTable, `${alterTablePrefix} ADD UNIQUE KEY \`${dbCol.Field}\` (\`${dbCol.Field}\`);`, 'utf8');
                                } else if ((!column.unique && dbCol.Key == 'UNI') || (column.unique && column.primaryKey && dbCol.Key == 'UNI')) {
                                    // Removing Unique Key
                                    fs.appendFileSync(alterTable, `${alterTablePrefix} DROP INDEX \`${dbCol.Field}\`;`, 'utf8');
                                }
                                

                                // Validate Default Value
                                if (typeof column.defaultValue !== 'undefined') {
                                    // Setting Default Value
                                    fs.appendFileSync(alterTable, `${alterTablePrefix} ALTER \`${dbCol.Field}\` SET DEFAULT '${column.defaultValue}';`, 'utf8');
                                } else if (dbCol.Default) {
                                    // Droping Default Value
                                    fs.appendFileSync(alterTable, `${alterTablePrefix} ALTER \`${dbCol.Field}\` DROP DEFAULT;`, 'utf8')
                                }

                                // Validate Foreign Key
                                if (column.ref && column.ref.to && column.ref.foreignField) {
                                    this.store.dropFkQueries += `
                                    set @var=if((SELECT true FROM information_schema.TABLE_CONSTRAINTS WHERE
                                        CONSTRAINT_SCHEMA = DATABASE() AND
                                        TABLE_NAME        = '${this.modelName}' AND
                                        CONSTRAINT_NAME   = '${dbCol.Field}' AND
                                        CONSTRAINT_TYPE   = 'FOREIGN KEY') = true,'ALTER TABLE ${this.modelName}
                                        DROP FOREIGN KEY ${dbCol.Field}','select 1');
                            
                                    prepare stmt from @var;
                                    execute stmt;
                                    deallocate prepare stmt;
                                    `;
                                    droppedFks[column] = true;
                                    this.store.pendingFkQueries.push({ref: column.ref, query: `${alterTablePrefix} ADD CONSTRAINT \`${dbCol.Field}\` FOREIGN KEY (\`${dbCol.Field}\`) REFERENCES \`${column.ref.to}\`(\`${column.ref.foreignField}\`);`});
                                }

                            }  
                            // Adding Column to the list of Updated Columns
                            updatedColumns[dbCol.Field] = true;
                        }
                        
                    }

                    // Adding new columns to the database
                    for(let column in this.schema) {
                        
                        if (!(updatedColumns[column] || this.schema[column].deprecated) && this.schema[column].datatype && this.schema[column].datatype.name) {
                            // Adding new column
                            fs.appendFileSync(updateNewCol, `${alterTablePrefix} ADD \`${column}\` ${this.schema[column].datatype.name}${this.schema[column].datatype.size?`(${this.schema[column].datatype.size})`:``} ;`, 'utf8');
                            
                            // Adding NOT NULL || autoIncrement
                            if (this.schema[column].notNull || this.schema[column].autoIncrement) {
                                fs.appendFileSync(alterTable, `${alterTablePrefix} MODIFY \`${column}\` ${this.schema[column].datatype.name}${this.schema[column].datatype.size?`(${this.schema[column].datatype.size})`:``} ${this.schema[column].notNull?'NOT NULL':''} ${this.schema[column].autoIncrement && this.schema[column].primaryKey?'AUTO_INCREMENT':''};`, 'utf8');
                            }
                            
                            // Adding Primary Key to Temp Variable
                            if (this.schema[column].primaryKey) {
                                allPrimaryKeys.push(`\`${column}\``);
                            }

                            // Adding Unique Key
                            if (this.schema[column].unique && !this.schema[column].primaryKey) {
                                fs.appendFileSync(alterTable, `${alterTablePrefix} ADD UNIQUE KEY \`${column}\` (\`${column}\`);`, 'utf8');
                            }
                            
                            // Adding Foreign Key
                            if (this.schema[column].ref && this.schema[column].ref.to && this.schema[column].ref.foreignField) {
                                this.store.dropFkQueries += `
                                set @var=if((SELECT true FROM information_schema.TABLE_CONSTRAINTS WHERE
                                    CONSTRAINT_SCHEMA = DATABASE() AND
                                    TABLE_NAME        = '${this.modelName}' AND
                                    CONSTRAINT_NAME   = '${column}' AND
                                    CONSTRAINT_TYPE   = 'FOREIGN KEY') = true,'ALTER TABLE ${this.modelName}
                                    DROP FOREIGN KEY ${column}','select 1');
                        
                                prepare stmt from @var;
                                execute stmt;
                                deallocate prepare stmt;
                                `;
                                droppedFks[column] = true;
                                this.store.pendingFkQueries.push({ref: this.schema[column].ref, query: `${alterTablePrefix} ADD CONSTRAINT \`${column}\` FOREIGN KEY (\`${column}\`) REFERENCES \`${this.schema[column].ref.to}\`(\`${this.schema[column].ref.foreignField}\`);`});
                                
                            }

                            // Set default value for column
                            if (typeof this.schema[column].defaultValue !== 'undefined') {
                                fs.appendFileSync(alterTable, `${alterTablePrefix} ALTER \`${column}\` SET DEFAULT '${this.schema[column].defaultValue}';`, 'utf8');
                            }
                        }
                    }
                    
                    // Adding Timestamps if required
                    if (this.options.timestamps) {
                        fs.appendFileSync(alterTable, `
                        SET @preparedStatement = (SELECT IF(
                            (
                              SELECT true FROM INFORMATION_SCHEMA.COLUMNS
                              WHERE
                                (TABLE_NAME = '${this.modelName}') AND 
                                (TABLE_SCHEMA = '${this.store.config.database}') AND
                                (COLUMN_NAME = 'created_at')
                            ) = true,
                            "SELECT 1",
                            CONCAT("${alterTablePrefix} ADD \`created_at\` timestamp NOT NULL DEFAULT current_timestamp();")
                          ));

                          PREPARE alterIfNotExists FROM @preparedStatement;
                          EXECUTE alterIfNotExists;
                          DEALLOCATE PREPARE alterIfNotExists;
                          
                          SET @preparedStatement = (SELECT IF(
                            (
                              SELECT true FROM INFORMATION_SCHEMA.COLUMNS
                              WHERE
                                (TABLE_NAME = '${this.modelName}') AND 
                                (TABLE_SCHEMA = '${this.store.config.database}') AND
                                (COLUMN_NAME = 'updated_at')
                            ) = true,
                            "SELECT 1",
                            CONCAT("${alterTablePrefix} ADD \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE CURRENT_TIMESTAMP;")
                          ));
                          PREPARE alterIfNotExists FROM @preparedStatement;
                          EXECUTE alterIfNotExists;
                          DEALLOCATE PREPARE alterIfNotExists;
                        `, 'utf8');
                    }
                    
                    if (allPrimaryKeys.length > 0) {
                        fs.appendFileSync(primaryKeys, `${alterTablePrefix} ADD PRIMARY KEY (${allPrimaryKeys.join()});`, 'utf8');
                    }
                } catch (err) {
                    console.log(err);
                } finally {
                    if (updateInit !== undefined) {
                        fs.closeSync(updateInit);
                    }
                    if (updateNewCol !== undefined) {
                        fs.closeSync(updateNewCol);
                    }
                    if (alterTable !== undefined) {
                        fs.closeSync(alterTable);
                    }
                    if (primaryKeys !== undefined) {
                        fs.closeSync(primaryKeys);
                    }
                }
                 // Removing all Foreign Keys
                this.store.connection.query(`SELECT TABLE_NAME, CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS T WHERE CONSTRAINT_SCHEMA = '${this.store.config.database}' AND CONSTRAINT_TYPE='FOREIGN KEY'`, function(err, result) {
                    if (!err) {
                        for (let item of result) {
                            if (!droppedFks[item['CONSTRAINT_NAME']]) {
                                this.store.dropFkQueries += `
                                set @var=if((SELECT true FROM information_schema.TABLE_CONSTRAINTS WHERE
                                    CONSTRAINT_SCHEMA = DATABASE() AND
                                    TABLE_NAME        = '${item['TABLE_NAME']}' AND
                                    CONSTRAINT_NAME   = '${item['CONSTRAINT_NAME']}' AND
                                    CONSTRAINT_TYPE   = 'FOREIGN KEY') = true,'ALTER TABLE ${item['TABLE_NAME']}
                                    DROP FOREIGN KEY ${item['CONSTRAINT_NAME']}','select 1');
                        
                                prepare stmt from @var;
                                execute stmt;
                                deallocate prepare stmt;
                                `;
                            }
                        }

                        let fkQueries = '';
                        if (this.store.pendingFkQueries.length > 0) {
                            for(const fk of this.store.pendingFkQueries) {
                                if (this.store.createdModels[fk.ref.to]) {
                                    fkQueries += fk.query;
                                }
                            }
                        }
                        
                        let sql = `SET foreign_key_checks = 0; ${this.store.dropFkQueries} ${fs.readFileSync(this.schemaFiles.updateInit)} ${pkShouldDrop?`${alterTablePrefix} DROP PRIMARY KEY;`:''} ${fs.readFileSync(this.schemaFiles.updateNewCol)} ${fs.readFileSync(this.schemaFiles.extra)} ${fs.readFileSync(this.schemaFiles.alterTable)} ${this.indexes.join('')} ${fkQueries} SET foreign_key_checks = 1;`.trim();
                        if (sql) {
                            this.store.connection.query(sql, function(err, result) {
                                if (err) {
                                    if (err.sql) delete err.sql;
                                    console.log(err, ` (Error -> Model = ${this.modelName} )`);
                                }
                                
                                fs.unlink(this.schemaFiles.alterTable, function(){});
                                fs.unlink(this.schemaFiles.extra, function(){});
                                fs.unlink(this.schemaFiles.updateNewCol, function(){});
                                fs.unlink(this.schemaFiles.updateInit, function(){});
                                delete this.schemaFiles;
                                delete this.indexes;
                                delete this.indexesObject;
                            }.bind(this));
                        }
                    }
                }.bind(this));
                
            } 
        }.bind(this));
    }

    parseIndexes() {
        for(let index of this.indexesObject) {
            this.indexes.push(`
            set @var=if((SELECT true FROM information_schema.STATISTICS WHERE
                TABLE_SCHEMA      =  DATABASE() AND
                TABLE_NAME        = '${this.modelName}' AND
                INDEX_NAME        = '${index.indexName}') = true,'ALTER TABLE ${this.modelName}
                DROP INDEX ${index.indexName}','select 1');
    
            prepare stmt from @var;
            execute stmt;
            deallocate prepare stmt;
            `);
            if (`${index.indexName}`.trim() && `${index.columns}`.trim() && !index.options.deprecated) {
                this.indexes.push(`CREATE ${index.options.unique?'UNIQUE':''} INDEX ${index.indexName} ON ${this.modelName} (${index.columns});`);
            } 
        }
    }

    index(indexName, columns, options = {}) {
        this.indexesObject.push({indexName, columns, options});   
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
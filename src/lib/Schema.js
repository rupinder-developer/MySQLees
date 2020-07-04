"use strict"

// Inbuilt Modules
import fs from 'fs';

// Classes
import Store from './Store';

module.exports = class Schema {

    constructor(schema, options = {}) {
        // Raw Schema
        this.schema    = schema;
        this.options   = options;
        this.modelName = '';

        // Schema Temporary files
        this.schemaFiles = {
            createTable: '',
            alterTable: '',
            extra: '',
            updateNewCol: '',
            updateInit: '',
            renameColumn: ''

        };
        this.indexes       = [];
        this.indexesObject = [];

        return this;
    }

    implementSchema(modelName, config) {
        if (`${modelName}`.trim()) {
            Schema.config = config; // Connection Configuration for schema implementation
            this.startConnection();
            Schema.connection.query(`SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = N'${modelName}' AND TABLE_SCHEMA='${Schema.config.database}' LIMIT 1`, function (err, result) {
                Schema.createdModels[modelName] = 1;
                if (result) {
                    this.modelName = modelName;
                    if (result[0].count === 0) {
                        // Installing Schema
                        this.parseIndexes();
                        this.parseSchema();
                        this.installSchema();
                    } else {
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
                allColumns       = [],
                allPrimaryKeys   = [],
                alterTablePrefix = `ALTER TABLE \`${this.modelName}\``;

            try {
                if (!fs.existsSync(`${__dirname}/temp`)) {
                    fs.mkdirSync(`${__dirname}/temp`);
                }

                this.schemaFiles.createTable = `${__dirname}/temp/${this.uuid()}.sql`;
                this.schemaFiles.alterTable  = `${__dirname}/temp/${this.uuid()}.sql`;

                createTable = fs.openSync(this.schemaFiles.createTable, 'a');
                alterTable  = fs.openSync(this.schemaFiles.alterTable, 'a');

                fs.appendFileSync(createTable, `CREATE TABLE IF NOT EXISTS \`${this.modelName}\` (`, 'utf8');
                
                // Parsing Schema Data
                for (let column in this.schema) {
                    const {
                        ref,
                        unique,
                        dataType,
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
                            console.error(`Error -> (Model = ${this.modelName}): It is not possible to deprecate all the columns of any Model!!`);
                            process.exit();
                        }
                        continue;
                    }

                    if (dataType && !deprecated) {

                        // Adding Columns
                        allColumns.push(`\`${column}\` ${dataType}`);

                        // Adding NOT NULL || autoIncrement
                        if (notNull || autoIncrement) {
                            fs.appendFileSync(alterTable, `${alterTablePrefix} MODIFY \`${column}\` ${dataType} ${notNull ? 'NOT NULL' : ''} ${autoIncrement && primaryKey ? 'AUTO_INCREMENT' : ''};`, 'utf8');
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
                            Schema.pendingFkQueries.push({ ref, query: `${alterTablePrefix} ADD CONSTRAINT \`${this.modelName}_${column}\` FOREIGN KEY (\`${column}\`) REFERENCES \`${ref.to}\`(\`${ref.foreignField}\`);` });
                        }

                        // Set default value for column
                        if (typeof defaultValue !== 'undefined') {
                            fs.appendFileSync(alterTable, `${alterTablePrefix} ALTER \`${column}\` SET DEFAULT '${defaultValue}';`, 'utf8');
                        }

                    } else {
                        console.error(`dataType is missing for column \`${column}\` (Model = ${this.modelName})`);
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
                console.error(err);
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
            if (Schema.pendingFkQueries.length > 0) {
                for (const fk in Schema.pendingFkQueries) {
                    if (Schema.createdModels[Schema.pendingFkQueries[fk].ref.to]) {
                        fkQueries += Schema.pendingFkQueries[fk].query;
                        delete Schema.pendingFkQueries[fk];
                    }
                }
            }

            Schema.connection.query(`${fs.readFileSync(this.schemaFiles.createTable)} ${fs.readFileSync(this.schemaFiles.alterTable)} ${this.indexes.join('')} ${fkQueries}`, function (err, result) {
                if (err) {
                    if (err.sql) delete err.sql;

                    let {code, errno, sqlState, sqlMessage} = err;
                    if (err.errno == 1064) {
                        sqlMessage = 'Failed to parse Data Type; You have an error in your SQL syntax;';
                    }
                    console.error('Error:', {code, errno, sqlState, sqlMessage}, `-> Model = ${this.modelName}`);
                }       
                    
                // Cleaning Resources
                this.endConnection();
                fs.unlink(this.schemaFiles.createTable, function () { });
                fs.unlink(this.schemaFiles.alterTable, function () { });

                delete this.schemaFiles;
                delete this.indexes;
                delete this.indexesObject;
            }.bind(this));
        }
    }

    updateSchema() {
        Schema.connection.query(`DESC \`${this.modelName}\``, function (err, result) {
            if (!err) {
                var primaryKeys,
                    alterTable,
                    renameColumn,
                    updateNewCol,
                    updateInit,
                    allPrimaryKeys   = [],
                    pkShouldDrop     = false,
                    updatedColumns   = {},
                    dbCols           = {},
                    droppedFks       = {},
                    dropFkQueries    = '', // This Variable contains the queries which helps to drop all the present Foreign Keys in the database while updating schema.
                    alterTablePrefix = `ALTER TABLE \`${this.modelName}\``;
                try {
                    this.schemaFiles.extra        = `${__dirname}/temp/${this.uuid()}.sql`;
                    this.schemaFiles.alterTable   = `${__dirname}/temp/${this.uuid()}.sql`;
                    this.schemaFiles.updateNewCol = `${__dirname}/temp/${this.uuid()}.sql`;
                    this.schemaFiles.updateInit   = `${__dirname}/temp/${this.uuid()}.sql`;
                    this.schemaFiles.renameColumn = `${__dirname}/temp/${this.uuid()}.sql`;
                    
                    updateNewCol = fs.openSync(this.schemaFiles.updateNewCol, 'a');
                    updateInit   = fs.openSync(this.schemaFiles.updateInit, 'a');
                    alterTable   = fs.openSync(this.schemaFiles.alterTable, 'a');
                    primaryKeys  = fs.openSync(this.schemaFiles.extra, 'a');
                    renameColumn = fs.openSync(this.schemaFiles.renameColumn, 'a');

                    const updateColumn = function(dbCol, schemaCol = '') {
                        let column = this.schema[schemaCol ? schemaCol : dbCol.Field], aiShouldDrop = false, skip = false;
                        
                        if (this.options.timestamps && (dbCol.Field == 'created_at' || dbCol.Field == 'updated_at')) {
                            if (!(this.schema['created_at'] || this.schema['updated_at'])) {
                                skip = true;
                            }
                        }

                        if (column && !skip) {
                            if (column.deprecated) {
                                // If column is no more needed in DB stucture
                                if (dbCol.Key == 'PRI') {
                                    if (column.autoIncrement) {
                                        fs.appendFileSync(updateInit, `${alterTablePrefix} MODIFY \`${dbCol.Field}\` ${dbCol.Type};`, 'utf8');
                                    }
                                    pkShouldDrop = true;
                                }
                                fs.appendFileSync(alterTable, `${alterTablePrefix} DROP COLUMN \`${dbCol.Field}\`;`, 'utf8');

                            } else if (column.dataType) {
                                // Validate Primary Key
                                if (column.primaryKey) {
                                    allPrimaryKeys.push(`\`${dbCol.Field}\``);
                                    if (dbCol.Key == 'PRI') {
                                        if (column.autoIncrement) {
                                            fs.appendFileSync(updateInit, `${alterTablePrefix} MODIFY \`${dbCol.Field}\` ${column.dataType};`, 'utf8');
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
                                        fs.appendFileSync(alterTable, `${alterTablePrefix} MODIFY \`${dbCol.Field}\` ${column.dataType} ${column.notNull ? 'NOT NULL' : ''};`, 'utf8');
                                    } else {
                                        fs.appendFileSync(alterTable, `${alterTablePrefix} MODIFY \`${dbCol.Field}\` ${column.dataType} ${column.notNull ? 'NOT NULL' : ''} ${column.autoIncrement && column.primaryKey ? 'AUTO_INCREMENT' : ''};`, 'utf8');
                                    }
                                } else {
                                    // Modifing only dataType
                                    fs.appendFileSync(updateInit, `${alterTablePrefix} MODIFY \`${dbCol.Field}\` ${column.dataType};`, 'utf8');
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
                                    let colName = schemaCol ? schemaCol : dbCol.Field;
                                    if (!droppedFks[`${this.modelName}_${colName}`]) {                                        
                                        dropFkQueries += `
                                        set @var=if((SELECT true FROM information_schema.TABLE_CONSTRAINTS WHERE
                                            CONSTRAINT_SCHEMA = DATABASE() AND
                                            TABLE_NAME        = '${this.modelName}' AND
                                            CONSTRAINT_NAME   = '${this.modelName}_${colName}' AND
                                            CONSTRAINT_TYPE   = 'FOREIGN KEY') = true,'ALTER TABLE ${this.modelName}
                                            DROP FOREIGN KEY ${this.modelName}_${colName}','select 1');
                                
                                        prepare stmt from @var;
                                        execute stmt;
                                        deallocate prepare stmt;
                                        `;
                                        droppedFks[`${this.modelName}_${colName}`] = true;
                                    }
                                    Schema.pendingFkQueries.push({ ref: column.ref, query: `
                                    set @var=if((SELECT true FROM information_schema.COLUMNS WHERE
                                        TABLE_NAME        = '${this.modelName}' AND
                                        COLUMN_NAME       = '${colName}' AND
                                        TABLE_SCHEMA      = '${Schema.config.database}') = true,'${alterTablePrefix} ADD CONSTRAINT \`${this.modelName}_${colName}\` FOREIGN KEY (\`${colName}\`) REFERENCES \`${column.ref.to}\`(\`${column.ref.foreignField}\`)','select 1');
                            
                                    prepare stmt from @var;
                                    execute stmt;
                                    deallocate prepare stmt;` }); 
                                }

                            }
                            // Adding Column to the list of Updated Columns
                            updatedColumns[dbCol.Field] = true;
                        }
                    }.bind(this)

                    // Updating existing columns in the database
                    for (let dbCol of result) {
                        updateColumn(dbCol);

                        // Saving each database column
                        dbCols[dbCol.Field] = dbCol;
                    }

                    // Adding new columns to the database
                    for (let column in this.schema) {

                        if (!(updatedColumns[column] || this.schema[column].deprecated || this.schema[column].renamedFrom) && this.schema[column].dataType) {
                            // Adding new column
                            fs.appendFileSync(updateNewCol, `${alterTablePrefix} ADD \`${column}\` ${this.schema[column].dataType} ;`, 'utf8');

                            // Adding NOT NULL || autoIncrement
                            if (this.schema[column].notNull || this.schema[column].autoIncrement) {
                                fs.appendFileSync(alterTable, `${alterTablePrefix} MODIFY \`${column}\` ${this.schema[column].dataType} ${this.schema[column].notNull ? 'NOT NULL' : ''} ${this.schema[column].autoIncrement && this.schema[column].primaryKey ? 'AUTO_INCREMENT' : ''};`, 'utf8');
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
                                Schema.pendingFkQueries.push({ ref: this.schema[column].ref, query: `
                                    set @var=if((SELECT true FROM information_schema.COLUMNS WHERE
                                        TABLE_NAME        = '${this.modelName}' AND
                                        COLUMN_NAME       = '${column}' AND
                                        TABLE_SCHEMA      = '${Schema.config.database}') = true,'${alterTablePrefix} ADD CONSTRAINT \`${this.modelName}_${column}\` FOREIGN KEY (\`${column}\`) REFERENCES \`${this.schema[column].ref.to}\`(\`${this.schema[column].ref.foreignField}\`)','select 1');
                            
                                    prepare stmt from @var;
                                    execute stmt;
                                    deallocate prepare stmt;` });
                            }

                            // Set default value for column
                            if (typeof this.schema[column].defaultValue !== 'undefined') {
                                fs.appendFileSync(alterTable, `${alterTablePrefix} ALTER \`${column}\` SET DEFAULT '${this.schema[column].defaultValue}';`, 'utf8');
                            }
                        } else if (!this.schema[column].deprecated && this.schema[column].renamedFrom && this.schema[column].dataType) {
                            // Update Column
                            if (dbCols[this.schema[column].renamedFrom]) {
                                updateColumn(dbCols[this.schema[column].renamedFrom], column);
                            }

                            // Rename Column
                            fs.appendFileSync(renameColumn, `
                            SET @preparedStatement = (SELECT IF(
                                (
                                  SELECT true FROM INFORMATION_SCHEMA.COLUMNS
                                  WHERE
                                    (TABLE_NAME = '${this.modelName}') AND 
                                    (TABLE_SCHEMA = '${Schema.config.database}') AND
                                    (COLUMN_NAME = '${this.schema[column].renamedFrom}')
                                ) = true,
                                "${alterTablePrefix} CHANGE COLUMN \`${this.schema[column].renamedFrom}\` \`${column}\` ${this.schema[column].dataType}",
                                "SELECT 1"
                              ));
    
                              PREPARE alterIfNotExists FROM @preparedStatement;
                              EXECUTE alterIfNotExists;
                              DEALLOCATE PREPARE alterIfNotExists;
                            `, 'utf8');



                        }
                    }


                    // Adding || Removing Timestamps
                    if (this.options.timestamps) {
                        // Adding Timestamps
                        fs.appendFileSync(alterTable, `
                        SET @preparedStatement = (SELECT IF(
                            (
                              SELECT true FROM INFORMATION_SCHEMA.COLUMNS
                              WHERE
                                (TABLE_NAME = '${this.modelName}') AND 
                                (TABLE_SCHEMA = '${Schema.config.database}') AND
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
                                (TABLE_SCHEMA = '${Schema.config.database}') AND
                                (COLUMN_NAME = 'updated_at')
                            ) = true,
                            "SELECT 1",
                            CONCAT("${alterTablePrefix} ADD \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE CURRENT_TIMESTAMP;")
                          ));
                          PREPARE alterIfNotExists FROM @preparedStatement;
                          EXECUTE alterIfNotExists;
                          DEALLOCATE PREPARE alterIfNotExists;
                        `, 'utf8');
                    } else {
                        // Removing Timestamps 
                        if (!this.schema['created_at']) {
                            fs.appendFileSync(alterTable, `
                            SET @preparedStatement = (SELECT IF(
                                (
                                  SELECT true FROM INFORMATION_SCHEMA.COLUMNS
                                  WHERE
                                    (TABLE_NAME = '${this.modelName}') AND 
                                    (TABLE_SCHEMA = '${Schema.config.database}') AND
                                    (COLUMN_NAME = 'created_at')
                                ) = true,
                                "${alterTablePrefix} DROP COLUMN \`created_at\`;",
                                "SELECT 1"
                              ));
    
                              PREPARE alterIfNotExists FROM @preparedStatement;
                              EXECUTE alterIfNotExists;
                              DEALLOCATE PREPARE alterIfNotExists;
                            `, 'utf8');
                        }

                        if (!this.schema['updated_at']) {
                            fs.appendFileSync(alterTable, `
                              SET @preparedStatement = (SELECT IF(
                                (
                                  SELECT true FROM INFORMATION_SCHEMA.COLUMNS
                                  WHERE
                                    (TABLE_NAME = '${this.modelName}') AND 
                                    (TABLE_SCHEMA = '${Schema.config.database}') AND
                                    (COLUMN_NAME = 'updated_at')
                                ) = true,
                                "${alterTablePrefix} DROP COLUMN \`updated_at\`;",
                                "SELECT 1"
                              ));
                              PREPARE alterIfNotExists FROM @preparedStatement;
                              EXECUTE alterIfNotExists;
                              DEALLOCATE PREPARE alterIfNotExists;
                            `, 'utf8');
                        }

                    }

                    if (allPrimaryKeys.length > 0) {
                        fs.appendFileSync(primaryKeys, `${alterTablePrefix} ADD PRIMARY KEY (${allPrimaryKeys.join()});`, 'utf8');
                    }
                } catch (err) {
                    console.error(err);
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
                    if (renameColumn !== undefined) {
                        fs.closeSync(renameColumn);
                    }
                }

                // Removing all Foreign Keys
                Schema.connection.query(`SELECT TABLE_NAME, CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS T WHERE CONSTRAINT_SCHEMA = '${Schema.config.database}' AND CONSTRAINT_TYPE='FOREIGN KEY'`, function (err, result) {
                    if (!err) {
                        for (let item of result) {
                            if (!droppedFks[item['CONSTRAINT_NAME']]) {
                                dropFkQueries += `
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
                                droppedFks[item['CONSTRAINT_NAME']] = true;
                            }
                        }

                        let fkQueries = '';
                        if (Schema.pendingFkQueries.length > 0) {
                            for (const fk in Schema.pendingFkQueries) {
                                if (Schema.createdModels[Schema.pendingFkQueries[fk].ref.to]) {
                                    fkQueries += Schema.pendingFkQueries[fk].query;
                                    delete Schema.pendingFkQueries[fk];
                                }
                            }
                        }

                        let sql = `SET foreign_key_checks = 0; ${dropFkQueries} ${fs.readFileSync(this.schemaFiles.updateInit)} ${pkShouldDrop ? `${alterTablePrefix} DROP PRIMARY KEY;` : ''} ${fs.readFileSync(this.schemaFiles.updateNewCol)} ${fs.readFileSync(this.schemaFiles.extra)} ${fs.readFileSync(this.schemaFiles.alterTable)} ${fs.readFileSync(this.schemaFiles.renameColumn)} ${this.indexes.join('')} ${fkQueries} SET foreign_key_checks = 1;`.trim();
                        if (sql) {
                            Schema.connection.query(sql, function (err, result) {
                                if (err) {
                                    if (err.sql) delete err.sql;

                                    let {code, errno, sqlState, sqlMessage} = err;
                                    if (err.errno == 1064) {
                                        sqlMessage = 'Failed to parse Data Type; You have an error in your SQL syntax;';
                                    }
                                    console.error('Error:', {code, errno, sqlState, sqlMessage}, `-> Model = ${this.modelName}`);
                                }

                                
                                
                                
                                // Cleaning Resources
                                this.endConnection();
                                fs.unlink(this.schemaFiles.alterTable, function () { });
                                fs.unlink(this.schemaFiles.extra, function () { });
                                fs.unlink(this.schemaFiles.updateNewCol, function () { });
                                fs.unlink(this.schemaFiles.updateInit, function () { });
                                fs.unlink(this.schemaFiles.renameColumn, function () { });
                                
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
        for (let index of this.indexesObject) {
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
                this.indexes.push(`CREATE ${index.options.unique ? 'UNIQUE' : ''} INDEX ${index.indexName} ON ${this.modelName} (${index.columns});`);
            }
        }
    }

    index(indexName, columns, options = {}) {
        this.indexesObject.push({ indexName, columns, options });
    }

    uuid() {
        let dt   = new Date().getTime();
        let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            let r = (dt + Math.random() * 16) % 16 | 0;
            dt    = Math.floor(dt / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    }

    startConnection() {
        if (!Schema.connection) {
            // Initializing variables for schema implementation
            Schema.pendingFkQueries  = []; // Pending Foreign Keys Queries
            Schema.createdModels     = {};
            Schema.implementedModels = [];


            Schema.connection = Store.mysql.createConnection({
                host: Schema.config.host,
                user: Schema.config.user,
                password: Schema.config.password,
                database: Schema.config.database,
                multipleStatements: true
            });
            
            Schema.connection.connect(function(err) {
                if (err) {
                    console.error(err);
                    process.exit();
                } else {
                    console.log('Migrating....');
                }
            }); 
        }
    }

    endConnection() {
        Schema.implementedModels.push(this.modelName);
        if (Object.keys(Schema.createdModels).length == Schema.implementedModels.length && Schema.implementedModels.length > 0) {
            // Close Schema Connection
            Schema.connection.end(function(err) {
                delete Schema.pendingFkQueries; 
                delete Schema.createdModels;    
                delete Schema.implementedModels;
                delete Schema.connection;
                delete Schema.config;
                delete Schema.migrate;
                console.log('Migration Completed!!');
                process.exit();
            });   
        }
    }
}

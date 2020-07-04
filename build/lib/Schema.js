"use strict"; // Inbuilt Modules

var _fs = _interopRequireDefault(require("fs"));

var _Store = _interopRequireDefault(require("./Store"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

module.exports = /*#__PURE__*/function () {
  function Schema(schema) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Schema);

    // Raw Schema
    this.schema = schema;
    this.options = options;
    this.modelName = ''; // Schema Temporary files

    this.schemaFiles = {
      createTable: '',
      alterTable: '',
      extra: '',
      updateNewCol: '',
      updateInit: '',
      renameColumn: ''
    };
    this.indexes = [];
    this.indexesObject = [];
    return this;
  }

  _createClass(Schema, [{
    key: "implementSchema",
    value: function implementSchema(modelName, config) {
      if ("".concat(modelName).trim()) {
        Schema.config = config; // Connection Configuration for schema implementation

        this.startConnection();
        Schema.connection.query("SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = N'".concat(modelName, "' AND TABLE_SCHEMA='").concat(Schema.config.database, "' LIMIT 1"), function (err, result) {
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
  }, {
    key: "parseSchema",
    value: function parseSchema() {
      var schemaLength = Object.keys(this.schema).length;

      if (schemaLength > 0) {
        // Creating Schema Files
        var createTable,
            alterTable,
            allColumns = [],
            allPrimaryKeys = [],
            alterTablePrefix = "ALTER TABLE `".concat(this.modelName, "`");

        try {
          if (!_fs["default"].existsSync("".concat(__dirname, "/temp"))) {
            _fs["default"].mkdirSync("".concat(__dirname, "/temp"));
          }

          this.schemaFiles.createTable = "".concat(__dirname, "/temp/").concat(this.uuid(), ".sql");
          this.schemaFiles.alterTable = "".concat(__dirname, "/temp/").concat(this.uuid(), ".sql");
          createTable = _fs["default"].openSync(this.schemaFiles.createTable, 'a');
          alterTable = _fs["default"].openSync(this.schemaFiles.alterTable, 'a');

          _fs["default"].appendFileSync(createTable, "CREATE TABLE IF NOT EXISTS `".concat(this.modelName, "` ("), 'utf8'); // Parsing Schema Data


          for (var column in this.schema) {
            var _this$schema$column = this.schema[column],
                ref = _this$schema$column.ref,
                unique = _this$schema$column.unique,
                dataType = _this$schema$column.dataType,
                notNull = _this$schema$column.notNull,
                primaryKey = _this$schema$column.primaryKey,
                defaultValue = _this$schema$column.defaultValue,
                autoIncrement = _this$schema$column.autoIncrement,
                deprecated = _this$schema$column.deprecated;

            if (this.options.timestamps && (column == 'created_at' || column == 'updated_at')) {
              continue;
            }

            if (deprecated) {
              schemaLength--;

              if (schemaLength <= 0) {
                console.error("Error -> (Model = ".concat(this.modelName, "): It is not possible to deprecate all the columns of any Model!!"));
                process.exit();
              }

              continue;
            }

            if (dataType && !deprecated) {
              // Adding Columns
              allColumns.push("`".concat(column, "` ").concat(dataType)); // Adding NOT NULL || autoIncrement

              if (notNull || autoIncrement) {
                _fs["default"].appendFileSync(alterTable, "".concat(alterTablePrefix, " MODIFY `").concat(column, "` ").concat(dataType, " ").concat(notNull ? 'NOT NULL' : '', " ").concat(autoIncrement && primaryKey ? 'AUTO_INCREMENT' : '', ";"), 'utf8');
              } // Adding Primary Key to Temp Variable


              if (primaryKey) {
                allPrimaryKeys.push("`".concat(column, "`"));
              } // Adding Unique Key


              if (unique && !primaryKey) {
                _fs["default"].appendFileSync(alterTable, "".concat(alterTablePrefix, " ADD UNIQUE KEY `").concat(column, "` (`").concat(column, "`);"), 'utf8');
              } // Adding Foreign Key


              if (ref && ref.to && ref.foreignField) {
                Schema.pendingFkQueries.push({
                  ref: ref,
                  query: "".concat(alterTablePrefix, " ADD CONSTRAINT `").concat(this.modelName, "_").concat(column, "` FOREIGN KEY (`").concat(column, "`) REFERENCES `").concat(ref.to, "`(`").concat(ref.foreignField, "`);")
                });
              } // Set default value for column


              if (typeof defaultValue !== 'undefined') {
                _fs["default"].appendFileSync(alterTable, "".concat(alterTablePrefix, " ALTER `").concat(column, "` SET DEFAULT '").concat(defaultValue, "';"), 'utf8');
              }
            } else {
              console.error("dataType is missing for column `".concat(column, "` (Model = ").concat(this.modelName, ")"));
            }
          } // Adding All Columns


          _fs["default"].appendFileSync(createTable, allColumns.join(','), 'utf8'); // Adding Timestamps


          if (this.options.timestamps) {
            _fs["default"].appendFileSync(createTable, ",`updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE CURRENT_TIMESTAMP,", 'utf8');

            _fs["default"].appendFileSync(createTable, "`created_at` timestamp NOT NULL DEFAULT current_timestamp()", 'utf8');
          } // Closing Create Table statement


          _fs["default"].appendFileSync(createTable, ");", 'utf8'); // Adding all primary keys


          if (allPrimaryKeys.length > 0) {
            _fs["default"].appendFileSync(createTable, "".concat(alterTablePrefix, " ADD PRIMARY KEY (").concat(allPrimaryKeys.join(), ");"), 'utf8');
          }
        } catch (err) {
          console.error(err);
        } finally {
          if (createTable !== undefined) {
            _fs["default"].closeSync(createTable);
          }

          if (alterTable !== undefined) {
            _fs["default"].closeSync(alterTable);
          }
        }
      }
    }
  }, {
    key: "installSchema",
    value: function installSchema() {
      if (_fs["default"].existsSync(this.schemaFiles.createTable) && _fs["default"].existsSync(this.schemaFiles.alterTable)) {
        var fkQueries = '';

        if (Schema.pendingFkQueries.length > 0) {
          for (var fk in Schema.pendingFkQueries) {
            if (Schema.createdModels[Schema.pendingFkQueries[fk].ref.to]) {
              fkQueries += Schema.pendingFkQueries[fk].query;
              delete Schema.pendingFkQueries[fk];
            }
          }
        }

        Schema.connection.query("".concat(_fs["default"].readFileSync(this.schemaFiles.createTable), " ").concat(_fs["default"].readFileSync(this.schemaFiles.alterTable), " ").concat(this.indexes.join(''), " ").concat(fkQueries), function (err, result) {
          if (err) {
            if (err.sql) delete err.sql;
            var code = err.code,
                errno = err.errno,
                sqlState = err.sqlState,
                sqlMessage = err.sqlMessage;

            if (err.errno == 1064) {
              sqlMessage = 'Failed to parse Data Type; You have an error in your SQL syntax;';
            }

            console.error('Error:', {
              code: code,
              errno: errno,
              sqlState: sqlState,
              sqlMessage: sqlMessage
            }, "-> Model = ".concat(this.modelName));
          } // Cleaning Resources


          this.endConnection();

          _fs["default"].unlink(this.schemaFiles.createTable, function () {});

          _fs["default"].unlink(this.schemaFiles.alterTable, function () {});

          delete this.schemaFiles;
          delete this.indexes;
          delete this.indexesObject;
        }.bind(this));
      }
    }
  }, {
    key: "updateSchema",
    value: function updateSchema() {
      Schema.connection.query("DESC `".concat(this.modelName, "`"), function (err, result) {
        if (!err) {
          var primaryKeys,
              alterTable,
              renameColumn,
              updateNewCol,
              updateInit,
              allPrimaryKeys = [],
              pkShouldDrop = false,
              updatedColumns = {},
              dbCols = {},
              droppedFks = {},
              dropFkQueries = '',
              // This Variable contains the queries which helps to drop all the present Foreign Keys in the database while updating schema.
          alterTablePrefix = "ALTER TABLE `".concat(this.modelName, "`");

          try {
            this.schemaFiles.extra = "".concat(__dirname, "/temp/").concat(this.uuid(), ".sql");
            this.schemaFiles.alterTable = "".concat(__dirname, "/temp/").concat(this.uuid(), ".sql");
            this.schemaFiles.updateNewCol = "".concat(__dirname, "/temp/").concat(this.uuid(), ".sql");
            this.schemaFiles.updateInit = "".concat(__dirname, "/temp/").concat(this.uuid(), ".sql");
            this.schemaFiles.renameColumn = "".concat(__dirname, "/temp/").concat(this.uuid(), ".sql");
            updateNewCol = _fs["default"].openSync(this.schemaFiles.updateNewCol, 'a');
            updateInit = _fs["default"].openSync(this.schemaFiles.updateInit, 'a');
            alterTable = _fs["default"].openSync(this.schemaFiles.alterTable, 'a');
            primaryKeys = _fs["default"].openSync(this.schemaFiles.extra, 'a');
            renameColumn = _fs["default"].openSync(this.schemaFiles.renameColumn, 'a');

            var updateColumn = function (dbCol) {
              var schemaCol = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
              var column = this.schema[schemaCol ? schemaCol : dbCol.Field],
                  aiShouldDrop = false,
                  skip = false;

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
                      _fs["default"].appendFileSync(updateInit, "".concat(alterTablePrefix, " MODIFY `").concat(dbCol.Field, "` ").concat(dbCol.Type, ";"), 'utf8');
                    }

                    pkShouldDrop = true;
                  }

                  _fs["default"].appendFileSync(alterTable, "".concat(alterTablePrefix, " DROP COLUMN `").concat(dbCol.Field, "`;"), 'utf8');
                } else if (column.dataType) {
                  // Validate Primary Key
                  if (column.primaryKey) {
                    allPrimaryKeys.push("`".concat(dbCol.Field, "`"));

                    if (dbCol.Key == 'PRI') {
                      if (column.autoIncrement) {
                        _fs["default"].appendFileSync(updateInit, "".concat(alterTablePrefix, " MODIFY `").concat(dbCol.Field, "` ").concat(column.dataType, ";"), 'utf8');
                      }

                      pkShouldDrop = true;
                    }
                  } else if (!column.primaryKey && dbCol.Key == 'PRI') {
                    pkShouldDrop = true;
                    aiShouldDrop = true;
                  } // Validate Not Null & Auto Increment


                  if (column.notNull || column.autoIncrement) {
                    if (aiShouldDrop) {
                      _fs["default"].appendFileSync(alterTable, "".concat(alterTablePrefix, " MODIFY `").concat(dbCol.Field, "` ").concat(column.dataType, " ").concat(column.notNull ? 'NOT NULL' : '', ";"), 'utf8');
                    } else {
                      _fs["default"].appendFileSync(alterTable, "".concat(alterTablePrefix, " MODIFY `").concat(dbCol.Field, "` ").concat(column.dataType, " ").concat(column.notNull ? 'NOT NULL' : '', " ").concat(column.autoIncrement && column.primaryKey ? 'AUTO_INCREMENT' : '', ";"), 'utf8');
                    }
                  } else {
                    // Modifing only dataType
                    _fs["default"].appendFileSync(updateInit, "".concat(alterTablePrefix, " MODIFY `").concat(dbCol.Field, "` ").concat(column.dataType, ";"), 'utf8');
                  } // Validate Unique Key


                  if (column.unique && !column.primaryKey && dbCol.Key != 'UNI') {
                    // Adding Unique Key
                    _fs["default"].appendFileSync(alterTable, "".concat(alterTablePrefix, " ADD UNIQUE KEY `").concat(dbCol.Field, "` (`").concat(dbCol.Field, "`);"), 'utf8');
                  } else if (!column.unique && dbCol.Key == 'UNI' || column.unique && column.primaryKey && dbCol.Key == 'UNI') {
                    // Removing Unique Key
                    _fs["default"].appendFileSync(alterTable, "".concat(alterTablePrefix, " DROP INDEX `").concat(dbCol.Field, "`;"), 'utf8');
                  } // Validate Default Value


                  if (typeof column.defaultValue !== 'undefined') {
                    // Setting Default Value
                    _fs["default"].appendFileSync(alterTable, "".concat(alterTablePrefix, " ALTER `").concat(dbCol.Field, "` SET DEFAULT '").concat(column.defaultValue, "';"), 'utf8');
                  } else if (dbCol.Default) {
                    // Droping Default Value
                    _fs["default"].appendFileSync(alterTable, "".concat(alterTablePrefix, " ALTER `").concat(dbCol.Field, "` DROP DEFAULT;"), 'utf8');
                  } // Validate Foreign Key


                  if (column.ref && column.ref.to && column.ref.foreignField) {
                    var colName = schemaCol ? schemaCol : dbCol.Field;

                    if (!droppedFks["".concat(this.modelName, "_").concat(colName)]) {
                      dropFkQueries += "\n                                        set @var=if((SELECT true FROM information_schema.TABLE_CONSTRAINTS WHERE\n                                            CONSTRAINT_SCHEMA = DATABASE() AND\n                                            TABLE_NAME        = '".concat(this.modelName, "' AND\n                                            CONSTRAINT_NAME   = '").concat(this.modelName, "_").concat(colName, "' AND\n                                            CONSTRAINT_TYPE   = 'FOREIGN KEY') = true,'ALTER TABLE ").concat(this.modelName, "\n                                            DROP FOREIGN KEY ").concat(this.modelName, "_").concat(colName, "','select 1');\n                                \n                                        prepare stmt from @var;\n                                        execute stmt;\n                                        deallocate prepare stmt;\n                                        ");
                      droppedFks["".concat(this.modelName, "_").concat(colName)] = true;
                    }

                    Schema.pendingFkQueries.push({
                      ref: column.ref,
                      query: "\n                                    set @var=if((SELECT true FROM information_schema.COLUMNS WHERE\n                                        TABLE_NAME        = '".concat(this.modelName, "' AND\n                                        COLUMN_NAME       = '").concat(colName, "' AND\n                                        TABLE_SCHEMA      = '").concat(Schema.config.database, "') = true,'").concat(alterTablePrefix, " ADD CONSTRAINT `").concat(this.modelName, "_").concat(colName, "` FOREIGN KEY (`").concat(colName, "`) REFERENCES `").concat(column.ref.to, "`(`").concat(column.ref.foreignField, "`)','select 1');\n                            \n                                    prepare stmt from @var;\n                                    execute stmt;\n                                    deallocate prepare stmt;")
                    });
                  }
                } // Adding Column to the list of Updated Columns


                updatedColumns[dbCol.Field] = true;
              }
            }.bind(this); // Updating existing columns in the database


            var _iterator = _createForOfIteratorHelper(result),
                _step;

            try {
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                var dbCol = _step.value;
                updateColumn(dbCol); // Saving each database column

                dbCols[dbCol.Field] = dbCol;
              } // Adding new columns to the database

            } catch (err) {
              _iterator.e(err);
            } finally {
              _iterator.f();
            }

            for (var column in this.schema) {
              if (!(updatedColumns[column] || this.schema[column].deprecated || this.schema[column].renamedFrom) && this.schema[column].dataType) {
                // Adding new column
                _fs["default"].appendFileSync(updateNewCol, "".concat(alterTablePrefix, " ADD `").concat(column, "` ").concat(this.schema[column].dataType, " ;"), 'utf8'); // Adding NOT NULL || autoIncrement


                if (this.schema[column].notNull || this.schema[column].autoIncrement) {
                  _fs["default"].appendFileSync(alterTable, "".concat(alterTablePrefix, " MODIFY `").concat(column, "` ").concat(this.schema[column].dataType, " ").concat(this.schema[column].notNull ? 'NOT NULL' : '', " ").concat(this.schema[column].autoIncrement && this.schema[column].primaryKey ? 'AUTO_INCREMENT' : '', ";"), 'utf8');
                } // Adding Primary Key to Temp Variable


                if (this.schema[column].primaryKey) {
                  allPrimaryKeys.push("`".concat(column, "`"));
                } // Adding Unique Key


                if (this.schema[column].unique && !this.schema[column].primaryKey) {
                  _fs["default"].appendFileSync(alterTable, "".concat(alterTablePrefix, " ADD UNIQUE KEY `").concat(column, "` (`").concat(column, "`);"), 'utf8');
                } // Adding Foreign Key


                if (this.schema[column].ref && this.schema[column].ref.to && this.schema[column].ref.foreignField) {
                  Schema.pendingFkQueries.push({
                    ref: this.schema[column].ref,
                    query: "\n                                    set @var=if((SELECT true FROM information_schema.COLUMNS WHERE\n                                        TABLE_NAME        = '".concat(this.modelName, "' AND\n                                        COLUMN_NAME       = '").concat(column, "' AND\n                                        TABLE_SCHEMA      = '").concat(Schema.config.database, "') = true,'").concat(alterTablePrefix, " ADD CONSTRAINT `").concat(this.modelName, "_").concat(column, "` FOREIGN KEY (`").concat(column, "`) REFERENCES `").concat(this.schema[column].ref.to, "`(`").concat(this.schema[column].ref.foreignField, "`)','select 1');\n                            \n                                    prepare stmt from @var;\n                                    execute stmt;\n                                    deallocate prepare stmt;")
                  });
                } // Set default value for column


                if (typeof this.schema[column].defaultValue !== 'undefined') {
                  _fs["default"].appendFileSync(alterTable, "".concat(alterTablePrefix, " ALTER `").concat(column, "` SET DEFAULT '").concat(this.schema[column].defaultValue, "';"), 'utf8');
                }
              } else if (!this.schema[column].deprecated && this.schema[column].renamedFrom && this.schema[column].dataType) {
                // Update Column
                if (dbCols[this.schema[column].renamedFrom]) {
                  updateColumn(dbCols[this.schema[column].renamedFrom], column);
                } // Rename Column


                _fs["default"].appendFileSync(renameColumn, "\n                            SET @preparedStatement = (SELECT IF(\n                                (\n                                  SELECT true FROM INFORMATION_SCHEMA.COLUMNS\n                                  WHERE\n                                    (TABLE_NAME = '".concat(this.modelName, "') AND \n                                    (TABLE_SCHEMA = '").concat(Schema.config.database, "') AND\n                                    (COLUMN_NAME = '").concat(this.schema[column].renamedFrom, "')\n                                ) = true,\n                                \"").concat(alterTablePrefix, " CHANGE COLUMN `").concat(this.schema[column].renamedFrom, "` `").concat(column, "` ").concat(this.schema[column].dataType, "\",\n                                \"SELECT 1\"\n                              ));\n    \n                              PREPARE alterIfNotExists FROM @preparedStatement;\n                              EXECUTE alterIfNotExists;\n                              DEALLOCATE PREPARE alterIfNotExists;\n                            "), 'utf8');
              }
            } // Adding || Removing Timestamps


            if (this.options.timestamps) {
              // Adding Timestamps
              _fs["default"].appendFileSync(alterTable, "\n                        SET @preparedStatement = (SELECT IF(\n                            (\n                              SELECT true FROM INFORMATION_SCHEMA.COLUMNS\n                              WHERE\n                                (TABLE_NAME = '".concat(this.modelName, "') AND \n                                (TABLE_SCHEMA = '").concat(Schema.config.database, "') AND\n                                (COLUMN_NAME = 'created_at')\n                            ) = true,\n                            \"SELECT 1\",\n                            CONCAT(\"").concat(alterTablePrefix, " ADD `created_at` timestamp NOT NULL DEFAULT current_timestamp();\")\n                          ));\n\n                          PREPARE alterIfNotExists FROM @preparedStatement;\n                          EXECUTE alterIfNotExists;\n                          DEALLOCATE PREPARE alterIfNotExists;\n                          \n                          SET @preparedStatement = (SELECT IF(\n                            (\n                              SELECT true FROM INFORMATION_SCHEMA.COLUMNS\n                              WHERE\n                                (TABLE_NAME = '").concat(this.modelName, "') AND \n                                (TABLE_SCHEMA = '").concat(Schema.config.database, "') AND\n                                (COLUMN_NAME = 'updated_at')\n                            ) = true,\n                            \"SELECT 1\",\n                            CONCAT(\"").concat(alterTablePrefix, " ADD `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE CURRENT_TIMESTAMP;\")\n                          ));\n                          PREPARE alterIfNotExists FROM @preparedStatement;\n                          EXECUTE alterIfNotExists;\n                          DEALLOCATE PREPARE alterIfNotExists;\n                        "), 'utf8');
            } else {
              // Removing Timestamps 
              if (!this.schema['created_at']) {
                _fs["default"].appendFileSync(alterTable, "\n                            SET @preparedStatement = (SELECT IF(\n                                (\n                                  SELECT true FROM INFORMATION_SCHEMA.COLUMNS\n                                  WHERE\n                                    (TABLE_NAME = '".concat(this.modelName, "') AND \n                                    (TABLE_SCHEMA = '").concat(Schema.config.database, "') AND\n                                    (COLUMN_NAME = 'created_at')\n                                ) = true,\n                                \"").concat(alterTablePrefix, " DROP COLUMN `created_at`;\",\n                                \"SELECT 1\"\n                              ));\n    \n                              PREPARE alterIfNotExists FROM @preparedStatement;\n                              EXECUTE alterIfNotExists;\n                              DEALLOCATE PREPARE alterIfNotExists;\n                            "), 'utf8');
              }

              if (!this.schema['updated_at']) {
                _fs["default"].appendFileSync(alterTable, "\n                              SET @preparedStatement = (SELECT IF(\n                                (\n                                  SELECT true FROM INFORMATION_SCHEMA.COLUMNS\n                                  WHERE\n                                    (TABLE_NAME = '".concat(this.modelName, "') AND \n                                    (TABLE_SCHEMA = '").concat(Schema.config.database, "') AND\n                                    (COLUMN_NAME = 'updated_at')\n                                ) = true,\n                                \"").concat(alterTablePrefix, " DROP COLUMN `updated_at`;\",\n                                \"SELECT 1\"\n                              ));\n                              PREPARE alterIfNotExists FROM @preparedStatement;\n                              EXECUTE alterIfNotExists;\n                              DEALLOCATE PREPARE alterIfNotExists;\n                            "), 'utf8');
              }
            }

            if (allPrimaryKeys.length > 0) {
              _fs["default"].appendFileSync(primaryKeys, "".concat(alterTablePrefix, " ADD PRIMARY KEY (").concat(allPrimaryKeys.join(), ");"), 'utf8');
            }
          } catch (err) {
            console.error(err);
          } finally {
            if (updateInit !== undefined) {
              _fs["default"].closeSync(updateInit);
            }

            if (updateNewCol !== undefined) {
              _fs["default"].closeSync(updateNewCol);
            }

            if (alterTable !== undefined) {
              _fs["default"].closeSync(alterTable);
            }

            if (primaryKeys !== undefined) {
              _fs["default"].closeSync(primaryKeys);
            }

            if (renameColumn !== undefined) {
              _fs["default"].closeSync(renameColumn);
            }
          } // Removing all Foreign Keys


          Schema.connection.query("SELECT TABLE_NAME, CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS T WHERE CONSTRAINT_SCHEMA = '".concat(Schema.config.database, "' AND CONSTRAINT_TYPE='FOREIGN KEY'"), function (err, result) {
            if (!err) {
              var _iterator2 = _createForOfIteratorHelper(result),
                  _step2;

              try {
                for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                  var item = _step2.value;

                  if (!droppedFks[item['CONSTRAINT_NAME']]) {
                    dropFkQueries += "\n                                set @var=if((SELECT true FROM information_schema.TABLE_CONSTRAINTS WHERE\n                                    CONSTRAINT_SCHEMA = DATABASE() AND\n                                    TABLE_NAME        = '".concat(item['TABLE_NAME'], "' AND\n                                    CONSTRAINT_NAME   = '").concat(item['CONSTRAINT_NAME'], "' AND\n                                    CONSTRAINT_TYPE   = 'FOREIGN KEY') = true,'ALTER TABLE ").concat(item['TABLE_NAME'], "\n                                    DROP FOREIGN KEY ").concat(item['CONSTRAINT_NAME'], "','select 1');\n                        \n                                prepare stmt from @var;\n                                execute stmt;\n                                deallocate prepare stmt;\n                                ");
                    droppedFks[item['CONSTRAINT_NAME']] = true;
                  }
                }
              } catch (err) {
                _iterator2.e(err);
              } finally {
                _iterator2.f();
              }

              var fkQueries = '';

              if (Schema.pendingFkQueries.length > 0) {
                for (var fk in Schema.pendingFkQueries) {
                  if (Schema.createdModels[Schema.pendingFkQueries[fk].ref.to]) {
                    fkQueries += Schema.pendingFkQueries[fk].query;
                    delete Schema.pendingFkQueries[fk];
                  }
                }
              }

              var sql = "SET foreign_key_checks = 0; ".concat(dropFkQueries, " ").concat(_fs["default"].readFileSync(this.schemaFiles.updateInit), " ").concat(pkShouldDrop ? "".concat(alterTablePrefix, " DROP PRIMARY KEY;") : '', " ").concat(_fs["default"].readFileSync(this.schemaFiles.updateNewCol), " ").concat(_fs["default"].readFileSync(this.schemaFiles.extra), " ").concat(_fs["default"].readFileSync(this.schemaFiles.alterTable), " ").concat(_fs["default"].readFileSync(this.schemaFiles.renameColumn), " ").concat(this.indexes.join(''), " ").concat(fkQueries, " SET foreign_key_checks = 1;").trim();

              if (sql) {
                Schema.connection.query(sql, function (err, result) {
                  if (err) {
                    if (err.sql) delete err.sql;
                    var code = err.code,
                        errno = err.errno,
                        sqlState = err.sqlState,
                        sqlMessage = err.sqlMessage;

                    if (err.errno == 1064) {
                      sqlMessage = 'Failed to parse Data Type; You have an error in your SQL syntax;';
                    }

                    console.error('Error:', {
                      code: code,
                      errno: errno,
                      sqlState: sqlState,
                      sqlMessage: sqlMessage
                    }, "-> Model = ".concat(this.modelName));
                  } // Cleaning Resources


                  this.endConnection();

                  _fs["default"].unlink(this.schemaFiles.alterTable, function () {});

                  _fs["default"].unlink(this.schemaFiles.extra, function () {});

                  _fs["default"].unlink(this.schemaFiles.updateNewCol, function () {});

                  _fs["default"].unlink(this.schemaFiles.updateInit, function () {});

                  _fs["default"].unlink(this.schemaFiles.renameColumn, function () {});

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
  }, {
    key: "parseIndexes",
    value: function parseIndexes() {
      var _iterator3 = _createForOfIteratorHelper(this.indexesObject),
          _step3;

      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
          var index = _step3.value;
          this.indexes.push("\n            set @var=if((SELECT true FROM information_schema.STATISTICS WHERE\n                TABLE_SCHEMA      =  DATABASE() AND\n                TABLE_NAME        = '".concat(this.modelName, "' AND\n                INDEX_NAME        = '").concat(index.indexName, "') = true,'ALTER TABLE ").concat(this.modelName, "\n                DROP INDEX ").concat(index.indexName, "','select 1');\n    \n            prepare stmt from @var;\n            execute stmt;\n            deallocate prepare stmt;\n            "));

          if ("".concat(index.indexName).trim() && "".concat(index.columns).trim() && !index.options.deprecated) {
            this.indexes.push("CREATE ".concat(index.options.unique ? 'UNIQUE' : '', " INDEX ").concat(index.indexName, " ON ").concat(this.modelName, " (").concat(index.columns, ");"));
          }
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
    }
  }, {
    key: "index",
    value: function index(indexName, columns) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      this.indexesObject.push({
        indexName: indexName,
        columns: columns,
        options: options
      });
    }
  }, {
    key: "uuid",
    value: function uuid() {
      var dt = new Date().getTime();
      var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c == 'x' ? r : r & 0x3 | 0x8).toString(16);
      });
      return uuid;
    }
  }, {
    key: "startConnection",
    value: function startConnection() {
      if (!Schema.connection) {
        // Initializing variables for schema implementation
        Schema.pendingFkQueries = []; // Pending Foreign Keys Queries

        Schema.createdModels = {};
        Schema.implementedModels = [];
        Schema.connection = _Store["default"].mysql.createConnection({
          host: Schema.config.host,
          user: Schema.config.user,
          password: Schema.config.password,
          database: Schema.config.database,
          multipleStatements: true
        });
        Schema.connection.connect(function (err) {
          if (err) {
            console.error(err);
            process.exit();
          } else {
            console.log('Migrating....');
          }
        });
      }
    }
  }, {
    key: "endConnection",
    value: function endConnection() {
      Schema.implementedModels.push(this.modelName);

      if (Object.keys(Schema.createdModels).length == Schema.implementedModels.length && Schema.implementedModels.length > 0) {
        // Close Schema Connection
        Schema.connection.end(function (err) {
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
  }]);

  return Schema;
}();
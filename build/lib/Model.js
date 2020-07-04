"use strict"; // Classes

var _QueryHelper2 = _interopRequireDefault(require("./QueryHelper"));

var _Store = _interopRequireDefault(require("./Store"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

module.exports = /*#__PURE__*/function (_QueryHelper) {
  _inherits(Model, _QueryHelper);

  var _super = _createSuper(Model);

  /**
   * Model Constructor
   * 
   * @param {Object} obj 
   */
  function Model(schema) {
    var _this;

    _classCallCheck(this, Model);

    _this = _super.call(this);
    /**
     * Private Variables
     * 
     * 1. _$modelName {String}
     * 
     * 2. _$connection {Object} - MySQL Connection 
     * 
     * 3. _$where {String} - Projection for SELECT Query
     * 
     * 4. _$project {String} - Projection for SELECT Query
     * 
     * 5. _$limit {String}
     * 
     * 6. _$orderBy {String}
     * 
     * 7. _$populate {Array} -> [
     *          {
     *              col: 'column_name',
     *              project: [] 
     *          },
     *          ...
     *    ]
     * 
     * 8. _$lean {Boolean} - Decide whether return instace of Model or simple JSON Object
     *
     * 9. _$orginalColData {String} - Store orginal column data before populating, which in will further helps to run .save() on parent model
     *
     * 10. _$schema {Schema} - Instance of Schema (Only used in migration)
     */

    _this._$modelName = function () {
      return null;
    };

    _this._$connection = function () {
      return _Store["default"].connection;
    };

    _this._$orginalColData = function () {
      return '';
    }; // Query Chunks


    _this._$where = function () {
      return '';
    };

    _this._$project = function () {
      return '*';
    };

    _this._$limit = function () {
      return '';
    };

    _this._$orderBy = function () {
      return '';
    };

    _this._$populate = function () {
      return [];
    };

    _this._$lean = function () {
      return false;
    };

    _this._$schema = function () {
      return schema;
    }; // Only used in migration


    return _this;
  }
  /**
   * Map data to Model
   * 
   * @param {Object} obj 
   */


  _createClass(Model, [{
    key: "mapObject",
    value: function mapObject(obj) {
      // Map obj to Model
      var schema = _Store["default"].models.get(this._$modelName()).schema;

      for (var column in schema) {
        if (obj.hasOwnProperty(column)) {
          this[column] = obj[column];
        }
      } // Map Timestamps to Model


      if (obj.hasOwnProperty('created_at')) {
        this['created_at'] = obj['created_at'];
      }

      if (obj.hasOwnProperty('updated_at')) {
        this['updated_at'] = obj['updated_at'];
      }
    }
    /**
     * Map one Model to another
     * 
     * @param {Model} model - Instance of Model 
     */

  }, {
    key: "mapModel",
    value: function mapModel(model) {
      model._$connection = this._$connection;
    }
    /**
     * Create new instace of Model
     * 
     * @param {Object} obj
     * 
     * @return {Model} - New Instance of Model
     */

  }, {
    key: "create",
    value: function create(obj) {
      var modelName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      var model = new Model(); // Set Model Name

      model.modelName = modelName ? modelName : this._$modelName(); // Map all private data to new instace of Model

      this.mapModel(model); // Map data to new instace of Model

      model.mapObject(obj);
      return model;
    }
    /**
     * Upsert data to database
     * 
     * @return {Promise} - Model Instance
     */

  }, {
    key: "save",
    value: function save() {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        var modelName = _this2._$modelName();

        for (var i in _this2) {
          if (typeof _this2[i] === 'function') {
            continue;
          }

          if (_this2[i] instanceof Model) {
            _this2[i] = _this2[i]._$orginalColData();
          }
        }

        _this2._$connection().query("INSERT INTO ".concat(modelName, " SET ? ON DUPLICATE KEY UPDATE ?"), [_this2, _this2], function (error, result) {
          if (error) {
            delete error.sql;
            reject(error);
          }

          if (result && result.insertId) {
            _this2[_Store["default"].models.get(modelName).aiField] = result.insertId;
          }

          resolve(_this2);
        });
      });
    }
    /**
     * 
     * @param {Object} data 
     * @param {Object} where 
     * 
     * @return {Promise}
     */

  }, {
    key: "update",
    value: function update(data) {
      var _this3 = this;

      var where = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      return new Promise(function (resolve, reject) {
        _this3._$connection().query("UPDATE ".concat(_this3._$modelName(), " SET ? ").concat(_this3.isObjectEmpty(where) ? '' : 'WHERE', " ").concat(_this3.where(where)), [data], function (error, result) {
          if (error) reject(error);
          resolve(result);
        });
      });
    }
    /**
     * 
     * @param {Object} where 
     * 
     * @return {Promise}
     */

  }, {
    key: "delete",
    value: function _delete() {
      var _this4 = this;

      var where = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      return new Promise(function (resolve, reject) {
        _this4._$connection().query("DELETE FROM ".concat(_this4._$modelName(), " ").concat(_this4.isObjectEmpty(where) ? '' : 'WHERE', " ").concat(_this4.where(where)), function (error, result) {
          if (error) reject(error);
          resolve(result);
        });
      });
    }
    /**
     * Insert in Bulk
     * 
     * @param {Array} cols 
     * @param {Array} values 
     * 
     * @return {Promise}
     */

  }, {
    key: "insertMany",
    value: function insertMany(cols, values) {
      var _this5 = this;

      return new Promise(function (resolve, reject) {
        _this5._$connection().query("INSERT INTO ".concat(_this5._$modelName(), "(").concat(cols.join(), ") VALUES ?"), [values], function (error, result) {
          if (error) reject(error);
          resolve(result);
        });
      });
    }
    /**
     * Execute SELECT Query
     * 
     * @returns {Promise}
     */

  }, {
    key: "exec",
    value: function exec() {
      var _this6 = this;

      var lean = this._$lean();

      var populate = this._$populate();

      var modelName = this._$modelName();

      var promise = new Promise(function (resolve, reject) {
        _this6._$connection().query("SELECT ".concat(_this6._$project(), " FROM ").concat(modelName, " ").concat(_this6._$where(), " ").concat(_this6._$orderBy(), " ").concat(_this6._$limit()), /*#__PURE__*/function () {
          var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(error, result) {
            var schema, i, _final;

            return regeneratorRuntime.wrap(function _callee3$(_context3) {
              while (1) {
                switch (_context3.prev = _context3.next) {
                  case 0:
                    if (error) reject(error);

                    if (!(result && result.length > 0)) {
                      _context3.next = 14;
                      break;
                    }

                    if (!(populate.length > 0)) {
                      _context3.next = 11;
                      break;
                    }

                    schema = _Store["default"].models.get(modelName).schema; // Schema of this Model

                    _context3.t0 = regeneratorRuntime.keys(populate);

                  case 5:
                    if ((_context3.t1 = _context3.t0()).done) {
                      _context3.next = 11;
                      break;
                    }

                    i = _context3.t1.value;

                    if (!schema.hasOwnProperty(populate[i].col)) {
                      _context3.next = 9;
                      break;
                    }

                    return _context3.delegateYield( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
                      var populatedData, shouldProceed, column, project, primaryKeys, refModel, distinct, k;
                      return regeneratorRuntime.wrap(function _callee2$(_context2) {
                        while (1) {
                          switch (_context2.prev = _context2.next) {
                            case 0:
                              /**
                               * poplatedData {Object} -> {
                               *      col_value: {...},
                               *      ...
                               * }
                               */
                              populatedData = {};
                              shouldProceed = true; // Flag for population

                              column = schema[populate[i].col]; // Schema Column

                              project = populate[i].project; // Projection for populaion
                              // Getting Primary Keys of `ref` Model

                              primaryKeys = void 0;
                              refModel = void 0;

                              if (_Store["default"].models.has(column.ref)) {
                                refModel = _Store["default"].models.get(column.ref);
                                primaryKeys = refModel.primaryKeys.array;

                                if (primaryKeys.length > 1) {
                                  shouldProceed = false;
                                } else {
                                  if (project.length > 0) {
                                    project.push(primaryKeys[0]);
                                  }
                                }
                              } else {
                                shouldProceed = false;
                              } // Pull out distinct values for column (populate[i].col) from result


                              distinct = void 0;

                              if (!shouldProceed) {
                                _context2.next = 21;
                                break;
                              }

                              distinct = new Set();
                              _context2.t0 = regeneratorRuntime.keys(result);

                            case 11:
                              if ((_context2.t1 = _context2.t0()).done) {
                                _context2.next = 21;
                                break;
                              }

                              k = _context2.t1.value;

                              if (!result[k].hasOwnProperty(populate[i].col)) {
                                _context2.next = 17;
                                break;
                              }

                              distinct.add(result[k][populate[i].col]);
                              _context2.next = 19;
                              break;

                            case 17:
                              shouldProceed = false;
                              return _context2.abrupt("break", 21);

                            case 19:
                              _context2.next = 11;
                              break;

                            case 21:
                              if (!shouldProceed) {
                                _context2.next = 29;
                                break;
                              }

                              _context2.prev = 22;
                              return _context2.delegateYield( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
                                var populateResult, _loop, j, l;

                                return regeneratorRuntime.wrap(function _callee$(_context) {
                                  while (1) {
                                    switch (_context.prev = _context.next) {
                                      case 0:
                                        _context.next = 2;
                                        return _this6.populateQuery(column.ref, _this6.populateProject(project), primaryKeys[0], _toConsumableArray(distinct));

                                      case 2:
                                        populateResult = _context.sent;

                                        _loop = function _loop(j) {
                                          if (lean) {
                                            populatedData[populateResult[j][primaryKeys[0]]] = populateResult[j];
                                          } else {
                                            var model = _this6.create(populateResult[j], column.ref); // Saving orignal column data


                                            model._$orginalColData = function () {
                                              return populateResult[j][primaryKeys[0]];
                                            };

                                            populatedData[populateResult[j][primaryKeys[0]]] = model;
                                          }
                                        };

                                        for (j in populateResult) {
                                          _loop(j);
                                        }

                                        for (l in result) {
                                          if (populatedData.hasOwnProperty(result[l][populate[i].col])) {
                                            result[l][populate[i].col] = populatedData[result[l][populate[i].col]];
                                          }
                                        }

                                      case 6:
                                      case "end":
                                        return _context.stop();
                                    }
                                  }
                                }, _callee);
                              })(), "t2", 24);

                            case 24:
                              _context2.next = 29;
                              break;

                            case 26:
                              _context2.prev = 26;
                              _context2.t3 = _context2["catch"](22);
                              console.error("Error: Failed to populate ".concat(populate[i].col), _context2.t3);

                            case 29:
                            case "end":
                              return _context2.stop();
                          }
                        }
                      }, _callee2, null, [[22, 26]]);
                    })(), "t2", 9);

                  case 9:
                    _context3.next = 5;
                    break;

                  case 11:
                    if (lean) {
                      resolve(result);
                    } else {
                      _final = result.map(function (row) {
                        return _this6.create(row, modelName);
                      });
                      resolve(_final);
                    }

                    _context3.next = 15;
                    break;

                  case 14:
                    resolve(result);

                  case 15:
                  case "end":
                    return _context3.stop();
                }
              }
            }, _callee3);
          }));

          return function (_x, _x2) {
            return _ref.apply(this, arguments);
          };
        }());
      });
      this.clearChunks(); // Clear Query Chunks

      return promise;
    }
    /**
     * Generate WEHRE Clause Statement
     * 
     * @param {Object} obj  
     * 
     * @return {Model}
     */

  }, {
    key: "find",
    value: function find() {
      var _this7 = this;

      var where = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      if (!this.isObjectEmpty(where)) {
        this._$where = function () {
          return "WHERE ".concat(_this7.where(where));
        };
      }

      return this;
    }
    /** 
     * Set projection for SELECT query
     * 
     * @param {Array} arr
     * @param {String} modelName
     * 
     * @return {Model}
     */

  }, {
    key: "project",
    value: function project() {
      var arr = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

      if (arr.length > 0) {
        var primaryKeys = _Store["default"].models.get(this._$modelName()).primaryKeys;

        var projection = new Set([].concat(_toConsumableArray(arr), _toConsumableArray(primaryKeys.array)));

        this._$project = function () {
          return _toConsumableArray(projection).join();
        };
      }

      return this;
    }
    /**
     * Generate LIMIT Clause Statement
     * 
     * @param {Number} limit 
     * @param {Number} [offset] 
     * 
     * @return {Model}
     */

  }, {
    key: "limit",
    value: function limit(_limit) {
      var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

      this._$limit = function () {
        return "LIMIT ".concat(offset ? "".concat(offset, ", ") : '', " ").concat(_limit);
      };

      return this;
    }
    /**
     * Generate ORDER BY Clause Statement
     * 
     * @param {String} cols 
     * @param {String} [sortBy] 
     * 
     * @return {Model}
     */

  }, {
    key: "orderBy",
    value: function orderBy(cols) {
      var sortBy = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

      this._$orderBy = function () {
        return "ORDER BY ".concat(cols, " ").concat(sortBy);
      };

      return this;
    }
    /**
    * Decide whether return instace of Model or simple JSON Object
    * 
    * @return {Model}
    */

  }, {
    key: "lean",
    value: function lean() {
      this._$lean = function () {
        return true;
      };

      return this;
    }
    /**
     * Populate Columns
     * 
     * @param {String} col 
     * @param {String} project 
     * 
     * @return {Model}
     */

  }, {
    key: "populate",
    value: function populate(col) {
      var project = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

      var populate = this._$populate();

      populate.push({
        col: col,
        project: project
      });

      this._$populate = function () {
        return populate;
      };

      return this;
    }
    /**
     * Generate projection for populate query
     * 
     * @param {Array} arr 
     * @param {String} modelName 
     */

  }, {
    key: "populateProject",
    value: function populateProject() {
      var arr = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

      if (arr.length > 0) {
        var projection = new Set(_toConsumableArray(arr));
        return _toConsumableArray(projection).join();
      }

      return '*';
    }
    /**
     * Generate query for populating data
     * 
     * @param {String} tableName 
     * @param {String} project 
     * @param {String} col 
     * @param {Array} arr 
     * 
     * @return {Promise}
     */

  }, {
    key: "populateQuery",
    value: function populateQuery(tableName, project, col, arr) {
      var _this8 = this;

      return new Promise(function (resolve, reject) {
        _this8._$connection().query("SELECT ".concat(project, " FROM ").concat(tableName, " WHERE ").concat(_Store["default"].mysql.escapeId(col), " IN (?)"), [arr], function (error, result) {
          if (error) reject(error);
          resolve(result);
        });
      });
    }
    /**
     * Clear Query Chunks
     */

  }, {
    key: "clearChunks",
    value: function clearChunks() {
      this._$where = function () {
        return '';
      };

      this._$project = function () {
        return '*';
      };

      this._$limit = function () {
        return '';
      };

      this._$orderBy = function () {
        return '';
      };

      this._$populate = function () {
        return [];
      };

      this._$lean = function () {
        return false;
      };
    }
    /**
     * Set new connection to Model
     * 
     * @param {Object} connection - MySQL Connection
     * 
     * @return {Model} 
     */

  }, {
    key: "useConnection",
    value: function useConnection(connection) {
      this._$connection = function () {
        return connection;
      };

      return this;
    }
    /**
     * Release Pool Connection
     */

  }, {
    key: "releaseConnection",
    value: function releaseConnection() {
      this._$connection().release();

      this._$connection = function () {
        return _Store["default"].connection;
      };
    }
    /**
     * Destroy Pool Connection
     */

  }, {
    key: "destroyConnection",
    value: function destroyConnection() {
      this._$connection().destroy();

      this._$connection = function () {
        return _Store["default"].connection;
      };
    }
    /**
     * Set & Parse Schema (Generate Final Schema for Model)
     */

  }, {
    key: "schema",
    set: function set(schema) {
      var finalSchema = {};
      var aiField = ''; // AUTO_INCREMENT Field

      var primaryKeys = {
        string: '',
        array: [],
        object: {}
      };

      for (var column in schema) {
        // Skip if column is deprecated
        if (schema[column].deprecated) {
          continue;
        } // Save Primary Keys


        if (schema[column].primaryKey) {
          primaryKeys.array.push(column);
          primaryKeys.object[column] = 1;
        } // Save AUTO_INCREMENT Field


        if (schema[column].autoIncrement) {
          aiField = column;
        } // Save column if not deprecated


        finalSchema[column] = schema[column];
      }

      primaryKeys.string = primaryKeys.array.join(); // Saving Data into Store

      _Store["default"].models.set(this._$modelName(), {
        primaryKeys: primaryKeys,
        aiField: aiField,
        schema: finalSchema
      });
    }
    /**
     * Set Model Name
     */

  }, {
    key: "modelName",
    set: function set(modelName) {
      this._$modelName = function () {
        return modelName;
      };
    }
    /**
     * Get Model Name
     */
    ,
    get: function get() {
      return this._$modelName();
    }
  }]);

  return Model;
}(_QueryHelper2["default"]);
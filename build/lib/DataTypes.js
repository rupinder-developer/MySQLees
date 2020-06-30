"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

module.exports = /*#__PURE__*/function () {
  function DataTypes() {
    _classCallCheck(this, DataTypes);
  }

  _createClass(DataTypes, null, [{
    key: "varchar",
    value: function varchar() {
      var size = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 255;
      return "VARCHAR(".concat(size, ")");
    }
  }, {
    key: "char",
    value: function char() {
      var size = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
      return "CHAR(".concat(size, ")");
    }
  }, {
    key: "binary",
    value: function binary() {
      var size = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
      return "BINARY(".concat(size, ")");
    }
  }, {
    key: "varbinary",
    value: function varbinary() {
      var size = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 10;
      return "VARBINARY(".concat(size, ")");
    }
  }, {
    key: "tinyblob",
    value: function tinyblob() {
      return 'TINYBLOB';
    }
  }, {
    key: "blob",
    value: function blob() {
      return 'BLOB';
    }
  }, {
    key: "longblob",
    value: function longblob() {
      return 'LONGBLOB';
    }
  }, {
    key: "tinytext",
    value: function tinytext() {
      return 'TINYTEXT';
    }
  }, {
    key: "mediumtext",
    value: function mediumtext() {
      return 'MEDIUMTEXT';
    }
  }, {
    key: "text",
    value: function text() {
      return 'TEXT';
    }
  }, {
    key: "longtext",
    value: function longtext() {
      return 'LONGTEXT';
    }
  }, {
    key: "bit",
    value: function bit() {
      var size = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
      return "BIT(".concat(size, ")");
    }
  }, {
    key: "tinyint",
    value: function tinyint() {
      var size = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 4;
      return "TINYINT(".concat(size, ")");
    }
  }, {
    key: "smallint",
    value: function smallint() {
      var size = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 6;
      return "SMALLINT(".concat(size, ")");
    }
  }, {
    key: "mediumint",
    value: function mediumint() {
      var size = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 9;
      return "MEDIUMINT(".concat(size, ")");
    }
  }, {
    key: "int",
    value: function int() {
      var size = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 11;
      return "INT(".concat(size, ")");
    }
  }, {
    key: "bigint",
    value: function bigint() {
      var size = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 20;
      return "BIGINT(".concat(size, ")");
    }
  }, {
    key: "float",
    value: function float() {
      return "FLOAT";
    }
  }, {
    key: "double",
    value: function double() {
      return "DOUBLE";
    }
  }, {
    key: "decimal",
    value: function decimal() {
      var size = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 10;
      var d = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      return "DECIMAL(".concat(size, ", ").concat(d, ")");
    }
  }, {
    key: "datetime",
    value: function datetime() {
      return "DATETIME";
    }
  }, {
    key: "timestamp",
    value: function timestamp() {
      return "TIMESTAMP";
    }
  }, {
    key: "date",
    value: function date() {
      return "DATE";
    }
  }, {
    key: "time",
    value: function time() {
      return "TIME";
    }
  }, {
    key: "year",
    value: function year() {
      return "YEAR";
    }
  }, {
    key: "enum",
    value: function _enum() {
      var result = '';

      for (var i = 0; i < arguments.length; i++) {
        result += "\"".concat(arguments[i], "\"").concat(arguments.length - i == 1 ? '' : ', ');
      }

      return "ENUM(".concat(result, ")");
    }
  }, {
    key: "set",
    value: function set() {
      var result = '';

      for (var i = 0; i < arguments.length; i++) {
        result += "\"".concat(arguments[i], "\"").concat(arguments.length - i == 1 ? '' : ', ');
      }

      return "SET(".concat(result, ")");
    }
  }]);

  return DataTypes;
}();
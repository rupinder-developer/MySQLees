"use strict";

var _Store = _interopRequireDefault(require("./Store"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

module.exports = /*#__PURE__*/function () {
  function QueryHelper() {
    _classCallCheck(this, QueryHelper);
  }

  _createClass(QueryHelper, [{
    key: "where",

    /**
     * Generate WHERE Clause Statement
     * 
     * @param {Object} obj 
     * @return {String}
     */
    value: function where(obj) {
      var _final = [];

      for (var i in obj) {
        if (i === '$and') {
          if (Array.isArray(obj[i])) {
            var and = [];

            for (var k in obj[i]) {
              and.push("".concat(this.where(obj[i][k])));
            }

            _final.push("(".concat(and.join(' AND '), ")"));
          }
        } else if (i === '$or') {
          if (Array.isArray(obj[i])) {
            var or = [];

            for (var j in obj[i]) {
              or.push("".concat(this.where(obj[i][j])));
            }

            _final.push("(".concat(or.join(' OR '), ")"));
          }
        } else {
          if (_typeof(obj[i]) === 'object') {
            for (var l in obj[i]) {
              if (l === '$lt') {
                _final.push("".concat(_Store["default"].mysql.escapeId(i), "<").concat(_Store["default"].mysql.escape(obj[i][l])));
              } else if (l === '$lte') {
                _final.push("".concat(_Store["default"].mysql.escapeId(i), "<=").concat(_Store["default"].mysql.escape(obj[i][l])));
              } else if (l === '$gt') {
                _final.push("".concat(_Store["default"].mysql.escapeId(i), ">").concat(_Store["default"].mysql.escape(obj[i][l])));
              } else if (l === '$gte') {
                _final.push("".concat(_Store["default"].mysql.escapeId(i), ">=").concat(_Store["default"].mysql.escape(obj[i][l])));
              } else if (l === '$ne') {
                _final.push("".concat(_Store["default"].mysql.escapeId(i), "<>").concat(_Store["default"].mysql.escape(obj[i][l])));
              } else if (l === '$like') {
                _final.push("".concat(_Store["default"].mysql.escapeId(i), " LIKE ").concat(_Store["default"].mysql.escape(obj[i][l])));
              } else if (l === '$nlike') {
                _final.push("".concat(_Store["default"].mysql.escapeId(i), " NOT LIKE ").concat(_Store["default"].mysql.escape(obj[i][l])));
              } else if (l === '$in' || l === '$nin') {
                var temp = [];
                var operator = l === '$in' ? 'IN' : 'NOT IN';

                if (Array.isArray(obj[i][l])) {
                  var _iterator = _createForOfIteratorHelper(obj[i][l]),
                      _step;

                  try {
                    for (_iterator.s(); !(_step = _iterator.n()).done;) {
                      var value = _step.value;
                      temp.push(_Store["default"].mysql.escape(value));
                    }
                  } catch (err) {
                    _iterator.e(err);
                  } finally {
                    _iterator.f();
                  }
                }

                _final.push("(".concat(_Store["default"].mysql.escapeId(i), " ").concat(operator, "(").concat(temp.join(), "))"));
              }
            }
          } else {
            _final.push("".concat(_Store["default"].mysql.escapeId(i), "=").concat(_Store["default"].mysql.escape(obj[i])));
          }
        }
      }

      if (_final.length === 0) {
        return '';
      }

      if (_final.length > 1) {
        return "(".concat(_final.join(' AND '), ")");
      }

      return "".concat(_final.join(' AND '));
    }
  }, {
    key: "isObjectEmpty",
    value: function isObjectEmpty(obj) {
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          return false;
        }
      }

      return true;
    }
  }]);

  return QueryHelper;
}();
const mysql = require('mysql');
const mysqlees = require('./build/MySQLees');


const cschema = mysqlees.schema({
    id: {
        primary_key: true,
        auto_increment: true,
        datatype: {
            name: 'int',
            size: 11
        }
    },
    name: {
        datatype: {
            name: 'varchar',
            size: 255
        },
        not_null: true
    },
    data: {
        datatype: {
            name: 'int',
            size: 11
        },
        not_null: true,
        ref: {
            to: 'orders',
            foreign_field: 'id'
        }
    }
}, {
    timestamp: true
});


mysqlees.model('customer', cschema);

const mysql = require('mysql');
const mysqlees = require('./build/index');


mysqlees.connect(mysql, {
    host: "localhost",
    user: "root",
    password: "",
    database: "test"
});

const schema = mysqlees.schema({
    id: {
        primary_key: true,
        auto_increment: true,
        datatype: {
            name: 'int'
        }
    },
    name: {
        datatype: {
            name: 'varchar',
            size: '255'
        }
    }
}, {
    timestamps: true
});

const schema2 = mysqlees.schema({
    id: {
        primary_key: true,
        auto_increment: true,
        datatype: {
            name: 'int'
        }
    },
    customer_id: {
        datatype: {
            name: 'int',
            size: 11
        },
        ref: {
            to: 'customers',
            foreign_field: 'id'
        }
    }
}, {
    timestamps: true
});

mysqlees.model('orders', schema2);
mysqlees.model('customers', schema);
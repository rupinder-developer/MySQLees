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
    phone_number: {
        primary_key: true,
        datatype: {
            name: 'varchar',
            size: 15
        }
    },
    email: {
        unique: true,
        datatype: {
            name: 'varchar',
            size: 255
        }
    },
    city: {
        datatype: {
            name: 'varchar',
            size: 255
        }
    }
 }, {
    timestamps: true
 });

const model = mysqlees.model('data', schema);
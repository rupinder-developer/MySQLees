const mysql = require('mysql');
const mysqlees = require('./build/MySQLees');

mysqlees.connect(mysql, {
    host: "localhost",
    user: "root",
    password: "",
    database: "tesst"
}).then(() => console.log("Connected!!")).catch(err => console.log(err));

const schema = mysqlees.schema({
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
    }
}, {
    timestamp: true
});

mysqlees.model('test1', schema);

const mysql = require('mysql');
const mysqlees = require('./build/index');

mysqlees.connect(mysql, {
    host: "localhost",
    user: "root",
    password: "",
    database: "inventory"
});

mysqlees.options({
    autoMigration: true
});

const members = mysqlees.schema({
    id: {
        primaryKey: true,
        autoIncrement: true,
        datatype: {
            name: 'int'
        }
    },
    full_name: {
        datatype: {
            name: 'varchar',
            size: '255'
        }
    },
    username: {
        datatype: {
            name: 'varchar',
            size: '255'
        },
        unique: true
    },
    email: {
        datatype: {
            name: 'varchar',
            size: '255'
        },
        unique: true
    },
    password: {
        datatype: {
            name: 'longtext'
        }
    },
    type: {
        datatype: {
            name: 'varchar',
            size: 10
        }
    },
    is_active: {
        datatype: {
            name: 'int'
        }
    },
}, {
    timestamps: true
});


mysqlees.model('members', members);
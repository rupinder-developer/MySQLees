const mysql = require('mysql');
const mysqlees = require('./build/index');

mysqlees.bind(mysql);

mysqlees.connect({
    connectionLimit: 10,
    host: "localhost",
    user: "root",
    password: "",
    database: "test"
});

mysqlees.options({
    autoMigration: true
});

const customers = mysqlees.schema({
    id: {
        primaryKey: true,
        autoIncrement: true,
        dataType: 'int'
    },
    name: {
        dataType: 'varchar(255)'
    }
}, {
    timestamps: true
});

const orders = mysqlees.schema({
    id: {
        primaryKey: true,
        autoIncrement: true,
        dataType: 'int',
        renamedFrom: 'order_id'
    },
    customer_id: {
        dataType: 'int',
        ref: {
            to: 'customers',
            foreignField: 'id'
        },
    },
    text2: {
        primaryKey: true,
        dataType: 'int',
        renamedFrom: 'text'
    },
    new2: {
        dataType: 'varchar(255)',
        unique: false,
        renamedFrom: 'new'
    },
}, {
    timestamps: true
});

orders.index('text', 'text', {
    unique: true,
    deprecated: true
});



const m = mysqlees.model('orders', orders);
const m2 = mysqlees.model('customers', customers);                

const dump = mysqlees.schema({
    id: {
        primaryKey: true,
        autoIncrement: true,
        dataType: 'int(11)'
    }
}, {
    timestamps: true
});
mysqlees.model('dump', dump);                

const mysql = require('mysql');
const mysqlees = require('./build/index');

mysqlees.bind(mysql);

mysqlees.createPool({
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
        dataType: mysqlees.dataType.int()
    },
    name: {
        dataType: mysqlees.dataType.varchar()
    }
}, {
    timestamps: true
});

const mC = mysqlees.model('customers', customers);                

const orders = mysqlees.schema({
    id: {
        dataType: mysqlees.dataType.int(),
        primaryKey: true,
        autoIncrement: true,
        renamedFrom: 'order_id'
    },
    new: {
        primaryKey: true,
        dataType: mysqlees.dataType.int(),
    },
    customer_id: {
        dataType: mysqlees.dataType.int(),
        ref: {
            to: 'customers',
            foreignField: 'id'
        },
    },
}, {
    timestamps: true
});

orders.index('text', 'text', {
    unique: true,
    deprecated: true
});

const mO = mysqlees.model('orders', orders);


mC.find({
    id: {$gt: 2}
}).lean().exec().then(res => console.log(res)).catch(err => console.log(err));

mC.find({
    id: {$gt: 2}
}).exec().then(res => console.log(res)).catch(err => console.log(err));
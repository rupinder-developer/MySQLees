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
        dataType: mysqlees.dataType.int()
    },
    name: {
        dataType: mysqlees.dataType.varchar()
    }
}, {
    timestamps: true
});

const orders = mysqlees.schema({
    id: {
        dataType: mysqlees.dataType.int(),
        primaryKey: true,
        autoIncrement: true,
        renamedFrom: 'order_id'
    },
    customer_id: {
        dataType: mysqlees.dataType.int(),
        ref: {
            to: 'customers',
            foreignField: 'id'
        },
    },
    text2: {
        primaryKey: true,
        dataType: mysqlees.dataType.int(),
        renamedFrom: 'text'
    },
    new2: {
        dataType: mysqlees.dataType.varchar(),
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
        dataType: mysqlees.dataType.int()
    }
}, {
    timestamps: true
});
mysqlees.model('dump', dump);                

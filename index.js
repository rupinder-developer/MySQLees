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
    autoMigration: false
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


const newCustomer =  mC.create({
    name: 'Rupinder Singh'
});

// console.log(newCustomer._$schema());
newCustomer.save().then(result => {
    console.log(JSON.stringify(result));
    result.name = "Rupinder Singh | Mod";

    result.save();

    console.log(JSON.stringify(result));
}
).catch(err => console.log(err));
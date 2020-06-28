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
    data: {
        dataType: mysqlees.dataType.varchar(),
        renamedFrom: 'new'
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


// mC.find({
//     id: {$gt: 2}
// }).lean().exec().then(res => console.log(res)).catch(err => console.log(err));

// mC.find({
//     id: {$gt: 2}
// }).exec().then(res => console.log(res)).catch(err => console.log(err));

console.time('p');
mO.find().populate('customer_id').exec().then(res => {
    console.log(res);
    res[0].data = 'Data | Mode';
    res[0].save().then(res => console.log(res)).catch(err => console.error(err));
    console.timeEnd('p');
}).catch(err =>  console.error(err));
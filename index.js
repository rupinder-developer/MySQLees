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

const a = mysqlees.schema({
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

const mA = mysqlees.model('authors', a); 

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
    customer: {
        dataType: mysqlees.dataType.int(),
        ref: {
            to: 'customers',
            foreignField: 'id'
        }
    },
    author: {
        dataType: mysqlees.dataType.int(),
        ref: {
            to: 'authors',
            foreignField: 'id'
        }
    }
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
mO.find().populate('customer', ['name']).populate('author', ['name']).limit(1).exec().then(res => {
    console.log(res[0]);

    console.timeEnd('p');
    // const used = process.memoryUsage().heapUsed / 1024 / 1024;
    // console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
}).catch(err =>  console.error(err));

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
            name: 'varchar',
            size: 255
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


const products = mysqlees.schema({
    id: {
        autoIncrement: true,
        primaryKey: true,
        datatype: {
            name: 'int'
        }
    },
    brand: {
        datatype: {
            name: 'varchar',
            size: 255
        }
    },
    purchase_invoice_number: {
        datatype: {
            name: 'varchar',
            size: 255
        }
    },
    purchase_invoice_date: {
        datatype: {
            name: 'varchar',
            size: 255
        }
    },
    product_name: {
        datatype: {
            name: 'varchar',
            size: 255
        }
    },
    eancode: {
        datatype: {
            name: 'varchar',
            size: 255
        },
        ref: {
            to: 'inventory',
            foreignField: 'eancode'
        },
    },
    mrp: {
        datatype: {
            name: 'int'
        }
    },
    customer_discount: {
        datatype: {
            name: 'int'
        }
    },
    lp: {
        datatype: {
            name: 'int'
        }
    },
    qty: {
        datatype: {
            name: 'int'
        }
    },
    category: {
        datatype: {
            name: 'varchar',
            size: 255
        }
    },
    qty: {
        datatype: {
            name: 'int'
        }
    },
    cost_price: {
         datatype: {
            name: 'int'
        }
    },
    filename: {
        datatype: {
            name: 'varchar',
            size: 255
        }
    }
}, {timestamps: true});


mysqlees.model('products', products);

const inventory = mysqlees.schema({
    eancode: {
        datatype: {
            name: 'varchar',
            size: 255
        },
        primaryKey: true
    },
    qty: {
        datatype: {
            name: 'int'
        }
    }
}, {timestamps: true});

mysqlees.model('inventory', inventory);
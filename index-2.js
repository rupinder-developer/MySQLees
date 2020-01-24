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
            name: 'decimal',
            size: '10, 2'
        }
    },
    customer_discount: {
        datatype: {
            name: 'decimal',
            size: '10, 2'
        }
    },
    lp: {
        datatype: {
            name: 'decimal',
            size: '10, 2'
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
            name: 'decimal',
            size: '10, 2'
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

const invoice_data = mysqlees.schema({
    id: {
        autoIncrement: true,
        primaryKey: true,
        datatype: {
            name: 'int'
        }
    },
    eancode: {
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
    hsn_code: {
        datatype: {
            name: 'varchar',
            size: 255
        }
    },
    mrp: {
        datatype: {
            name: 'decimal',
            size: '10, 2'
        }
    },
    qty: {
        datatype: {
            name: 'int'
        }
    },
    customer_discount: {
        datatype: {
            name: 'decimal',
            size: '10, 2'
        }
    },
    td: {
        datatype: {
            name: 'decimal',
            size: '10, 2'
        }
    },
    cgst_rate: {
        datatype: {
            name: 'decimal',
            size: '10, 2'
        }
    },
    cgst_amount: {
        datatype: {
            name: 'decimal',
            size: '10, 2'
        }
    },
    sgst_rate: {
        datatype: {
            name: 'decimal',
            size: '10, 2'
        }
    },
    sgst_amount: {
        datatype: {
            name: 'decimal',
            size: '10, 2'
        }
    },
    igst_rate: {
        datatype: {
            name: 'decimal',
            size: '10, 2'
        }
    },
    igst_amount: {
        datatype: {
            name: 'decimal',
            size: '10, 2'
        }
    },
    total_amount: {
        datatype: {
            name: 'decimal',
            size: '10, 2'
        }
    },
    invoice_id: {
        datatype: {
            name: 'int'
        },
        ref: {
            to: 'invoice',
            foreignField: 'id'
        }
    }
}, {timestamps: true});

mysqlees.model('invoice_data', invoice_data);

const invoice = mysqlees.schema({
    id: {
        autoIncrement: true,
        primaryKey: true,
        datatype: {
            name: 'int'
        }
    },
    name: {
        datatype: {
            name: 'varchar',
            size: 255
        }
    },
    address: {
        datatype: {
            name: 'varchar',
            size: 255
        }
    },
    contact: {
        datatype: {
            name: 'varchar',
            size: 255
        }
    },
    contact: {
        datatype: {
            name: 'varchar',
            size: 255
        }
    },
    gstin: {
        datatype: {
            name: 'varchar',
            size: 255
        }
    },
    bill_to: {
        datatype: {
            name: 'varchar',
            size: 255
        }
    },
    address_to: {
        datatype: {
            name: 'varchar',
            size: 255
        }
    },
    contact_to: {
        datatype: {
            name: 'varchar',
            size: 255
        }
    },
    invoice_no: {
        datatype: {
            name: 'varchar',
            size: 255
        }
    },
    invoice_date: {
        datatype: {
            name: 'date'
        }
    },
    is_draft: {
        datatype: {
            name: 'int'
        }
    }
}, {timestamps: true});

mysqlees.model('invoice', invoice);
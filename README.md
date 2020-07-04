# MySQLees

MySQLees is a promise-based Node.js ORM for MySQL. It supports the auto migration of schemas which means, now you don't need to write any type of migrations. Everything will be handled by MySQLees.

## Installation

First install [Node.js](http://nodejs.org/) and [MySQL](https://www.mysql.com/downloads/). Then:

```sh
$ npm install --save mysqlees
```

## Importing

```javascript
// Using Node.js `require()`
const mysqlees = require('mysqlees');
```

## Documentation

## Table of Contents
1. [Establishing connections](#establishing-connections)
    + [Connection options](#connection-options)
2. [Terminating connections](#terminating-connections)
3. [Pooling connections](#pooling-connections)
4. [Performing queries](#performing-queries)
5. [Escaping query values](#escaping-query-values)
6. [Escaping query identifiers](#escaping-query-identifiers)
7. [escape() & escapeId()](#escape--escapeid)
8. [Model & Schema](#model--schema)
    + [Defining your schema](#defining-your-schema)
    + [Schema Data Types & Constraints](#schema-data-types--constraints)
        + [Data Types](#data-types)
        + [Constraints](#constraints)
    + [Indexes](#indexes)
    + [Compiling your model](#compiling-your-first-model)
9. [Migrations](#migrations)
10. [Insert Data](#insert-data)
    + [Model.create()](#modelcreate)
    + [Model.insertMany()](#modelinsertmany)
11. [Select Data](#select-data)
    + [Model.find()](#modelfind)
      + [Filter your query](#filter-your-query)
        + [$or (OR)](#or-or)
        + [$and (AND)](#and-and)
        + [$gt (>)](#gt-)
        + [$gte (>=)](#gte-)
        + [$lt (<)](#lt-)
        + [$lte (<=)](#lte-)
        + [$ne (<> or !=)](#ne--or-)
        + [$like (LIKE)](#like-like)
        + [$nlike (NOT LIKE)](#nlike-not-like)
        + [$in (IN)](#in-in)
        + [$nin (NOT IN)](#nin-not-in)
    + [Model.project()](#modelproject)
    + [Model.limit()](#modellimit)
    + [Model.orderBy()](#modelorderby)
    + [Model.populate()](#modelpopulate)
    + [Model.lean()](#modellean)
12. [Updata Data](#update-data)
    + [Model.save()](#modelsave)
    + [Model.update()](#modelupdate)
13. [Delete Data](#delete-data)
    + [Model.delete()](#modeldelete)
14. [Manage Connection Pool in Model](#manage-connection-pool-in-model)
    + [Model.useConnection()](#manage-connection-pool-in-model)
    + [Model.releaseConnection()](#manage-connection-pool-in-model)
    + [Model.destroyConnection()](#manage-connection-pool-in-model)

## Establishing connections

You need to use `createConnection()` method for establish a connection.

```javascript
mysqlees.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'test'
});
```

## Connection options

When establishing a connection, you can set the following options:

* `host`: The hostname of the database you are connecting to.
* `user`: The MySQL user to authenticate as.
* `password`: The password of that MySQL user.
* `database`: Name of the database to use for this connection.

For more details about the connection configuration, you can visit [here](https://github.com/mysqljs/mysql/blob/master/Readme.md#connection-options).

## Terminating connections

There are two ways to end a connection. Terminating a connection gracefully is done by calling the `end()` method:

```javascript
const connection = mysqlees.connection(); // Will return your the current MySQL connection

connection.end(function(err) {
  // The connection is terminated now
});
```

This will make sure all previously enqueued queries are still before sending a `COM_QUIT` packet to the MySQL server. If a fatal error occurs before the `COM_QUIT` packet can be sent, an `err` argument will be provided to the callback, but the connection will be terminated regardless of that.

An alternative way to end the connection is to call the `destroy()` method. This will cause an immediate termination of the underlying socket. Additionally `destroy()` guarantees that no more events or callbacks will be triggered for the connection.

```js
mysqlees.connection().destroy();
```

Unlike `end()` the `destroy()` method does not take a callback argument.

## Pooling connections

Rather than creating and managing connections one-by-one, this module also provides built-in connection pooling using `mysql.createPool(config)`. [Read more about connection pooling](https://en.wikipedia.org/wiki/Connection_pool).

Create a pool and use it directly:

```js
const mysqlees = require('mysqlees');

mysqlees.createPool({
  connectionLimit : 10,
  host            : 'localhost',
  user            : 'root',
  password        : '',
  database        : 'test'
});

mysqlees.query('SELECT 1 + 1 AS solution')
        .then(result => {
          console.log('The solution is: ', results[0].solution);
        })
        .catch(error => {
            console.log(error);
        });
```

This is a shortcut for the `mysqlees.getConnection()` -> `mysqlees.query()` -> `connection.release()` code flow. Using `mysqlees.getConnection()` is useful to share connection state for subsequent queries. This is because two calls to `mysqlees.query()` may use two different connections and run in parallel. This is the basic structure:

```js
const mysqlees = require('mysqlees');

mysqlees.createPool({
  connectionLimit : 10,
  host            : 'localhost',
  user            : 'root',
  password        : '',
  database        : 'test'
});

mysqlees.getConnection()
        .then(connection => {
            // Use the connection 

            mysqlees.query('SELECT * FROM customers', [], connection)
                    .then(result => {
                         // When done with the connection, release it.
                         connection.release();
                    })
                    .catch(error => {
                      console.log(error);
                    })

        })
        .catch(error => {
          // not connected!
          console.log(error);
        })
```

If you would like to close the connection and remove it from the pool, use `connection.destroy()` instead. The pool will create a new connection the next time one is needed.

Connections are lazily created by the pool. If you configure the pool to allow up to 100 connections, but only ever use 5 simultaneously, only 5 connections will be made. Connections are also cycled round-robin style, with connections being taken from the top of the pool and returning to the bottom.

When a previous connection is retrieved from the pool, a ping packet is sent to the server to check if the connection is still good.

**For more details about connection pooling, you can visit official MySQL Package [Documentation](https://github.com/mysqljs/mysql/blob/master/Readme.md#pool-options).**

You can also use `mysqlees.pool()` method to get your MySQL pool that you had created by using createPool().

```javascript

mysqlees.createPool({
  connectionLimit : 10,
  host            : 'localhost',
  user            : 'root',
  password        : '',
  database        : 'test'
});

const pool = mysqlees.pool(); // Will return your the current MySQL pool
```

## Performing queries

The most basic way to perform a query is to call the `mysqlees.query()` method.

****Note:*** `mysqlees.query()` method automatically detects whether you're using createPool() or createConnection(). Which means if you're using createPool(), then it automatically run your query by using pool connection.*

The simple form of `.query()` is `.query(sqlString)`, Where a SQL string is the first argument
```javascript
mysqlees.query('SELECT * FROM `books` WHERE `author` = "David"')
        .then(result => {
            // results will contain the results of the query
        })
        .catch(error => {
          console.log(error);
        });
```

The second form `.query(sqlString, values)` comes when using placeholder values (see [escaping query values](#escaping-query-values)):

```javascript
mysqlees.query('SELECT * FROM `books` WHERE `author` = ?', ['David'])
        .then(result => {
            // results will contain the results of the query
        })
        .catch(error => {
          console.log(error);
        });
```

The third form `.query(sqlString, values, connection)` comes when you're using connection pooling. Here the third param is your mysql connection, you need to pass third param only if you're using `mysqlees.getConnection()` method.

```javascript
mysqlees.getConnection()
        .then(connection => {
            // Use the connection 

            mysqlees.query('SELECT * FROM `books` WHERE `author` = ?', ['David'], connection)
                    .then(result => {
                         // When done with the connection, release it.
                         connection.release();
                    })
                    .catch(error => {
                      console.log(error);
                    })

        })
        .catch(error => {
          // not connected!
          console.log(error);
        })
```

## Escaping query values

In order to avoid SQL Injection attacks, you should always escape any user provided data before using it inside a SQL query. You can use `?` characters as placeholder for values and `??` character as placeholder for identifiers.

```javascript
let userId = 'some user provided value';

mysqlees.query('SELECT * FROM users WHERE id = ?', [userId])
        .then(result => {
          // Your result
        })
        .catch(error => {
          console.log(error);
        });
```

Multiple placeholders are mapped to values in the same order as passed. For example, in the following query foo equals a, bar equals b, baz equals c, and id will be userId:

```javascript
mysqlees.query('UPDATE users SET foo = ?, bar = ?, baz = ? WHERE id = ?', ['a', 'b', 'c', userId])
        .then(result => {
            // Your result
        })
        .catch(error => {
          console.log(error);
        });
```

Different value types are escaped differently, here is how:

* Numbers are left untouched
* Booleans are converted to `true` / `false`
* Date objects are converted to `'YYYY-mm-dd HH:ii:ss'` strings
* Buffers are converted to hex strings, e.g. `X'0fa5'`
* Strings are safely escaped
* Arrays are turned into list, e.g. `['a', 'b']` turns into `'a', 'b'`
* Nested arrays are turned into grouped lists (for bulk inserts), e.g. `[['a','b'], ['c', 'd']]` turns into `('a', 'b'), ('c', 'd')`
* Objects are turned into `key = 'val'` pairs for each enumerable property on the object. If the property's value is a function, it is skipped; if the property's value is an object, toString() is called on it and the returned value is used.
* `undefined` / `null` are converted to `NULL`
* `NaN` / `Infinity` are left as-is. MySQL does not support these, and trying to insert them as values will trigger MySQL errors until they implement support.

This escaping allows you to do neat things like this:

```js
let post  = {id: 1, title: 'Hello MySQL'};
mysqlees.query('INSERT INTO posts SET ?', post)
        .then(result => {
          // Your Result
        })
        .catch(error => {
          console.log(error)
        });

// INSERT INTO posts SET `id` = 1, `title` = 'Hello MySQL'
```

## Escaping query identifiers

You can use ?? characters as placeholders for identifiers you would like to have escaped like this:

```javascript
let userId = 1;
let columns = ['username', 'email'];
mysqlees.query('SELECT ?? FROM ?? WHERE id = ?', [columns, 'users', userId])
        .then(result => {
          // Your Result
        })
        .catch(error => {
          console.log(error);
        }); 
// SELECT `username`, `email` FROM `users` WHERE id = 1
```

**Please note that this character sequence is experimental and syntax might change**

## escape() & escapeId()

You can use `mysqlees.escape()` method for escaping values and `mysqlees.escapeId()` for identifiers.

**mysqlees.escape()**

```javascript
let userId = 'some user provided value';
let sql    = 'SELECT * FROM users WHERE id = '+ mysqlees.escape(userId)
mysqlees.query(sql)
        .then(result => {
          // Your result
        })
        .catch(error => {
          console.log(error);
        });
```

**mysqlees.escapeId()**
```js
let sorter = 'date';
let sql    = 'SELECT * FROM posts ORDER BY ' + mysqlees.escapeId(sorter);

mysqlees.query(sql)
        .then(result => {
          // ...
        })
        .catch(error => {
          console.log(error);
        });
```

It also supports adding qualified identifiers. It will escape both parts.

```js
let sorter = 'date';
let sql    = 'SELECT * FROM posts ORDER BY ' + mysqlees.escapeId('posts.' + sorter);
// -> SELECT * FROM posts ORDER BY `posts`.`date`
```

If you do not want to treat `.` as qualified identifiers, you can set the second
argument to `true` in order to keep the string as a literal identifier:

```js
let sorter = 'date.2';
let sql    = 'SELECT * FROM posts ORDER BY ' + mysqlees.escapeId(sorter, true);
// -> SELECT * FROM posts ORDER BY `date.2`
```

## Model & Schema

## Defining your schema

Each schema maps to a MySQL and defines the structure of the database within that table. You can create MySQLees Schema by using `mysqlees.schema(tableStructure, options)` method. Here the second parameter (options) is optional.

```javascript
const mysqlees = require('mysqlees');

const customerSchema = mysqlees.schema({
    customer_id: {
      primaryKey: true,
      autoIncrement: true,
      dataType: mysqlees.dataType.int(11)
    },
    full_name: {
      dataType: mysqlees.dataType.varchar(50),
    },
    email: {
      dataType: mysqlees.dataType.varchar(), // VARCHAR(255) 
      unique: true,
      notNull: true
    },
    is_active: {
      dataType: mysqlees.dataType.tinyint(), // TINYINT(4)
      defaultValue: 1
    }
}, {
  timestamps: true
});
```

Here **customer_id**, **full_name**, **email**, and **is_active** are the columns of your MySQL table. And the option `timestamps` will create extra two columns `created_at` and `updated_at` in your MySQL table. 

## Schema Data Types & Constraints

### Data Types

You can use `mysqlees.dataType` variable to assign data type to your column. [Click here](#data-types-reference) for the reference.

```javascript
const schema = mysqlees.schema({
  column_1: {
    dataType: mysqlees.dataType.int(), // Recommended 
  },
  column_2: {
    dataType: 'INT(11)', // This is also valid
  },
  colum_3: {
    dataType: mysqlees.dataType.enum("value1", "value2")
  }
})
```

### Constraints

```javascript
const schema = mysqlees.schema({
  column_1: {
    dataType: mysqlees.dataType.int(),

    primaryKey: true,    // Primary Key Constraint
    autoIncrement: true, // Auto Increment Constraint
  },
  column_2: {
    dataType: mysqlees.dataType.varchar(),

    defaultValue: 'value', // Default Value Constraint
  },
  column_3: {
    dataType: mysqlees.dataType.int(),

    notNull: true,    // Not Null Constraint
    unique: true,    // Unique Constraint
  },
  column_4: {
    dataType: mysqlees.dataType.int(),

    ref: 'tableName', // Target Table/Model Name

  }
})
```

Here `ref` helps to [populate](#) the column.  

## Indexes

Indexes are used to retrieve data from the database more quickly than otherwise. The users cannot see the indexes, they are just used to speed up searches/queries.

You can use `schema.index(indexName, columns, options)` method to create index in your database.

```javascript
const mysqlees = require('mysqlees');

// Your Schema
const schema = mysqless.schema(...);

// Indexing
schema.index('indexName', 'columnName');

/**
 * Indexing on multiple columns
 * 
 * schema.index('indexName', 'column1, column2', ...);
 */
```

To create a unique index (duplicate values are not allowed) on a table, you need to set unique = true in the `options` parameter as given below. 

```javascript
schema.index('indexName', 'columnName', {
  unique: true
})
```

## Compiling your first model

Models are fancy constructors compiled from Schema definitions. Models are responsible for creating and reading data from the underlying MySQL database.

When you call `mysqlees.model(tableName, schema)` on a schema, MySQLees compiles a model for you. Now let's create one model **./models/customer.js**

```javascript
// customer.js 

const mysqlees = require('mysqlees');

const schema = mysqlees.schema(...);

module.exports = mysqlees.model('customers', schema); // Will return the new instance of MySQLees Model
```

**Note: Always create a sperate file for each model and use `module.exports` to export the instance of your model.**

## Migrations

Migrations are typically used to build/modify your application's database schema. For migrations in MySQLees, you need to create one configuration file named `mysqlees.json` in the root directory of your Node.js application.

But before that you need to install [MySQLees CLI](https://github.com/rupinder-developer/mysqlees-cli).

```sh
$ npm install -g mysqlees-cli
```

**mysqlees.json (Configuration File)**

```javascript
// mysqlees.json
{
  "migration": {
    "models": ["./path/model1", "./path/model2"],
    "connection": {
      "host": "localhost",
      "user": "root",
      "password": "",
      "database": "test"
    }
  }
}
```

Here `migration.models` is an array of all the models that you have created. And `migration.connection` is the connection configuration that is use to make a connection with your database for this migration.

To build your schema first time or to modify your schema you need to run migration by using the following command:

```sh
$ mysqlees --migrate
```

You can also create a configuration file of some other name. But for that, you need to mention the name of your configuration file in the command as given below:

```sh
$ mysqlees --migrate --config filename.json
```

MySQLees automatically detects all the changes in your model's schema and change database structure accordingly. But for **deletion** and **rename** of columns, we need to use `deprecated` and `renamedFrom` option respectively.

### Delete Columns

If you want to delete any column from your schema, then you need to use `deprecated: true` option as given below.

**./models/users.js**
```javascript
const mysqlees = require('mysqlees');

const schema = mysqlees.schema({
  id: {
    dataType: mysqlees.dataType.int(),
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    dataType: mysqlees.dataType.varchar()
  },
  email: {
    dataType: mysqlees.dataType.varchar(),
    unique: true
  },
  height: {
    dataType: mysqlees.dataType.varchar(),
    deprecated: true // Delete `height` column from `users` table
  }
});

module.exports = mysqlees.model('users', schema);
```

### Rename Columns

To rename a column, we need to use `renamedFrom` option. In this example, we are renaming the column `name` to `full_name`. 

**./models/users.js**
```javascript
const mysqlees = require('mysqlees');

const schema = mysqlees.schema({
  id: {
    dataType: mysqlees.dataType.int(),
    primaryKey: true,
    autoIncrement: true
  },
  full_name: {
    dataType: mysqlees.dataType.varchar(),
    renamedFrom: 'name' // Rename `name` -> `full_name`
  },
  email: {
    dataType: mysqlees.dataType.varchar(),
    unique: true
  },
  height: {
    dataType: mysqlees.dataType.varchar(),
    deprecated: true // Delete `height` column from `users` table
  }
});

module.exports = mysqlees.model('users', schema);
```

### Delete Indexes

We can delete our indexes in the same way in which we are deleting our columns. We need to use `deprecated: true` option.

```javascript
schame.index('indexName', 'columnName', {
  deprecated: true
});
```

## Insert Data

You can use `Model.create()` and `Model.insertMany()` methods to insert data into your database.  

For better understanding, let's create one Model named `users`. 

**./models/users.js**

```javascript
const mysqlees = require('mysqlees');

const schema = mysqlees.schema({
  user_id: {
    dataType: mysqlees.dataType.int(),
    primaryKey: true,
    autoIncrement: true
  },
  full_name: {
    dataType: mysqlees.dataType.varchar(50),
    notNull: true
  },
  email: {
    dataType: mysqlees.dataType.varchar(), // Default size for varchar is 255
    unique: true,
    notNull: true
  },
  age: {
    dataType: mysqlees.dataType.int()
  }
},{
  timestamps: true
});

module.exports = mysqlees.model('users', schema);
```

### Model.create()

`Model.create()` method is used to insert single row in your MySQL table. 

```javascript
const User = require('./models/users');

const newUser = User.create({
    full_name: 'Rupinder Singh',
    email: 'me@rupindersingh.com',
    age: 21;
});

newUser.save()
       .then(user => {
         console.log(user instanceof mysqlees.Model); // Output: true
         console.log(user); // Output: {user_id: 'Inserted Id', full_name: "Rupider Singh", age: 21}
       })
       .catch(error => {
         console.log(error);
       });

```

### Model.insertMany()

To insert data in bulk, you need to use `Model.insertMany()` method.

```javascript
const colums = ['full_name', 'email', 'age'];
const value  =  [
    ['John', 'john@example.com', 22],
    ['Peter', 'peter@example.com', 23],
    ['Amy', 'amy@example.com', 21]
];
User.insertMany(column, values)
    .then(result => {
      console.log(result instanceof mysqlees.Model); // false
      console.log(result); 
      /*
        Output: {
          fieldCount: 0,
          affectedRows: 3,
          insertId: 0,
          serverStatus: 2,
          warningCount: 0,
          message: '\'Records:3  Duplicated: 0  Warnings: 0',
          protocol41: true,
          changedRows: 0
        }
       */
    })
    .catch(error => {
      console.log(error);
    });
```

## Select Data
For fetching data from the database, you can use `Model.find()` method and all the SQL queries generated by `Model.find()` method is SQL inject free. 

Now, let's create one Model for your reference. 

**./models/users.js**

```javascript
const mysqlees = require('mysqlees');

// Your Schema
const schema = mysqlees.schema(...);

module.exports = mysqlees.model('users', schema);
```

### Model.find()
```javascript
const mysqlees = require('mysqlees');

// User Model
const User = require('./models/users.js');

User.find()
    .exec()
    .then(result => {
      /*
        result is an `array` of MySQLees Model
       */

      console.log(result instanceof mysqlees.Model); // Output: true
    })
    .catch(error => {
      console.log(error);
    });

// Generated SQL: SELECT * FROM `users`
```

Here `Model.exec()` method is used to execute the query and it returns a Promise as shown in the example above.

### Filter your query

You can filter your query result by passing an argument to the `Model.find()` method.

```javascript
let filter = {
  column1: 'value1',
  column2: 'value2'
};

Model.find(filter)
     .exec()
     .then(result => {
      // Your result
     })
     .catch(error => {
       console.log(error);
     })

// Generated SQL: SELECT * FROM tableName WHERE column1='value1' AND column2='value2'
```

### $or (OR)

The `$or` operator performs a logical OR operation on an array of two or more `<expressions>` and selects the documents that satisfy at least one of the `<expressions>`. The $or has the following syntax:

```
{ $or: [ { <expression1> }, { <expression2> }, ... , { <expressionN> } ] }
```

Example:

```javascript
let filter = {
  $or: [ 
    { quantity: { $lt: 20 } }, 
    { price: 10 } 
  ] 
};

Model.find(filter)
     .exec()
     .then(result => {
      // Your result
     })
     .catch(error => {
       console.log(error);
     })

// Generated SQL: SELECT * FROM tableName WHERE quantity<20 OR price=10
```

### $and (AND)

`$and` performs a logical AND operation on an array of one or more expressions (e.g. `<expression1>`, `<expression2>`, etc.) and selects the data that satisfy all the expressions in the array. 

```
Syntax: { $and: [ { <expression1> }, { <expression2> } , ... , { <expressionN> } ] }
```


**AND Queries With Multiple Expressions Specifying the Same Field**

```javascript
let filter = {
  $and: [ 
    { price: { $gte: 100 } }, 
    { price: { $lt: 240 } } 
  ]
};

Model.find(filter)
     .exec()
     .then(result => {
      // Your result
     })
     .catch(error => {
       console.log(error);
     })

// Generated SQL: SELECT * FROM tableName WHERE price>=100 AND price<240
```

This query can be also be constructed with an implicit AND operation by combining the operator expressions for the price field. For example, this query can be written as:

```javascript
let filter = {
  price: { $gte: 100, $lt: 240 }
};

// Generated SQL: SELECT * FROM tableName WHERE price>=100 AND price<240
```

**AND Queries With Multiple Expressions Specifying the Same Operator**

```javascript
let filter = {
    $and: [
        { $or: [ { qty: { $lt : 10 } }, { qty : { $gt: 50 } } ] },
        { $or: [ { sale: 1 }, { price : { $lt : 5 } } ] }
    ]
};

// Generated SQL: SELECT * FROM tableName WHERE ((qty<10 OR qty>50) AND (sale=1 OR price<5))
```

### $gt (>)

`$gt` selects the data where the value of the field is greater than (i.e. >) the specified value.

```
Syntax: {field: {$gt: value} }
```

Example:

```javascript
let filter = {
  qty: {$gt: 10}
}

Model.find(filter)
     .exec()
     .then(result => {
      // Your result
     })
     .catch(error => {
       console.log(error);
     })

// Generated SQL: SELECT * FROM tableName WHERE qty > 10
```

### $gte (>=)

`$gte` selects the data where the value of the field is greater than or equal to (i.e. >=) the specified value.

```
Syntax: {field: {$gte: value} }
```

### $lt (<)

`$lt` selects the data where the value of the field is less than (i.e. <) the specified value.

```
Syntax: {field: {$lt: value} }
```

### $lte (<=)

`$lte` selects the data where the value of the field is less than or equal to (i.e. <=) the specified value.

```
Syntax: {field: {$lte: value} }
```

### $ne (<> or !=)

`$ne` selects the data where the value of the field is not equal to the specified value.

```
Syntax: {field: {$ne: value} }
```

### $like (LIKE)

`$like` is used to search for a specified pattern in a column.

```
Syntax: {field: {$like: value} }
```

Example:

```javascript
let filter = {
  customer_name: {$like: 'a%'}
}

Model.find(filter)
     .exec()
     .then(result => {
      // Your result
     })
     .catch(error => {
       console.log(error);
     })

// Generated SQL: SELECT * FROM tableName WHERE customer_name LIKE 'a%'
```

### $nlike (NOT LIKE)

It is exactly opposite to $like.

```
Syntax: {field: {$nlike: value} }
```

Example:

```javascript
let filter = {
  customer_name: {$nlike: 'a%'}
}

Model.find(filter)
     .exec()
     .then(result => {
      // Your result
     })
     .catch(error => {
       console.log(error);
     })

// Generated SQL: SELECT * FROM tableName WHERE customer_name NOT LIKE 'a%'
```

### $in (IN)

The `$in` operator selects the data where the value of a field equals any value in the specified array.

```
Syntax: { field: { $in: [<value1>, <value2>, ... <valueN> ] } }
```

Example: 

```javascript
let filter = {
  qty: { $in: [5, 15] }
}

Model.find(filter)
     .exec()
     .then(result => {
      // Your result
     })
     .catch(error => {
       console.log(error);
     })

// Generated SQL: SELECT * FROM tableName WHERE qty IN(5, 15)
```

### $nin (NOT IN)

The `$nin` operator selects the data where the field value is not in the specified array

```
Syntax: { field: { $nin: [<value1>, <value2>, ... <valueN> ] } }
```

Example: 

```javascript
let filter = {
  qty: { $nin: [5, 15] }
}

Model.find(filter)
     .exec()
     .then(result => {
      // Your result
     })
     .catch(error => {
       console.log(error);
     })

// Generated SQL: SELECT * FROM tableName WHERE qty NOT IN(5, 15)
```

### Model.project()

Projection means choosing which columns (or expressions) the query shall return. You need to chain `.project(array)` method with `Model.find()`.

```javascript
let projection = ['column1', 'column2'];

Model.find()
     .project(projection)
     .exec()
     .then(result => {
       // Your result
     })
     .catch(error => {
       console.log(error);
     });

// Generated SQL: SELECT column1, column2 FROM tableName
```

### Model.limit()

Lets you limit the number of rows you would like returned by the query:

```javascript 
Model.find().limit(10).exec()

// Generated SQL: SELECT * FROM tableName LIMIT 10
```

The second parameter lets you set a result offset.

```javascript 
Model.find().limit(10, 20).exec()

// Generated SQL: SELECT * FROM tableName LIMIT 20, 10
```

### Model.orderBy()

```javascript 
Model.find().orderBy('id', 'DESC').exec()

// Generated SQL: SELECT * FROM tableName ORDER BY id DESC

Model.find().orderBy('title DESC, name ASC').exec()

// Generated SQL: SELECT * FROM tableName ORDER BY title DESC, name ASC
```

### Model.populate()

Populate will automatically replace the specified path in the record, with record from other table.

Let's look at some examples:

**./models/customers**
```javascript
const mysqlees = require('mysqlees');

const schema = mysqlees.schema({
  customer_id: { primaryKey: true, autoIncrement: true, dataType: mysqlees.dataType.int() },
  name: { dataType: mysqlees.dataType.vachar() },
  mobile_number: { dataType: mysqlees.dataType.vachar() }
});

module.exports = mysqlees.model('customers', schema);
```

**./models/orders**
```javascript
const mysqlees = require('mysqlees');

const schema = mysqlees.schema({
  order_id: { primaryKey: true, autoIncrement: true, dataType: mysqlees.dataType.int() },
  total_price: { dataType: mysqlees.dataType.double() },
  customer: { 
    dataType: mysqlees.dataType.int(),
    ref: 'customers' // Target Table/Model Name
  }
});

module.exports = mysqlees.model('orders', schema);
```

```javascript
const Order = require('./models/orders');

Order.find()
     .limit(1)
     .populate('customer') // Column name
     .exec()
     .then(result => {
        console.log(result);
        /*
          Sample Output:
          [
            {
              order_id: 1,
              total_price: 100,
              customer: {
                customer_id: 10,
                name: 'Rupinder Singh'
                mobile_number: 'Rupinder Singh'
              }
            }
          ]
         */
     })
     .catch(error => {
      console.log(error);
     });
```

Here we populated the customer column of **orders** table.

**Populate with Projection**

You need to pass array as a second argument for selecting the columns of your choise from the target table.

```javascript
Order.find()
     .populate('customer', ['name'])  // Only selecting `name` from target table
     .exec()
```

You can also populate multiple columns of the table by chaining `.populate()` method more than once.

```javascript
// Populate Multiple Columns

Model.find()
     .populate('column1')
     .populate('column2')
     .exec()
```

***Note:** Populate will only work if your target table contains the primary key and the primary key should not be the combination of more than one column.*

### Model.lean()

The lean option tells MySQLees to skip hydrating the result. This makes queries faster and less memory intensive, but the result is an array of RowDataPacket (MySQL Default Result Set), not MySQLees Model. 

```javascript
const normal = await Model.find().exec();
const lean = await Model.find().lean().exec();

console.log(normal instanceof mysqlees.Model); // true

console.log(lean instanceof mysqlees.Model); // false
```

The downside of enabling lean is that lean result set don't have:
  * `save()`


## Update Data

### Model.save()

MySQLees Models track changes. You can modify data by using `Model.save()` method. Let's take an example for that.

```javascript
const result = await Model.find().limit(1).exec();
console.log(result[0] instance of mysqlees.Model); // true

// Updating Data
result[0].name = 'Rupinder Singh';
await result.save(); // `name` updated to 'Rupinder Singh'
```

### Model.update()

You can also use `Model.update(data, filter)` method to update your data. 

```javascript
let data = {
  name: 'Rupinder Singh'
}

let filter = {
  id: 10
}

Model.update(data, filter)
     .then(result => {
       console.log(result);
       /*
       Output:
        {
          fieldCount: 0,
          affectedRows: 1,
          insertId: 0,
          serverStatus: 34,
          warningCount: 0,
          message: '(Rows matched: 1 Changed: 1 Warnings: 0',
          protocol41: true,
          changedRows: 1
        }
       */
     })
     .catch(error => {
       console.log(error);
     })

// Generated SQL: UPDATE tableName SET name='Rupinder Singh' WHERE id=10;
```

***Note**: Please refer to the ["Filter your query"](#filter-your-query) section for the second parameter of Model.update() method.*


## Delete Data

### Model.delete()

You can use `Model.delete(filter)` method to delete data from your database. 

```javascript
let filter = {
  id: 10
}

Model.delete(filter)
     .then(result => {
       console.log(result);
       /*
       Output:
        {
          fieldCount: 0,
          affectedRows: 1,
          insertId: 0,
          serverStatus: 34,
          warningCount: 0,
          message: '',
          protocol41: true,
          changedRows: 0
        }
       */
     })
     .catch(error => {
       console.log(error);
     })

// Generated SQL: DELETE FROM tableName WHERE id=10;
```

***Note**: Please refer to the ["Filter your query"](#filter-your-query) section for the first parameter of Model.delete() method.*

## Manage Connection Pool in Model

### Model.useConnection()

`Model.useConnection()` method is used to set the connection for the instance of the model that you are using. You only need to use this method, if you want to share the connection state for subsequent queries.

```javascript
mysqlees.getConnection()
        .then(connection => {
            // Use the connection 

            Model.useConnection(connection)
                 .find()
                 .limit(1)
                 .exec()
                 .then(result => {
                    // When done with the connection, release it.
                    Model.releaseConnection();
                  })
                  .catch(error => {
                    console.log(error);
                  })               

        })
        .catch(error => {
          // not connected!
          console.log(error);
        })
```

If you would like to close the connection and remove it from the pool, use `Model.destroyConnection()` instead. The pool will create a new connection the next time one is needed. 

## Data Types Reference

| MySQLees Datatypes                 | Description                   | Default Values       |
|------------------------------------|-------------------------------|----------------------|
| mysqlees.dataType.varchar(size)    | VARCHAR(SIZE)                 | SIZE = 255           |
| mysqlees.dataType.char(size)       | CHAR(SIZE)                    | SIZE = 1             |
| mysqlees.dataType.binary(size)     | BINARY(SIZE)                  | SIZE = 1             |
| mysqlees.dataType.varbinary(size)  | VARBINARY(SIZE)               | SIZE = 10            |
| mysqlees.dataType.tinyblob()       | TINYBLOB                      |                      |
| mysqlees.dataType.blob()           | BLOB                          |                      |
| mysqlees.dataType.longblob()       | LONGBLOB                      |                      |
| mysqlees.dataType.tinytext()       | TINYTEXT                      |                      |
| mysqlees.dataType.mediumtext()     | MEDIUMTEXT                    |                      |
| mysqlees.dataType.text()           | TEXT                          |                      |
| mysqlees.dataType.longtext()       | LONGTEXT                      |                      |
| mysqlees.dataType.bit(size)        | BIT(SIZE)                     | SIZE = 1             |
| mysqlees.dataType.tinyint(size)    | TINYINT(SIZE)                 | SIZE = 4             |
| mysqlees.dataType.smallint(size)   | SMALLINT(SIZE)                | SIZE = 6             |
| mysqlees.dataType.mediumint(size)  | MEDIUMINT(SIZE)               | SIZE = 9             |
| mysqlees.dataType.int(size)        | INT(SIZE)                     | SIZE = 11            |
| mysqlees.dataType.bigint(size)     | BIGINT(SIZE)                  | SIZE = 20            |
| mysqlees.dataType.float()          | FLOAT                         |                      |
| mysqlees.dataType.double()         | DOUBLE                        |                      |
| mysqlees.dataType.decimal(size, d) | DECIMAL(SIZE, D)              | SIZE = 10, D = 0     |
| mysqlees.dataType.datetime()       | DATETIME                      |                      |
| mysqlees.dataType.timestamp()      | TIMESTAMP                     |                      |
| mysqlees.dataType.date()           | DATE                          |                      |
| mysqlees.dataType.time()           | TIME                          |                      |
| mysqlees.dataType.year()           | YEAR                          |                      |
| mysqlees.dataType.enum(...args)    | ENUM("value1", "value2",...)  |                      |
| mysqlees.dataType.set(...args)     | SET("value1", "value2",...)   |                      |

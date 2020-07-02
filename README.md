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

## Bind MySQLees

The very first step for using MySQLees is that you need to bind MySQLees with the official [MySQL Package](https://www.npmjs.com/package/mysql).

First, we need to install official [MySQL Package](https://www.npmjs.com/package/mysql).

```sh
$ npm install --save mysql
```

After installing [MySQL](https://www.npmjs.com/package/mysql), we have to bind that with MySQLees.

```javascript
const mysql    = require('mysql');
const mysqlees = require('mysqlees');

mysqlees.bind(mysql); // Bind MySQLees with MySQL
```

After all these steps you are ready to go. So let's take a deep dive into the documentation.

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
    + [Compiling your model](#compiling-your-first-model)

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

```js
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
const mysql    = require('mysql');
const mysqlees = require('mysqlees');

mysqlees.bind(mysql); // Bind MySQLees with MySQL

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
const mysql    = require('mysql');
const mysqlees = require('mysqlees');

mysqlees.bind(mysql); // Bind MySQLees with MySQL

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

### Schema Data Types & Constraints

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
    autoIncrement: true,    // Auto Increment Constraint
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

    ref: {
      to: 'tableName',            // Target Table Name
      foreignField: 'column_name' // Column Name of Target Table
    }

  }
})
```

Here `ref` is used for Foreign Key and helps to [populate](#) the column.  

## Compiling your first model

Models are fancy constructors compiled from Schema definitions. Models are responsible for creating and reading data from the underlying MySQL database.

When you call `mysqlees.model(tableName, schema)` on a schema, MySQLees compiles a model for you.

```javascript
const Customer = mysqlees.model('customers', customerSchema); // Will return the new instance of MySQLees Model
```

## Data Types Reference

| MySQLees Datatypes                 | Description                                       |
|------------------------------------|---------------------------------------------------|
| mysqlees.dataType.varchar(size)    | VARCHAR(SIZE)       [Default Size = 255]          |
| mysqlees.dataType.char(size)       | CHAR(SIZE)          [Default Size = 1]            |
| mysqlees.dataType.binary(size)     | BINARY(SIZE)        [Default Size = 1]            |
| mysqlees.dataType.varbinary(size)  | VARBINARY(SIZE)     [Default Size = 10]           |
| mysqlees.dataType.tinyblob()       | TINYBLOB                                          |
| mysqlees.dataType.blob()           | BLOB                                              |
| mysqlees.dataType.longblob()       | LONGBLOB                                          |
| mysqlees.dataType.tinytext()       | TINYTEXT                                          |
| mysqlees.dataType.mediumtext()     | MEDIUMTEXT                                        |
| mysqlees.dataType.text()           | TEXT                                              |
| mysqlees.dataType.longtext()       | LONGTEXT                                          |
| mysqlees.dataType.bit(size)        | BIT(SIZE)           [Default Size = 1]            |
| mysqlees.dataType.tinyint(size)    | TINYINT(SIZE)       [Default Size = 4]            |
| mysqlees.dataType.smallint(size)   | SMALLINT(SIZE)      [Default Size = 6]            |
| mysqlees.dataType.mediumint(size)  | MEDIUMINT(SIZE)     [Default Size = 9]            |
| mysqlees.dataType.int(size)        | INT(SIZE)           [Default Size = 11]           |
| mysqlees.dataType.bigint(size)     | BIGINT(SIZE)        [Default Size = 20]           |
| mysqlees.dataType.float()          | FLOAT                                             |
| mysqlees.dataType.double()         | DOUBLE                                            |
| mysqlees.dataType.decimal(size, d) | DECIMAL(SIZE, D)    [Default Size = 10, D = 0]    |
| mysqlees.dataType.datetime()       | DATETIME                                          |
| mysqlees.dataType.timestamp()      | TIMESTAMP                                         |
| mysqlees.dataType.date()           | DATE                                              |
| mysqlees.dataType.time()           | TIME                                              |
| mysqlees.dataType.year()           | YEAR                                              |
| mysqlees.dataType.enum(...args)    | ENUM("value1", "value2",...)                      |
| mysqlees.dataType.set(...args)     | SET("value1", "value2",...)                       |

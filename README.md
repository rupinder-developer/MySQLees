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

There are two ways to end a connection. Terminating a connection gracefully is
done by calling the `end()` method:

```js
const connection = mysqlees.connection(); // Will return your the current MySQL connection

connection.end(function(err) {
  // The connection is terminated now
});
```

This will make sure all previously enqueued queries are still before sending a
`COM_QUIT` packet to the MySQL server. If a fatal error occurs before the
`COM_QUIT` packet can be sent, an `err` argument will be provided to the
callback, but the connection will be terminated regardless of that.

An alternative way to end the connection is to call the `destroy()` method.
This will cause an immediate termination of the underlying socket.
Additionally `destroy()` guarantees that no more events or callbacks will be
triggered for the connection.

```js
mysqlees.connection().destroy();
```

Unlike `end()` the `destroy()` method does not take a callback argument.

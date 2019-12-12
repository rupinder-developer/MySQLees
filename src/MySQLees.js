"use strict"

global.connection = null;
global.config = null;

import Schema from './Schema';
import Model from './Model';

class MySQLees {
    connect(mysql, config) {
        global.config = config;
        global.connection = mysql.createConnection({...config, multipleStatements: true});
        return new Promise(function(resolve, reject) {
            global.connection.connect(function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        });
    }

    model(model_name, schema) {
        return new Model(model_name, schema);
    }

    schema(schema, options = {}) {
        return new Schema(schema, options);
    } 
}

module.exports = new MySQLees;
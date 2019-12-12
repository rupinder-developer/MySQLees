"use strict"

import Schema from './Schema';
import Model from './Model';

class MySQLees {
    model(model_name, schema) {
        return new Model(model_name, schema);
    }
    
    schema(schema, options = {}) {
        return new Schema(schema, options);
    } 
}

module.exports = new MySQLees;
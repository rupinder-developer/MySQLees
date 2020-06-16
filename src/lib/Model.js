"use strict"

// Classes
import QueryBuilder from './QueryBuilder';
import Store        from './Store';

module.exports =  class Model extends QueryBuilder {
    constructor(options) {
        super(options);
    } 
}
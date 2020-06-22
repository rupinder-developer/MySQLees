"use strict"

import Store from './Store';

module.exports = class QueryBuilder {
    /**
     * 
     * Example 
     * obj ={
     *  $and : [
     *      { $or : [ { price : 0.99}, { price : 1.99 } ] },
     *      { $or : [ { sale : true }, { qty :  20 } ] }
     *    ]
     * }
     * 
     * Result = ( (price=0.99 OR price=1.99) AND (sale=true OR qty=20) )
     */
    where(obj) {
        let final = [];
        for (let i in obj) {
            if (i === '$and') {
                if (Array.isArray(obj[i])) {
                    let and = [];
                    for (let k in obj[i]) {
                        and.push(`${where(obj[i][k])}`);
                    }

                    final.push(`(${and.join(' AND ')})`);
                }
            } else if (i === '$or') {
                if (Array.isArray(obj[i])) {
                    let or = [];
                    for (let j in obj[i]) {
                        or.push(`${where(obj[i][j])}`);
                    }

                    final.push(`(${or.join(' OR ')})`);
                }
            } else {
                if (typeof obj[i] === 'object') {
                    for (let l in obj[i]) {
                        if (l === '$lt') {
                            final.push(`${Store.mysql.escapeId(i)}<${Store.mysql.escape(obj[i][l])}`);
                        } else if (l === '$lte') {
                            final.push(`${Store.mysql.escapeId(i)}<=${Store.mysql.escape(obj[i][l])}`);
                        } else if (l === '$gt') {
                            final.push(`${Store.mysql.escapeId(i)}>${Store.mysql.escape(obj[i][l])}`);
                        } else if (l === '$gte') {
                            final.push(`${Store.mysql.escapeId(i)}>=${Store.mysql.escape(obj[i][l])}`);
                        } else if (l === '$ne') {
                            final.push(`${Store.mysql.escapeId(i)}<>${Store.mysql.escape(obj[i][l])}`);
                        } else if (l === '$like') {
                            final.push(`${Store.mysql.escapeId(i)} LIKE ${Store.mysql.escape(obj[i][l])}`);
                        } else if (l === '$nlike') {
                            final.push(`${Store.mysql.escapeId(i)} NOT LIKE ${Store.mysql.escape(obj[i][l])}`);
                        } else if (l === '$in' || l === '$nin') {
                            let temp = [];
                            let operator = (l === '$in' ? 'IN' : 'NOT IN');
                            if (Array.isArray(obj[i][l])) {
                                for (let value of obj[i][l]) {
                                    temp.push(Store.mysql.escape(value));
                                }
                            }
                            final.push(`(${Store.mysql.escapeId(i)} ${operator}(${temp.join()}))`);
                        }
                    }
                } else {
                    final.push(`${Store.mysql.escapeId(i)}=${obj[i]}`);
                }
            }
        }
        
        if (final.length === 0) {
            return '';
        }
        if (final.length > 1) {
            return `WHERE (${final.join(' AND ')})`
        }      
        return `WHERE ${final.join(' AND ')}`;
    }

    limit(limit, offset) {
        return ` LIMIT ${offset ? `${offset}, ` : ''} ${limit}`;
    }

    orderBy(cols, sortBy = '') {
        return ` ORDER BY ${cols} ${sortBy}`
    }
}
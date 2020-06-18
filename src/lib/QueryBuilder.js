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
            final.push(`${i}=${obj[i]}`);
          }
        }
      
        if (final.length > 1) {
          return `(${final.join(' AND ')})`
        } 
      
        return `${final.join(' AND ')}`
      }
}
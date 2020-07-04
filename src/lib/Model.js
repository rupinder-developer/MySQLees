"use strict"

// Classes
import QueryHelper from './QueryHelper';
import Store        from './Store';

module.exports =  class Model extends QueryHelper {
    /**
     * Model Constructor
     * 
     * @param {Object} obj 
     */
    constructor(schema) {
        super();

        /**
         * Private Variables
         * 
         * 1. _$modelName {String}
         * 
         * 2. _$connection {Object} - MySQL Connection 
         * 
         * 3. _$where {String} - Projection for SELECT Query
         * 
         * 4. _$project {String} - Projection for SELECT Query
         * 
         * 5. _$limit {String}
         * 
         * 6. _$orderBy {String}
         * 
         * 7. _$populate {Array} -> [
         *          {
         *              col: 'column_name',
         *              project: [] 
         *          },
         *          ...
         *    ]
         * 
         * 8. _$lean {Boolean} - Decide whether return instace of Model or simple JSON Object
         *
         * 9. _$orginalColData {String} - Store orginal column data before populating, which in will further helps to run .save() on parent model
         *
         * 10. _$schema {Schema} - Instance of Schema (Only used in migration)
         */

            
        this._$modelName  = () => null;
        this._$connection = () => Store.connection;

        this._$orginalColData = () => '';
        
        // Query Chunks
        this._$where    = () => '';
        this._$project  = () => '*';
        this._$limit    = () => '';
        this._$orderBy  = () => '';
        this._$populate = () => [];
        this._$lean     = () => false;


        this._$schema = () => schema; // Only used in migration
    }

    /**
     * Map data to Model
     * 
     * @param {Object} obj 
     */
    mapObject(obj) {
        // Map obj to Model
        const schema = Store.models.get(this._$modelName()).schema;
        for (let column in schema) {
            if (obj.hasOwnProperty(column)) {
                this[column] = obj[column];
            }
        }
        
        // Map Timestamps to Model
        if (obj.hasOwnProperty('created_at')) {
            this['created_at'] = obj['created_at'];
        }
        if (obj.hasOwnProperty('updated_at')) {
            this['updated_at'] = obj['updated_at'];
        }
    }

    /**
     * Map one Model to another
     * 
     * @param {Model} model - Instance of Model 
     */
    mapModel(model) {
        model._$connection  = this._$connection;
    }

    /**
     * Create new instace of Model
     * 
     * @param {Object} obj
     * 
     * @return {Model} - New Instance of Model
     */
    create(obj, modelName = null) {
        const model = new Model();

        // Set Model Name
        model.modelName = modelName ? modelName : this._$modelName();

        // Map all private data to new instace of Model
        this.mapModel(model);

        // Map data to new instace of Model
        model.mapObject(obj);

        return model;
    }

    /**
     * Upsert data to database
     * 
     * @return {Promise} - Model Instance
     */
    save() {
        return new Promise((resolve, reject) => {
            const modelName = this._$modelName();
            for (let i in this) {
                if ((typeof this[i]) === 'function') {
                    continue;
                }

                if (this[i] instanceof Model) {
                    this[i] = this[i]._$orginalColData();
                }
            }
            this._$connection().query(`INSERT INTO ${modelName} SET ? ON DUPLICATE KEY UPDATE ?`, [this, this], (error, result)  => {
                if (error) {
                    delete error.sql;
                    reject(error);
                }

                if (result && result.insertId) {
                    this[Store.models.get(modelName).aiField] = result.insertId;
                }

                resolve(this);
            });
        });   
    }

    /**
     * 
     * @param {Object} data 
     * @param {Object} where 
     * 
     * @return {Promise}
     */
    update(data, where = {}) {
        return new Promise((resolve, reject) => {
            this._$connection().query(`UPDATE ${this._$modelName()} SET ? ${this.isObjectEmpty(where)?'':'WHERE'} ${this.where(where)}`, [data], function(error, result) {
                if (error) reject(error);

                resolve(result);
            });
        });
    }

    /**
     * 
     * @param {Object} where 
     * 
     * @return {Promise}
     */
    delete(where = {}) {
        return new Promise((resolve, reject) => {
            this._$connection().query(`DELETE FROM ${this._$modelName()} ${this.isObjectEmpty(where)?'':'WHERE'} ${this.where(where)}`, function(error, result) {
                if (error) reject(error);

                resolve(result);
            });
        });
    }

    /**
     * Insert in Bulk
     * 
     * @param {Array} cols 
     * @param {Array} values 
     * 
     * @return {Promise}
     */
    insertMany(cols, values) {
        return new Promise((resolve, reject) => {
            this._$connection().query(`INSERT INTO ${this._$modelName()}(${cols.join()}) VALUES ?`, [values], function(error, result) {
                if (error) reject(error);

                resolve(result);
            });
        });
    }

    /**
     * Execute SELECT Query
     * 
     * @returns {Promise}
     */
    exec() {
        const lean      = this._$lean();
        const populate  = this._$populate();
        const modelName = this._$modelName();
        const promise   = new Promise((resolve, reject) => {
            this._$connection().query(`SELECT ${this._$project()} FROM ${modelName} ${this._$where()} ${this._$orderBy()} ${this._$limit()}`, async (error, result) => {
                if (error) reject(error);

                if(result && result.length > 0) {
                    if (populate.length > 0) {
                        const schema = Store.models.get(modelName).schema; // Schema of this Model
  
                        for (let i in populate) {
                            // Get colum details from schema
                            if (schema.hasOwnProperty(populate[i].col))  {

                                /**
                                 * poplatedData {Object} -> {
                                 *      col_value: {...},
                                 *      ...
                                 * }
                                 */
                                const populatedData = {};

                                let shouldProceed = true; // Flag for population
                                
                                let column = schema[populate[i].col]; // Schema Column
                                let project = populate[i].project; // Projection for populaion
                                
                                // Getting Primary Keys of `ref` Model
                                let primaryKeys;
                                let refModel;
                                if (Store.models.has(column.ref)) {
                                    refModel = Store.models.get(column.ref)
                                    primaryKeys = refModel.primaryKeys.array;
                                    if (primaryKeys.length > 1) {
                                        shouldProceed = false;
                                    } else {
                                        if (project.length > 0) {
                                            project.push(primaryKeys[0]);
                                        }
                                    }
                                } else {
                                    shouldProceed = false;
                                }

                                // Pull out distinct values for column (populate[i].col) from result
                                let distinct;
                                if (shouldProceed) {
                                    distinct = new Set();
                                    for(let k in result) {
                                        if (result[k].hasOwnProperty(populate[i].col)) {
                                            distinct.add(result[k][populate[i].col]);
                                        } else {
                                            shouldProceed = false;
                                            break;
                                        }
                                    }
                                }
       

                                if(shouldProceed) {
                                    try {
                                        let populateResult = await this.populateQuery(column.ref, this.populateProject(project), primaryKeys[0], [...distinct]);
                                        for (let j in populateResult) {
                                            if (lean) {
                                                populatedData[populateResult[j][primaryKeys[0]]] = populateResult[j];
                                            } else {
                                                const model = this.create(populateResult[j], column.ref);
                                                
                                                // Saving orignal column data
                                                model._$orginalColData = () => populateResult[j][primaryKeys[0]];

                                                populatedData[populateResult[j][primaryKeys[0]]] = model;
                                            }
                                        }

                                        for (let l in result) {
                                            if (populatedData.hasOwnProperty(result[l][populate[i].col])) {
                                                result[l][populate[i].col] = populatedData[result[l][populate[i].col]];
                                            }
                                        }
                                    } catch(err) {
                                        // console.error(`Error: Failed to populate ${populate[i].col}`, err);
                                    }
                                }

                            }
                        }

                    }

                    if (lean) {
                        resolve(result);
                    } else {
                        const final = result.map((row) => {
                            return this.create(row, modelName);
                        });
                        resolve(final);  
                    }

                } else {
                    resolve(result);
                }
            });
        });
        this.clearChunks(); // Clear Query Chunks
        return promise;
    }

    /**
     * Generate WEHRE Clause Statement
     * 
     * @param {Object} obj  
     * 
     * @return {Model}
     */
    find(where = {}) {
        if (!this.isObjectEmpty(where)) {
            this._$where = () => `WHERE ${this.where(where)}`;
        }
        return this;
    }

    /** 
     * Set projection for SELECT query
     * 
     * @param {Array} arr
     * @param {String} modelName
     * 
     * @return {Model}
     */
    project(arr = []) {
        if (arr.length > 0) {
            const primaryKeys = Store.models.get(this._$modelName()).primaryKeys;
            const projection = new Set([...arr, ...(primaryKeys.array)]);
            this._$project = () => [...projection].join();
        }
        
        return this;
    }

    /**
     * Generate LIMIT Clause Statement
     * 
     * @param {Number} limit 
     * @param {Number} [offset] 
     * 
     * @return {Model}
     */
    limit(limit, offset = null) {
        this._$limit = () => `LIMIT ${offset ? `${offset}, ` : ''} ${limit}`;
        return this;
    }

    /**
     * Generate ORDER BY Clause Statement
     * 
     * @param {String} cols 
     * @param {String} [sortBy] 
     * 
     * @return {Model}
     */
    orderBy(cols, sortBy = '') {
        this._$orderBy = () => `ORDER BY ${cols} ${sortBy}`;
        return this;
    }

     /**
     * Decide whether return instace of Model or simple JSON Object
     * 
     * @return {Model}
     */
    lean() {
        this._$lean = () => true;
        return this;
    }

    /**
     * Populate Columns
     * 
     * @param {String} col 
     * @param {String} project 
     * 
     * @return {Model}
     */
    populate(col, project = []) {
        let populate = this._$populate();
        populate.push({col, project});
        
        this._$populate = () => populate;
        return this;
    }

    /**
     * Generate projection for populate query
     * 
     * @param {Array} arr 
     * @param {String} modelName 
     */
    populateProject(arr = []) {
        if (arr.length > 0) {
            const projection = new Set([...arr]);
            return [...projection].join();
        }
        return '*';
    }

    /**
     * Generate query for populating data
     * 
     * @param {String} tableName 
     * @param {String} project 
     * @param {String} col 
     * @param {Array} arr 
     * 
     * @return {Promise}
     */
    populateQuery(tableName, project, col, arr) {
        return new Promise((resolve, reject) => {
            this._$connection().query(`SELECT ${project} FROM ${tableName} WHERE ${Store.mysql.escapeId(col)} IN (?)`, [arr], (error, result) => {
                if (error) reject(error);

                resolve(result);
            });
        });
    }

    /**
     * Clear Query Chunks
     */
    clearChunks() {
        this._$where    = () => '';
        this._$project  = () => '*';
        this._$limit    = () => '';
        this._$orderBy  = () => '';
        this._$populate = () => [];
        this._$lean     = () => false;
    }

    /**
     * Set new connection to Model
     * 
     * @param {Object} connection - MySQL Connection
     * 
     * @return {Model} 
     */
    useConnection(connection) {
        this._$connection = () => connection;
        return this;
    }

    /**
     * Release Pool Connection
     */
    releaseConnection() {
        this._$connection().release();
        this._$connection = () => Store.connection;
    }

    /**
     * Destroy Pool Connection
     */
    destroyConnection() {
        this._$connection().destroy();
        this._$connection = () => Store.connection;
    }
    
    /**
     * Set & Parse Schema (Generate Final Schema for Model)
     */
    set schema(schema) {
        let finalSchema = {};
        let aiField     = ''; // AUTO_INCREMENT Field
        let primaryKeys = {
            string: '',
            array: [],
            object: {} 
        };

        for(let column in schema) {
            // Skip if column is deprecated
            if (schema[column].deprecated) {
                continue;
            }

            // Save Primary Keys
            if (schema[column].primaryKey) {
                primaryKeys.array.push(column);
                primaryKeys.object[column] = 1;
            }

            // Save AUTO_INCREMENT Field
            if (schema[column].autoIncrement) {
                aiField = column;
            }

            // Save column if not deprecated
            finalSchema[column] = schema[column];
        }

        primaryKeys.string = primaryKeys.array.join();

        // Saving Data into Store
        Store.models.set(this._$modelName(), {primaryKeys, aiField, schema: finalSchema});
    }

    /**
     * Set Model Name
     */
    set modelName(modelName) {
        this._$modelName = () => modelName;
    }

    /**
     * Get Model Name
     */
    get modelName() {
        return this._$modelName();
    }
}
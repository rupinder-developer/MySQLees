#! /usr/bin/env node
'use strict';

const ArgumentParser = require('argparse').ArgumentParser;
const mysqlees       = require('./build/index');
const execSync       = require('child_process').execSync;
const path           = require('path');
const fs             = require('fs');


const parser = new ArgumentParser({
    version: '1.0.0',
    addHelp: true,
    description: 'MySQLees CLI'
});

parser.addArgument(
    ['-m', '--migrate'],
    {
        action: 'storeTrue',
        help: 'Migrate Schemas'
    }
);

parser.addArgument(
    ['-c', '--config'],
    {
        help: 'Configuration File'
    }
);

const args = parser.parseArgs();

let mysql, sleep = false;
try {
    mysql = require('mysql');
} catch(err) {
    sleep = true;
    console.log('Installing MySQL Package (https://www.npmjs.com/package/mysql)...');
    execSync('npm install --save mysql');
    console.log('MySQL Package Installed Successfully!!');
}

const cli = () => {
    if (args.migrate) {
        
        const cwd        = process.cwd();
        const config     = args.config ? args.config : 'mysqlees.json'; 
        const configPath = path.join(cwd, config);
        
        if (fs.existsSync(configPath)) {
            let json;
            try {
                json = JSON.parse(fs.readFileSync(configPath));
            } catch(err) {
                console.log(`Error: Faild to parse configuration file (${config})`);
                process.exit();
            }
    
            mysql = require('mysql');
            mysqlees.bind(mysql);
            
            if (!json.migration.connection && json.migration.connection.host === undefined && 
                json.migration.connection.user === undefined && json.migration.connection.password === undefined &&
                json.migration.connection.database === undefined) {
                    console.log(`Error: Invalid connection configuration for migration. Please visit official documentation (https://github.com/rupinder-developer/MySQLees) for reference.`);
                    process.exit();
            }
    
            for(let value of json.migration.models) {
                if (fs.existsSync(path.join(value+'.js'))) {
                    const model = require(path.join(cwd, value));
                    model._$schema().implementSchema(model.modelName, json.migration.connection);
                    // model._$schema() -> This is Instance of Schema
                } else {
                    console.log(`Error: Model not found!! (Invalid Path: ${value})`);
                }
            }
        } else {
            console.log(`Error: ${config} not found!! (Invalid Path: ${path.join(cwd, config)})`);
            process.exit();
        }
    }
}

if (sleep) {
    setTimeout(cli, 2000);
} else {
    cli();
}



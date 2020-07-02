#!/usr/bin/env node
'use strict';

const ArgumentParser = require('argparse').ArgumentParser;
const mysqlees       = require('./build/index');
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
const args = parser.parseArgs();

if (args.migrate) {
    const cwd = process.cwd();
    if (fs.existsSync(path.join(cwd, 'mysqlees.json'))) {
        mysqlees.migrate(args.migrate);
        const json = JSON.parse(fs.readFileSync('mysqlees.json'));
        for(let value of json.models) {
            if (fs.existsSync(value)) {
                require(value);
            } else {
                console.log(`Error: Model not found!! (${value})`);
            }
        }
    } else {
        console.log(`Error: mysqlees.json not found!! (${path.join(cwd, 'mysqlees.json')})`);
    }
}


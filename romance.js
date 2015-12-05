'use strict';

var mysql = require('mysql');
var squel = require('squel');

let instance = null;

class Romance
{
	constructor(options)
	{
		if (!instance)
			instance = this;

		this.config = options;
		this.pool = mysql.createPool(this.config);
		this.connection = null;

		return instance;
	}

	connect(callback)
	{
		if (this.connection)
		{
			setImmediate(callback, null);
		}
		else
		{
			var self = this;
			this.pool.getConnection(function(err, connection) {
				self.connection = connection;

				setImmediate(callback.bind(self), err);
			});
		}
	}

	end()
	{
		console.log('this.pool.end()');
		this.pool.end();
	}

	repository(table)
	{
		if (!this.connection)
			return false;

		return new Repository(table, this.connection);
	}
}

class Repository
{
	constructor(table, connection)
	{
		this.table = table;
		this.connection = connection;
	}

	find(type, options)
	{
		// console.log(this.table + ' :: ' + type);
		this.connection.query('SELECT id, name FROM ' + this.table + ' LIMIT 10', function(err, rows) {

			console.log(rows);
			// And done with the connection. 
			// self.connection.release();
		});
	}

	count(conditions)
	{
		console.log(this.table + ' :: count()');
		//console.log(conditions);
	}
}

module.exports = Romance;

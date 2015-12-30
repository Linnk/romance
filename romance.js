'use strict';

var mysql = require('mysql');
var squel = require('squel');
var inflection = require('inflection');

var romance = null;

class Romance
{
	constructor(options)
	{
		if (!options.connectionLimit)
			options.connectionLimit = 1;

		this.config = options;
		this.squel = squel;
		this.mysql = mysql;
		this.pool = null;

		this.repositories = {};
		this.queries = 0;
	}

	query(sql, callback)
	{
		if (this.queries === 0)
		{
			console.log('OPEN CONNECTION');
			this.pool = mysql.createPool(this.config);
		}

		this.queries++;

		this.pool.query(sql, (function(err, rows, fields){
			setImmediate(callback, err, rows, fields);
			setTimeout((function(){
				if (--this.queries === 0)
				{
					console.log('CLOSING CONNECTION');
					this.close();
				}
			}).bind(this), 10);
		}).bind(this));
	}

	close(callback)
	{
		this.pool.end();
	}

	repository(table, alias)
	{
		if (!this.repositories[table])
			this.repositories[table] = new Repository(table, alias);

		return this.repositories[table];
	}
}

class Repository
{
	constructor(table, alias)
	{
		this.table = table;
		this.alias = alias ? alias : inflection.classify(inflection.singularize(table));
		this.options = {};

		var passing = ['field', 'where', 'group', 'order', 'limit'];

		for (var i = 0; i < passing.length; i++)
		{
			this[passing[i]] = (function(method){
				return function() {
					this._initSelectIfNeeded();
					this.__sql[method].apply(this, arguments);

					return this;
				}
			})(passing[i]);
		}

		this.__sql = null;
	}

	_initSelectIfNeeded()
	{
		if (this.__sql === null)
		{
			this.__sql = squel.select({autoQuoteFieldNames: true}).from(this.table, this.alias);
		}
	}

	first(callback)
	{
		this._initSelectIfNeeded();

		this.__sql.limit(1);

		this.all(function(err, rows, fields){
			callback(err, rows && rows.length > 0 ? rows[0] : null, fields);
		});
	}

	all(callback)
	{
		this._initSelectIfNeeded();

		var sql = this.__sql.toString();

		romance.query(sql, callback);

		this.__sql = null;
	}

	find(type, options)
	{
		this._initSelectIfNeeded();

		if (!options)
		{
			options = {}
		}

		if (typeof options.fields === 'string')
		{
			options.fields = options.fields.split(',');
		}
		if (options.fields instanceof Array)
		{
			for (var i = 0; i < options.fields.length; i++)
			{
				this.__sql.field(options.fields[i]);
			}
		}

		if (typeof options.conditions === 'string')
		{
			this.__sql.where(options.conditions);
		}
		else if (options.conditions instanceof Array)
		{
			for (var i = 0; i < options.conditions.length; i++)
			{
				if (typeof options.conditions[i] === 'string')
				{
					this.__sql.where(options.conditions[i]);
				}
				else if (options.conditions[i] instanceof Array)
				{
					this.__sql.where.apply(this, options.conditions[i]);
				}
			}
		}

		if (typeof options.order === 'string')
		{
			options.order = options.order.split(',');
		}
		if (options.order instanceof Array)
		{
			for (var i = 0; i < options.order.length; i++)
			{
				var order_field = options.order[i].split(' ');
				var order = !order_field[1] || (order_field[1] && order_field[1] === 'ASC');

				this.__sql.order(order_field[0], order);
			}
		}

		if (typeof options.group === 'string')
		{
			options.group = options.group.split(',');
		}
		if (options.group instanceof Array)
		{
			for (var i = 0; i < options.group.length; i++)
			{
				this.__sql.group(options.group[i]);
			}
		}

		if (type === 'first')
		{
			this.__sql.limit(1);
		}
		else if (typeof options.limit === 'number')
		{
			this.__sql.limit(options.limit);
		}

		var sql = this.__sql.toString();

		this.__sql = null;

		return new Promise(function(resolve, reject) {
			romance.query(sql, function(err, rows, fields){
				if (err)
				{
					reject(err);
				}
				else
				{
					if (type === 'first')
					{
						rows = rows && rows.length > 0 ? rows[0] : null;
					}
					resolve(rows);
				}
			});
		});
	}

	save(entity)
	{
		var sql = squel.update().table(this.table, this.alias);
		var keys = Object.keys(entity);

		for (var i = 0; i < keys.length; i++)
		{
			if (keys[i] === 'id')
				continue;

			sql.set(keys[i], entity[keys[i]])
		}

		sql.where('id = ?', entity.id || null);

		console.log(sql.toString());

		return new Promise(function(resolve, reject) {
			romance.query(sql.toString(), function(err, result){
				if (err)
				{
					reject(err);
				}
				else
				{
					resolve(entity);
				}
			});
		});
	}

	count(conditions)
	{
		console.log(this.table + ' :: count()');
		//console.log(conditions);
	}
}

module.exports = function(config)
{
	if (!romance)
	{
		romance = new Romance(config);
	}

	return romance;
}

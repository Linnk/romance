'use strict';

var mysql = require('mysql');
var squel = require('squel');
var inflection = require('inflection');

var databases = {};

module.exports = function(config)
{
	var key = config.socketPath ? config.socketPath : (config.host || 'localhost') + ':' + (config.host || 3306);
	key += '/' + config.user + '@' + config.database;

	if (!databases[key])
	{
		databases[key] = new Romance(config);
	}

	return databases[key];
}

class Romance
{
	constructor(options)
	{
		if (!options.connectionLimit)
			options.connectionLimit = 1;

		this.mysql = mysql;
		this.squel = squel;

		this.config = options;
		this.pool = null;

		this.repositories = {};
		this.working = 0;
	}

	_increase_work()
	{
		if (this.working++ === 0)
		{
			console.log('OPEN CONNECTION');
			this.pool = this.mysql.createPool(this.config);
		}
	}

	_decrease_work()
	{
		if (--this.working === 0)
		{
			console.log('CLOSING CONNECTION');
			this.close();
		}
	}

	query(sql, callback)
	{
		this._increase_work();

		if (typeof callback === 'function')
		{
			this.pool.query(sql, (err, rows, fields) => {
				setImmediate(callback, err, rows, fields);
				setTimeout(this._decrease_work.bind(this), 10);
			});

			return this;
		}

		return new Promise((resolve, reject) => {
			this.pool.query(sql, (err, result) => {
				if (err)
				{
					reject(err);
				}
				else
				{
					resolve(result);
				}
				setTimeout(this._decrease_work.bind(this), 10);
			});
		});
	}

	begin(callback)
	{
		this._increase_work();

		return this.query('START TRANSACTION;', callback);
	}

	commit(callback)
	{
		setTimeout(this._decrease_work, 10);

		return this.query('COMMIT;', callback);
	}

	rollback(callback)
	{
		setTimeout(this._decrease_work, 10);

		return this.query('ROLLBACK;', callback);
	}

	close(callback)
	{
		this.pool.end();
	}

	repository(table, alias)
	{
		if (!this.repositories[table])
			this.repositories[table] = new Repository(table, alias, this);

		return this.repositories[table];
	}
}

class Repository
{
	constructor(table, alias, db)
	{
		this.table = table;
		this.alias = alias ? alias : inflection.classify(inflection.singularize(table));
		this.db = db;

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

		this.db.query(sql, callback);

		this.__sql = null;
	}

	count(callback)
	{
		this._initSelectIfNeeded();

		this.__sql.field('COUNT(*)', 'total');

		this.all(function(err, rows, fields){
			callback(err, result && rows.length > 0 && rows[0].total ? parseInt(rows[0].total) : 0);
		});
	}

	find(type, options)
	{
		this._initSelectIfNeeded();

		if (!options)
		{
			options = {}
		}

		if (type === 'count')
		{
			this.__sql.field('COUNT(*)', 'total');
		}
		else
		{
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

		return new Promise((resolve, reject) => {
			this.db.query(sql).then(result => {
				if (type === 'first')
				{
					resolve(result && result.length > 0 ? result[0] : null)
				}
				else if (type === 'count')
				{
					resolve(result && result.length > 0 && result[0].total ? parseInt(result[0].total) : 0);
				}
				else
				{
					resolve(result);
				}
			}).catch(reject);
		});
	}

	save(entity, callback)
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
		sql = sql.toString();

		console.log(sql);

		return this.db.query(sql, callback);
	}

	query(sql, callback)
	{
		return this.db.query(sql, callback);
	}

	begin(callback)
	{
		return this.db.begin(callback);
	}

	commit(callback)
	{
		return this.db.commit(callback);
	}

	rollback(callback)
	{
		return this.db.rollback(callback);
	}
}

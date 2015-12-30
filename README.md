# Romance - ORM / DataMapper abstraction

A prototype draft for my future ORM / DataMapper abstraction.

Disclosure: This is yet experimental. DO NOT USE IT JUST YET.

## Features

* Magic methods for the standard SQL queries: SELECT, UPDATE, INSERT and DELETE.
* Access to the inner libraries: mysql (_.pool & _.connection) & squel.
* Can be extended to build any query or command of your choosing.
* Uses method chaining for ease of use.

## Installation

## Examples

So, this is all experimental and the main idea (hoping to finishing it the next week):

	var romance = require('./romance.js');

	var db = romance({
		host:       'localhost',
		user:       'root',
		password:   'root',
		database:   'incremen_crm',
		port:       3306
	});

	var Users = db.repository('users');

	Users.field('id').where('id = ?', 1337).first(function(err, user, fields){

		console.log('First:', user);

	});

	Users.where('username LIKE ?', '%incrementacrm.com%').all(function(err, users, fields){

		for (var n = 0; n < users.length; n++)
		{
			console.log('All: ' + users[n].name + ' :: ' + users[n].username);
		}

	});

	Users.find('first', {
		fields: ['id', 'username', 'name'],
		conditions: [
			['username LIKE ?', '%incrementacrm.com%'],
		],
		joins: [
			{
				type: 'LEFT',
				table: 'company AS Company',
				conditions: 'Company.id = User.id',
			},
		],
		order: ['User.name ASC', 'User.username DESC', 'User.id'],
		limit: 5,
	}).then(function(user){
		user.name = 'Blanca Sánchez';

		return Users.save(user);
	}).then(function(user){

		return Users.field('id').field('username').field('name').where('id = ?', user.id).find('first');
	}).then(function(user){

		console.log(user);
	});


## License

MIT - see LICENSE.md

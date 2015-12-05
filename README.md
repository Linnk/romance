# Romance - ORM / ActiveRecord abstraction

A prototype draft for my future ORM / ActiveRecord abstraction.

Disclosure: This is yet experimental. DO NOT USE IT JUST YET.

## Features

* Magic methods for the standard SQL queries: SELECT, UPDATE, INSERT and DELETE.
* Access to the inner libraries: mysql (_.pool & _.connection) & squel.
* Can be extended to build any query or command of your choosing.
* Uses method chaining for ease of use.

## Installation

### node.js

Install using [npm](http://npmjs.org/):

    $ npm install romance

## Examples

So, this is all experimental and the main idea (hoping to finishing it the next week):

	var Romance = require('romance');
	
	var db = new Romance({
		host:       'localhost',
		user:       'root',
		password:   'root',
		database:   'database_name'
	});
	
	db.connect(function(err){
		var Users = db.repository('users');
		
		Users.where('email = ?', 'john@email.com').find(function(user, index){
			user.email = 'john2@email.com';
			user.save().then(function(err){
				// saved
			});
		}).then(function(){
			// found them!
		});
    	
		Users.where('email = ?', 'john@email.com').all(function(users){
			// Could be simple objects or entities
		});
    	
		Users.findAllActive(function(users){
			// Could be simple objects or entities
		});
    	
		db.end();
	});

## License

MIT - see LICENSE.md

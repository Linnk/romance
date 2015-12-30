var romance = require('./romance.js');
var config = require('./config').config;

var db = romance(config);

var Users = db.repository('users', 'User');

Users.find('first').then(function(){

});

Users.find('first').then(function(){

});

Users.find('first', {
	fields: ['User.id', 'User.email', 'User.name'],
	conditions: [
		'User.email = ? AND User.name LIKE ?', 'john@email.com', '%John%'
	],
	order: [
		'User.name ASC',
		'User.email ASC',
	],
}).then(function(user){

});

Users.find('all', {
	fields: [],
	conditions: [
		'Company.id = User.id',
		['email = ?', 'john@email.com'],
	],
	joins: [
		{
			type: 'LEFT',
			table: 'company AS Company',
			conditions: 'Company.id = User.id',
		},
	],
	order: ['User.name ASC', 'User.email ASC'],
	limit: 5,
}).then(function(users){

}).catch(function(err){

});

Users.where('email = ?', 'john@email.com').find('first').then(function(user){
	user.email = 'john2@email.com';
	Users.save(user).then(function(success){

	});
});

Users.where('email = ?', 'john@email.com').first(function(user, fields){

});

Users.where('email = ?', 'john@email.com').all(function(users, fields){

});


// ---------------------------------------------------------------------------- //

/* Entities
------------------------------------- */
var db = require('./romance.js')(config);

var Users = db.gateway('users');

Users.where('email = ?', 'john@email.com').order('id DESC').first(function(user){

	user.name = 'John doe';
	user.email = 'john@email.com';
	Users.save(user).then(function(){ // save => update()
	
	}).catch(function(reason){

	});

});

Users.find('first', {
	fields: [],
	conditions: [
		[],
		[],
	],
	order: [],
}).then(function(user){

});

var user = Users.newEntity();

user.name = 'John doe';
user.email = 'john@email.com';
Users.save(user).then(function(){ // save => update()

}).catch(function(reason){

});

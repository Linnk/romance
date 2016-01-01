var romance = require('./romance.js');

var db = romance({
	host:       'localhost',
	user:       'root',
	password:   'root',
	database:   'incremen_crm',
	port:       3306
});

db.query('SELECT id, username, name FROM users LIMIT 3').then(result => {

	console.log(result);

}).catch(reason => {

	console.log(reason);

});

var Users = db.repository('users');

Users.field('id').field('name').where('id = ?', 1337).first(function(err, user, fields){

	console.log('First:', user);

});

Users.where('username LIKE ?', '%incrementacrm.com%').limit(3).all(function(err, users, fields){

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
			table: 'companies',
			conditions: 'Company.id = User.id',
		},
	],
	order: ['User.name ASC', 'User.username DESC', 'User.id'],
	limit: 5,
}).then(user => {
	user.name = 'Blanca Sánchez';

	return Users.save(user);
}).then(user => {

	return Users.field('id').field('username').field('name').where('id = ?', user.id).find('first');
}).then(user => {

	console.log(user);
});

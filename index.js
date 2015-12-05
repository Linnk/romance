var Romance = require('./romance.js');
var config = require('./config').config;

var db = new Romance(config);

db.connect(function(err){

	var Users = db.repository('users');

	Users.find('first', {
		conditions: {email: 'john@email.com'},
		result: function(user, index) {
			user.name = 'John doe';
			user.save(function(err){
	
			});
		},
		error: function(err) {
			throw err;
		},
		end: function() {
			// end of query
		}
	});

	db.end();

});
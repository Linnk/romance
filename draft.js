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

	Users.where('email = ?', 'john@email.com').find(function(user, index){
		user.email = 'john2@email.com';
		user.save(function(err){
			
		});
	}).then(function(){
		
	});

	Users.where('email = ?', 'john@email.com').all(function(users){
		
	});

	Users.findAllActive(function(users){
		
	});

	db.end();

});

/* Entities
------------------------- */
var User = Users.entity('user');

var user = new User(); // save => insert()
user.name = 'John doe';
user.email = 'john@email.com';
user.save().then(function(){
	
});
user.set('name', 'lol').then(function(){
	
})

// select
var user = new User({id: 1}); // save => update()

user.get('name').then(function(name){
	
});
user.email = 'john@email.com';
user.save(function(err){
	
});

var db = require('./romance.js')({
	host:       'localhost',
	user:       'root',
	password:   'root',
	database:   'incremen_crm',
	port:       3306
})

var Users = db.repository('users')

/* Promises
----------------------------------------------------- */

Users.begin().then(() => {

	return Users.where('id = ?', 1337).find('first')

}).then(user => {

	user.name = user.name + '*'

	return Users.save(user)

}).then(user => {

	return Users.commit()

}).then(() => {

	console.log('Done. ʕ •ᴥ•ʔ')

})

/* Promises <3 Functional Programming c:
----------------------------------------------------- */

Users.begin()
	.then(done => { return Users.findById(1337) })
	.then(Users.updateNameField)
	.then(Users.commit)
	.then(done => { console.log('Done. ʕ •ᴥ•ʔ') })

class Users extends UsersRepository
{
	findById(id)
	{
		return this.where('id = ?', id).find('first')
	}
	updateNameField(user)
	{
		user.name = user.name + '*'

		return this.save(user)
	}
}

/* Callbacks: You can do it, but don't.
----------------------------------------------------- */

Users.begin(function(){

	Users.where('id = ?', 1337).first(function(err, user, fields){

		user.name = user.name + '*'

		Users.save(user, function(user){

			Users.commit(function(commited){
				console.log('This is where you think you still have control.')
			})

		})

	})

})

var User = require('./models/user');

/*
*	Cherche un utilisateur dans la BDD
*/
exports.getUser = function(me, callback){
	User.findOne({'mail': me.mail}, function(err, user){
		if (err) throw err;
		callback(user);
	});
}

/*
*	Ajoute un utilisateur dans la BDD
*/
exports.addUser = function(me){
	var newUser = new User({
		pseudo : me.username,
		mail : me.mail,
		avatar : me.avatar
	});
	newUser.save(function (err){
		if (err) throw err;
		console.log('Utilisateur ajouté avec succès');
	});
};

/*
*	Met à jour un utilisateur dans la BDD
*/
exports.updateUser = function(me){
	User.findOneAndUpdate({'mail': me.mail}, {'avatar': me.avatar}, function(err, user){
		if (err) throw err;
	});
};
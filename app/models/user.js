var mongoose = require('mongoose');

module.exports = mongoose.model('User', {
	pseudo : String,
	mail : String,
	avatar : String
});
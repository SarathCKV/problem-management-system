const mongoose = require('mongoose');
let Schema = mongoose.Schema;

const UserSchema = new Schema({
	firstName: {
		type: String
	},
	lastName: {
		type: String
	},
	email: {
		type: String
	},
	password: {
		type: String
	},
	userType: {
		type: String,
		default: 'user'
	}
});

module.exports = mongoose.model('users', UserSchema);
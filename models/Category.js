const mongoose = require('mongoose');
let Schema = mongoose.Schema;

const catSchema = new Schema({
	name: {
		type: String
	}
});

module.exports = mongoose.model('categories', catSchema);
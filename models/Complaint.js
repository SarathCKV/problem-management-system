const mongoose = require('mongoose');
let Schema = mongoose.Schema;

const ComplaintSchema = new Schema({
	category: {
        type: Schema.Types.ObjectID,
        ref: 'categories'
    },
    user: {
        type: String
    },
	title: {
		type: String
	},
	importance: {
		type: String
	},
	status: {
		type: String,
		default: 'Not Initiated'
	},
	description: {
		type: String
	},
	date: {
		type: Date,
		default: Date.now()
	},
	submitDate: {
		type: String
	},
	file: {
		type: String
	},
	building: {
		type: String
	},
	floor: {
		type: String
	},
	room: {
		type: String
	},
	changeStatus: {
		type: Boolean
	},
	comments: [{
		type: mongoose.Types.ObjectId,
		ref: 'comments'
	}]
}, {usePushEach: true});

module.exports = mongoose.model('complaints', ComplaintSchema);
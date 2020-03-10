const express = require('express');
let router = express.Router();
const path = require('path');
const fs = require('fs');
const User = require('../../models/User');
const Complaint = require('../../models/Complaint');
const Category = require('../../models/Category');
const Comment = require('../../models/Comment');
const bcrypt = require('bcryptjs');
const upload = require('express-fileupload');
const {isEmpty, uploadDir} = require('../../helpers/upload-helper');
let loggedIn = 'user';
const {SESS_NAME} = require('../../index');
const ObjectID = require('mongoose').ObjectID;



router.all('/*', (req, res, next) => {
	req.app.locals.layout = 'home';
	next();
});

const redirectLogin = (req, res, next) => {
	if(!req.session.userId) {
		res.redirect('/login');
	} else {
		next();
	}
}

const protectHome = (req, res, next) => {
	User.findOne({firstName: req.session.userId}).lean().then(user => {
		if(user.userType === 'admin') {
			res.redirect('/admin');
		} else {
			next();
		}
	});
}

const redirectHome = (req, res, next) => {
	if(req.session.userId) {
		User.findOne({firstName: req.session.userId}).lean().then(user => {
			if(user.userType === 'admin') {
				res.redirect('/admin');
			} else {
				res.redirect('/home');
			}
		});
	} else {
		next();
	}
}

router.get('/', redirectHome, (req, res) => {
	const { userId } = req.session;
	loggedIn = 'user';
	Complaint.find({}).lean().then(complaint => {
		res.render('home/index', {loggedIn: loggedIn, complaint: complaint});
	});
	res.send('hello');
});

router.get('/login', redirectHome, (req, res) => {
	loggedIn = 'user';
	res.render('home/login', {loggedIn: loggedIn});
});

router.get('/register', redirectHome, (req, res) => {
	loggedIn = 'user';
	res.render('home/register', {loggedIn: loggedIn});
});

router.post('/register', (req, res) => {
	let errors = [];

	if(!req.body.firstName) {
		errors.push({message: 'First name is required!!'});
	}

	if(!req.body.lastName) {
		errors.push({message: 'Last name is required'});
	}

	if(!req.body.email) {
		errors.push({message: 'Email is required!!'});
	}

	if(!req.body.password) {
		errors.push({message: 'Password is required'});
	}

	if(req.body.password !== req.body.passwordConfirm) {
		errors.push({message: 'Passwords do not match!!'});
	}

	if(errors.length > 0) {
		loggedIn = 'user';
		res.render('home/register', {errors: errors, loggedIn: loggedIn});
	} else {
		const newUser = new User({
			firstName: req.body.firstName,
			lastName: req.body.lastName,
			email: req.body.email,
			password: req.body.password
		});
		bcrypt.genSalt(10, (err, salt) => {
			bcrypt.hash(newUser.password, salt, (err, hash) => {
				newUser.password = hash;
				newUser.save().then(savedUser => {
					req.flash('success_message', 'User successfully registered!!!');
					res.redirect('/login');
				});
			})
		})
	}
});

router.post('/login', (req, res) => {
	let errors = [];
	if(!req.body.email) {
		errors.push({message: 'Email is required!!'});
	}

	if(!req.body.password) {
		errors.push({message: 'Password is required'});
	}

	if(errors.length > 0) {
		loggedIn = 'user';
		res.render('home/login', {errors: errors, loggedIn});
	} else {
		User.findOne({email: req.body.email}).lean().then(user => {
			if(user) {
				if(user.userType === 'admin') {
					bcrypt.compare(req.body.password, user.password, (err, matched) => {
						if(err) throw err;
						if(matched) {
							req.session.userId = user.firstName;
							res.redirect('/admin');
						}
					});
				} else {
					bcrypt.compare(req.body.password, user.password, (err, matched) => {
						if(err) throw err;
						if(matched) {
							req.session.userId = user.firstName;
							res.redirect('/home');
						}
					});
				}
			}
		});
	}
});


router.get('/home', redirectLogin, protectHome, (req, res) => {
	loggedIn = '';
	Complaint.find({user: req.session.userId, $or: [{status: 'Approved'}, {status: 'Not Initiated'}]}).lean().populate('category').then(complaint => {
		Complaint.find({user: req.session.userId, status: 'Completed'}).lean().populate('category').then(completedComplaint => {
			res.render('home/dash', {loggedIn: loggedIn, complaint: complaint, completedComplaint: completedComplaint});
		});
	});
});

router.get('/home/complain', redirectLogin, protectHome, (req, res) => {
	loggedIn = '';
	Category.find({}).lean().then(categories => {
		User.findOne({firstName: req.session.userId}).lean().then(user => {
			res.render('home/create', {loggedIn: loggedIn, categories: categories, user: user});
		})
	});
});



router.delete('/home/:id', (req, res) => {
	Complaint.findOne({_id: req.params.id}).then(comp => {
		fs.unlink(uploadDir + comp.file, (err) => {
			if(!comp.comments.length < 1) {
				comp.comments.forEach(comment => {
					Comment.findByIdAndRemove(comment).then(com => {

					})
				});
			}
			comp.remove();
			req.flash('success_message', 'Complaint successfully closed...');
			res.redirect('/home');
		})
	});
});


router.get('/home/complain/:id', redirectLogin, protectHome, (req, res) => {
	Complaint.findOne({_id: req.params.id}).lean().populate('comments').then(complaint => {
		res.render('home/complaint', {complaint: complaint});
	});
});

router.post('/home/comments', (req, res) => {
	Complaint.findById(req.body.Pid).then(comp => {
		const newComment = new Comment({
			user: req.session.userId,
			body: req.body.body,
			date: Date.now()
		});
		// console.log(complaint);
		// console.log(newComment);
		comp.comments.push(newComment);
		comp.save().then(savedComp => {
			newComment.save().then(savedCom => {
				res.redirect(`/home/complain/${comp.id}`);
			});
		});
	});
});

router.post('/logout', (req, res) => {
	req.session.userId = '';
	res.redirect('/login');
});

module.exports = router;
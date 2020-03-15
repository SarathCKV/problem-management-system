const express = require('express');
let router = express.Router();
const Complaint = require('../../models/Complaint');
const Category = require('../../models/Category');
const User = require('../../models/User');
const Comment = require('../../models/Comment');
const flash = require('connect-flash');
const pdf = require('handlebars-pdf');
const num = Math.random();
const fs = require('fs');
const { generateTime } = require('../../helpers/handlebars-helpers');
const hbs = require('handlebars');
const moment = require('moment');
const path = require('path');

router.use(flash());
router.use((req, res, next) => {
	res.locals.success_message = req.flash('success_message');
	next();
});

const redirectLogin = (req, res, next) => {
	if(!req.session.userId) {
		res.redirect('/login');
	} else {
		next();
	}
}

const protectAdmin = (req, res, next) => {
	User.findOne({firstName: req.session.userId}).lean().then(user => {
		if(user.userType === 'user') {
			res.redirect('/home');
		} else {
			next();
		}
	});
}

router.all('/*', (req, res, next) => {
	req.app.locals.layout = 'admin';
	next();
});

router.get('/', redirectLogin, protectAdmin, (req, res) => {
	let adminHome='adminHome';
	const { userId } = req.session;
	// console.log(userId);
	res.render('admin/index', {adminHome: adminHome});
});

router.get('/create', redirectLogin, protectAdmin, (req, res) => {
	let create = 'create';
	res.render('admin/create', {create: create});
});

router.get('/view', redirectLogin, protectAdmin, (req, res) => {
	let view = 'view';
	Complaint.find({}).populate('category').lean().then(complaint => {
		res.render('admin/view', {complaint: complaint, view: view});
	});
});

router.post('/create', (req, res) => {
	loggedIn = '';
	const newComp = new Complaint({
		title: req.body.title,
		importance: req.body.importance,
		description: req.body.description
	});
	newComp.save().then(savedComp => {
		req.flash('success_message', 'Complaint successfully posted!!');
		res.redirect('/admin');
	});
})

router.get('/edit/:id', redirectLogin, protectAdmin, (req, res) => {
	Complaint.findOne({_id: req.params.id}).then(comp => {
		comp.changeStatus = true;
	});
	Complaint.find({}).lean().populate('category').then(complaints => {
		res.render('admin/edit', {complaints: complaints});
	});
});

router.put('/edit/:id', (req, res) => {
	Complaint.findOne({_id: req.params.id}).then(comps => {
		comps.status = req.body.status;
		comps.save().then(savedComp => {
			res.redirect('/admin/view');
		}).catch(error => {
			if(error) throw error;
		});
	});
});

router.get('/category/create', redirectLogin, protectAdmin, (req, res) => {
	let cat_create = 'cat_create';
	Category.find({}).lean().then(category => {
		res.render('admin/cat-create', {cat_create: cat_create, category: category});
	});
});

router.post('/category/create', (req, res) => {
	const newCat = new Category({
		name: req.body.name
	});
	newCat.save().then(savedCat => {
		req.flash('success_message', 'Category successfully created');
		res.redirect('/admin/category/create');
	})
});

router.get('/user/view', redirectLogin, protectAdmin, (req, res) => {
	let viewUser = 'viewUser';
	User.find({userType: 'user'}).lean().then(user => {
		res.render('admin/user', {user: user, viewUser: viewUser});
	});
});

router.delete('/delete/:id', (req, res) => {
	User.findOne({_id: req.params.id}).then(user => {
		user.remove();
		res.redirect('/admin/user/view');
	});
});

router.get('/comments/view', redirectLogin, protectAdmin, (req, res) => {
	let viewComments = 'comment';
	Comment.find({}).lean().then(comment => {
		res.render('admin/comment', {comment: comment, viewComments: viewComments})
	})
});

router.get('/complain/:id', redirectLogin, (req, res) => {
	Complaint.findById(req.params.id).lean().populate({path: 'comments', options: { sort: {'date': -1}}}).then(complaint => {
		res.render('admin/complaint', {complaint: complaint});
	});
});

router.post('/comments', (req, res) => {
	Complaint.findById(req.body.id).then(comp => {
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
				res.redirect(`/admin/complain/${comp.id}`);
			});
		});
	});
});

router.delete('/comments/:id', (req, res) => {
	Comment.findByIdAndRemove(req.params.id).then(deleted => {
		Complaint.findOneAndUpdate({comments: req.params.id}, {$pull: {comments: req.params.id}}, (err, data) => {
			if(err) throw err;
			res.redirect('/admin/comments/view');
		});
	});
});

router.get('/generate', (req, res) => {
	Category.find({}).lean().then(categories => {

		res.render('admin/generate', {categories: categories});
	});
});

router.get('/generate/complete', (req, res) => {
	Complaint.find({status: 'Completed'}).populate('category').lean().then(tran => {
        // console.log(tran)
        let document = {
			template: '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">' +
			'<style>table, th, td { border: 1px solid black; border-collapse: collapse; padding:5px; font-size:10px;}</style>' +
			'<h1>Complaints</h1>'+
			'<table>' +
			'<thead>' +
			'<th>Title</th>' +
				'<th>Category</th>' +
				'<th>Importance</th>' +
				'<th>Date</th>' +
				'<th>Status</th>' +
				'<th>Location</th>' +
				'<th>Posted by</th>' +
			'</thead>' +
			'<tbody>' +
			'{{#each tran}}'+
			'<tr>' +
			'<td>{{title}}</td>' +
			'<td>{{category.name}}</td>' +
			'<td>{{importance}}</td>' +
			'<th>{{date}}</th>' +
			'<td>{{status}}</td>' +
			'<td>{{room}}, {{floor}}, {{building}}</td>' +
			'<td>{{user}}</td>' +
				'</tr>' +
			'{{/each}}',
			context: {
				tran: tran
			},
			path: "./completedComplaints.pdf"
		}
         
        pdf.create(document).then(result => {
                console.log(result.filename)
                // var files = fs.createReadStream('completedComplaints.pdf');
				// res.writeHead(200, {'Content-disposition': 'attachment; filename=completedComplaints.pdf'}); //here you can add more headers
				// files.pipe(res);
				res.download(result.filename);
            }).catch(error => {
                console.error(error)
		});
	});
});

router.get('/generate/app', (req, res) => {
	Complaint.find({status: 'Approved'}).populate('category').lean().then(tran => {
        // console.log(tran)
        let document = {
			template: '<style>table, th, td { border: 1px solid black; border-collapse: collapse; padding:5px;}</style>' +
			'<h1>Complaints</h1>'+
			'<table>' +
			'<thead>' +
			'<th>Title</th>' +
				'<th>Category</th>' +
				'<th>Importance</th>' +
				'<th>Date</th>' +
				'<th>Status</th>' +
				'<th>Location</th>' +
				'<th>Posted by</th>' +
			'</thead>' +
			'<tbody>' +
			'{{#each tran}}'+
			'<tr>' +
			'<td>{{title}}</td>' +
			'<td>{{category.name}}</td>' +
			'<td>{{importance}}</td>' +
			'<th>{{date}}</th>' +
			'<td>{{status}}</td>' +
			'<td>{{room}}, {{floor}}, {{building}}</td>' +
			'<td>{{user}}</td>' +
				'</tr>' +
			'{{/each}}',
			context: {
				tran: tran
			},
			path: "./approvedComplaints.pdf"
		}
         
        pdf.create(document).then(result => {
                console.log(result.filename)
                var files = fs.createReadStream('approvedComplaints.pdf');
				res.writeHead(200, {'Content-disposition': 'attachment; filename=approvedComplaints.pdf'}); //here you can add more headers
				files.pipe(res);
            }).catch(error => {
                console.error(error)
		});
	});
});

router.get('/generate/ncomplete', (req, res) => {
	Complaint.find({status: 'Not Initiated'}).populate('category').lean().then(tran => {
        // console.log(tran)
        let document = {
			template: '<style>table, th, td { border: 1px solid black; border-collapse: collapse; padding:5px;}</style>' +
			'<h1>Complaints</h1>'+
			'<table>' +
			'<thead>' +
			'<th>Title</th>' +
				'<th>Category</th>' +
				'<th>Importance</th>' +
				'<th>Date</th>' +
				'<th>Status</th>' +
				'<th>Location</th>' +
				'<th>Posted by</th>' +
			'</thead>' +
			'<tbody>' +
			'{{#each tran}}'+
			'<tr>' +
			'<td>{{title}}</td>' +
			'<td>{{category.name}}</td>' +
			'<td>{{importance}}</td>' +
			'<th>{{date}}</th>' +
			'<td>{{status}}</td>' +
			'<td>{{room}}, {{floor}}, {{building}}</td>' +
			'<td>{{user}}</td>' +
				'</tr>' +
			'{{/each}}',
			context: {
				tran: tran
			},
			path: "./notInitComplaints.pdf"
		}
         
        pdf.create(document).then(result => {
                console.log(result.filename)
                var files = fs.createReadStream('notInitComplaints.pdf');
				res.writeHead(200, {'Content-disposition': 'attachment; filename=notInitComplaints.pdf'}); //here you can add more headers
				files.pipe(res);
            }).catch(error => {
                console.error(error)
		});
	});
});

router.post('/generate/category', (req, res) => {
	Complaint.find({category: req.body.categories}).populate('category').lean().then(tran => {
		// console.log(tran)
		let document = {
			template: '<style>table, th, td { border: 1px solid black; border-collapse: collapse; padding:5px;}</style>' +
			'<h1>Complaints</h1>'+
			'<table>' +
			'<thead>' +
			'<th>Title</th>' +
				'<th>Category</th>' +
				'<th>Importance</th>' +
				'<th>Date</th>' +
				'<th>Status</th>' +
				'<th>Location</th>' +
				'<th>Posted by</th>' +
			'</thead>' +
			'<tbody>' +
			'{{#each tran}}'+
			'<tr>' +
			'<td>{{title}}</td>' +
			'<td>{{category.name}}</td>' +
			'<td>{{importance}}</td>' +
			'<th>{{generateTime date \'MMMM Do\'}}</th>' +
			'<td>{{status}}</td>' +
			'<td>{{room}}, {{floor}}, {{building}}</td>' +
			'<td>{{user}}</td>' +
				'</tr>' +
			'{{/each}}',
			context: {
				tran: tran
			},
			path: "./categoryBased-"+ num + ".pdf"
		}
			
		pdf.create(document).then(result => {
				console.log(result.filename)
				var files = fs.createReadStream('categoryBased-' + num + ".pdf");
				res.writeHead(200, {'Content-disposition': 'attachment; filename=categoryBased-'+ num + '.pdf'}); //here you can add more headers
				files.pipe(res);
			}).catch(error => {
				console.error(error)
		});
	});
});

router.post('/logout', (req, res) => {
	req.session.userId = '';
	res.redirect('/login');
});

module.exports = router;
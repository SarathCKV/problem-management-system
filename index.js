const express = require('express');
let app = express();
const port = process.env.PORT || 1050;
const home = require('./routes/home/home');
const admin = require('./routes/admin/admin');
const ehbs = require('express-handlebars');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const bcrypt = require('bcryptjs');
const moment = require('moment');
const {select, generateTime, ifEquality} = require('./helpers/handlebars-helpers');
const {isEmpty} = require('./helpers/upload-helper');
const methodOverride = require('method-override');
const multer = require('multer');
const Complaint = require('./models/Complaint');
const User = require('./models/User.js');
const Category = require('./models/Category');
const upload = require('express-fileupload');
const {uploadDir} = require('./helpers/upload-helper');
const Handlebars = require('handlebars');
const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access')


const {
	SESS_NAME = 'sid'
} = process.env

mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
//mongodb+srv://Sarath:123@cluster0-sjzxx.mongodb.net/test?retryWrites=true&w=majority
//mongodb://localhost:27017/probms
mongoose.connect('mongodb+srv://Sarath:123@cluster0-sjzxx.mongodb.net/test?retryWrites=true&w=majority', (err) =>  {
	if(err) throw err;
	console.log('Connected to DB');
});

app.use(methodOverride('_method'));
app.use(session({name: SESS_NAME, secret: 'Hello', resave: true, saveUninitialized: true, cookie: {maxAge: 60000000, sameSite: true}}));
app.use(flash());
app.use((req, res, next) => {
	res.locals.user = req.user || null;
	res.locals.success_message = req.flash('success_message');
	res.locals.logged_in = '';
	next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(upload());

app.use('/', home);
app.use('/admin', admin);


app.use(express.static(path.join(__dirname, 'public')));
app.engine('handlebars', ehbs({defaultLayout: 'home', handlebars: allowInsecurePrototypeAccess(Handlebars), helpers: {select: select, generateTime: generateTime, ifEquality: ifEquality}}));
app.set('view engine', 'handlebars');




app.post('/create', (req, res) => {
	loggedIn = '';
	let filename = '';
	let errors = [];

	if(!req.body.title) {
		errors.push({message: 'Title is required!!'});
	}

	if(!req.body.importance) {
		errors.push({message: 'Select a importance option'});
	}

	if(!req.body.categories) {
		errors.push({message: 'Please choose a category'});
	}

    // if(!isEmpty(req.files)) {
    //     let file = req.files.file;
    //     filename = Date.now() + '-' + file.name;
    //     file.mv(uploadDir + filename, (err) => {
    //         if(err) throw err;
    //     });
	// }

	if(!(req.body.building || req.body.floor || req.body.room)) {
		errors.push({message: 'Please choose a location'});
	}

	if(!req.body.submitDate) {
		errors.push({message: 'Please select a date'});
	}

	if(errors.length > 0) {
		res.render('home/create', {errors: errors});
	} else {
		const newComp = new Complaint({
			user: req.session.userId,
			title: req.body.title,
			importance: req.body.importance,
			description: req.body.description,
			category: req.body.categories,
			// file: filename,
			submitDate: generateTime(req.body.submitDate, 'MMMM Do YYYY'),
			building: req.body.building,
			floor: req.body.floor,
			room: req.body.room,
			changeStatus: false
		});
		newComp.save().then(savedComp => {
			req.flash('success_message', 'Complaint successfully posted!!!');
			res.redirect('/home');
		});
	}
});

app.get('/complain/:id', (req, res) => {
	let loggedIn = 'user';
	Complaint.findOne({_id: req.params.id}).lean().populate('comments').then(complaint => {
		res.render('home/complaintView', {complaint: complaint, loggedIn: loggedIn});
	});
});


app.listen(port, (err) => {
	console.log(`Listening to port ${port}`);
});
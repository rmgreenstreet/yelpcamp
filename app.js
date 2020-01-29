
require('dotenv').config();
const 	express 				= require("express"),
		app 					= express(),
		LocalStrategy			= require('passport-local'),
	  	bodyParser 				= require('body-parser'),
		mongoose 				= require('mongoose'),
		methodOverride 			= require('method-override'),
		expressSanitizer 		= require('express-sanitizer'),
		passport 				= require('passport'),
		pasportLocalMongoose	= require('passport-local-mongoose'),
		User					= require('./models/user.js'),
	  	expressSession			= require('express-session'),
		seedDB					= require('./seeds.js'),
	  	flash					= require('connect-flash');

const commentRoutes = require("./routes/comments.js"),
	  campgroundRoutes = require("./routes/campgrounds.js"),
	  indexRoutes = require("./routes/index.js"),
	  userRoutes = require('./routes/user.js');

//app config


mongoose.connect(process.env.DATABASEURL || "mongodb+srv://robertgreenstreet:"+process.env.DB_PASSWORD+"@yelpcamp-wvcjs.mongodb.net/yelp_camp?retryWrites=true&w=majority",{
	useNewUrlParser:true, 
	useUnifiedTopology:true,
	useFindAndModify: false,
	useCreateIndex:true
}).then(() => {
	console.log('Connected to Mongoose DB')
}).catch(err => {
	console.log('error: ',err.message)
});

console.log("Environment database URL: "+process.env.DATABASEURL);

app.set('view engine','ejs');

app.use(express.static("public")),
app.use(methodOverride("_method"));
app.use(expressSanitizer());
app.use(passport.initialize());
app.use(passport.session());
app.use(expressSession({
		secret:"dogs are so good",
		resave:false,
		saveUninitialized:false
		}));
app.use(express.static(__dirname+"/public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.locals.moment = require('moment');

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// seedDB();


app.use( async function(req, res, next){
	res.locals.currentUser = req.user;
	if(req.user) {
		try {
			let user = await User.findById(req.user.id).populate('notifications',null, {isRead:false}).exec();
			res.locals.notifications = user.notifications.reverse();
		}
		catch (err) {
			console.log(err);
		}
	}
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
});

//requiring routes
app.use(indexRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use(userRoutes);

app.get("*",(req,res) => {
     res.send("This page does not exist. Please go back and try again.")
     });

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8080;
}
app.listen(port, () => {
	console.log("server has started, listening on port "+port);
});
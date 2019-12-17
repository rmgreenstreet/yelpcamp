
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
		Campground				= require('./models/campground.js'),
		Comment					= require('./models/comment.js'),
	  	flash					= require('connect-flash');

const commentRoutes = require("./routes/comments.js"),
	  campgroundRoutes = require("./routes/campgrounds.js"),
	  indexRoutes = require("./routes/index.js");

//app config
// mongoose.connect("mongodb://localhost:27017/yelp_camp",{useNewUrlParser:true, useUnifiedTopology:true,useFindAndModify: false});

// const dbpass = dotEnv.env.DB_PASS;
// const uri = "mongodb+srv://robertgreenstreet:"+process.env.DB_PASSWORD+"@yelpcamp-wvcjs.mongodb.net/yelp_camp?retryWrites=true&w=majority";

mongoose.connect(process.env.DATABASEURL || "mongodb+srv://robertgreenstreet:"+process.env.DB_PASSWORD+"@yelpcamp-wvcjs.mongodb.net/yelp_camp?retryWrites=true&w=majority",{
	useNewUrlParser:true, 
	useUnifiedTopology:true,
	useFindAndModify: false
}).then(() => {
	console.log('Connected to Mongoose DB')
}).catch(err => {
	console.log('error: ',err.message)
});

console.log("Environment database URL: "+process.env.DATABASEURL);

// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology:true,useFindAndModify: false, useCreateIndex:true });
// client.connect(err => {
//   const collection = client.db("test").collection("devices");
//   // perform actions on the collection object
//   client.close();
// });


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

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

seedDB();


app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
});

//requiring routes
app.use(indexRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
app.use("/campgrounds", campgroundRoutes);

app.get("*",(req,res) => {
     res.send("This page does not exist. Please go back and try again.")
     });

// app.listen(8080, process.env.IP, function() {
//     console.log("server has started");
// });

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8080;
}
app.listen(port, () => {
	console.log("server has started, listening on port "+port);
});
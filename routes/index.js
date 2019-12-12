
const express 		= require('express'),
	  router = express.Router({mergeParams:true}),
  	   Campground 	= require("../models/campground.js"),
	   Comment 		= require("../models/comment.js"),
	   passport		= require("passport"),
	   User 		= require("../models/user.js");

//root route
router.get("/",(req,res) => {
	res.render('home.ejs');
});


//register form route
router.get('/register',(req,res)=>{
	res.render('register.ejs');
});

//signup logic
router.post('/register',(req,res)=>{
	var newUsername = new User({username:req.body.username});
	var newPassword = req.body.password;
	User.register(newUsername,newPassword,(err,user)=>{
		if(err){
			req.flash('error',err.message);
			console.log(err);
			return res.redirect('/register');
		}
		passport.authenticate('local')(req,res,()=> {
			req.flash('success','Account created. Welcome to the club, '+req.body.username+'!');
			res.redirect('/campgrounds');
		})
	});
	
});

//show login page
router.get('/login',(req,res)=>{
	res.render('login.ejs');
});

//login logic
router.post("/login", passport.authenticate("local",
  {
    successRedirect: "/campgrounds",
    failureRedirect: "/login"
  }), function(req, res){
	
});

//logout route
router.get('/logout',(req,res)=>{
	req.logout();
	req.flash("success","You have been logged out");
	res.redirect('/campgrounds');
});

module.exports = router;
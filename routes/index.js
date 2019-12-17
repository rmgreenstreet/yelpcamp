
const express 		= require('express'),
	  router 		= express.Router({mergeParams:true}),
  	  Campground 	= require("../models/campground.js"),
	  Comment 		= require("../models/comment.js"),
	  passport		= require("passport"),
	  User 			= require("../models/user.js"),
	  middleware 	= require('../middleware');

//root route
router.get("/", (req,res) => {
	
	res.render('home.ejs');
});


//register form route
router.get('/register',(req,res)=>{
	res.render('user/register/subscriber.ejs', {page:'register'});
});

//admin register form route
router.get('/register/admin',(req,res)=>{
	res.render('user/register/admin.ejs', {page:'register'});
});

//signup logic
router.post('/register',(req,res)=>{
	var newUser = new User({username:req.body.username});
	User.register(newUser,req.body.password,(err,user)=>{
		if(err){
			req.flash('error',err.message);
			console.log(err);
			return res.redirect('back');
		}
		passport.authenticate('local')(req,res,()=> {
			req.flash('success','Account created. Welcome to the club, '+req.body.username+'!');
			res.redirect('/campgrounds');
		})
	});
});

//admin signup logic
router.post('/register',(req,res)=>{
	var newUser = new User({username:req.body.username});
	
	if(req.body.adminCode == process.env.ADMINCODE){
		newUser.isAdmin=true;
		User.register(newUser,req.body.password,(err,user)=>{
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
	}
});

//show login page
router.get('/login',(req,res)=>{
	res.render('user/login.ejs',{page:'login'});
});

//login logic
router.post("/login", passport.authenticate("local",
  {
    successRedirect: "/campgrounds",
    failureRedirect: "/login"
  }), function(req, res){
	
});

//show user profile
router.get('/profile/:id', (req,res) => {
	User.findById(req.params.id, (err,foundUser) => {
		if(err){
			req.flash('error',err.message);
			res.redirect('back');
		}
		else {
			res.render('user/profile.ejs',{user:foundUser,page:'profile'});
		}
	});
});

//update route

router.put('/profile/:id',middleware.checkProfileOwnership,(req,res) => {
	//find and update the correct user
		
	User.findByIdAndUpdate(req.params.id, req.body.user, (err,updatedUser) => {
		if(err) {
			res.redirect('back');
		}
		else {
			res.redirect('/profile/'+req.params.id,{user:updatedUser});
		}
	});
});

//delete route
router.delete('/profile/:id',middleware.checkProfileOwnership,(req,res) => {
	User.findByIdAndRemove(req.params.id,(err) =>{
		if(err){
			req.flash('error',err.message)
			res.redirect('back');
		}
		else {
			req.flash('success','You have deleted your account');
			res.redirect('/campgrounds');
		}
	});
});

//logout route
router.get('/logout',(req,res)=>{
	req.logout();
	req.flash("success","You have been logged out");
	res.redirect('/campgrounds');
});

module.exports = router;
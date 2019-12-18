const express = require('express'),
	  router = express.Router({mergeParams:true}),
	  Campground = require("../models/campground.js"),
	  Comment = require("../models/comment.js"),
	  passport= require("passport"),
	  User = require("../models/user.js"),
	  middleware = require('../middleware'),
	  methodOverride = require('method-override');



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
	var newUser = new User({username:req.body.username,image:req.body.image});
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
	var newUser = new User({username:req.body.username,image:req.body.image});
	
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
			else if(!foundUser){
				req.flash('error','This user does not exist');
				res.redirect('back');
			}
			else {
				Campground.find({'author.id':req.params.id}, (err,foundCampgrounds) =>{
				if(err) {
					req.flash('error',err.message);
					res.render('back');
				}
				else {
					res.render('user/profile.ejs',{user:foundUser,page:'profile', foundCampgrounds:foundCampgrounds});
				}
				});
			}
		});
});

//edit route
router.get('/profile/:id/edit',middleware.checkProfileOwnership,(req,res) => {
	User.findById(req.user.id, (err,foundUser) => {
		if(err) {
			req.flash('error',err.message);
			res.redirect('back');
		}
		else {
			res.render('user/edit.ejs',{foundUser:foundUser});
		}
	});
});

//update route
router.put('/profile/:id',middleware.checkProfileOwnership,(req,res) => {
	//find and update the correct user
	User.findByIdAndUpdate(req.user.id, req.body.user, (err,updatedUser) => {
		if(err) {
			req.flash('error',err.message);
			res.redirect('back');
		}
		else {
			req.flash('success','Your profile has been updated!');
			res.redirect('/profile/'+req.user.id);
		}
	});
});

//delete user route
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
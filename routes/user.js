const express = require('express'),
	  router = express.Router({mergeParams:true}),
	  Campground = require("../models/campground.js"),
	  Comment = require("../models/comment.js"),
	  passport= require("passport"),
	  User = require("../models/user.js"),
	  middleware = require('../middleware'),
	  methodOverride = require('method-override'),
	  async = require('async'),
	  nodemailer = require('nodemailer'),
	  ejs = require('ejs');



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
	var newUser = new User({username:req.body.username,image:req.body.image,email:req.body.email});
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
router.get('/logout',middleware.isLoggedIn,(req,res)=>{
	req.logout();
	req.flash("success","You have been logged out");
	res.redirect('/campgrounds');
});

//forgot route
router.get('/forgot',(req,res) => {
	res.render('../views/user/forgot.ejs');
});

//send reset email
router.post('/forgot',(req,res) => {
	async.waterfall([
		function(done) {
			crypto.randomBytes(20,(err,buf) => {
				var token = buf.toString('hex');
				done(err,token);
			});
		},
		function(token,done) {
			User.findOne({username:req.body.username},(err,foundUser) =>{
				if(err) {
					req.flash('error','No user with that username exists');
					res.redirect('back');
				}
				else {
					foundUser.resetPasswordToken = token;
					foundUser.resetPasswordExpires = Date.now() + 1800000 //30 minutes

					foundUser.save((err) => {
						done(err,token,foundUser);
					});
				}
			});
		},
		function(token,foundUser,done) {
			ejs.renderFile("./private/reset.ejs", { foundUser:foundUser,address:req.headers.host, token:token }, (err, data) => {
				if(err){
					console.log(err);
				}
				else {
					let smtpTransport = nodemailer.createTransport({
						service:'Gmail',
						auth:{
							user:'rgreenstreetdev@gmail.com',
							pass:process.env.GMAILPW
						}
					});
					let mailOptions = {
						to:foundUser.email,
						from:'rgreenstreetdev@gmail.com',
						subject:'YelpCamp Password Reset',
						// text:'You are receiving this email because you (or someone else) have requested to reset the password for '+foundUser.username+' on YelpCamp.' +
						// 	'Please click the following link, or paste it into your address bar, to set a new password for this account:' +
						// 	'http://'+req.headers.host+'/reset/'+token+'\n\n' *
						// 	'If you did not request to reset your password, please ignore this email and your password will remain the same.'
						html:data
					};
					smtpTransport.sendMail(mailOptions,(err) => {
						console.log('password reset email sent');
						req.flash('success','A password reset link has been sent to the email address associated with your account');
						done(err,'done');
					});
				}
			});
		}
	],
		function(err) {
		if (err) return next(err);
		res.redirect('/forgot');
		}
	);
});

//reset route
router.get('/reset/:token',(req,res) => {
	User.findOne({resetPasswordToken:req.params.token, resetPasswordExpires: {$gt: Date.now()}}, (err,foundUser) => {
		if(err){
			req.flash('error',err.message)
			res.redirect('back');
		}
		else if(!foundUser) {
			req.flash('The password reset token is invalid or expired. Please send another reset link');
			res.redirect('/forgot');
		}
		else {
		res.render('../views/user/reset.ejs',{foundUser:foundUser,token:req.params.token});
		}
	})
});

//save new password
router.post('/reset/:token',(req,res) => {
	async.waterfall([
		function(done) {
			User.findOne({resetPasswordToken:req.params.token, resetPasswordExpires:{$gt: Date.now()}}, (err,foundUser) => {
				if(err) {
					req.flash('error',err.message);
					res.redirect('back');
				}
				else if (req.body.newPassword === req.body.confirmNewPassword) {
					foundUser.setPassword(req.body.newPassword, (err) => {
						if(err){
							console.log(err);
						}
						else {
							foundUser.resetPasswordToken= undefined;
							foundUser.resetPasswordExpires = undefined;
							foundUser.save(function(err) {
							  req.logIn(foundUser, function(err) {
								done(err,foundUser);
							  });
							});
						}
					});	
				}
				else {
					req.flash('error','Passwords do not match');
					res.redirect('back');
				}
			});
		},
		function(foundUser,done) {
			ejs.renderFile("./private/resetSuccess.ejs", { foundUser:foundUser,address:req.headers.host}, (err, data) => {
				if(err){
					console.log(err);
				}
				else {
					let smtpTransport = nodemailer.createTransport({
						service:'Gmail',
						auth:{
							user:'rgreenstreetdev@gmail.com',
							pass:process.env.GMAILPW
						}
					});
					let mailOptions = {
						to:foundUser.email,
						from:'rgreenstreetdev@gmail.com',
						subject:'YelpCamp Password Reset Successful',
						html:data
					};
					smtpTransport.sendMail(mailOptions,(err) => {
						console.log('Successful reset email sent');
						req.flash('success','Your password has been reset successfully');
						res.redirect('/campgrounds');
						done(err);
					});
				}
			});
		}
	], function(err) {
		req.flash('error',err.message);
		res.redirect('/campgrounds');
	});
});

module.exports = router;
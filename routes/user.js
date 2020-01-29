const express = require('express'),
	  router = express.Router({mergeParams:true}),
	  Campground = require("../models/campground.js"),
	  bodyParser = require('body-parser'),
	  passport= require("passport"),
	  User = require("../models/user.js"),
	  middleware = require('../middleware'),
	  methodOverride = require('method-override'),
	  nodemailer = require('nodemailer'),
	  ejs = require('ejs'),
	  cloudinary = require('cloudinary').v2,
	  multer = require('multer'),
	  async = require('async');

	  let storage = multer.diskStorage({
		filename: function(req,file,callback) {
			callback(null,Date.now() + file.originalname);
		},
		folder:'users'
	 });
	
	let imageFilter = function (req,file,cb) {
		//accept image files only
		if (!file.originalname.match(/\.jpg|jpeg|png|gif)$/i)) {
			return cb(new Error('Only image files (jpg, jpeg, png, gif) are allowed!'), false);
		}
		else {
			cb(null,true);
		}
	};
	
	let upload = multer({storage:storage, filefilter:imageFilter});
	
	cloudinary.config({
		cloud_name:process.env.CLOUDINARY_NAME,
		api_key: process.env.CLOUDINARY_API_KEY,
		api_secret: process.env.CLOUDINARY_API_SECRET
	});


router.use(bodyParser.urlencoded({extended:true}));

function createUser(req,res,adminStatus){
	cloudinary.uploader.upload(req.file.path, (err,result) => {
	if(err) {
		req.flash('error',"Image Upload Error: "+err.message);
		res.redirect('back');
	}
	else {
		var newUser = new User({username:req.body.username,email:req.body.email,'image.url':result.url,'image.publicId':result.public_id,isAdmin:adminStatus});
		User.register(newUser,req.body.password,(err,user)=>{
			if(err){
				cloudinary.uploader.destroy(result.public_id);
				req.flash('error','Account Creation Error: '+err.message);
				console.log(err);
				res.redirect('back');
				}
			else {
				passport.authenticate('local')(req,res,()=> {
					if(adminStatus === true) {
						req.flash('success','Admin Account Created! Welcome to the team, '+req.body.username)
					}
					else {
						req.flash('success','Account created! Welcome to the club, '+req.body.username+'!');
					}
					res.redirect('/profile/'+user._id);
				});
				}
			});
		}
	});
};


//register form route
router.get('/register',(req,res)=>{
	res.render('user/register.ejs', {page:'register'});
});

//signup logic
router.post('/register', upload.single('image'),(req,res)=>{
	if(req.body.adminCode == process.env.ADMINCODE){
		createUser(req,res,true);
	}
	else {
		createUser(req,res,false);
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

//view notifications



//handle notifications




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
router.put('/profile/:id',middleware.isLoggedIn,middleware.checkProfileOwnership, upload.single('image'),(req,res) => {
	//check to see whether an image was uploaded
	if(!req.file) {
		//if not, only update username
		User.findByIdAndUpdate(req.user.id, {username:req.body.user.username}, (err) => {
			if(err) {
				req.flash('error','User update error: '+err.message);
				res.redirect('back');
			}
			else {
				req.flash('success','Your profile has been updated!');
				res.redirect('/profile/'+req.user.id);
			}
		});
	}
	else {
		//if an image was uploaded, send it to cloudinary as well as updating the username
		cloudinary.uploader.destroy(req.body.publicId,(err) => {
			if(err) {
				req.flash('error','Image Upload Error: Please try again');
				console.log(err.message);
				res.redirect('back');
			}
			else {
				cloudinary.uploader.upload(req.file.path,{folder:users}, (err,result) => {
					if(err) {
						req.flash('error',"Image Upload Error: "+err.message);
						res.redirect('back');
					}
					else {
						console.log(result.url);
						User.findByIdAndUpdate(req.user.id, {username:req.body.user.username,'image.url':result.url,'image.publicId':result.public_id}, (err) => {
							if(err){
								cloudinary.uploader.destroy(result.public_id);
								req.flash('error','User update error: '+err.message)
								res.redirect('back');
							}
							else {
								req.flash('success','You have updated your profile');
								res.redirect('/profile/'+req.user.id);
							}
						});
					}
				});
			}
		});
			
	}
});

//delete user route
router.delete('/profile/:id',middleware.isLoggedIn,middleware.checkProfileOwnership,(req,res) => {
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
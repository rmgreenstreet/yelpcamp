
const express = require('express'),
	  router = express.Router({mergeParams:true}),
	  Campground = require("../models/campground.js"),
	  Comment = require("../models/comment.js"),
	  passport= require("passport"),
	  User = require("../models/user.js"),
	  middleware = require('../middleware'), 
	  NodeGeocoder = require('node-geocoder'),
	  cloudinary = require('cloudinary').v2,
	  multer = require('multer'),
	  async = require('async');


let storage = multer.diskStorage({
	filename: function(req,file,callback) {
		callback(null,Date.now() + file.originalname);
	} 
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

var mapsOptions = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODING_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(mapsOptions);

//index route
router.get("/",(req,res) => {
	
	//get all campgrounds from mogo then render the page
	Campground.find({},(err,allCampgrounds)=>{
		
		if(err){
			console.log(err);
		}
		else {
			console.log("Campgrounds found");
			res.render('campgrounds/index.ejs',{campgrounds:allCampgrounds, page:'campgrounds'});
		}
	});
});

//create - makes a new campground
router.get("/new",middleware.isLoggedIn, (req,res) => {
	res.render('campgrounds/new.ejs');
});



//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res){
	let newCampground = new Campground(req.body.campground);
		
	//get google maps lat, long, and properly formatted address and apply it to campground.location/lat/long
	geocoder.geocode(newCampground.location, (err, data) => {
		if (err || !data.length) {
		  req.flash('error', err.message);
		  return res.redirect('back');
		}
		newCampground.lat = data[0].latitude;
		newCampground.lng = data[0].longitude;
		newCampground.location = data[0].formattedAddress;
		  //make campground.author be currently logged in user
		newCampground.author = {
		  id: req.user._id,
		  username: req.user.username			
		};
		cloudinary.uploader.upload(req.file.path, (err,result) => {
			//add cloudinary url for the image to the campground object under image property
			if(err) {
				req.flash('error',err.message);
				res.redirect('back');
			}
			else {
				console.log(newCampground);
				newCampground.image.url = result.secure_url;
				newCampground.image.publicId = result.public_id;
				// Create a new campground and save to DB
				Campground.create(newCampground, function(err, newlyCreated){
					if(err){
						console.log(err);
						cloudinary.api.delete_resources(result.public_id);
					} else {
						//redirect back to campgrounds page
						console.log(newlyCreated);
						res.redirect("/campgrounds");
					}
				});
			}
		});	
	});
});


//SHOW - shows more info about one campground
router.get("/:id", (req,res) => {
	Campground.findById(req.params.id).populate("comments").exec((err,foundCampground)=> {
		if(err){
			console.log(err);
		}
		else {
			res.render('campgrounds/show.ejs',{foundCampground:foundCampground});
		}
	});
});

//edit routes
router.get('/:id/edit',middleware.isLoggedIn,middleware.checkCampgroundOwnership,(req,res) => {
		Campground.findById(req.params.id, (err,foundCampground) => {
			if(err){
				res.redirect('back');
			}
			else {
				res.render('campgrounds/edit',{campground:foundCampground});
			}
		});
});

//update route

router.put('/:id',middleware.checkCampgroundOwnership, upload.single('image'),(req,res) => {
	let updatedCampground = req.body.campground;
	geocoder.geocode(updatedCampground.location, (err, data) => {
		if (err || !data.length) {
		req.flash('error', "Geocoding error: "+err.message);
		return res.redirect('back');
		}
		else {
			updatedCampground.lat = data[0].latitude
							.lng = data[0].longitude
							.location = data[0].formattedAddress;
			if(!req.file) {
				req.flash('error','Please upload an accepted file type');
				res.redirect('back');
			}
			else {
				cloudinary.uploader.upload(req.file.path, {public_id:req.body.publicId}, (err,result) => {
					if(err) {
						req.flash('error',"Image Upload Error: "+err.message);
						res.redirect('back');
					}
					else {
						Campground.findByIdAndUpdate(req.params.id,{
							updatedCampground,
							'image.url':result.url,
							'image.publicId':result.public_id
						},(err,changedCampground) => {
							if(err) {
								req.flash('error',"Campground Update Error: "+err.message);
								res.redirect('back');
							}
							else if(!changedCampground) {
								req.flash('error','Campground not updated');
								res.redirect('back');
							}
								else {
									req.flash('success','Campground successfully updated!');
									res.redirect('/campgrounds/'+changedCampground.id);
							}
						});
					}
				});
			}
		}
	});
});

//delete route
router.delete('/:id',middleware.checkCampgroundOwnership,(req,res) => {
	try {
		Campground.findById(req.params.id, (err,foundCampground) => {
			if(err) {
				req.flash('error',err.message);
				res.redirect('back');
			}
			else {
				cloudinary.api.delete_resources(foundCampground.image.publicId, (err) => {
					if(err) {
						req.flash('error',err.message);
						res.redirect('back');
					}
					else {
						Campground.findByIdAndRemove(req.params.id,(err) =>{
							if(err){
								res.redirect('back');
							}
							else {
								req.flash('success','Campground deleted');
								res.redirect('/campgrounds');
							}
						});
					}
				});
			}
		});
	}
	catch (err) {
		console.log(err)
		req.flash('error','There was a problem removing this campground, please try again later');
		res.redirect('back');
	}
});
	

module.exports = router;
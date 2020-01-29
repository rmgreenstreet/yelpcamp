function escapeRegex(text) {
	return text.replace(/[-\]{}()*+?.,\\^$!#\s]/g,"\\$&");
};

const express = require('express'),
	  router = express.Router({mergeParams:true}),
	  Campground = require("../models/campground.js"),
	  Notification = require("../models/notification.js"),
	  middleware = require('../middleware'), 
	  NodeGeocoder = require('node-geocoder'),
	  cloudinary = require('cloudinary').v2,
	  multer = require('multer'),
	  User = require('../models/user'),
	  async = require('async');
const mbxGeocoding = require ('@mapbox/mapbox-sdk/services/geocoding');
const geocodingClient = mbxGeocoding({accessToken:process.env.MAPBOX_TOKEN});


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
	let search = "";
	if(req.query.searchTerm) {
		search = new RegExp(escapeRegex(req.query.searchTerm),'gi');
	}
	else {
		search = new RegExp(".");
	}
	Campground.find({name:search},(err,foundCampgrounds)=>{
		console.log(foundCampgrounds.length + " Campgrounds found");
		if(err){
			req.flash('error',"Search Error: "+err.message);
			res.redirect('back');
			console.log(err);
		}
		else if (foundCampgrounds.length < 1 ){
			req.flash('error','No campgrounds match that search. Please try again.');
			res.redirect('campgrounds/');
		}
		else {
			res.render('campgrounds/index.ejs',{campgrounds:foundCampgrounds, page:'campgrounds'});
		}
		
	});
});

//create - makes a new campground
router.get("/new",middleware.isLoggedIn, (req,res) => {
	res.render('campgrounds/new.ejs');
});



//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), async function (req, res) {
	console.log(req.body.campground);
	 try {
		// get data from form and add to campgrounds array
		const newCampground = req.body.campground;
		const image = await cloudinary.uploader.upload(req.file.path);
		newCampground.image = {url:image.secure_url,publicId:image.public_id};

		const locationData = await await geocodingClient.forwardGeocode({
			query:req.body.campground.location,
			limit:1
		})
		.send();
		console.log(locationData.body.features[0]);
		const author = {
			id: req.user._id,
			username: req.user.username
		}
		newCampground.location = locationData.body.features[0].place_name;
		newCampground.lat = locationData.body.features[0].geometry.coordinates[1];
		newCampground.lng = locationData.body.features[0].geometry.coordinates[0];
		newCampground.author = author;
		console.log(newCampground);

	   let campground = await Campground.create(newCampground);
	   let user = await User.findById(req.user._id).populate('followers').exec();
	   let newNotification = {
		 username: req.user.username,
		 campgroundId: campground.id
	   }
	   for(const follower of user.followers) {
		 let notification = await Notification.create(newNotification);
		 follower.notifications.push(notification);
		 follower.save();
	   }
 
	   //redirect back to campgrounds page
	   res.redirect(`/campgrounds/${campground.id}`);
	 } catch(err) {
		 console.log(err);
	   req.flash('error', err.message);
	   res.redirect('back');
	 }
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
								cloudinary.uploader.destroy({public_id:result.public_id});
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
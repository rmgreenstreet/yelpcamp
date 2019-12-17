
const express = require('express'),
	  router = express.Router({mergeParams:true}),
	  Campground = require("../models/campground.js"),
	  Comment = require("../models/comment.js"),
	  passport= require("passport"),
	  User = require("../models/user.js"),
	  middleware = require('../middleware'), 
	  NodeGeocoder = require('node-geocoder');
 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODING_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

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
router.post("/", middleware.isLoggedIn, function(req, res){
  // get data from form and add to campgrounds array
  var name = req.body.name;
  var image = req.body.image;
  var desc = req.body.description;
  var author = {
      id: req.user._id,
      username: req.user.username
  };
	var price = req.body.price;
  geocoder.geocode(req.body.location, (err, data) => {
    if (err || !data.length) {
      req.flash('error', err.message);
      return res.redirect('back');
    }
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
	  
	// var place_id = data[0].place_id;
	  
    var newCampground = {name: name, image: image, description: desc, author:author, price:price, location: location, lat: lat, lng: lng};
    // Create a new campground and save to DB
    Campground.create(newCampground, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to campgrounds page
            console.log(newlyCreated);
            res.redirect("/campgrounds");
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
router.get('/:id/edit',middleware.checkCampgroundOwnership,(req,res) => {
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

router.put('/:id',middleware.checkCampgroundOwnership,(req,res) => {
	//find and update the correct campground
	geocoder.geocode(req.body.location, function (err, data) {
		if (err || !data.length) {
		  req.flash('error', 'Invalid address');
		  return res.redirect('back');
		}
		req.body.campground.lat = data[0].latitude;
		req.body.campground.lng = data[0].longitude;
		req.body.campground.location = data[0].formattedAddress;
		
		// req.body.campground.place_id = data[0].place_id;
		
		Campground.findByIdAndUpdate(req.params.id, req.body.campground, (err,updatedCampground) => {
			if(err) {
				res.redirect('back');
			}
			else {
				res.redirect('/campgrounds/'+req.params.id);
			}
		});
	});
});

//delete route
router.delete('/:id',middleware.checkCampgroundOwnership,(req,res) => {
	Campground.findByIdAndRemove(req.params.id,(err) =>{
		if(err){
			res.redirect('back');
		}
		else {
			req.flash('success','Campground deleted');
			res.redirect('/campgrounds');
		}
	});
});
	

module.exports = router;
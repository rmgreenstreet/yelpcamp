
const express = require('express'),
	  router = express.Router({mergeParams:true}),
	  Campground = require("../models/campground.js"),
	  Comment = require("../models/comment.js"),
	  passport= require("passport"),
	  User = require("../models/user.js"),
	  middleware = require('../middleware');

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

//post route
router.post("/",middleware.isLoggedIn, (req,res) => {
	//get data from form  and add to campgrounds array
	//redirect back to campgrounds page
	var name=req.body.name;
	var image=req.body.image;
	var desc=req.body.description;
	var author = {
		id:req.user._id,
		username:req.user.username
	};
	var price = req.body.price;
	var newCampground = {name:name, image:image, description:desc, author:author, price:price};
	//create new campground and save to database
	Campground.create(newCampground,(err,newlyCreated)=> {
		if(err){
			console.log(err);
		}
		//redirect back to campgrounds
		else {
			req.flash('success','Campground has been created');
			res.redirect("/campgrounds");
		}
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
	Campground.findByIdAndUpdate(req.params.id, req.body.campground, (err,updatedCampground) => {
		if(err) {
			res.redirect('back');
		}
		else {
			res.redirect('/campgrounds/'+req.params.id);
		}
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
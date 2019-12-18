
const express 		= require('express'),
	  router 		= express.Router({mergeParams:true}),
  	  Campground 	= require("../models/campground.js"),
	  Comment 		= require("../models/comment.js"),
	  passport		= require("passport"),
	  User 			= require("../models/user.js"),
	  middleware 	= require('../middleware'),
	  mongoose 		= require('mongoose');

//root route
router.get("/", (req,res) => {
	res.render('home.ejs');
});

module.exports = router;
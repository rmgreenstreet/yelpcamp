


const express = require('express'),
	  router = express.Router({mergeParams:true}),
	  Campground = require("../models/campground.js"),
	  Comment = require("../models/comment.js"),
	  passport= require("passport"),
	  User = require("../models/user.js"),
	  middleware = require('../middleware');

//comments new
router.get("/new", middleware.isLoggedIn, (req,res) => {
	//find campground by id
	Campground.findById(req.params.id, function(err, campground) {
    if(err) {
      console.log(err);
    } else {
      res.render("comments/new", {campground: campground});
    }
  });
});

//comments create
router.post("/", middleware.isLoggedIn, (req,res) => {
	//lookup campground using ID
	Campground.findById(req.params.id, (err,campground) => {
		if(err){
			req.flash('error','Something went wrong, please try again');
			console.log(err);
			res.redirect("/campgrounds/"+campground._id);
		}
		else {
			Comment.create(req.body.comment, (err,comment) => {
				if (err){
					console.log(err);
				}
				else {
					//add username and ID to comment
					comment.author.id=req.user._id;
					comment.author.username=req.user.username;
					//save the comment
					comment.save();
					
					campground.comments.push(comment);
					campground.save();
					req.flash('success','Comment added');
					res.redirect("/campgrounds/"+campground._id);
				}
			});
		}
	});
});

//edit route
router.get("/:comment_id/edit",middleware.checkCommentOwnership,(req,res) => {
	var campground_id = req.params.id;
	Comment.findById(req.params.comment_id, (err,foundComment) => {
		if(err) {
			res.redirect('back');
		}
		else {
			res.render('./comments/edit.ejs',{campground_id:campground_id,foundComment:foundComment});
		}
	})
});

//update route
router.put("/:comment_id/",middleware.checkCommentOwnership,(req,res) => {
	var campground_id = req.params.id;
	Comment.findByIdAndUpdate(req.params.comment_id,req.body.updatedComment, (err,foundComment) => {
		if(err) {
			res.redirect('back');
		}
		else {
			res.redirect('/campgrounds/'+campground_id);
		}
	});
});

//destroy route
router.delete('/:comment_id',middleware.checkCommentOwnership,(req,res) => {
	var campground_id = req.params.id;
	Comment.findByIdAndRemove(req.params.comment_id, (err) => {
		if(err) {
			res.redirect('back');
		}
		else {
			req.flash('success','Comment deleted');
			res.redirect('back');
		}
	});
});

module.exports = router;
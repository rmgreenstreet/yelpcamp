const Campground = require("../models/campground.js"),
	  Comment = require("../models/comment.js");

let middlewareObj = {};
//middleware
middlewareObj.isLoggedIn = function (req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
	req.flash("error","You must be logged in to do that");
  	res.redirect("/login");
}

middlewareObj.checkCampgroundOwnership = function (req,res,next) {
	if(req.isAuthenticated()){
		Campground.findById(req.params.id, (err,foundCampground) => {
			if(err) {
				req.flash('error','Something went wrong, please try again');
				res.redirect("back");
			}
			else {
				if((foundCampground.author.id.equals(req.user._id)) || (req.user.isAdmin)){
					next();
				}
				else {
					req.flash('error','This campground does not belong to you');
					res.redirect('back');
				}
			}
		});
	}
	else {
		req.flash('error','You must be logged in to do that');
		res.redirect('back');
	}
}

middlewareObj.checkCommentOwnership = function (req,res,next) {
	if(req.isAuthenticated()){
		Comment.findById(req.params.comment_id, (err,foundComment) => {
			if(err) {
				req.flash('error','Something went wrong, please try again');
				res.redirect("back");
			}
			else {
				if((foundComment.author.id.equals(req.user._id)) || (req.user.isAdmin)){
					next();
				}
				else {
					req.flash('error','This comment does not belong to you');
					res.redirect('back');
				}
			}
		});
	}
	else {
		req.flash('error','You must be logged in to do that');
		res.redirect('back');
	}
}

middlewareObj.checkProfileOwnership = function (req,res,next) {
	if(req.isAuthenticated()) {
		User.findByID(req.user.id, (err,foundUser) =>{
			if(err) {
				req.flash('error',err.message);
				res.redirect('back');
			}
			else {
				if((foundUser.id.equals(req.user._id)) || (req.user.isAdmin)){
					next();
				}
				else{
					req.flash('error','This profile does not belong to you');
					res.redirect('back');
				}
			}
		})
	}
	else {
		req.flash('error','You must be logged in to do that');
		res.redirect('/login');
	}
}

module.exports = middlewareObj;
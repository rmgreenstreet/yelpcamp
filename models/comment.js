const mongoose 		= require("mongoose"),
  Campground		= require('./campground.js');

var commentSchema = new mongoose.Schema({
    text: String,
    author: {
		id: {
			type: mongoose.Schema.Types.ObjectID,
			ref:"User"
		},
		username:String
	}
});
 
module.exports = mongoose.model("Comment", commentSchema);
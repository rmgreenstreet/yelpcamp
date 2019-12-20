const mongoose 	= require('mongoose'),
	  Comment 	= require('./comment.js');


const campgroundSchema = new mongoose.Schema({
	name:String,
	image:{
		url:{
			type:String, 
			default:'https://res.cloudinary.com/rgreenstreet/image/upload/v1576869271/bonfire-1867275_640_bw3nhf.jpg'
		},
		publicId:String
	},
	description:String,
	created: {
		type:Date, default:Date.now
	},
	location:String,
	lat:Number,
	lng:Number,
	comments:[
		{
			type:mongoose.Schema.Types.ObjectId,
			ref: "Comment"
		}
	],
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username:String
	},
	price:Number
});

var Campground = mongoose.model("Campground",campgroundSchema);
module.exports = Campground;
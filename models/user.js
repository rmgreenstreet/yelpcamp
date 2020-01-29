const 	mongoose 					= require('mongoose'),
		passportLocalMongoose 	= require('passport-local-mongoose'),
		Notification = require('./notification');


const UserSchema = new mongoose.Schema({ 
	username:{type:String,unique:true,required:true},
	email:{type:String,unique:true,required:true},
	resetPasswordToken:String,
	resetPasswordExpires:Date,
	// isAdmin:{type:Boolean,default:false},
	image:{
		url:{
			type:String,
			default:'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png'}
			,
		publicId:String
	},
	followers: [
		{type: mongoose.Schema.Types.ObjectId,
		ref:'User'}
	],
	notifications: [
		{type: mongoose.Schema.Types.ObjectId,
		ref:'Notification'}
	]
});

UserSchema.plugin(passportLocalMongoose);

module.exports= mongoose.model("User", UserSchema);
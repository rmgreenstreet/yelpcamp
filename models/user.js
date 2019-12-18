const 	mongoose 					= require('mongoose'),
		passportLocalMongoose 	= require('passport-local-mongoose');


const UserSchema = new mongoose.Schema({ 
	username:String,
	password:String,
	isAdmin:{type:Boolean,default:false},
	image:{type:String, default:'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png'}
});

UserSchema.plugin(passportLocalMongoose);

module.exports= mongoose.model("User", UserSchema);
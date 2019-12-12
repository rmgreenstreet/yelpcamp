var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/cats");

var catSchema = new mongoose.Schema({
	name:String,
	age:Number,
	temperament:String
});

var Cat = mongoose.model("Cat", catSchema);

// var george = new Cat({
// 	name:"George",
// 	age:11,
// 	temperament: "Snuggly"
// });

// var george = new Cat({
// 	name:"Mrs. Norris",
// 	age:51,
// 	temperament: "Vindictive"
// });

// george.save((err,cat) => {
// 	if(err){
// 		console.log("Something went wrong!");
// 		console.log(err);
// 	}
// 	console.log("Cat added:");
// 	console.log(cat);
// });

Cat.find({},(err,cat) => {
	if(err){
		console.log("Uh oh:");
		console.log(err);
	}
	console.log(cat);
});

Cat.create({
	name:"Tibbles",
	age:15,
	temperament:"Bland"
},(err,cat) =>{
	if(err){
		console.log("Uh oh:");
		console.log(err);
	}
	console.log(cat);
});
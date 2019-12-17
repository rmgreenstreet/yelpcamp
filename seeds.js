const mongoose 		= require("mongoose"),
	  Campground 	= require("./models/campground.js"),
	  Comment   	= require("./models/comment.js"),
	  seeds = [
    {
        name: "Turkey Point", 
        image: "https://farm4.staticflickr.com/3795/10131087094_c1c0a1c859.jpg",
        description: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum",
		author: {
			id:"5deff8bd60ff5c04a8727abc",
			username:"Joe Schmoe"
		},
		price:12,
		location:"30967 Turkey Point Prkwy, Osage City, KS 66523",
		lat:38.551001,
		lng:-95.859732,
    },
    {
        name: "Desert Mesa", 
        image: "https://farm6.staticflickr.com/5487/11519019346_f66401b6c1.jpg",
        description: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum",
		author: {
			id:"5deff8bd60ff5c04a8727abc",
			username:"Joe Schmoe"
		},
		price:15,
		location:"Cliff Palace Loop, Mesa Verde National Park, CO 81330",
		lat:37.169037,
		lng:-108.470609,
    },
    {
        name: "Canyon Floor", 
        image: "https://farm1.staticflickr.com/189/493046463_841a18169e.jpg",
        description: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum",
		author: {
			id:"5deff8bd60ff5c04a8727abc",
			username:"Joe Schmoe"
		},
		price:30,
		location:"40 S Kaibab Trail, Grand Canyon Village, AZ 86023",
		lat:36.091558,
		lng:-112.086602,
    }
];
 
async function seedDB(){
	try {
	await Comment.deleteMany({});
	console.log('Campgrounds removed');
	await Campground.deleteMany({});
	console.log('Comments removed');
	for(var seed of seeds) {
		let campground = await Campground.create(seed);
		console.log('Campground created');
		let comment = await Comment.create(
			{
				text: "This place is great, but I wish there was internet",
				author: {
						id: "5deff8bd60ff5c04a8727abc",
						username:"Homer"
					}
			});
		console.log('Comment created');
		campground.comments.push(comment);
		campground.save();
		console.log('Comment added to the created campground');
	};
	}
	catch(err) {
		console.log(err);
	}
};
 
module.exports = seedDB;
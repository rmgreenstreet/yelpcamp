
const express 		= require('express'),
	  router 		= express.Router({mergeParams:true});

//root route
router.get("/", (req,res) => {
	res.render('home.ejs');
});

module.exports = router;
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({ 
    isRead:{
        type:Boolean,
        default:false
    },
    campgroundId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'Campground'
    },
    username:String
});

module.exports= mongoose.model("Notification", NotificationSchema);
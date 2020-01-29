const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({ 
    isRead:{
        type:Boolean,
        default:false
    },
    campgroundId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'Campground'
    }
});

module.exports= mongoose.model("Notification", NotificationSchema);
import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema({

title:{
type:String,
required:true
},

className:{
type:String,
required:true
},

subject:{
type:String,
required:true
},

facultyName:{          // ✅ NEW FIELD
type:String,
required:true
},

youtubeLink:{
type:String,
required:true
},

createdAt:{
type:Date,
default:Date.now
}

});

export default mongoose.model("Lecture",lectureSchema);
import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema({

title:{
type:String,
required:true
},

subject:{
type:String,
required:true
},

facultyName:{
type:String,
required:true
},

youtubeLink:{
type:String,
required:true
},

// Target audience filters
college: {
type: String,
required: true,
enum: ['Degree College', 'Junior College']
},

course: {
type: String,
required: true
},

stream: {
type: String,
enum: ['Commerce', 'Arts'],
required: function() {
return this.college === 'Junior College';
}
},

degree: {
type: String,
required: function() {
return this.college === 'Degree College';
}
},

year: {
type: String,
required: true,
enum: ['FY', 'SY', 'TY']
},

semester: {
type: Number,
required: function() {
return this.college === 'Degree College';
},
min: 1,
max: 6
},

createdAt:{
type:Date,
default:Date.now
}

});

export default mongoose.model("Lecture",lectureSchema);
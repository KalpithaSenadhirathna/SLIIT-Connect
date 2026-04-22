const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ReminderSchema = new mongoose.Schema({
  /*text: {
      type: String,
      default: null 
    },*/
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "session",
    default: null 
  },
  Name: String,
  dateHappened: Date,
  message: String,
  
}, { _id: false });

const AttendanceSchema = new Schema(
  {
    stuId: {
      type: String,
      required: true
    },
    stuName: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["Participating", "Not participating", "May be"],
      required: true
    },
  },
  { _id: false }
);

const sessionSchema = new Schema({
    
    ID:{
        type: Number,
        default: null 
    },
    Name:{
        type: String,
        default: null 
    },
    
    Description:{
        type: String,
        required : true
    },
    Year:{
        type: String,
        required : true
    },
    Semester:{
        type: String,
        required : true
    },
    Module:{
        type: String,
        required : true
    },


    Category:{
        type: String,
        default: null 
    },
    Link:{
        type: String,
        default: null 
    },
    Location:{
        type: String,
        default: null 
    },
    hall:{
        type: String,
        default: null 
    },

    Date:{
        type: Date,
        required : true
    },
    Time:{
        type: String,
        default: null
    },
    
    Mode:{
        type: String,
        default: null  
    },
    Reminder:{
        type: ReminderSchema,
        default: null 
    },
    attendance: {
        type: [AttendanceSchema],
        default: [] 
    }



})

const Session = mongoose.model("Session", sessionSchema);
module.exports = Session;
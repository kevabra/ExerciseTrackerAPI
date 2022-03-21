const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config

var bodyParser = require("body-parser");
const mongoose = require("mongoose");
const {mongodb, ObjectId} = require("mongodb");
const mySecret = "mongodb+srv://Kevin:ultraultra@cluster0.bx5tm.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

mongoose.connect(mySecret, {useNewUrlParser: true, useUnifiedTopology: true});
const {Schema} = mongoose;
let UserSchema = new Schema({
  username: String,
  _id: String // mongoose.ObjectId
}, {versionKey: false});

let ExerciseSchema = new Schema({
  username: String,
  _id: String,
  description: String,
  duration: Number,
  date: String
}, {versionKey: false});

let LogSchema = new Schema({
  username: String,
  count: Number,
  _id: String,
  log: Array
}, {versionKey: false});

let Users = mongoose.model('Users', UserSchema);
let ExerciseModel = mongoose.model("ExerciseModel", ExerciseSchema);
let LogModel = mongoose.model("LogModel", LogSchema);
app.use(cors());
app.use(express.static('public'));


app.use(bodyParser.urlencoded({extended: true}));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/users", function(req, res) {
  console.log(req.body);
  let object_id = ObjectId();
  let user = new Users({
    username: req.body.username,
    _id: object_id
  });
  let exercise_object = new ExerciseModel({
          username: user.username,
          description: "",
          duration: 0,
          date: new Date(),
          _id: user._id
        });
  let log_object = new LogModel({
      username: user.username,
      _id: user._id,
      count: 0,
      log: []
    });
  user.save();
  exercise_object.save();
  log_object.save();
  res.json(user);
});

app.get("/api/users", function(req, res) {
  let arrayOfUsers;
  let users = Users.find({}, function(err, data) {
    console.log("data: " + data);
    arrayOfUsers = data;
    console.log("array of users: " + arrayOfUsers);
    res.send(arrayOfUsers);
    return arrayOfUsers;
  });
  
});

app.post("/api/users/:_id/exercises", function(req, res) {
  let exercise_object, log_object;
  let description = req.body.description + "";
  let duration = Number(req.body.duration);
  
  
  Users.findById(req.params._id, function(err, data) {
    let date_entered = req.body.date + "";
    let d;
    if (date_entered.trim() == "" || date_entered == null) {
      d = Date.now();
      d = new Date(d).toDateString();
    }
    else {
      d = date_entered;
      d = new Date(d).toDateString();
    }
    console.log("data._id: " + data._id);
    ExerciseModel.findById(data._id, function(err, exerciseInfo) {
      if (exerciseInfo != null) {
        exerciseInfo.username = data.username;
        exerciseInfo.description = description;
        exerciseInfo.duration = duration;
        exerciseInfo.date = d;
        exercise_object = exerciseInfo;
      }
      else {
        exercise_object = new ExerciseModel({
          username: data.username,
          description: description,
          duration: duration,
          date: d,
          _id: data._id
        });
      }
      let exerciseData = { description: req.body.description, duration: Number(req.body.duration), date: d};
      LogModel.findById(data._id, function(err, logdata) {
        logdata.log = (logdata.log != null) ?         [...logdata.log, exerciseData] : [exerciseData];
        logdata.count = logdata.log.length;
        logdata.save();
      });
      exercise_object.save();
      res.json(exercise_object);
  });
      
    });
    
    
    
});

app.get("/api/users/:_id/exercises", function(req, res) {
  ExerciseModel.findById(req.params._id, function(err, data) {
    res.json(data);
  });
});

app.get("/api/users/:_id/logs", function(req, res) {
  LogModel.findById(req.params._id, function(err, data) {
    let log_object = data;
    
    log_object.count = log_object.log.length;

    
    if (req.query.from == null && req.query.to == null && req.query.limit == null) {
    log_object.save();
    console.log("log object: " + log_object);
    res.json(log_object);
    }
    else {
      let from = (req.query.from != null) ? req.query.from + "" : "1970-01-01";
      let to = (req.query.to != null) ? req.query.to + "" : "9999-12-30";
      let limit = (req.query.limit != null) ? Number(req.query.limit) : Number(log_object.log.length);

      let from_date = new Date(from);
      let to_date = new Date(to);

      let from_time = from_date.getTime();
      let to_time = to_date.getTime();

      let current_total = 0;
      let newLogArray = [];
      for (let i = 0; i < log_object.log.length; i++) {
        let current = log_object.log[i]['date'];
        let current_date = new Date(current);
        let current_time = current_date.getTime();

        if (current_total == limit)
          break;
  
        if (current_time >= from_date && current_time <= to_date) {
 
          
          newLogArray = [...newLogArray, log_object.log[i]];
          console.log("log obj: " + log_object.log[i]);
          current_total++;
        }
      }

      log_object.log = newLogArray;
      let newObj = log_object;
      
      console.log("new log array: " + newLogArray);
      console.log("new obj: " + newObj);
      res.json(newObj);
    }
  });
});

/*
if (req.query.from == null && req.query.to == null && req.query.limit == null) {
      res.json(log_object);
    }
    let from = (req.query.from != null) ? req.query.from + "" : "1970-01-01";
  let to = (req.query.to != null) ? req.query.to + "" : "9999-12-30";
  let limit = (req.query.limit != null) ? req.query.limit : log_object.log.length;
  console.log("limit: " + limit);

  // use getTime for each of the date objects
  // for a given date to lie between the range of the from date and the to date its getTime must be greater than or equal to the getTime of the from date and less than or equal to the getTime of the to date

  let date_values = [];
  LogModel.findById(req.params._id, function(err, data) {
    let log_object = data;
    console.log("log obj: " + log_object);

    
    let logArray = log_object.log;

    let newLogArray = [];

    let from_date = new Date(from);
    let to_date = new Date(to);

    let from_time = from_date.getTime();
    let to_time = to_date.getTime();

    let current_total = 0;
    console.log("log array length: " + log_object.log.length);
    for (let i = 0; i < log_object.log.length; i++) {
      let date_string = log_object.log[i]['date'];
      let date_object = new Date(date_string);
      let date_time = date_object.getTime();

      console.log("date time: " + date_time);
      console.log("from time: " + from_time);
      console.log("to time: " + to_time);

      if (current_total == limit)
        break;

      if (date_time >= from_date && date_time <= to_date) {
        newLogArray = [...newLogArray, log_object.log[i]];
        console.log("log obj: " + log_object.log[i])
        current_total++;
      }
    }
    log_object.log = newLogArray;
    let newObj = log_object;
    console.log("new log array: " + newLogArray);
    console.log("new obj: " + newObj);
    res.json(newObj);
  });
});
*/

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});

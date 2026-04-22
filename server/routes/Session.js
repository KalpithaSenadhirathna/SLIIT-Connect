const router = require("express").Router();
const Session = require("../models/session");
let session = require("../models/session");

router.route("/add").post((req,res) => {
    //const ID = Number(req.body.ID);
    const Name = req.body.Name;
    const Description = req.body.Description;
    const Year = req.body.Year;
    const Semester = req.body.Semester;
    const Module = req.body.Module;
    const Category = req.body.Category;
    const Link = req.body.Link;
    const Location = req.body.Location;
    const hall = req.body.hall;
    const sessionDate = req.body.Date;
    const Time = req.body.Time;
    const Reminder = req.body.Reminder;
   // const Mode = req.body.Mode;

    const newSession = new session({
        //ID,
        Name,
        Description,
        Year,
        Semester,
        Module,
        Category,
        Link,
        Location,
        hall,
        //Date: new Date(Date),
        Date: new Date(sessionDate),
        Time,
       // Mode
       Reminder
    })

    newSession.save().then( () => {
        res.json("Session added")
    }).catch( (err) => {
        //console.log(err);
        console.error("ERROR:", err.message);   
    res.status(500).json({ message: err.message });
    })
})

router.route("/").get((req,res) => {
    session.find().then((session) => {
        res.json(session)
    }).catch((err) => {
        console.log(err)
    })
})




router.route("/update/:id").put(async(req,res) =>{
    try{
    let itemId = req.params.id;
    const {Name,Description,Year,Semester,Module,Category,Link,Location,hall,Date,Time} = req.body;

    const updateSession = {
       // ID,
        Name,
        Description,
        Year,
        Semester,
        Module,
       Category,
       Link,
       Location,
       hall,
        Date,
        //Date: new Date(sessionDate),
        //Date: Date ? new Date(Date) : undefined,
        Time,
        //Mode
        //Reminder
    }
    const update = await session.findByIdAndUpdate(itemId, updateSession,{ new: true });

    if (!update) {
        return res.status(404).json({ status: "Session not found" });
    }
        res.status(200).send({status:"session updated", item: update});
    

    }catch(err){
        console.log(err);
        res.status(500).send({status: "Error in updating", error: err.message});
    }
    
    

})


router.put("/addReminder/:id", async (req, res) => {
  try {
    const { Name, dateHappened, message } = req.body;

    if (!Name || !dateHappened || !message) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: "Record not found" });

    //const now = new Date();
    
    
   /* if (!session.current) {
      return res.status(400).json({ message: "Current record does not exist" });
    }*/

    /*session.current.Reminder = {
      Name: String,
  dateHappened: Date,
  message: String,
      
    };*/
    session.Reminder = {
      sessionId: session._id,
      Name: Name,
      dateHappened: new Date(dateHappened),
      message: message
    };

    await session.save();

    res.json({ message: "Reminder added successfully", data: session });
  } catch (err) {
    console.error("Error saving reminder:", err);
    res.status(500).json({ message: "Failed to add Reminder", error: err.message });
  }
});


router.put("/addAttendance/:id", async (req, res) => {
  try {
    const { stuId,stuName, status } = req.body;
    /*const updatedRecord = await session.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          attendance: { stuId, stuName, status }   
        }
      }, 
      { new: true }           
    );
    res.json(updatedRecord);*/
    const sessionDoc = await Session.findById(req.params.id);
    if (!sessionDoc) return res.status(404).json({ message: "Session not found" });

    
    if (!Array.isArray(sessionDoc.attendance)) {
      sessionDoc.attendance = [];
    }

    sessionDoc.attendance.push({ stuId, stuName, status });
    await sessionDoc.save();

    res.json(sessionDoc);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});



router.route("/delete/:id").delete(async(req,res) => {
    let itemId = req.params.id;
    await session.findByIdAndDelete(itemId).then(() => {
        res.status(200).send({status: "deleted successfully"});
    }).catch((err) => {
        console.log(err.message);
        res.status(500).send({status: "error in deleting", error: err.message});
    })
})




router.route("/get/:id").get(async(req,res) => {
    try{
    let itemId = req.params.id;
    //await stock.findOne(Name)
    const item = await session.findById(itemId);

    if (!item) {
        return res.status(404).json({ message: "Session not found" });
    }
        res.status(200).send({status: "fetched" , data: item});
    }catch(err){
        console.log(err.message);
        res.status(500).send({status: "error in fetching", error: err.message});
    }
    
})





module.exports = router;
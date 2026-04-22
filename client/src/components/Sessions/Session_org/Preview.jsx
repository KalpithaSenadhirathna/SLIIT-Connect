import { useState, useRef ,useEffect } from "react";
//import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios"; 



export default function Preview() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const cardRef = useRef();

   const [inputs,setInputs] = useState(state ||{
          Name: "",
             Description: "",
             Year: "",
             Semester: "",
             Module: "",
             Category: "",
             Link: "",
             Location: "",
             hall: "",
             Date: "",
             Time: ""
  
      });
  if (!state) return <p>No preview data available.</p>;

  const { Name,Description, Year,Semester,Module,Category,Link,Location,hall,Date: sessionDate,Time } = state || {};



  const handleEdit = () => navigate(-1/*"/Questions"*/, { state: {
      Name,Description,Year,Semester,Module,Date: inputs   
    }});
  const handleConfirm = (e) => {
 
      
        e.preventDefault();
        console.log(inputs);
       
        sendRequest().then(() => navigate('/AddSession'));
    

    
  };

    const sendRequest = async () => {
  try {
    const res = await axios.post("http://localhost:5000/api/sessions/add", {
      Name: inputs.Name,
      Description: inputs.Description,
      Year: inputs.Year,
      Semester: inputs.Semester,
      Module: inputs.Module,
      Category: inputs.Category,
      Link: inputs.Link,
      Location: inputs.Location,
      hall: inputs.hall,
      Date: new Date(inputs.Date), // convert string to Date
      Time: inputs.Time
    });

    console.log("Response from server:", res.data); 
    alert("Submitted successfully!");
    return res.data;

  } catch (error) {
    if (error.response) {
      console.error("Server responded with:", error.response.data);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }
    alert("Failed to add session. Check backend server.");
  }
};
const containerStyle = {
   backgroundColor: "#e6f2ff",
      //backgroundImage: "url('https://wallpaperaccess.com/full/960592.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      minHeight: "100vh",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    };

const cardStyle = {
  backgroundColor: "white",
  padding: "20px",
  borderRadius: "8px",
  lineHeight: "1.6",
  textAlign: "left",
  fontSize: "20px",
  animation: "card-entrance 0.8s var(--ease-out-quart) forwards",
  position: "relative",
   boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
   gap:"20px"
};



  return (
    
    
     <div >
      
    <div style={{ fontFamily: "Segoe UI", /*backgroundColor: "#e6f2ff",*/ minHeight: "100vh" }}>
      

     
      <div
        style={{
          maxWidth: "700px",
          margin: "80px auto",
          background: "white",
          borderRadius: "15px",
          padding: "30px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ textAlign: "center", fontSize:"30px" }}><b>Preview Your Details</b></h2>
<br></br>


                <div
          //key={index}
          //ref={cardRef}
          //className="card"
          style={cardStyle}
         
        >
       
        <p><b>Session name:</b> {Name}</p>
        </div>
        
        <div style={cardStyle}>
        <p><b>Description: </b> {Description}</p>
        </div>
        <div style={cardStyle}>
        <p><b>Year:</b> {Year}</p>
        </div>
        <div style={cardStyle}>
        <p><b>Semester:</b> {Semester}</p>
        </div>
        <div style={cardStyle}>
        <p><b>Module:</b> {Module}</p>
        </div>
        <div style={cardStyle}>
                                    <p><b>Category:</b> {Category}</p>
                                    </div>


                                  {Category === "online" && (
                                  <div style={cardStyle}>
                                   <p><b>Meeting Link:</b></p>
                                      <a
                                       href={Link}
                                       target="_blank"
                                           rel="noopener noreferrer"
                                      >
                                        {Link}
                                      </a>
                                    </div>
                                  )}

                                {Category === "physical" && (
                                         <div style={cardStyle}>
                                 <p><b>Location:</b> {Location}</p>
                                <p><b>Hall:</b> {hall}</p>
                                      </div>
                                    )}
        <div style={cardStyle}>
        <p><b>Date:</b> {sessionDate}</p>
        </div>
        <div style={cardStyle}>
                                    <p>Time: {Time}</p>
                                    </div>

        <div style={{ marginTop: "30px", textAlign: "center" }}>
          <button
            onClick={handleEdit}
            style={{
              backgroundColor: "#aaa",
              color: "white",
              border: "none",
              padding: "10px 20px",
              marginRight: "10px",
              borderRadius: "6px",
              fontSize:"20px"
            }}
          >
            Edit
          </button>
          <button
            onClick={handleConfirm}
            style={{
              backgroundColor: "blue",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "6px",
              fontSize:"20px"
            }}
          >
            Confirm & Submit
          </button>
       
      </div>
</div>
      </div>
    </div>
  );
}


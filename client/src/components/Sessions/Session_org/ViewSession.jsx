import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from "axios";
import { useNavigate,Link ,useLocation,useParams} from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";


const containerStyle = {
        //backgroundImage: "url('https://images.freecreatives.com/wp-content/uploads/2016/04/Best-Website-New-Wallpaper.jpg')", // Background image URL
       //backgroundColor: "#e6f2ff",
        backgroundSize: "cover",
        backgroundPosition: "center",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        margin: "0",
        padding: "0",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: '30px',
        //fontWeight: 'bold'
    };

    const buttonStyle = {
      padding: '10px 15px',
        backgroundColor: '#100c35ff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold',
        width:"200px",
    };
const gridContainer = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr", // 2 columns
  gap: "20px",
  width: "100%",
   margin:"30px"

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

const formStyle = {
        backgroundColor: "rgba(231, 240, 241, 0.8)", // Semi-transparent background for form
        padding: "30px",
        //width: "600px",
        borderRadius: "10px",
        fontSize:"20px",
        marginLeft: "60px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        //float: "right",
        display: "flex",
        flexDirection: "column",
        justifyContent:"center",
        transition: "transform 0.3s ease, border-color 0.3s ease"
    };

    const inputStyle = {
        padding: "10px",
        borderRadius: "5px",
        border: "1px solid #ccc",
        width: "100%",
        fontSize: "16px"
    };

function SessionDashboard(){
  const navigate = useNavigate();
  const cardRef = React.createRef();
  const [newdata, setnewdata] = useState([]);
const location = useLocation();
const [filteredData, setFilteredData] = useState([]);
const ComponentsRef = useRef();
const [noResults, setNoResults] = useState(false);
const [inputs,setInputs] = useState({Reminder: "" });
const [user, setUser] = useState({
    username: "",
    gender: "",
    age: "",
    photo: "", 
    role:""
  });

const handleChange = (e) => {
        setInputs((prevState)=> ({
            ...prevState,
            [e.target.name]: e.target.value,
        }));
    }; 

    const { itemId } = useParams();

const fetchData = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/sessions/get/${itemId}`);

            console.log("API response:", response.data);

            
        /*const session = response.data;

        const selectedRecord = session.find(
          (item) => String(item._id) === String(id)
        );
            setnewdata(response.data);
            setFilteredData(response.data);
        } catch (error) {
            console.error("Error fetching data:", error);
            setnewdata([]);
            setFilteredData([]);
        }*/
       setFilteredData([response.data.data]); // only one record
  } catch (error) {
    console.error("Error fetching data:", error);
    setFilteredData([]);
  }
    };

    useEffect(() => {
  if (itemId) {
    fetchData();
  }
}, [itemId]); 

    const deleteHandler = async (_id) => {
        try {
            await axios.delete(`http://localhost:5000/api/sessions/delete/${_id}`);
            alert("Deleted successfully!");
            fetchData(); 
        } catch (error) {
            console.error("Error deleting stock:", error);
            alert("Failed to delete records. Please try again.");
        }
    };

    const handleReminderSubmit = async (e,session) => {
  e.preventDefault();

   if (filteredData.length === 0) {
    alert("No record selected.");
    return;
  }
 const currentRecord = filteredData[0];
  //console.log("Patient ID:", currentRecord.UserId?._id);
//console.log("Doctor ID:", localStorage.getItem("doctorId"));
console.log("Message:", inputs.Reminder);

 
   if (!inputs.Reminder || inputs.Reminder.trim() === "") {
    alert("Cannot send reminder. Enter the  message.");
    return;
  }

  try {

    console.log({
      sessionId: currentRecord._id,
      Name: currentRecord.Name,
      dateHappened: new Date(),
      message: inputs.Reminder,
      
    });
    await axios.put(
      `http://localhost:5000/api/sessions/addReminder/${currentRecord._id}`,
      {
        
        sessionId: currentRecord._id,
        Name: currentRecord.Name,
        dateHappened: new Date().toISOString(),
        message: inputs.Reminder,
        
      },
      /*{ withCredentials: true }*/
    );

    setFilteredData(prev =>
      prev.map(item =>
        item._id === currentRecord._id
          ? { ...item, current: { ...item.current, Reminder: { message: inputs.Reminder } } }
          : item
      )
    );
    setInputs(prev => ({ ...prev, Reminder: "" }));
    alert("Reminder added successfully!");
  } catch (error) {
    console.error("Error occurred while adding Reminder:", error);
    alert("Failed to add Reminder. Please try again.");
  }
};
  
const attendance = filteredData[0]?.attendance || [];

const participating = attendance.filter(
  s => s.status === "Participating"
).length;

const notParticipating = attendance.filter(
  s => s.status === "Not participating"
).length;

const maybe = attendance.filter(
  s => s.status === "May be"
).length;

const pieData = [
  { name: "Participating", value: participating },
  { name: "Not Participating", value: notParticipating },
  { name: "May be", value: maybe }
];

const COLORS = ["#4CAF50", "#F44336", "#FFC107"]; 
    return(
        <div>
            
     <div style={containerStyle}>
        <div style={{ display: "flex", minHeight: "100vh", width:"100%" }}>
     

      {/* Main Content */}
      
      <div
        style={{
          flex: 2,
          //backgroundColor: "#f5f5f5",
          padding: "40px",
        }}
      >
        <h1><center>Sessions</center></h1>
        <div /*style={gridContainer}*/className="groups-grid">

       {/* <div
          //key={index}
          //ref={cardRef}
          //className="card"
          style={cardStyle}
         
        >*/}

          
          {noResults ? (
                <div >
                    <p>No records Found</p>
                </div>
            ) : (
                <div ref={ComponentsRef} /*style={containerStyle}*/>

               
                    {filteredData && filteredData.length > 0 ? (
                        filteredData.map((data) => (
                          <motion.div
                                key={data._id}
                                //className="group-card"
                                //onClick={() => navigate(`/sessions/${data._id}`)}
                                style={{ cursor: 'pointer' }}
                                whileHover={{ y: -5 }}
                                transition={{ duration: 0.2 }}
                            >
                            <div key={data._id} style={cardStyle}>
                                <div /*style={containerStyle1}*/>
                                    <div className="card-image-wrapper">
           <img
    src={
      user.photo ||
      "https://cdn0.tnwcdn.com/wp-content/blogs.dir/1/files/2015/04/colortheory.jpg"
    }
    alt="Profile"
    /*style={{
      width: "100%",          // full width inside card
      height: "150px",        // rectangle height
      objectFit: "cover",     // crop nicely
      borderRadius: "10px" ,
      opacity: 0.55,   
    }}*/
   className="card-image"
  />
         </div><br></br>
                               <div className="card-content">
                                    <div style={cardStyle}>
                                    <p className="card-title"><b>name: </b>{data.Name}</p>
                                    </div>
                                    <br></br>
                                     <div style={cardStyle}>
                                    <p className="card-description">Description:   {data.Description}</p>
                                    </div>
                                    <br></br>
                                    <div style={cardStyle}>
                                    <p className="card-description">Year: {data.Year}</p>
                                    </div>
                                    <br></br>
                                    <div style={cardStyle}>
                                    <p className="card-description">Semester: {data.Semester}</p>
                                    </div>
                                    <br></br>
                                    <div style={cardStyle}>
                                    <p className="card-description">Module: {data.Module}</p>
                                    </div>
                                    <br></br>
                                    <div style={cardStyle}>
                                    <p className="card-description"><b>Category:</b> {data.Category}</p>
                                    </div><br></br>


                                  {data.Category === "online" && (
                                  <div style={cardStyle}>
                                   <p className="card-description"><b>Meeting Link:</b></p>
                                      <a
                                       href={data.Link}
                                       target="_blank"
                                           rel="noopener noreferrer"
                                      >
                                        {data.Link}
                                      </a>
                                    </div>
                                  )}
                                  <br></br>
                                {data.Category === "physical" && (
                                         <div style={cardStyle}>
                                 <p className="card-description"><b>Location:</b> {data.Location}</p><br></br>
                                <p className="card-description"><b>Hall:</b> {data.hall}</p>
                                      </div>
                                    )}<br></br>
                                    <div style={cardStyle}>
                                    <p className="card-description">Date: {data.Date}</p>
                                    </div><br></br>
                                    <div style={cardStyle}>
                                    <p className="card-description">Time: {data.Time}</p>
                                    </div>
                                    <br></br>
                                    <Link to={`/UpdateSession/${data._id}`}><button style={buttonStyle}>Update</button></Link>
                                    </div>
                                </div>
                            </div>
                            </motion.div>
                        ))
                    ) : (
                        <p>No records available</p>
                    )}
                    
                    <br></br>
                </div>
            )}
       {/*</div>*/}
        </div>
 
      </div>

      <div
        style={{
          flex: 0.5,
          backgroundColor: "#e8e8e8",
          //width: "400px",
          padding: "40px",
          borderRadius: '20px',
        }}
      >
        <form style={formStyle} onSubmit={handleReminderSubmit}>
  <p>Add Reminders for your session</p><br></br>
   <label>
          <textarea type="text" name="Reminder" style={inputStyle} value={inputs.Reminder || "" }/* checked={inputs.Reminder === "weekly"} */ onChange={handleChange}  />
          
          </label><br></br>
          
           
  <br />
  
          <button
            onClick={handleReminderSubmit}
            style={buttonStyle}
          >
            Submit
          </button>
        </form>
  
        <div style={{ marginTop: "40px", background: "white", padding: "20px", borderRadius: "10px" }}>
  <h2>Attendance Overview</h2>

  {attendance.length === 0 ? (
    <p style={{fontSize:"20px"}}>No attendance data available</p>
  ) : (
    <PieChart width={400} height={300}>
      <Pie
        data={pieData}
        cx="50%"
        cy="50%"
        outerRadius={100}
        dataKey="value"
        label
        fontSize="15px"
      >
        {pieData.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index]}/>
          
        ))}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  )}
</div>

</div>
            </div>

            
        </div>
        <style jsx>{`
                .groups-container {
                    padding: 30px 40px;
                    font-family: 'Inter', sans-serif;
                }

                @media (max-width: 1024px) {
                    .groups-container {
                        padding: 20px;
                    }
                }

                @media (max-width: 768px) {
                    .groups-container {
                        padding: 15px;
                    }
                    .filters-row {
                        flex-direction: column;
                        align-items: flex-start !important;
                        gap: 15px;
                    }
                    .search-box-premium {
                        width: 100%;
                        max-width: none;
                        order: 2;
                    }
                    .status-tabs {
                        width: 100%;
                        overflow-x: auto;
                        padding: 4px;
                        order: 1;
                    }
                    .header-actions {
                        width: 100%;
                        justify-content: space-between;
                        order: 3;
                    }
                    .groups-grid {
                        grid-template-columns: 1fr !important;
                    }
                }

                .groups-header-section {
                    margin-bottom: 30px;
                }

                .filters-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 20px;
                }

                .search-box-premium {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(10px);
                    border: 1px solid #e2e8f0;
                    border-radius: 30px;
                    display: flex;
                    align-items: center;
                    padding: 8px 16px;
                    gap: 10px;
                    flex: 1;
                    max-width: 400px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.02);
                    transition: all 0.3s ease;
                }

                .search-box-premium:focus-within {
                    background: white;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                    border-color: #20E3B2;
                }

                .search-icon {
                    color: #94a3b8;
                }

                .search-box-premium input {
                    border: none !important;
                    background: transparent !important;
                    width: 100% !important;
                    outline: none !important;
                    font-size: 0.95rem !important;
                    font-weight: 500 !important;
                    color: #1e293b !important;
                    padding: 0 !important;
                    box-shadow: none !important;
                }

                .status-tabs {
                    display: flex;
                    gap: 12px;
                    background: white;
                    padding: 8px;
                    border-radius: 30px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.02);
                }

                .status-pill {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    border: none;
                    background: transparent;
                    border-radius: 20px;
                    font-weight: 600;
                    font-size: 0.9rem;
                    color: #4a4a4a;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .status-pill .count {
                    background: #f0f0f0;
                    color: #666;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 0.8rem;
                    font-weight: 700;
                }

                .status-pill:hover {
                    background: #f8f9fa;
                }

                .status-pill.active.teaching {
                    background: #20E3B2; /* Vibrant mint green from reference */
                    color: white;
                }
                .status-pill.active.teaching .count {
                    background: rgba(255,255,255,0.9);
                    color: #20E3B2;
                }

                .status-pill.active.enrolled {
                    background: #1a1a1a;
                    color: white;
                }
                .status-pill.active.enrolled .count {
                    background: rgba(255,255,255,0.2);
                    color: white;
                }

                .status-pill.active.compliance {
                    background: #F2994A; /* Orange */
                    color: white;
                }
                .status-pill.active.compliance .count {
                    background: rgba(255,255,255,0.2);
                    color: white;
                }


                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }

                .create-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background-color: var(--primary);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 0.95rem;
                    cursor: pointer;
                    transition: background-color 0.2s;
                    box-shadow: 0 4px 12px rgba(26, 79, 118, 0.2);
                }

                .create-btn:hover {
                    background-color: #153c5a;
                }

                .pagination-arrows {
                    display: flex;
                    gap: 8px;
                }

                .arrow-btn {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    border: none;
                    background: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: #1a1a1a;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                    transition: transform 0.2s;
                }

                .arrow-btn:hover {
                    transform: scale(1.05);
                }

                .groups-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                    gap: 24px;
                    justify-content: center;
                    max-width: 700px; 
                    margin: 0 auto;  
                    
                }

                .group-card {
                    background: white;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.03);
                    display: flex;
                    flex-direction: column;
                    height: 465px; /* Fixed height for uniformity */
                }

                .card-image-wrapper {
                    position: relative;
                    height: 180px;
                    width: 100%;
                }

                .card-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .card-type-badge {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(4px);
                    padding: 8px;
                    border-radius: 50%;
                    color: #1a1a1a;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }

                .card-content {
                    padding: 20px;
                    flex: 1;
                }

                .card-title {
                    font-size: 20px;
                    font-weight: 700;
                    color: #1a1a1a;
                    margin: 0 0 10px 0;
                    line-height: 1.4;
                }

                .card-description {
    font-size: 18px;
    color: #4a4a4a;
    line-height: 1.5;
    margin: 0;
    flex: 1; /* lets it fill remaining space */
    overflow: hidden; /* prevents overflowing text */
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 3; /* show max 3 lines */
    -webkit-box-orient: vertical;
}

                .card-footer {
                    padding: 16px 20px;
                    border-top: 1px solid #f0f0f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    
                }

                .footer-icons {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    color: #888;
                }

                .icon-group {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .icon-text {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #4a4a4a;
                }

                .card-action-btn {
                    background: none;
                    border: none;
                    color: #1a1a1a;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 4px;
                    border-radius: 50%;
                    transition: background 0.2s;
                }

                .card-action-btn:hover {
                    background: #f0f0f0;
                }

                /* Modal Styles */
                .modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.4);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }

                .modal-content {
                    background: white;
                    padding: 30px;
                    border-radius: 20px;
                    width: 100%;
                    max-width: 500px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                }

                .modal-content h3 {
                    margin-top: 0;
                    margin-bottom: 20px;
                    color: #1a1a1a;
                    font-size: 1.4rem;
                }

                .form-group {
                    margin-bottom: 20px;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: #4a4a4a;
                    font-size: 0.9rem;
                }

                .form-group input, .form-group textarea {
                    width: 100%;
                    padding: 12px 16px;
                    border: 1px solid #e0e0e0;
                    border-radius: 12px;
                    font-family: inherit;
                    font-size: 0.95rem;
                    transition: border-color 0.2s;
                }

                .form-group input:focus, .form-group textarea:focus {
                    outline: none;
                    border-color: var(--primary);
                }

                .toggle-options {
                    display: flex;
                    gap: 10px;
                }

                .toggle-btn {
                    flex: 1;
                    padding: 10px;
                    border: 1px solid #e0e0e0;
                    background: white;
                    border-radius: 10px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #666;
                    transition: all 0.2s;
                }

                .toggle-btn.active {
                    background: var(--primary);
                    color: white;
                    border-color: var(--primary);
                }

                .modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    margin-top: 30px;
                }

                .cancel-btn, .submit-btn {
                    padding: 10px 20px;
                    border-radius: 10px;
                    font-weight: 600;
                    font-size: 0.95rem;
                    cursor: pointer;
                    border: none;
                }

                .cancel-btn {
                    background: #f0f0f0;
                    color: #4a4a4a;
                }

                .submit-btn {
                    background: var(--primary);
                    color: white;
                }
            `}</style>
        </div>
    )
}

export default SessionDashboard
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from "axios";
import { useNavigate,Link ,useLocation} from "react-router-dom";
import { Plus, Users, Calendar, Lock, Unlock, ChevronRight, ChevronLeft, CalendarDays, Bell, MoreHorizontal, Search } from 'lucide-react';


const containerStyle = {
        //backgroundImage: "url('https://images.freecreatives.com/wp-content/uploads/2016/04/Best-Website-New-Wallpaper.jpg')", // Background image URL
       //backgroundColor: "#e6f2ff",
        backgroundSize: "cover",
        backgroundPosition: "center",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        margin: "0",
        padding: "0",
        minheight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: '30px',
        //fontWeight: 'bold'
    };

    const gridContainer = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  //gridTemplateColumns: "1fr 1fr", // 2 columns
  gap: "20px",
  width: "90%",
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

    const buttonStyle = {
      padding: '10px 20px',
      backgroundColor: '#100c35ff',
      color: 'white',
      border: 'bold',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '20px',
      fontWeight: 'bold'
    };

    const reminderCardStyle = {
  ...cardStyle,        
  marginBottom: "15px", 
  fontSize: "18px",     
};
function StudentDashboard(){
  const navigate = useNavigate();
  const cardRef = React.createRef();
  const [newdata, setnewdata] = useState([]);
const location = useLocation();
const [filteredData, setFilteredData] = useState([]);
const ComponentsRef = useRef();
const [noResults, setNoResults] = useState(false);
const [selectedSessions, setSelectedSessions] = useState([]);
const [user, setUser] = useState({
    username: "",
    gender: "",
    age: "",
    photo: "", 
    role:""
  });

const fetchData = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/sessions/');
            setnewdata(response.data);
            setFilteredData(response.data);
        } catch (error) {
            console.error("Error fetching data:", error);
            setnewdata([]);
            setFilteredData([]);
        }
    };

    useEffect(() => {
        fetchData();
    }, [location.key]); 

    const deleteHandler = async (_id) => {
        try {
            await axios.delete(`http://localhost:8080/session/delete/${_id}`);
            alert("Deleted successfully!");
            fetchData(); 
        } catch (error) {
            console.error("Error deleting stock:", error);
            alert("Failed to delete records. Please try again.");
        }
    };

     const [viewedRecords, setViewedRecords] = useState(() => {
      return JSON.parse(localStorage.getItem("viewedRecords")) || [];
    });

     const handleUserClick = ( itemId) => {
  
  const updatedViewed = [...new Set([...viewedRecords, itemId])];
  setViewedRecords(updatedViewed);
  localStorage.setItem("viewedRecords", JSON.stringify(updatedViewed));

  
  navigate(`/ViewSession2/${itemId}`);
};

useEffect(() => {
  const saved = JSON.parse(localStorage.getItem("selectedSessions")) || [];
  setSelectedSessions(saved);
}, [location.key]);

const sortedData = [...newdata].sort((a, b) => {
  const aSelected = selectedSessions.includes(a._id);
  const bSelected = selectedSessions.includes(b._id);

  return bSelected - aSelected;
});

const selectedList = newdata.filter(item =>
  selectedSessions.includes(String(item._id))
);

const unselectedList = newdata.filter(item =>
  !selectedSessions.includes(String(item._id))
);

    return(
        <div>
            
     <div style={containerStyle}>
        <div style={{ display: "flex", minheight: "100vh", width:"100%" }}>
      

      {/* Main Content */}
      
      <div
        style={{
          flex: 1,
          //backgroundColor: "#f5f5f5",
          //backgroundColor: "#e6f2ff",
          
          padding: "40px",
        }}
      >
        <h1><center>Dashboard</center></h1>
       
        {/*} <div
          //key={index}
          //ref={cardRef}
          //className="card"
          style={cardStyle}
         
        >*/}
 <div className="status-tabs">
          <h2 className="status-pill">Selected List</h2><br></br></div>
          {noResults ? (
                <div>
                    <p>No records Found</p>
                </div>
            ) : (
                <div ref={ComponentsRef} /*style={containerStyle}*/>
                   <div /*style={gridContainer}*/ className="groups-grid">
                    {selectedList && selectedList.length > 0 ? (
                        selectedList.map((data) => (
                          <motion.div
                                key={data._id}
                                className="group-card"
                                //onClick={() => navigate(`/sessions/${data._id}`)}
                                style={{ cursor: 'pointer' }}
                                whileHover={{ y: -5 }}
                                transition={{ duration: 0.2 }}
                            >
                            <div key={data._id} style={cardStyle}>
                                <div /*style={{ marginBottom: "15px" }}*/className="card-image-wrapper">
  <img
    src={
      user.photo ||
      "https://img.freepik.com/free-vector/flat-back-school-pattern-collection_23-2149040892.jpg?semt=ais_hybrid"
    }
    alt="Profile"
    className="card-image"
    /*style={{
      width: "100%",          // full width inside card
      height: "150px",        // rectangle height
      objectFit: "cover",     // crop nicely
      borderRadius: "10px" ,
      opacity: 0.65,   
    }}*/
  />
</div>
                                <div className="card-content"/*style={containerStyle1}*/>
                                    <h1 className="card-title"><b>name: </b>{data.Name}</h1>
                                    <h1 className="card-description"><b>Description: </b>{data.Description}</h1>
                                    <h1 className="card-description"><b>Year:</b> {data.Year}</h1>
                                    <h1 className="card-description"><b>Semester:</b> {data.Semester}</h1>
                                    <h1 className="card-description"><b>Module: </b>{data.Module}</h1>
                                    <h1 className="card-description"><b>Date:</b> {data.Date}</h1>
                                    {/*<Link to={`/Update/${data._id}`}><button style={buttonStyle}>Update</button></Link>*/}
                                    
                                  
                                </div>
                                 <div className="card-footer">
                                                                                                <div className="footer-icons">
                                                                                                    <span className="icon-group" title="Created">
                                                                                                        <MoreHorizontal size={16} />
                                                                                                    </span>
                                                                                                    
                                                                                                    
                                                                                                </div>
                                                                                                <button className="card-action-btn" onClick={() => handleUserClick(data._id)} >
                                                                                                    <ChevronRight size={18} />
                                                                                                </button>
                                                                                            </div>
                            </div>
                            </motion.div>
                        ))
                    ) : (
                        <p>No records available</p>
                    )}
                     </div>
                    <br></br>
                 </div>
            )}
          {/*  </div>*/}
          
            
        {/* <div
          //key={index}
          //ref={cardRef}
          //className="card"
          style={cardStyle}
         
        >*/}

            <div className="status-tabs">
          <h2 className="status-pill">All Sessions</h2><br></br></div>
        {noResults ? (
                <div>
                    <p>No records Found</p>
                </div>
            ) : (
                <div ref={ComponentsRef} /*style={containerStyle}*/>
                   <div /*style={gridContainer}*/className="groups-grid">
                    {unselectedList && unselectedList.length > 0 ? (
                        unselectedList.map((data) => (
                          <motion.div
                                key={data._id}
                                className="group-card"
                                //onClick={() => navigate(`/sessions/${data._id}`)}
                                style={{ cursor: 'pointer' }}
                                whileHover={{ y: -5 }}
                                transition={{ duration: 0.2 }}
                            >
                            <div key={data._id} style={cardStyle}>
                                <div /*style={{ marginBottom: "15px" }}*/className="card-image-wrapper">
  <img
    src={
      user.photo ||
      "https://img.freepik.com/free-vector/flat-back-school-pattern-collection_23-2149040892.jpg?semt=ais_hybrid"
    }
    alt="Profile"
    className="card-image"
    /*style={{
      width: "100%",          // full width inside card
      height: "150px",        // rectangle height
      objectFit: "cover",     // crop nicely
      borderRadius: "10px" ,
      opacity: 0.65,   
    }}*/
  />
</div>
                                <div className="card-content"/*style={containerStyle1}*/>
                                    
                                    <h1 className="card-title"><b>name: </b>{data.Name}</h1>
                                    <h1 className="card-description"><b>Description:</b> {data.Description}</h1>
                                    <h1 className="card-description"><b>Year: </b>{data.Year}</h1>
                                    <h1 className="card-description"><b>Semester:</b> {data.Semester}</h1>
                                    <h1 className="card-description"><b>Module: </b>{data.Module}</h1>
                                    <h1 className="card-description"><b>Date:</b> {data.Date}</h1>
                                    {/*<Link to={`/Update/${data._id}`}><button style={buttonStyle}>Update</button></Link>*/}
                                    
                                  
                                </div>
                                 <div className="card-footer">
                                                                                                <div className="footer-icons">
                                                                                                    <span className="icon-group" title="Created">
                                                                                                        <MoreHorizontal size={16} />
                                                                                                    </span>
                                                                                                    
                                                                                                    
                                                                                                </div>
                                                                                                <button className="card-action-btn" onClick={() => handleUserClick(data._id)} >
                                                                                                    <ChevronRight size={18} />
                                                                                                </button>
                                                                                            </div>
                            </div>
                            </motion.div>
                        ))
                    ) : (
                        <p>No records available</p>
                    )}
                     </div>
                    <br></br>
                </div>
            )}
           {/* </div>*/}
           
      </div>

      <div
        style={{
          flex: 0.25,
          backgroundColor: "#e8e8e8",
          //width: "400px",
          padding: "40px",
          borderRadius: '20px',
          
        }}
      ><b>Reminders</b><br></br>
      {filteredData
    .filter(item => item.Reminder?.message)
    .map((data, index) => (
      <div
        key={data._id || index}
        className="card"
        /*style={{
          marginBottom: "12px",
          padding: "12px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          fontSize:"20px"
        }}*/
       style={reminderCardStyle}
      >
        <b>Reminder:</b><br></br>
        <b>Session name:</b>  <b style={{color:"red"}}>{data.Name || "N/A"}</b>   
        <br />
        
        {/*<b>By Doctor:</b> {getDoctorName(data.current.Reminder.doctorId)}*/}
        
        <b>Date:</b>{" "}
        <b style={{color:"red"}}>{data.Reminder.dateHappened
          ? new Date(data.Reminder.dateHappened).toLocaleDateString()
          : "N/A"}</b>
    <br></br>
          <b>Message</b> {data.Reminder.message}
      </div>
    ))}

  {filteredData.filter(item => item.Reminder?.message).length === 0 && (
    <p style={{ textAlign: "center", color: "#64748b" }}>
      No reminders available
    </p>
  )}
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
                    font-size: 20px;
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
                    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
                    gap: 24px;
                }

                .group-card {
                    background: white;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.03);
                    display: flex;
                    flex-direction: column;
                    height: 500px; /* Fixed height for uniformity */
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

export default StudentDashboard
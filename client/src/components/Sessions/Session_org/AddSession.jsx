import { useState, useEffect } from "react";

import { useNavigate,Outlet  } from "react-router-dom";

const containerStyle = {
        //backgroundImage: "url('https://images.freecreatives.com/wp-content/uploads/2016/04/Best-Website-New-Wallpaper.jpg')", // Background image URL
       //backgroundColor: "#e6f2ff",
        backgroundSize: "cover",
        backgroundPosition: "center",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        margin: "0",
        padding: "0",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: '30px',
        //fontWeight: 'bold'
    };

    const formStyle = {
        backgroundColor: "rgba(255, 255, 255, 0.8)", // Semi-transparent background for form
        padding: "30px",
        width: "800px",
        //height:"100%",
        borderRadius: "10px",
        marginLeft: "60px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
        //boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        //float: "right",
        justifyContent:"center",
        transition: "transform 0.3s ease, border-color 0.3s ease",
        fontSize:"20px",
        
       

    };
    const inputStyle = {
        padding: "10px",
        borderRadius: "5px",
        border: "1px solid #ccc",
        width: "70%",
        fontSize: "16px"
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
        width:"400px",
        
    };

function AddSession(){
  const [year, setYear] = useState("");
const [semester, setSemester] = useState("");
const [modules, setModules] = useState([]);
    const navigate = useNavigate();
     const [currentStep, setCurrentStep] = useState(0);
     const totalSteps = 4;

   const [inputs,setInputs] = useState({
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

     const modulesData = [
  { id: 1, name: "Introduction to Programming", year: 1, semester: 1 },
  { id: 2, name: "Mathematics", year: 1, semester: 1 },
  { id: 3, name: "Database Management Systems", year: 1, semester: 2 },
  { id: 4, name: "Internet and Web Development", year: 1, semester: 2 },
  { id: 5, name: "Database Systems", year: 2, semester: 1 },
  { id: 6, name: "Computer Networking", year: 2, semester: 1 },
  { id: 7, name: "Human Computer Interaction", year: 3, semester: 1 },
  { id: 7, name: "Information Assurance and Seurity", year: 3, semester: 1 }
];

const locationData = {
  "Main Building - A Block": ["A501", "A502", "A503"],
  "Main Building - B Block": ["B501", "B502", "B403"],
  "New Building - G Block": ["G1301", "G601","G605"],
  "New Building - F Block": ["F1308", "F502"],
   "Other": ["Main Aditorium", "Mini Auditorium"],
  
};


     useEffect(() => {
  setModules([]);

  if (year && semester) {
    const filteredModules = modulesData.filter(
      (m) =>
        m.year === Number(year) &&
        m.semester === Number(semester)
    );

    setModules(filteredModules);
  }
}, [year, semester]);




/*const savedState = JSON.parse(localStorage.getItem("editState") || "{}");
  const defaultInputs = {
    Name: "",
             Description: "",
             Year: "",
             Semester: "",
             Module: "",
             Date: ""
  };*/


      useEffect(() => {
  window.scrollTo({ top: 0, behavior: "smooth" });
}, [currentStep]);
  const handlePreview = () => {
    navigate("/Preview", {
      /*state: {
        Name,
        Description,
        Year,
        Semester,
        Module,
        Date
        //inputs
      }*/state: inputs,
    });
  };
    return(
        <div>
           
     <div style={containerStyle}>
        <div style={{ display: "flex", height: "100vh", width:"100%" }}>
      

      {/* Main Content */}
      
      <div
        style={{
          flex: 1,
          //backgroundColor: "#f5f5f5",
          padding: "40px",
           display: "flex",
           flexDirection: "column",          
           alignItems: "center",
           marginTop:"40px"
          
        }}
      >
        <h1 style={{ marginBottom: "20px" }}>Session</h1>
       
        
         <form style={formStyle}  /*onSubmit={handleSubmit}*/>
         
         <div className="card-image-wrapper">
           <img
    src={
      user.photo ||
      "https://cdn0.tnwcdn.com/wp-content/blogs.dir/1/files/2015/04/colortheory.jpg"
    }
    alt="Profile"
    className="card-image"
    /*style={{
      width: "100%",          // full width inside card
      height: "150px",        // rectangle height
      objectFit: "cover",     // crop nicely
      borderRadius: "10px" ,
      opacity: 0.55,   
    }}*/
  />
         </div><br></br>
        {currentStep === 0 && (
          <div>
             <label><h2> Session name</h2></label>
      <ul>
       
          <li >
          <br></br>
            
          <input type = "text" name = "Name" style={inputStyle} placeholder ="enter you answer"   onChange={handleChange} value={inputs.Name || "" }></input><br></br>
          </li>
       
      </ul><br></br>
      <label><h2>Add Description</h2></label>
      <textarea type = "text" name = "Description" style={inputStyle} placeholder ="enter you answer" onChange={handleChange} value={inputs.Description || "" }></textarea><br></br>
          
      </div>
        )}
        {currentStep === 1 && (
          <div>
           <label><h2> Select the category</h2><br></br></label>
                      <label>
       <input
             type="radio"
             name="Category"
               value="online"
              checked={inputs.Category === "online"}
              onChange={handleChange}
            />
            Online
              </label>

        <br />

                <label>


              <input
                type="radio"
               name="Category"
               value="physical"
               checked={inputs.Category === "physical"}
              onChange={handleChange}
             />
             Physical
            </label>
           <br></br><br></br>

           {inputs.Category === "online" && (
            <div>
           <label><h2>Meeting Link</h2></label>
            <input
             type="text"
              name="Link"
              placeholder="Enter meeting link"
              value={inputs.Link || ""}
            onChange={handleChange}
            style={{ ...inputStyle, width: "100%" }}
          />
          </div>
                )}

          {inputs.Category === "physical" && (
               <div>
          <label><h2>Location</h2><br></br></label>

              <select
         name="Location"
        value={inputs.Location || ""}
        /*onChange={handleChange}*/
        //onChange={(e) => { handleChange(e); location(e.target.value)}}
        onChange={handleChange}
        style={{ ...inputStyle, width: "100%" }}
        >
         <option value="">Select Location</option>
  {Object.keys(locationData).map((location) => (
    <option key={location} value={location}>
      {location} Location
    </option>
  ))}
        </select>

        {inputs.Location && (
      <>
        <label><h2>Select hall</h2><br></br></label>
        <select
          name="hall"
          value={inputs.Hall}
          onChange={handleChange}
          style={{ ...inputStyle, width: "100%" }}
        >
          <option value="">Select Hall</option>
          {locationData[inputs.Location].map((hall) => (
            <option key={hall} value={hall}>
              {hall}
            </option>
          ))}
        </select>
      </>
    )}

          </div>
          )}

           
           </div>
        )}
{currentStep === 2 && (
          <div>
             <label><h2> Year</h2><br></br></label>
         <select
         name="Year"
        value={inputs.Year}
        /*onChange={handleChange}*/
        onChange={(e) =>{ handleChange(e); setYear(e.target.value)}}
        style={{ ...inputStyle, width: "100%" }}
        >
          <option value="">Select Year</option>
        <option value="1">Year 1</option>
  <option value="2">Year 2</option>
  <option value="3">Year 3</option>
        </select>
         <label><h2> Semester</h2><br></br></label>
         <select
         name="Semester"
        value={inputs.Semester}
        /*onChange={handleChange}*/
        onChange={(e) => { handleChange(e); setSemester(e.target.value)}}
        style={{ ...inputStyle, width: "100%" }}
        >
          <option value="">Select Semester</option>
         <option value="1">Semester 1</option>
  <option value="2">Semester 2</option>
        </select>

        <label><h2> Module name</h2><br></br></label>
         <select
         name="Module"
        value={inputs.Module}
        onChange={handleChange}
        style={{ ...inputStyle, width: "100%" }}
        >
        <option value="">Select Module</option>
  {modules.map((module) => (
    <option key={module.name} value={module.name}>
      {module.name}
    </option>
  ))}
        </select>
    </div>
      )}
{currentStep === 3 && (
    <div>
      <label><h2>Date scheduled</h2><br></br></label>
        <input type="date" name = "Date" style={inputStyle} onChange = {handleChange} value={inputs.Date || "" }/><br></br><br></br>
<br></br>

    <label><h2>Time scheduled</h2><br></br></label>
<input
  type="time"
  name="Time"
  placeholder="hh:mm AM/PM"
  value={inputs.Time || ""}
  onChange={handleChange}
  style={{ ...inputStyle, width: "100%" }}
/>
</div>
  )}
  <br></br>
  
        <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between", gap:"20px" }}>
    <button
      type="button"
      onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
      disabled={currentStep === 0}
      style={buttonStyle}
    >
      Previous
    </button>

    {currentStep < totalSteps - 1 && (
  <button
    type="button"
    onClick={() => setCurrentStep(prev => prev + 1)}
    style={buttonStyle}
  >
    Next
  </button>
 
)}


{currentStep === totalSteps - 1 && (
  <button
    type="button"
    onClick={handlePreview}
    style={{
      width: "50%",
      backgroundColor: "blue",
      color: "white",
      border: "none",
      padding: "10px",
      borderRadius: "6px",
      fontSize:"16px"
    }}
  >
    Preview All Details →
  </button>
)}

   
 </div>
         
      </form>
      
     
      
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

export default AddSession
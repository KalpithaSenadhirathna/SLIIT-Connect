import React, { useEffect , useState} from 'react';
import axios from 'axios';
import EmptyState from '../components/Groups/EmptyState';
import { Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SessionDashboard from '../components/Sessions/Session_org/SessionDashboard';
import StudentDashboard from '../components/Sessions/Session_stu/StudentDashboard';
import AddSession from '../components/Sessions/Session_org/AddSession';
import Preview from '../components/Sessions/Session_org/Preview';
import ViewSession from '../components/Sessions/Session_org/ViewSession';
import ViewSession2 from '../components/Sessions/Session_stu/ViewSession2';
import UpdateSession from '../components/Sessions/Session_org/UpdateSession';

const Sessions = () => {
   const [user, setUser] = useState(null); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await axios.get('http://localhost:5000/api/auth/me', {
          headers: { 'x-auth-token': token }
        });

        setUser(res.data); 
      } catch (err) {
        console.error('Error fetching user', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) return <p>Loading...</p>;

  let ComponentToRender;
  if (user?.role === 'Admin' || user?.role === 'Moderator') {
    ComponentToRender = <SessionDashboard />;
  } else if (user?.role === 'Student') {
    ComponentToRender = <StudentDashboard />;
  } else {
    ComponentToRender = <p style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No details available for your role.</p>;
  }
    return (
       <div className="page-content">
           {/*  <EmptyState
                title="Sessions are coming soon!"
                description="Manage your study sessions and appointments in one place. Feature launching soon!"
                icon={Calendar}
            />*/}
              {ComponentToRender}
              
        </div>
       
    );
};

export default Sessions;

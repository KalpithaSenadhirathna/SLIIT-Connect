import React from 'react';
import EmptyState from '../components/Groups/EmptyState';
import { UserCircle } from 'lucide-react';

const Profile = () => {
    return (
        <div className="page-content">
            <EmptyState
                title="Your Profile is coming soon!"
                description="Customize your experience and manage your academic presence. Feature launching shortly!"
                icon={UserCircle}
            />
        </div>
    );
};

export default Profile;

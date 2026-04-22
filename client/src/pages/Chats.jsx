import React from 'react';
import EmptyState from '../components/Groups/EmptyState';
import { MessageSquare } from 'lucide-react';

const Chats = () => {
    return (
        <div className="page-content">
            <EmptyState
                title="Chat is coming soon!"
                description="Connect with your peers in real-time. This feature is under active development."
                icon={MessageSquare}
            />
        </div>
    );
};

export default Chats;

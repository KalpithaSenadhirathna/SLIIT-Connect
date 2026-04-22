import React from 'react';
import EmptyState from '../components/Groups/EmptyState';
import { HelpCircle } from 'lucide-react';

const Help = () => {
    return (
        <div className="page-content">
            <EmptyState
                title="Help Center is coming soon!"
                description="We're preparing comprehensive guides and support tools to help you navigate SLIIT Connect."
                icon={HelpCircle}
            />
        </div>
    );
};

export default Help;

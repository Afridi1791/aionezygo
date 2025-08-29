

import React from 'react';

const Footer = () => {
    return (
        <footer className="glass border-t border-border-primary px-6 lg:px-8 flex-shrink-0">
            <div className="flex items-center justify-center py-6">
                <p className="text-text-muted text-sm">
                    &copy; {new Date().getFullYear()} OneZygo. All rights reserved.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
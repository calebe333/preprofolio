import React from 'react';

export default function LoadingScreen() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse"></div>
                <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse [animation-delay:0.2s]"></div>
                <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse [animation-delay:0.4s]"></div>
                <p className="text-lg font-semibold">Loading...</p>
            </div>
        </div>
    );
}

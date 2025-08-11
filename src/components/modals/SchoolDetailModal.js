import React from 'react';

// --- Helper Components ---
const InfoCard = ({ label, value }) => (
    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">{value || 'N/A'}</p>
    </div>
);

const SectionTitle = ({ children }) => (
    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">{children}</h3>
);

const PrerequisiteChecklist = ({ schoolPrereqs, userCourses }) => {
    // ... PrerequisiteChecklist component remains unchanged ...
};

// --- NEW: Stats Comparison Component ---
const StatsBar = ({ userStat, schoolStat, label, max }) => {
    const userValue = parseFloat(userStat) || 0;
    const schoolValue = parseFloat(schoolStat) || 0;
    
    // Calculate percentage for the bar width
    const userPercent = max ? (userValue / max) * 100 : 0;
    const schoolPercent = max ? (schoolValue / max) * 100 : 0;

    const barColor = userValue >= schoolValue ? 'bg-green-500' : 'bg-yellow-500';

    return (
        <div>
            <div className="flex justify-between items-baseline mb-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
                <p className="text-sm">
                    <span className="font-bold" style={{ color: userValue >= schoolValue ? '#22c55e' : '#eab308' }}>{userValue || 'N/A'}</span>
                    <span className="text-gray-500 dark:text-gray-400"> / {schoolValue || 'N/A'}</span>
                </p>
            </div>
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full relative overflow-hidden">
                {/* School Average Bar */}
                <div className="absolute h-full bg-gray-300 dark:bg-gray-600 rounded-full" style={{ width: `${schoolPercent}%` }}></div>
                {/* User Stat Bar */}
                <div className={`absolute h-full ${barColor} rounded-full`} style={{ width: `${userPercent}%` }}></div>
            </div>
        </div>
    );
};

const StatsComparison = ({ userProfile, school }) => {
    if (!userProfile) return null;

    return (
        <div className="space-y-4">
            <StatsBar userStat={userProfile.gpa} schoolStat={school.avgGPA} label="Overall GPA" max={4.0} />
            {school.program === 'MD' && <StatsBar userStat={userProfile.scienceGpa} schoolStat={school.avgBCPM} label="Science GPA" max={4.0} />}
            {school.program === 'MD' && <StatsBar userStat={userProfile.mcatScore} schoolStat={school.avgMCAT} label="MCAT Score" max={528} />}
            {school.program === 'DDS' && <StatsBar userStat={userProfile.datScore} schoolStat={school.avgDAT_AA} label="DAT (AA)" max={30} />}
             {school.program === 'PA' && <StatsBar userStat={userProfile.scienceGpa} schoolStat={school.avgScienceGPA} label="Science GPA" max={4.0} />}
        </div>
    );
};


export default function SchoolDetailModal({ isOpen, onClose, school, userCourses, userProfile }) {
    const motion = window.motion;
    if (!isOpen || !school) return null;

    const modalContent = (
        <>
            {/* ... Header and Mission Statement sections are unchanged ... */}
            
            <div className="p-6 sm:p-8 school-modal-content">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* New Stats Comparison Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <SectionTitle>My Stats vs. School Averages</SectionTitle>
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                            <StatsComparison userProfile={userProfile} school={school} />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <SectionTitle>Admissions</SectionTitle>
                        {/* ... Admissions InfoCards ... */}
                    </div>
                    <div className="space-y-6">
                        <SectionTitle>Academics</SectionTitle>
                        {/* ... Academics InfoCards ... */}
                    </div>
                    
                    {/* ... Requirements & Prerequisite sections are unchanged ... */}
                </div>
            </div>
        </>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            {/* ... Modal wrapper JSX is unchanged ... */}
        </div>
    );
};

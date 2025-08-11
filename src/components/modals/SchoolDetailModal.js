import React from 'react';

// A small helper component for displaying data points neatly
const InfoPill = ({ label, value, className = '' }) => (
    <div className={`bg-gray-100 dark:bg-gray-700 p-3 rounded-lg ${className}`}>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
        <p className="text-md font-semibold text-gray-900 dark:text-white">{value || 'N/A'}</p>
    </div>
);

// A helper for section titles
const SectionTitle = ({ children }) => (
    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600 pb-2 mb-4">{children}</h3>
);

export default function SchoolDetailModal({ isOpen, onClose, school }) {
    const motion = window.motion;
    if (!isOpen || !school) return null;

    const modalContent = (
        <div className="p-6 sm:p-8">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">{school.name}</h2>
                        {school.verified ? (
                            <span className="text-xs font-medium text-green-800 bg-green-100 dark:bg-green-900 dark:text-green-300 px-2.5 py-1 rounded-full">Verified</span>
                        ) : (
                            <span className="text-xs font-medium text-yellow-800 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300 px-2.5 py-1 rounded-full">Unverified</span>
                        )}
                    </div>
                    <p className="text-md text-gray-500 dark:text-gray-400">{school.location}</p>
                    {school.website && (
                        <a href={school.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                            Visit Website →
                        </a>
                    )}
                </div>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            {school.mission && (
                <div className="mb-6">
                    <SectionTitle>Mission Statement</SectionTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-300 italic bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">{school.mission}</p>
                </div>
            )}

            <div className="space-y-6">
                <div>
                    <SectionTitle>Admissions Overview</SectionTitle>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <InfoPill label="Program" value={school.program} />
                        <InfoPill label="Class Size" value={school.classSize} />
                        <InfoPill label="Acceptance Rate" value={school.acceptanceRate ? `${school.acceptanceRate}%` : 'N/A'} />
                        <InfoPill label="Application Deadline" value={school.deadline ? new Date(school.deadline).toLocaleDateString() : 'N/A'} />
                    </div>
                </div>

                <div>
                    <SectionTitle>Academic Averages</SectionTitle>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <InfoPill label="Overall GPA" value={school.avgGPA} />
                        {school.program === 'MD' && <InfoPill label="Science GPA (BCPM)" value={school.avgBCPM} />}
                        {school.program === 'PA' && <InfoPill label="Science GPA" value={school.avgScienceGPA} />}
                        {school.program === 'MD' && <InfoPill label="MCAT Score" value={school.avgMCAT} />}
                        {school.program === 'DDS' && <InfoPill label="DAT (AA)" value={school.avgDAT_AA} />}
                        {school.program === 'DDS' && <InfoPill label="DAT (PAT)" value={school.avgDAT_PAT} />}
                        {school.program === 'PA' && <InfoPill label="GRE Score" value={school.avgGRE} />}
                    </div>
                </div>

                <div>
                    <SectionTitle>Application Requirements</SectionTitle>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <InfoPill label="Interview Format" value={school.interviewFormat} />
                        {school.program === 'PA' && <InfoPill label="PCE Hours" value={school.pceHours ? `${school.pceHours}+` : 'N/A'} />}
                        {school.program === 'DDS' && <InfoPill label="Shadowing Hours" value={school.shadowingHours ? `${school.shadowingHours}+` : 'N/A'} />}
                        <InfoPill label="Secondary Fee" value={school.secondaryFee ? `$${school.secondaryFee}`: 'N/A'} />
                    </div>
                </div>
                 <div>
                    <SectionTitle>Tuition (Annual)</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoPill label="In-State" value={school.tuitionInState ? `$${Number(school.tuitionInState).toLocaleString()}` : 'N/A'} />
                        <InfoPill label="Out-of-State" value={school.tuitionOutOfState ? `$${Number(school.tuitionOutOfState).toLocaleString()}` : 'N/A'} />
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            {motion ? (
                 <motion.div 
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                >
                    {modalContent}
                </motion.div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">{modalContent}</div>
            )}
        </div>
    );
};

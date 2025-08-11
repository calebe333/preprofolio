import React from 'react';

// A helper component for displaying data points neatly
const InfoCard = ({ label, value, icon, className = '' }) => (
    <div className={`bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex items-start gap-4 ${className}`}>
        {icon && <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-300">{icon}</div>}
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{value || 'N/A'}</p>
        </div>
    </div>
);

// A helper for section titles
const SectionTitle = ({ children }) => (
    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">{children}</h3>
);

const PrerequisiteChecklist = ({ schoolPrereqs, userCourses }) => {
    if (!schoolPrereqs) {
        return <p className="text-sm text-gray-500 dark:text-gray-400">No prerequisite information available for this school.</p>;
    }

    const prereqList = schoolPrereqs.split('\n').filter(p => p.trim() !== '');

    const findMatchingCourse = (prereq) => {
        const prereqLower = prereq.toLowerCase();
        return userCourses.find(course => {
            const courseIdentifier = `${course.name.toLowerCase()} ${course.code.toLowerCase()}`;
            // This is a simple keyword matching logic. It can be improved for more accuracy.
            const keywords = prereqLower.replace(/w\/\s*lab/g, '').replace(/[i|v|1-9]/g, '').trim().split(' ');
            return keywords.every(kw => courseIdentifier.includes(kw));
        });
    };

    return (
        <ul className="space-y-3">
            {prereqList.map((prereq, index) => {
                const matchingCourse = findMatchingCourse(prereq);
                return (
                    <li key={index} className="flex items-start p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex-shrink-0 mt-1">
                            {matchingCourse ? (
                                <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{prereq}</p>
                            {matchingCourse && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">Completed: {matchingCourse.name} ({matchingCourse.grade})</p>
                            )}
                        </div>
                    </li>
                );
            })}
        </ul>
    );
};

export default function SchoolDetailModal({ isOpen, onClose, school, userCourses }) {
    const motion = window.motion;
    if (!isOpen || !school) return null;

    const modalContent = (
        <>
            <style>{`
                .school-modal-content::-webkit-scrollbar { width: 8px; }
                .school-modal-content::-webkit-scrollbar-track { background: transparent; }
                .school-modal-content::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
                .dark .school-modal-content::-webkit-scrollbar-thumb { background-color: #4b5563; }
            `}</style>

            <div className="p-6 sm:p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start">
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
            </div>
            
            <div className="p-6 sm:p-8 school-modal-content">
                {school.mission && (
                    <div className="mb-8">
                        <SectionTitle>Mission Statement</SectionTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-300 italic bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">{school.mission}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <SectionTitle>Admissions</SectionTitle>
                        <div className="space-y-4">
                            <InfoCard label="Program" value={school.program} />
                            <InfoCard label="Class Size" value={school.classSize} />
                            <InfoCard label="Acceptance Rate" value={school.acceptanceRate ? `${school.acceptanceRate}%` : 'N/A'} />
                            <InfoCard label="Application Deadline" value={school.deadline ? new Date(school.deadline).toLocaleDateString() : 'N/A'} />
                            <InfoCard label="Interview Format" value={school.interviewFormat} />
                        </div>
                    </div>
                    <div className="space-y-6">
                        <SectionTitle>Academics</SectionTitle>
                        <div className="space-y-4">
                            <InfoCard label="Overall GPA" value={school.avgGPA} />
                            {school.program === 'MD' && <InfoCard label="Science GPA (BCPM)" value={school.avgBCPM} />}
                            {school.program === 'PA' && <InfoCard label="Science GPA" value={school.avgScienceGPA} />}
                            {school.program === 'MD' && <InfoCard label="MCAT Score" value={school.avgMCAT} />}
                            {school.program === 'DDS' && <InfoCard label="DAT (AA)" value={school.avgDAT_AA} />}
                            {school.program === 'DDS' && <InfoCard label="DAT (PAT)" value={school.avgDAT_PAT} />}
                            {school.program === 'PA' && <InfoCard label="GRE Score" value={school.avgGRE} />}
                        </div>
                    </div>
                    <div className="lg:col-span-2 space-y-6">
                         <SectionTitle>Requirements & Tuition</SectionTitle>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {school.program === 'PA' && <InfoCard label="PCE Hours" value={school.pceHours ? `${school.pceHours}+` : 'N/A'} />}
                            {school.program === 'DDS' && <InfoCard label="Shadowing Hours" value={school.shadowingHours ? `${school.shadowingHours}+` : 'N/A'} />}
                            <InfoCard label="Secondary Fee" value={school.secondaryFee ? `$${school.secondaryFee}`: 'N/A'} />
                            <InfoCard label="In-State Tuition" value={school.tuitionInState ? `$${Number(school.tuitionInState).toLocaleString()}` : 'N/A'} />
                            <InfoCard label="Out-of-State Tuition" value={school.tuitionOutOfState ? `$${Number(school.tuitionOutOfState).toLocaleString()}` : 'N/A'} />
                         </div>
                    </div>
                    <div className="lg:col-span-2 space-y-6">
                        <SectionTitle>Prerequisite Analysis</SectionTitle>
                        <PrerequisiteChecklist schoolPrereqs={school.prerequisites} userCourses={userCourses} />
                    </div>
                </div>
            </div>
        </>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            {motion ? (
                 <motion.div 
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                    <div className="overflow-y-auto school-modal-content">
                        {modalContent}
                    </div>
                </motion.div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">{modalContent}</div>
            )}
        </div>
    );
};

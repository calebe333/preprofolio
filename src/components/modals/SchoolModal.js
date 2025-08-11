import React, { useState, useEffect } from 'react';

export default function SchoolModal({ isOpen, onClose, school, mode, onSaveMySchool, onSaveMasterSchool, isGuest, isStaff }) {
    const [formData, setFormData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const motion = window.motion;

    const isReadOnly = mode === 'editMaster' && school?.verified && !isStaff;

    useEffect(() => {
        const initialFormState = {
            name: '', location: '', program: 'MD', avgGPA: '',
            website: '', mission: '', classSize: '', acceptanceRate: '', deadline: '',
            tuitionInState: '', tuitionOutOfState: '', interviewFormat: '', secondaryFee: '',
            prerequisites: '', // New field for prerequisites
            // Program specific fields
            avgMCAT: '', avgBCPM: '',
            avgScienceGPA: '', pceHours: '', avgGRE: '',
            avgDAT_AA: '', avgDAT_PAT: '', shadowingHours: ''
        };

        if (mode === 'editMySchool') {
            setFormData({
                id: school.id,
                status: school.status,
                notes: school.notes || ''
            });
        } else if (mode === 'editMaster') {
            setFormData({ ...initialFormState, ...school });
        } else { // mode === 'add'
            setFormData({ ...initialFormState });
        }
    }, [school, isOpen, mode]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isReadOnly) {
            onClose();
            return;
        }

        setIsSubmitting(true);
        try {
            if (mode === 'editMySchool') {
                await onSaveMySchool(formData);
            } else {
                await onSaveMasterSchool(formData);
            }
        } catch (error) {
            console.error("Failed to save school data:", error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const getTitle = () => {
        if (mode === 'editMySchool') return school.name;
        if (mode === 'editMaster') return 'Edit School Information';
        return 'Suggest a New School';
    };
    
    const renderMySchoolForm = () => (
        <>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Update your personal application status and notes for this school.</p>
            <div className="space-y-4">
                <div>
                    <label className="block mb-2 text-sm font-medium">Application Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="input-class">
                        <option>Researching</option>
                        <option>Applying</option>
                        <option>Interviewing</option>
                        <option>Accepted</option>
                        <option>Rejected</option>
                    </select>
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium">My Notes</label>
                    <textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows="4" placeholder="e.g., Spoke with Dr. Smith at the conference..." className="input-class"></textarea>
                </div>
            </div>
        </>
    );

    const renderMasterSchoolForm = () => (
        <>
            {isReadOnly && <p className="text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/50 p-3 rounded-md my-4">This school is verified and can no longer be edited by users.</p>}
            {mode === 'add' && <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Your submission will be marked as "unverified" until reviewed by staff.</p>}
            
            <div className="space-y-4">
                {/* General Info */}
                <h3 className="font-semibold border-b pt-4">General Information</h3>
                <input type="text" name="name" value={formData.name || ''} onChange={handleChange} placeholder="School Name" required readOnly={isReadOnly} className="input-class" />
                {/* ... other general info fields ... */}
                <select name="program" value={formData.program} onChange={handleChange} disabled={isReadOnly} className="input-class">
                    <option value="MD">MD</option><option value="PA">PA</option><option value="DDS">DDS</option>
                </select>

                {/* Prerequisites */}
                <h3 className="font-semibold border-b pt-4">Prerequisites</h3>
                <textarea 
                    name="prerequisites" 
                    value={formData.prerequisites || ''} 
                    onChange={handleChange} 
                    placeholder="Enter one prerequisite per line (e.g., General Chemistry I w/ Lab)" 
                    readOnly={isReadOnly} 
                    className="input-class" 
                    rows="6"
                ></textarea>

                {/* Admissions Info */}
                <h3 className="font-semibold border-b pt-4">Admissions Data</h3>
                {/* ... other admissions fields ... */}

                {/* Program-Specific Averages */}
                <h3 className="font-semibold border-b pt-4">Academic Averages</h3>
                {/* ... other academic fields ... */}
                
                {/* Requirements & Fees */}
                <h3 className="font-semibold border-b pt-4">Requirements & Fees</h3>
                {/* ... other requirements fields ... */}
            </div>
        </>
    );

    const modalContent = (
        <form onSubmit={handleSubmit} className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{getTitle()}</h2>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            {mode === 'editMySchool' ? renderMySchoolForm() : renderMasterSchoolForm()}
            <div className="mt-6 flex justify-end gap-4">
                <button type="button" onClick={onClose} className="py-2 px-4 text-sm font-medium text-gray-900 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">
                    {isReadOnly ? 'Close' : 'Cancel'}
                </button>
                {!isReadOnly && (
                    <button type="submit" disabled={isSubmitting} className="py-2 px-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        {isSubmitting ? 'Saving...' : 'Save'}
                    </button>
                )}
            </div>
        </form>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <style>{`.input-class { background-color: #F9FAFB; border: 1px solid #D1D5DB; color: #111827; font-size: 0.875rem; border-radius: 0.5rem; display: block; width: 100%; padding: 0.625rem; } .dark .input-class { background-color: #374151; border-color: #4B5563; color: white; } .input-class:read-only { background-color: #E5E7EB; } .dark .input-class:read-only { background-color: #4B5563; }`}</style>
            {motion ? (
                <motion.div 
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                >
                    {modalContent}
                </motion.div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">{modalContent}</div>
            )}
        </div>
    );
};

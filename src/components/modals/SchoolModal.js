import React, { useState, useEffect } from 'react';

export default function SchoolModal({ isOpen, onClose, school, onSaveMySchool, onSaveNewSchool, isGuest }) {
    const isEditingMySchool = school && school.hasOwnProperty('status');
    
    const [formData, setFormData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const motion = window.motion;

    useEffect(() => {
        if (isEditingMySchool) {
            setFormData({
                id: school.id,
                status: school.status,
                notes: school.notes || ''
            });
        } else {
            setFormData({
                name: '',
                location: '',
                program: 'MD',
                avgMCAT: '',
                avgGPA: '',
                avgDAT: '',
                avgGRE: ''
            });
        }
    }, [school, isOpen, isEditingMySchool]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        if (isEditingMySchool) {
            onSaveMySchool(formData);
        } else {
            onSaveNewSchool(formData);
        }
        setIsSubmitting(false);
    };
    
    const renderEditMySchoolForm = () => (
        <>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{school.name}</h2>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
             <div className="space-y-4">
                <div>
                    <label className="block mb-2 text-sm font-medium">Application Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600">
                        <option>Researching</option>
                        <option>Applying</option>
                        <option>Interviewing</option>
                        <option>Accepted</option>
                        <option>Rejected</option>
                    </select>
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium">My Notes</label>
                    <textarea name="notes" value={formData.notes} onChange={handleChange} rows="4" placeholder="e.g., Spoke with Dr. Smith at the conference, great research in cardiology..." className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600"></textarea>
                </div>
            </div>
        </>
    );

    const renderAddNewSchoolForm = () => (
         <>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Suggest a New School</h2>
                 <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Thank you for contributing! Your submission will be reviewed by our team before being marked as verified.</p>
             <div className="space-y-4">
                <input type="text" name="name" value={formData.name || ''} onChange={handleChange} placeholder="School Name" required className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" />
                <input type="text" name="location" value={formData.location || ''} onChange={handleChange} placeholder="Location (e.g., City, ST)" required className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" />
                <select name="program" value={formData.program} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600">
                    <option>MD</option><option>PA</option><option>DDS</option>
                </select>
                <input type="text" name="avgGPA" value={formData.avgGPA || ''} onChange={handleChange} placeholder="Average GPA" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" />
                {formData.program === 'MD' && <input type="text" name="avgMCAT" value={formData.avgMCAT || ''} onChange={handleChange} placeholder="Average MCAT" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" />}
                {formData.program === 'DDS' && <input type="text" name="avgDAT" value={formData.avgDAT || ''} onChange={handleChange} placeholder="Average DAT" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" />}
                {formData.program === 'PA' && <input type="text" name="avgGRE" value={formData.avgGRE || ''} onChange={handleChange} placeholder="Average GRE" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" />}
            </div>
        </>
    );

    const modalContent = (
        <form onSubmit={handleSubmit} className="p-6">
            {isEditingMySchool ? renderEditMySchoolForm() : renderAddNewSchoolForm()}
            <div className="mt-6 flex justify-end gap-4">
                <button type="button" onClick={onClose} className="py-2 px-4 text-sm font-medium text-gray-900 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="py-2 px-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">{isSubmitting ? 'Saving...' : 'Save'}</button>
            </div>
        </form>
    );

     return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            {motion ? (
                 <motion.div 
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto"
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                >
                    {modalContent}
                </motion.div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto">{modalContent}</div>
            )}
        </div>
    );
};

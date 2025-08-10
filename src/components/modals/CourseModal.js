import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db, addDoc, collection, updateDoc, doc } from '../../firebase';

export default function CourseModal({ isOpen, onClose, onSuccess, course, isGuest }) {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: '', code: '', credits: '', semester: 'Fall', year: new Date().getFullYear(), grade: 'A', isScience: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const motion = window.motion;

    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
    const grades = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F', 'P', 'NP'];

    useEffect(() => {
        if (course) {
            setFormData({ ...course, isScience: course.isScience || false });
        } else {
            setFormData({ name: '', code: '', credits: '', semester: 'Fall', year: new Date().getFullYear(), grade: 'A', isScience: false });
        }
    }, [course]);
    
    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.credits || formData.credits <= 0) {
            setError('Course name and positive credits are required.');
            return;
        }
        setError('');
        setIsSubmitting(true);

        if (isGuest) {
            console.log("Guest mode does not save data.");
            onSuccess();
            setIsSubmitting(false);
            return;
        }

        const dataToSave = {
            ...formData,
            credits: parseFloat(formData.credits),
            year: parseInt(formData.year, 10),
            userId: user.uid,
            isScience: formData.isScience || false,
        };

        try {
            if (course) {
                const docRef = doc(db, 'courses', course.id);
                await updateDoc(docRef, dataToSave);
            } else {
                await addDoc(collection(db, 'courses'), dataToSave);
            }
            onSuccess();
        } catch (err) {
            console.error("Error saving course:", err);
            setError("Failed to save course. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const modalContent = (
        <form onSubmit={handleSubmit} className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{course ? 'Edit' : 'Add'} Course</h2>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <div className="space-y-4">
                <div>
                    <label className="block mb-2 text-sm font-medium">Course Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g., General Chemistry I" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium">Course Code</label>
                    <input type="text" name="code" value={formData.code} onChange={handleChange} placeholder="e.g., CHEM 101" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium">Credits</label>
                        <input type="number" name="credits" value={formData.credits} onChange={handleChange} step="0.1" min="0" required placeholder="e.g., 4" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium">Grade</label>
                        <select name="grade" value={formData.grade} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600">
                            {grades.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium">Semester</label>
                        <select name="semester" value={formData.semester} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600">
                            <option>Fall</option>
                            <option>Spring</option>
                            <option>Summer</option>
                        </select>
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium">Year</label>
                        <select name="year" value={formData.year} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600">
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>
                <div className="pt-2">
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            name="isScience"
                            checked={formData.isScience}
                            onChange={handleChange}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">This is a science course (for BCPM GPA)</span>
                    </label>
                </div>
            </div>
            <div className="mt-6 flex justify-end gap-4">
                <button type="button" onClick={onClose} className="py-2 px-4 text-sm font-medium text-gray-900 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">
                    Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="py-2 px-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:bg-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800 dark:disabled:bg-blue-400">
                    {isSubmitting ? 'Saving...' : 'Save'}
                </button>
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

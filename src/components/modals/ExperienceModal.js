import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db, writeBatch, serverTimestamp, doc, collection, updateDoc } from '../../firebase';
import { CATEGORY_NAMES } from '../../constants';

export default function ExperienceModal({ isOpen, onClose, onSuccess, experience, isGuest }) {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        category: 'Patient Care Experience',
        date: new Date().toISOString().split('T')[0],
        hours: '',
        location: '',
        notes: ''
    });
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringData, setRecurringData] = useState({
        endDate: '',
        frequency: 'Daily',
        daysOfWeek: { Sun: false, Mon: false, Tue: false, Wed: false, Thu: false, Fri: false, Sat: false }
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const motion = window.motion;

    useEffect(() => {
        if (experience) {
            const date = experience.date?.toDate ? experience.date.toDate() : new Date();
            setFormData({
                category: experience.category,
                date: date.toISOString().split('T')[0],
                hours: experience.hours,
                location: experience.location,
                notes: experience.notes
            });
            setIsRecurring(false);
        } else {
             setFormData({
                category: 'Patient Care Experience',
                date: new Date().toISOString().split('T')[0],
                hours: '',
                location: '',
                notes: ''
            });
        }
    }, [experience]);
    
    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleRecurringChange = (e) => {
        const { name, value } = e.target;
        setRecurringData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleDayToggle = (day) => {
        setRecurringData(prev => ({
            ...prev,
            daysOfWeek: { ...prev.daysOfWeek, [day]: !prev.daysOfWeek[day] }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.hours || formData.hours <= 0) {
            setError('Hours must be a positive number.');
            return;
        }
        if (isRecurring && !recurringData.endDate) {
            setError('End date is required for recurring entries.');
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

        const batch = writeBatch(db);
        
        if (isRecurring) {
            let currentDate = new Date(formData.date + 'T00:00:00');
            const lastDate = new Date(recurringData.endDate + 'T00:00:00');
            const selectedDays = Object.keys(recurringData.daysOfWeek).map((day, index) => recurringData.daysOfWeek[day] ? index : -1).filter(index => index !== -1);

            while (currentDate <= lastDate) {
                let shouldAdd = false;
                if (recurringData.frequency === 'Daily') {
                    shouldAdd = true;
                } else if (recurringData.frequency === 'Weekly') {
                    if (selectedDays.length === 0 || selectedDays.includes(currentDate.getDay())) {
                         shouldAdd = true;
                    }
                } else if (recurringData.frequency === 'Bi-Weekly') {
                    const weekDiff = Math.floor((currentDate - new Date(formData.date + 'T00:00:00')) / (1000 * 60 * 60 * 24 * 7));
                    if (weekDiff % 2 === 0 && (selectedDays.length === 0 || selectedDays.includes(currentDate.getDay()))) {
                        shouldAdd = true;
                    }
                }

                if (shouldAdd) {
                    const newDocRef = doc(collection(db, "experiences"));
                    batch.set(newDocRef, {
                        ...formData,
                        hours: parseFloat(formData.hours),
                        date: new Date(currentDate),
                        userId: user.uid,
                        createdAt: serverTimestamp(),
                    });
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
        } else {
             const finalData = {
                 ...formData,
                 hours: parseFloat(formData.hours),
                 date: new Date(formData.date + 'T00:00:00'),
                 userId: user.uid,
            }
            if (experience) {
                const docRef = doc(db, 'experiences', experience.id);
                batch.update(docRef, { ...finalData, updatedAt: serverTimestamp() });
            } else {
                const newDocRef = doc(collection(db, "experiences"));
                batch.set(newDocRef, { ...finalData, createdAt: serverTimestamp() });
            }
        }

        try {
            await batch.commit();
            onSuccess();
        } catch (err) {
            console.error("Error saving experience(s):", err);
            setError("Failed to save. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const modalContent = (
        <form onSubmit={handleSubmit} className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{experience ? 'Edit' : 'Log'} Experience</h2>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium">Date</label>
                        <input type="date" name="date" value={formData.date} onChange={handleChange} required className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium">Hours</label>
                        <input type="number" name="hours" value={formData.hours} onChange={handleChange} step="0.1" min="0" required placeholder="e.g., 8.5" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium">Category</label>
                    <select name="category" value={formData.category} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600">
                        {CATEGORY_NAMES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block mb-2 text-sm font-medium">Location / Organization</label>
                    <input type="text" name="location" value={formData.location} onChange={handleChange} required placeholder="e.g., City General Hospital" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium">Notes / Reflections</label>
                    <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" placeholder="Describe your responsibilities..." className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600"></textarea>
                </div>
                {!experience && (
                    <div className="flex items-center pt-2">
                        <input id="isRecurring" type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                        <label htmlFor="isRecurring" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">This is a recurring entry</label>
                    </div>
                )}
                {isRecurring && (
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-2 text-sm font-medium">End Date</label>
                                <input type="date" name="endDate" value={recurringData.endDate} onChange={handleRecurringChange} required className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium">Frequency</label>
                                <select name="frequency" value={recurringData.frequency} onChange={handleRecurringChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600">
                                    <option>Daily</option>
                                    <option>Weekly</option>
                                    <option>Bi-Weekly</option>
                                </select>
                            </div>
                        </div>
                        {(recurringData.frequency === 'Weekly' || recurringData.frequency === 'Bi-Weekly') && (
                            <div>
                                <label className="block mb-2 text-sm font-medium">Repeat on</label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.keys(recurringData.daysOfWeek).map(day => (
                                        <button type="button" key={day} onClick={() => handleDayToggle(day)} className={`px-3 py-1 text-sm rounded-full ${recurringData.daysOfWeek[day] ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
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

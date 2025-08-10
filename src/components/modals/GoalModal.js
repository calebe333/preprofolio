import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db, doc, setDoc } from '../../firebase';
import { CATEGORY_NAMES } from '../../constants';

export default function GoalModal({ isOpen, onClose, onSuccess, currentGoals, isGuest }) {
    const { user } = useAuth();
    const [goals, setGoals] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const motion = window.motion;

    useEffect(() => {
        const initialGoals = CATEGORY_NAMES.reduce((acc, cat) => {
            acc[cat] = currentGoals[cat] || '';
            return acc;
        }, {});
        setGoals(initialGoals);
    }, [currentGoals]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setGoals(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const goalsToSave = Object.entries(goals).reduce((acc, [key, value]) => {
            acc[key] = parseInt(value, 10) || 0;
            return acc;
        }, {});

        if (isGuest) {
            console.log("Guest goals would be saved locally:", goalsToSave);
            onSuccess();
            setIsSubmitting(false);
            return;
        }

        try {
            const goalDocRef = doc(db, "goals", user.uid);
            await setDoc(goalDocRef, goalsToSave, { merge: true });
            onSuccess();
        } catch (error) {
            console.error("Error saving goals:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const modalContent = (
         <form onSubmit={handleSubmit} className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Set Your Hour Goals</h2>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Set a target number of hours for each category to track your progress.</p>
            <div className="space-y-4">
                {CATEGORY_NAMES.map(cat => (
                     <div key={cat}>
                        <label htmlFor={cat} className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{cat}</label>
                        <input 
                            type="number" 
                            id={cat} 
                            name={cat}
                            value={goals[cat] || ''}
                            onChange={handleChange}
                            min="0"
                            placeholder="e.g., 200" 
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                        />
                    </div>
                ))}
            </div>
            <div className="mt-6 flex justify-end gap-4">
                <button type="button" onClick={onClose} className="py-2 px-4 text-sm font-medium text-gray-900 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">
                    Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="py-2 px-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:bg-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800 dark:disabled:bg-blue-400">
                    {isSubmitting ? 'Saving...' : 'Save Goals'}
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

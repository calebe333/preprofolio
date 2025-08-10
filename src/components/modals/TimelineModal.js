import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db, collection, doc, updateDoc, addDoc, serverTimestamp } from '../../firebase';

export default function TimelineModal({ isOpen, onClose, milestone, isGuest, existingCategories }) {
    const { user } = useAuth();
    const [formData, setFormData] = useState({ title: '', description: '', category: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const motion = window.motion;

    useEffect(() => {
        if (milestone) {
            setFormData({
                title: milestone.title || '',
                description: milestone.description || '',
                category: milestone.category || 'General'
            });
        } else {
            setFormData({ title: '', description: '', category: 'General' });
        }
    }, [milestone]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title) return;
        setIsSubmitting(true);

        if (isGuest) {
            console.log("Guest mode: Save timeline item", formData);
            onClose();
            setIsSubmitting(false);
            return;
        }

        const timelineCollectionRef = collection(db, 'users', user.uid, 'timeline');
        
        try {
            if (milestone) {
                const milestoneRef = doc(timelineCollectionRef, milestone.id);
                await updateDoc(milestoneRef, formData);
            } else {
                await addDoc(timelineCollectionRef, {
                    ...formData,
                    isCompleted: false,
                    createdAt: serverTimestamp()
                });
            }
            onClose();
        } catch (error) {
            console.error("Error saving milestone:", error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const modalContent = (
        <form onSubmit={handleSubmit} className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{milestone ? 'Edit' : 'Add'} Milestone</h2>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            <div className="space-y-4">
                <div>
                    <label className="block mb-2 text-sm font-medium">Title</label>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} required placeholder="e.g., Submit AMCAS Application" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium">Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows="3" placeholder="Add details or notes here..." className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600"></textarea>
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium">Category</label>
                    <input 
                        type="text" 
                        name="category" 
                        value={formData.category} 
                        onChange={handleChange} 
                        required 
                        placeholder="e.g., Primary Application" 
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600"
                        list="category-suggestions"
                    />
                    <datalist id="category-suggestions">
                        {existingCategories && existingCategories.map(cat => <option key={cat} value={cat} />)}
                    </datalist>
                </div>
            </div>
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

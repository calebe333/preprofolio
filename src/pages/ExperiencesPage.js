import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, collection, query, where, orderBy, onSnapshot, deleteDoc, doc, writeBatch, serverTimestamp, addDoc, updateDoc } from '../firebase';
import { getMockData } from '../mockData';
import { CATEGORY_NAMES } from '../constants';

// For further organization, you could move the Modal to its own file in `/components/modals/`
const ExperienceModal = ({ isOpen, onClose, onSuccess, experience, isGuest }) => {
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

        const batch = writeBatch(db);
        
        if (isRecurring) {
            let currentDate = new Date(formData.date + 'T00:00:00'); // Avoid timezone issues
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
                 date: new Date(formData.date),
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
            if (!isGuest) {
                await batch.commit();
            }
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
            {/* ... Modal JSX ... */}
        </form>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            {/* ... Modal wrapper JSX ... */}
        </div>
    );
};

const ExperienceRow = ({ exp, onEdit, onDelete }) => {
    const formattedDate = exp.date?.toDate ? exp.date.toDate().toLocaleDateString() : 'N/A';
    return (
        <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{formattedDate}</td>
            <td className="px-6 py-4">{exp.category}</td>
            <td className="px-6 py-4 font-bold">{exp.hours?.toFixed(1)}</td>
            <td className="px-6 py-4">{exp.location}</td>
            <td className="px-6 py-4 hidden md:table-cell max-w-xs truncate" title={exp.notes}>{exp.notes}</td>
            <td className="px-6 py-4 flex items-center gap-2">
                <button onClick={() => onEdit(exp)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Edit</button>
                <button onClick={() => onDelete(exp.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">Delete</button>
            </td>
        </tr>
    );
};

const ExperienceLog = ({ allExperiences, loading, onEdit, onDelete, filterCategory, setFilterCategory, searchTerm, setSearchTerm, dateRange, setDateRange }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const totalPages = Math.ceil(allExperiences.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentExperiences = allExperiences.slice(startIndex, endIndex);

    const goToNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };

    const goToPreviousPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [filterCategory, searchTerm, dateRange]);

    return (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg">
            {/* ... ExperienceLog JSX ... */}
        </div>
    );
};

export default function ExperiencesPage({ isGuest }) {
    const { user } = useAuth();
    const [experiences, setExperiences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isExperienceModalOpen, setIsExperienceModalOpen] = useState(false);
    const [editingExperience, setEditingExperience] = useState(null);
    const [filterCategory, setFilterCategory] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const motion = window.motion;

    useEffect(() => {
        if (isGuest) {
            setExperiences(getMockData().experiences);
            setLoading(false);
            return;
        }
        if (!user || !db) {
            setLoading(false);
            return;
        };

        setLoading(true);

        const expQuery = query(collection(db, "experiences"), where("userId", "==", user.uid), orderBy("date", "desc"));
        const unsubscribe = onSnapshot(expQuery, (querySnapshot) => {
            const experiencesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setExperiences(experiencesData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching experiences:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, isGuest]);

    const handleAddOrUpdate = () => {
        setIsExperienceModalOpen(false);
        setEditingExperience(null);
    };
    
    const handleEdit = (exp) => {
        setEditingExperience(exp);
        setIsExperienceModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (isGuest) {
            setExperiences(experiences.filter(exp => exp.id !== id));
            return;
        }

        if (window.confirm("Are you sure you want to delete this entry?")) {
            try {
                await deleteDoc(doc(db, "experiences", id));
            } catch (error) {
                console.error("Error deleting experience:", error);
            }
        }
    };
    
    const filteredExperiences = experiences.filter(exp => {
        const categoryMatch = filterCategory === 'All' || exp.category === filterCategory;
        const searchTermMatch = searchTerm === '' || 
                                (exp.location && exp.location.toLowerCase().includes(searchTerm.toLowerCase())) || 
                                (exp.notes && exp.notes.toLowerCase().includes(searchTerm.toLowerCase()));
        
        let startDateMatch = true;
        if (dateRange.start) {
            const start = new Date(dateRange.start);
            start.setHours(0, 0, 0, 0);
            startDateMatch = exp.date.toDate() >= start;
        }

        let endDateMatch = true;
        if (dateRange.end) {
            const end = new Date(dateRange.end);
            end.setHours(23, 59, 59, 999);
            endDateMatch = exp.date.toDate() <= end;
        }

        return categoryMatch && searchTermMatch && startDateMatch && endDateMatch;
    });

    return (
        <div className="max-w-7xl mx-auto space-y-8">
             {/* ... ExperiencesPage JSX ... */}
        </div>
    );
};

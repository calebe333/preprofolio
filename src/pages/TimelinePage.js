import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, collection, query, orderBy, onSnapshot, doc, updateDoc, writeBatch, serverTimestamp, deleteDoc, addDoc } from '../firebase';
import { getMockData } from '../mockData';
import { TIMELINE_MILESTONES } from '../constants';
import LoadingScreen from '../components/LoadingScreen';
import TimelineModal from '../components/modals/TimelineModal';

export default function TimelinePage({ isGuest }) {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [milestones, setMilestones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMilestone, setEditingMilestone] = useState(null);
    const motion = window.motion;

    useEffect(() => {
        if (isGuest) {
            const mockProfile = getMockData().profile;
            setProfile(mockProfile);
            const defaultMilestones = TIMELINE_MILESTONES[mockProfile.track] || [];
            setMilestones(defaultMilestones.map(m => ({ ...m, isCompleted: false, id: m.id })));
            setLoading(false);
            return;
        }

        if (!user || !db) {
            setLoading(false);
            return;
        }

        let profileUnsubscribe;
        let timelineUnsubscribe;

        const profileDocRef = doc(db, 'profiles', user.uid);
        profileUnsubscribe = onSnapshot(profileDocRef, (docSnap) => {
            const userProfile = docSnap.exists() ? docSnap.data() : { track: 'Pre-Med' };
            setProfile(userProfile);

            if (timelineUnsubscribe) timelineUnsubscribe(); 
            
            const timelineCollectionRef = collection(db, 'users', user.uid, 'timeline');
            timelineUnsubscribe = onSnapshot(query(timelineCollectionRef, orderBy('createdAt', 'asc')), async (snapshot) => {
                if (snapshot.empty && userProfile.track) {
                    setLoading(true);
                    const defaultMilestones = TIMELINE_MILESTONES[userProfile.track] || [];
                    const batch = writeBatch(db);
                    defaultMilestones.forEach((milestone) => {
                        const newMilestoneRef = doc(collection(db, 'users', user.uid, 'timeline'));
                        batch.set(newMilestoneRef, {
                            ...milestone,
                            isCompleted: false,
                            createdAt: serverTimestamp() 
                        });
                    });
                    await batch.commit();
                    setLoading(false);
                } else {
                    const userMilestones = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setMilestones(userMilestones);
                    setLoading(false);
                }
            });
        });

        return () => {
            if (profileUnsubscribe) profileUnsubscribe();
            if (timelineUnsubscribe) timelineUnsubscribe();
        };
    }, [user, isGuest]);

    const handleToggleComplete = async (milestone) => {
        if (isGuest) {
            setMilestones(milestones.map(m => m.id === milestone.id ? { ...m, isCompleted: !m.isCompleted } : m));
            return;
        }
        const milestoneRef = doc(db, 'users', user.uid, 'timeline', milestone.id);
        await updateDoc(milestoneRef, { isCompleted: !milestone.isCompleted });
    };

    const handleDelete = async (milestoneId) => {
        if (isGuest) {
            setMilestones(milestones.filter(m => m.id !== milestoneId));
            return;
        }
        if (window.confirm("Are you sure you want to delete this milestone?")) {
            const milestoneRef = doc(db, 'users', user.uid, 'timeline', milestoneId);
            await deleteDoc(milestoneRef);
        }
    };

    const handleOpenModal = (milestone = null) => {
        setEditingMilestone(milestone);
        setIsModalOpen(true);
    };

    if (loading) return <LoadingScreen />;

    const userTrack = profile?.track || 'Pre-Med';
    
    const uniqueCategories = [...new Set(milestones.map(m => m.category || 'General').sort())];
    
    const milestonesByCategory = milestones.reduce((acc, milestone) => {
        const category = milestone.category || 'General';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(milestone);
        return acc;
    }, {});
    
    const categoryOrder = TIMELINE_MILESTONES[userTrack]?.map(m => m.category)
        .filter((value, index, self) => self.indexOf(value) === index) || [];

    const sortedCategories = Object.keys(milestonesByCategory).sort((a, b) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });

    return (
        <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-8">
                <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Application Timeline</h2>
                <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">
                    Your personalized roadmap for the <span className="font-bold text-blue-600 dark:text-blue-400">{userTrack}</span> track.
                </p>
            </div>
             <div className="text-center mb-12">
                <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md flex items-center justify-center gap-2 transform hover:scale-105 transition-transform mx-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    Add Milestone
                </button>
            </div>

            <div className="relative pl-8 md:pl-0">
                <div className="absolute left-4 md:left-1/2 -translate-x-1/2 h-full w-1 bg-gray-200 dark:bg-gray-700 rounded-full" aria-hidden="true"></div>
                <div className="space-y-16">
                    {sortedCategories.map((category) => (
                        <div key={category} className="relative">
                            <div className="absolute left-4 md:left-1/2 -translate-x-1/2 -top-1 w-8 h-8 bg-white dark:bg-gray-900 flex items-center justify-center rounded-full">
                                <div className="w-4 h-4 bg-blue-500 rounded-full z-10"></div>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 md:text-center mb-8">{category}</h3>
                            <div className="space-y-12">
                                {milestonesByCategory[category].map((milestone, index) => {
                                    const isLeft = index % 2 === 0;
                                    return (
                                        <div key={milestone.id} className={`relative flex items-start w-full md:w-1/2 ${isLeft ? 'md:ml-auto md:pl-12' : 'md:mr-auto md:pr-12 md:text-right'}`}>
                                            <div className={`absolute left-4 md:left-auto md:right-auto ${isLeft ? 'md:-left-4' : 'md:-right-4'} top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-4 border-gray-50 dark:border-gray-900 z-10 transition-colors ${milestone.isCompleted ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                            <div className={`w-full p-5 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-l-4 md:border-l-0 ${isLeft ? 'md:border-r-4' : 'md:border-l-4'} transition-colors ${milestone.isCompleted ? 'border-green-500' : 'border-blue-500'}`}>
                                                <div className={`flex items-center ${isLeft ? 'justify-start md:justify-end' : 'justify-start'} gap-2 mb-2`}>
                                                     <button onClick={() => handleDelete(milestone.id)} className="text-gray-400 hover:text-red-500 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button>
                                                    <button onClick={() => handleOpenModal(milestone)} className="text-gray-400 hover:text-blue-500 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></button>
                                                </div>
                                                <h4 className="text-lg font-bold text-gray-900 dark:text-white">{milestone.title}</h4>
                                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{milestone.description}</p>
                                                <div className="mt-4">
                                                    <button onClick={() => handleToggleComplete(milestone)} className={`w-full flex items-center justify-center gap-2 py-2 px-4 text-sm font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 ${milestone.isCompleted ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900' : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}>
                                                        {milestone.isCompleted ? 'Marked as Complete' : 'Mark as Complete'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {motion && <motion.AnimatePresence>
                {isModalOpen && <TimelineModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} milestone={editingMilestone} isGuest={isGuest} existingCategories={uniqueCategories} />}
            </motion.AnimatePresence>}
            {!motion && isModalOpen && <TimelineModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} milestone={editingMilestone} isGuest={isGuest} existingCategories={uniqueCategories} />}
        </div>
    );
};

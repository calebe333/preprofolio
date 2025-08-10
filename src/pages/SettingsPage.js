import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, doc, onSnapshot, setDoc } from '../firebase';
import LoadingScreen from '../components/LoadingScreen';

export default function SettingsPage({ setCurrentPage }) {
    const { user } = useAuth();
    const [profile, setProfile] = useState({ track: 'Pre-Med', customTrack: '', bio: '', applicationYear: new Date().getFullYear() + 1 });
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const applicationYears = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        const profileDocRef = doc(db, 'profiles', user.uid);
        const unsubscribe = onSnapshot(profileDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setProfile(prev => ({...prev, ...docSnap.data()}));
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!user) return;
        setIsSaving(true);
        try {
            const profileDocRef = doc(db, 'profiles', user.uid);
            await setDoc(profileDocRef, profile, { merge: true });
        } catch (error) {
            console.error("Error saving profile:", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <LoadingScreen />;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
                    <img src={user.photoURL} alt="Profile" className="w-24 h-24 rounded-full" />
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{user.displayName}</h2>
                        <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                </div>
                
                <form onSubmit={handleSave} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="track" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Professional Track</label>
                            <select id="track" name="track" value={profile.track} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600">
                                <option>Pre-Med</option>
                                <option>Pre-PA</option>
                                <option>Pre-Dental</option>
                                <option>Other</option>
                            </select>
                        </div>
                        {profile.track === 'Other' && (
                            <div>
                                <label htmlFor="customTrack" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Custom Track Name</label>
                                <input type="text" name="customTrack" id="customTrack" value={profile.customTrack || ''} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                        )}
                        <div>
                            <label htmlFor="applicationYear" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Planned Application Year</label>
                            <select id="applicationYear" name="applicationYear" value={profile.applicationYear} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600">
                                {applicationYears.map(year => <option key={year} value={year}>{year}</option>)}
                            </select>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Professional Summary / Bio</label>
                        <textarea id="bio" name="bio" rows="4" value={profile.bio || ''} onChange={handleChange} placeholder="Briefly describe your goals and interests..." className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"></textarea>
                    </div>
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={() => setCurrentPage('dashboard')} className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
                            Back to Dashboard
                        </button>
                        <button type="submit" disabled={isSaving} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                            {isSaving ? 'Saving...' : 'Save Profile'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

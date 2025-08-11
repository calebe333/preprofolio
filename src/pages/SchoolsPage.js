import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, collection, onSnapshot, doc, query, where, addDoc, getDocs, updateDoc, deleteDoc, serverTimestamp, orderBy } from '../firebase';
import { getMockData } from '../mockData';
import LoadingScreen from '../components/LoadingScreen';
import SchoolModal from '../components/modals/SchoolModal';
import SchoolDetailModal from '../components/modals/SchoolDetailModal';
import MapView from '../components/schools/MapView';

// --- Helper Components (MySchoolsList, BrowseSchoolsList) remain unchanged ---

export default function SchoolsPage({ isGuest }) {
    const { user } = useAuth();
    const [view, setView] = useState('mySchools');
    const [browseView, setBrowseView] = useState('list');
    const [allSchools, setAllSchools] = useState([]);
    const [mySchools, setMySchools] = useState([]);
    const [userCourses, setUserCourses] = useState([]);
    const [userProfile, setUserProfile] = useState(null); // New state for user profile
    const [loading, setLoading] = useState(true);
    const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState(null);
    const [modalMode, setModalMode] = useState('add');
    
    const isStaff = user?.role === 'staff';

    useEffect(() => {
        if (isGuest) {
            const mock = getMockData();
            setAllSchools(mock.allSchools);
            setMySchools(mock.mySchools);
            setUserCourses(mock.courses);
            setUserProfile(mock.profile); // Load mock profile for guest
            setLoading(false);
            return;
        }

        if (!user) {
            setLoading(false);
            return;
        }

        // Listener for all schools
        const schoolsUnsubscribe = onSnapshot(query(collection(db, 'schools'), orderBy("name", "asc")), (snapshot) => {
            setAllSchools(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });

        // Listener for user's favorited schools
        const mySchoolsUnsubscribe = onSnapshot(collection(db, 'users', user.uid, 'mySchools'), (snapshot) => {
            setMySchools(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // Listener for user's courses
        const coursesUnsubscribe = onSnapshot(query(collection(db, "courses"), where("userId", "==", user.uid)), (snapshot) => {
            setUserCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // NEW: Listener for user's profile
        const profileUnsubscribe = onSnapshot(doc(db, "profiles", user.uid), (docSnap) => {
            if (docSnap.exists()) {
                setUserProfile(docSnap.data());
            }
        });

        return () => {
            schoolsUnsubscribe();
            mySchoolsUnsubscribe();
            coursesUnsubscribe();
            profileUnsubscribe(); // Cleanup the new listener
        };
    }, [user, isGuest]);
    
    // ... All handler functions remain unchanged ...

    const handleViewDetails = (schoolOrId) => {
        let schoolData = typeof schoolOrId === 'string'
            ? allSchools.find(s => s.id === schoolOrId)
            : schoolOrId;
        setSelectedSchool(schoolData);
        setIsDetailModalOpen(true);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* ... Page header and view toggles remain unchanged ... */}

            {view === 'mySchools' && (
                <MySchoolsList
                    mySchools={mySchools}
                    onEdit={(school) => openEditModal('editMySchool', school)}
                    onDelete={handleRemoveFromMyList}
                    onViewDetails={handleViewDetails}
                    loading={loading}
                />
            )}

            {view === 'browse' && browseView === 'list' && (
                <BrowseSchoolsList
                    allSchools={allSchools}
                    mySchoolIds={mySchools.map(s => s.schoolId)}
                    onToggleFavorite={handleToggleFavorite}
                    onAddNewSchool={() => openEditModal('add')}
                    onEditSchool={(school) => openEditModal('editMaster', school)}
                    onViewDetails={handleViewDetails}
                    onVerify={handleVerifySchool}
                    loading={loading}
                    isStaff={isStaff}
                    userId={user?.uid}
                />
            )}

            {view === 'browse' && browseView === 'map' && (
                <MapView schools={allSchools} onViewDetails={handleViewDetails} />
            )}
            
            {/* Detail Modal now receives userProfile */}
            {isDetailModalOpen && (
                <SchoolDetailModal 
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    school={selectedSchool}
                    userCourses={userCourses} 
                    userProfile={userProfile}
                />
            )}

            {/* Edit/Add Modal remains unchanged */}
            {isSchoolModalOpen && (
                <SchoolModal 
                    isOpen={isSchoolModalOpen}
                    onClose={() => setIsSchoolModalOpen(false)}
                    school={selectedSchool}
                    mode={modalMode}
                    onSaveMySchool={handleUpdateMySchool}
                    onSaveMasterSchool={handleSaveMasterSchool}
                    isGuest={isGuest}
                    isStaff={isStaff}
                />
            )}
        </div>
    );
};

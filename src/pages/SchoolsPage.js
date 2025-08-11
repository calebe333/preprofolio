import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, collection, onSnapshot, doc, query, where, addDoc, getDocs, updateDoc, deleteDoc, serverTimestamp, orderBy } from '../firebase';
import { getMockData } from '../mockData';
import LoadingScreen from '../components/LoadingScreen';
import SchoolModal from '../components/modals/SchoolModal';
import SchoolDetailModal from '../components/modals/SchoolDetailModal';

// --- Helper Components for SchoolsPage ---

const MySchoolsList = ({ mySchools, onEdit, onDelete, onViewDetails, loading }) => {
    if (loading) return <LoadingScreen />;
    if (mySchools.length === 0) {
        return (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No schools on your list yet</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Go to "Browse All" to start adding schools.</p>
            </div>
        );
    }

    const SchoolCard = ({ school, onEdit, onDelete, onViewDetails }) => {
        const statusColors = {
            'Researching': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
            'Applying': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
            'Interviewing': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
            'Accepted': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
            'Rejected': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        };
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border border-transparent hover:border-blue-500/50">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                        <button onClick={() => onViewDetails(school.schoolId)} className="text-lg font-bold text-gray-900 dark:text-white text-left hover:text-blue-600 dark:hover:text-blue-400 transition-colors pr-4">{school.name}</button>
                        <span className={`text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full ${statusColors[school.status] || 'bg-gray-100 text-gray-800'}`}>{school.status}</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{school.location} - {school.program}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md min-h-[50px]">{school.notes || 'No notes yet.'}</p>
                </div>
                <div className="flex justify-between items-center gap-4 mt-2 bg-gray-50 dark:bg-gray-800/50 px-6 py-3 rounded-b-2xl border-t border-gray-100 dark:border-gray-700">
                    <button onClick={() => onEdit(school)} className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">Edit Status/Notes</button>
                    <button onClick={() => onDelete(school.id)} title="Remove from My Schools" className="text-gray-400 hover:text-yellow-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    </button>
                </div>
            </div>
        );
    };
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mySchools.map(school => <SchoolCard key={school.id} school={school} onEdit={onEdit} onDelete={onDelete} onViewDetails={onViewDetails} />)}
        </div>
    );
};

const BrowseSchoolsList = ({ allSchools, mySchoolIds, onToggleFavorite, onAddNewSchool, onEditSchool, onViewDetails, onVerify, loading, isStaff, userId }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [programFilter, setProgramFilter] = useState('All');

    const filteredSchools = allSchools.filter(school => {
        const nameMatch = school.name.toLowerCase().includes(searchTerm.toLowerCase());
        const locationMatch = school.location.toLowerCase().includes(searchTerm.toLowerCase());
        const programMatch = programFilter === 'All' || school.program === programFilter;
        return (nameMatch || locationMatch) && programMatch;
    });

    return (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex-grow flex gap-2 w-full sm:w-auto">
                    <input 
                        type="text"
                        placeholder="Search by name or location..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    />
                    <select
                        value={programFilter}
                        onChange={(e) => setProgramFilter(e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-auto p-2.5 dark:bg-gray-700 dark:border-gray-600"
                    >
                        <option value="All">All Programs</option>
                        <option value="MD">MD</option>
                        <option value="PA">PA</option>
                        <option value="DDS">DDS</option>
                    </select>
                </div>
                <button onClick={onAddNewSchool} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center justify-center gap-2 w-full sm:w-auto transition-transform hover:scale-105">
                    Suggest New School
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                     <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3 w-12">Fav</th>
                            <th scope="col" className="px-6 py-3">School Name</th>
                            <th scope="col" className="px-6 py-3">Location</th>
                            <th scope="col" className="px-6 py-3">Program</th>
                            <th scope="col" className="px-6 py-3 text-center">Avg. GPA</th>
                            <th scope="col" className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="text-center p-8">Loading schools...</td></tr>
                        ) : filteredSchools.map(school => {
                            const isFavorited = mySchoolIds.includes(school.id);
                            return (
                                <tr key={school.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <button onClick={() => onToggleFavorite(school)} title={isFavorited ? "Remove from My Schools" : "Add to My Schools"} className="text-gray-400 hover:text-yellow-500 transition-transform hover:scale-125">
                                            {isFavorited ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                </svg>
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                        <button onClick={() => onViewDetails(school)} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left">
                                            {school.name}
                                        </button>
                                        {school.verified ? (
                                            <span className="ml-2 text-xs font-medium text-green-800 bg-green-100 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded-full">Verified</span>
                                        ) : (
                                            <span className="ml-2 text-xs font-medium text-yellow-800 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300 px-2 py-0.5 rounded-full">Unverified</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">{school.location}</td>
                                    <td className="px-6 py-4">{school.program}</td>
                                    <td className="px-6 py-4 text-center">{school.avgGPA || 'N/A'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            {isStaff && !school.verified && (
                                                <button onClick={() => onVerify(school.id)} className="text-green-600 hover:text-green-800 font-semibold">Verify</button>
                                            )}
                                            {(isStaff || (!school.verified && school.submittedBy === userId)) && (
                                                <button onClick={() => onEditSchool(school)} className="text-gray-500 hover:text-gray-700 font-semibold">Edit</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// --- Main SchoolsPage Component ---

export default function SchoolsPage({ isGuest }) {
    const { user } = useAuth();
    const [view, setView] = useState('mySchools');
    const [allSchools, setAllSchools] = useState([]);
    const [mySchools, setMySchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState(null);
    const [modalMode, setModalMode] = useState('add');
    const motion = window.motion;

    const isStaff = user?.role === 'staff';

    useEffect(() => {
        if (isGuest) {
            const mock = getMockData();
            setAllSchools(mock.allSchools);
            setMySchools(mock.mySchools);
            setLoading(false);
            return;
        }

        if (!user) {
            setLoading(false);
            return;
        }

        const schoolsCollectionRef = collection(db, 'schools');
        const unsubscribeSchools = onSnapshot(query(schoolsCollectionRef, orderBy("name", "asc")), (snapshot) => {
            const schoolsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllSchools(schoolsData);
            setLoading(false);
        });

        const mySchoolsCollectionRef = collection(db, 'users', user.uid, 'mySchools');
        const unsubscribeMySchools = onSnapshot(mySchoolsCollectionRef, (snapshot) => {
            const userSchools = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMySchools(userSchools);
        });

        return () => {
            unsubscribeSchools();
            unsubscribeMySchools();
        };
    }, [user, isGuest]);
    
    const handleToggleFavorite = async (schoolToToggle) => {
        if (isGuest || !user) return;

        const existingFavorite = mySchools.find(s => s.schoolId === schoolToToggle.id);

        if (existingFavorite) {
            const docToDeleteRef = doc(db, 'users', user.uid, 'mySchools', existingFavorite.id);
            await deleteDoc(docToDeleteRef);
        } else {
            const mySchoolsCollectionRef = collection(db, 'users', user.uid, 'mySchools');
            const newSchoolData = {
                schoolId: schoolToToggle.id,
                name: schoolToToggle.name,
                location: schoolToToggle.location,
                program: schoolToToggle.program,
                status: 'Researching',
                notes: '',
                addedAt: serverTimestamp()
            };
            await addDoc(mySchoolsCollectionRef, newSchoolData);
        }
    };

    const handleUpdateMySchool = async (updatedSchool) => {
        if (isGuest) {
            setMySchools(mySchools.map(s => s.id === updatedSchool.id ? updatedSchool : s));
        } else {
            const schoolDocRef = doc(db, 'users', user.uid, 'mySchools', updatedSchool.id);
            await updateDoc(schoolDocRef, {
                status: updatedSchool.status,
                notes: updatedSchool.notes,
            });
        }
        setIsSchoolModalOpen(false);
    };
    
    const handleSaveMasterSchool = async (schoolData) => {
        if (isGuest) {
            const newSchool = { ...schoolData, id: `guest-${Date.now()}`, verified: false };
            setAllSchools(prev => [...prev, newSchool]);
        } else {
            if (schoolData.id) {
                const schoolDocRef = doc(db, 'schools', schoolData.id);
                const { id, ...dataToUpdate } = schoolData;
                await updateDoc(schoolDocRef, dataToUpdate);
            } else {
                await addDoc(collection(db, 'schools'), {
                    ...schoolData,
                    verified: false,
                    submittedBy: user.uid,
                    submittedAt: serverTimestamp(),
                });
            }
        }
        setIsSchoolModalOpen(false);
    };
    
    const handleVerifySchool = async (schoolId) => {
        if (isGuest || !isStaff) return;
        if (window.confirm("Are you sure you want to verify this school? This action cannot be undone by users.")) {
            const schoolDocRef = doc(db, 'schools', schoolId);
            await updateDoc(schoolDocRef, { verified: true });
        }
    };

    const handleRemoveFromMyList = async (mySchoolId) => {
        if (isGuest) {
            setMySchools(mySchools.filter(s => s.id !== mySchoolId));
            return;
        }
        if (window.confirm("Are you sure you want to remove this school from your list?")) {
            const schoolDocRef = doc(db, 'users', user.uid, 'mySchools', mySchoolId);
            await deleteDoc(schoolDocRef);
        }
    };
    
    const openEditModal = (mode, school = null) => {
        setModalMode(mode);
        setSelectedSchool(school);
        setIsSchoolModalOpen(true);
    };

    const handleViewDetails = (schoolOrId) => {
        let schoolData = typeof schoolOrId === 'string'
            ? allSchools.find(s => s.id === schoolOrId)
            : schoolOrId;
        setSelectedSchool(schoolData);
        setIsDetailModalOpen(true);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">School Tracker</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {view === 'mySchools' ? 'Manage your personal list of schools.' : 'Browse and discover new programs.'}
                    </p>
                </div>
                <div className="bg-gray-200 dark:bg-gray-700 p-1 rounded-lg flex">
                    <button 
                        onClick={() => setView('mySchools')}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md ${view === 'mySchools' ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow' : 'text-gray-600 dark:text-gray-300'}`}
                    >
                        My Schools
                    </button>
                    <button 
                        onClick={() => setView('browse')}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md ${view === 'browse' ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow' : 'text-gray-600 dark:text-gray-300'}`}
                    >
                        Browse All
                    </button>
                </div>
            </div>

            {view === 'mySchools' && (
                <MySchoolsList
                    mySchools={mySchools}
                    onEdit={(school) => openEditModal('editMySchool', school)}
                    onDelete={handleRemoveFromMyList}
                    onViewDetails={handleViewDetails}
                    loading={loading}
                />
            )}

            {view === 'browse' && (
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
            
            {isDetailModalOpen && (
                <SchoolDetailModal 
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    school={selectedSchool}
                />
            )}

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

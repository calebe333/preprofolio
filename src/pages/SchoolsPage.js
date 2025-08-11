import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, collection, onSnapshot, doc, query, where, addDoc, getDocs, updateDoc, deleteDoc, serverTimestamp } from '../firebase';
import { getMockData } from '../mockData';
import LoadingScreen from '../components/LoadingScreen';
import SchoolModal from '../components/modals/SchoolModal';

// --- Helper Components for SchoolsPage ---

const MySchoolsList = ({ mySchools, onEdit, onDelete, loading }) => {
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

    const SchoolCard = ({ school, onEdit, onDelete }) => {
        const statusColors = {
            'Researching': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
            'Applying': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
            'Interviewing': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
            'Accepted': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
            'Rejected': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        };
        return (
            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-lg flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{school.name}</h3>
                        <span className={`text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full ${statusColors[school.status] || 'bg-gray-100 text-gray-800'}`}>{school.status}</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{school.location} - {school.program}</p>
                    <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md min-h-[50px]">{school.notes || 'No notes yet.'}</p>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={() => onEdit(school)} className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">Edit Status/Notes</button>
                    <button onClick={() => onDelete(school.id)} className="text-sm font-medium text-red-600 hover:underline dark:text-red-400">Remove</button>
                </div>
            </div>
        );
    };
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mySchools.map(school => <SchoolCard key={school.id} school={school} onEdit={onEdit} onDelete={onDelete} />)}
        </div>
    );
};

const BrowseSchoolsList = ({ allSchools, mySchoolIds, onAdd, onAddNewSchool, onEditSchool, onVerify, loading, isStaff, userId }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [programFilter, setProgramFilter] = useState('All');

    const filteredSchools = allSchools.filter(school => {
        const nameMatch = school.name.toLowerCase().includes(searchTerm.toLowerCase());
        const locationMatch = school.location.toLowerCase().includes(searchTerm.toLowerCase());
        const programMatch = programFilter === 'All' || school.program === programFilter;
        return (nameMatch || locationMatch) && programMatch;
    });

    return (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
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
                <button onClick={onAddNewSchool} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center justify-center gap-2 w-full sm:w-auto">
                    Suggest New School
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                     <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">School Name</th>
                            <th scope="col" className="px-6 py-3">Location</th>
                            <th scope="col" className="px-6 py-3">Program</th>
                            <th scope="col" className="px-6 py-3 text-center">Avg. MCAT/DAT</th>
                            <th scope="col" className="px-6 py-3 text-center">Avg. GPA</th>
                            <th scope="col" className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="text-center p-8">Loading schools...</td></tr>
                        ) : filteredSchools.map(school => (
                            <tr key={school.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                    {school.name}
                                    {school.verified ? (
                                        <span className="ml-2 text-xs font-medium text-green-800 bg-green-100 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded-full">Verified</span>
                                    ) : (
                                        <span className="ml-2 text-xs font-medium text-yellow-800 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300 px-2 py-0.5 rounded-full">Unverified</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">{school.location}</td>
                                <td className="px-6 py-4">{school.program}</td>
                                <td className="px-6 py-4 text-center">{school.avgMCAT || school.avgDAT || 'N/A'}</td>
                                <td className="px-6 py-4 text-center">{school.avgGPA || 'N/A'}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {!mySchoolIds.includes(school.id) && (
                                            <button onClick={() => onAdd(school)} className="text-blue-600 hover:text-blue-800 font-semibold">Add to My List</button>
                                        )}
                                        {isStaff && !school.verified && (
                                            <button onClick={() => onVerify(school.id)} className="text-green-600 hover:text-green-800 font-semibold">Verify</button>
                                        )}
                                        {/* Staff can edit any school. Regular users can only edit unverified schools they submitted. */}
                                        {(isStaff || (!school.verified && school.submittedBy === userId)) && (
                                            <button onClick={() => onEditSchool(school)} className="text-gray-500 hover:text-gray-700 font-semibold">Edit</button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
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
    const [editingSchool, setEditingSchool] = useState(null);
    const [modalMode, setModalMode] = useState('add'); // 'add', 'editMySchool', 'editMaster'
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
        const unsubscribeSchools = onSnapshot(schoolsCollectionRef, (snapshot) => {
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

    const handleAddSchoolToList = async (school) => {
        if (isGuest) {
            const newSchool = { ...school, id: school.id, schoolId: school.id, status: 'Researching', notes: '' };
            setMySchools(prev => [...prev, newSchool]);
            return;
        }
        const mySchoolsCollectionRef = collection(db, 'users', user.uid, 'mySchools');
        const newSchoolData = {
            schoolId: school.id,
            name: school.name,
            location: school.location,
            program: school.program,
            status: 'Researching',
            notes: '',
            addedAt: serverTimestamp()
        };
        const q = query(mySchoolsCollectionRef, where("schoolId", "==", school.id));
        const existing = await getDocs(q);
        if (existing.empty) {
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
            if (schoolData.id) { // Editing existing school
                const schoolDocRef = doc(db, 'schools', schoolData.id);
                const { id, ...dataToUpdate } = schoolData;
                await updateDoc(schoolDocRef, dataToUpdate);
            } else { // Adding new school
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
    
    const openModal = (mode, school = null) => {
        setModalMode(mode);
        setEditingSchool(school);
        setIsSchoolModalOpen(true);
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
                    onEdit={(school) => openModal('editMySchool', school)}
                    onDelete={handleRemoveFromMyList}
                    loading={loading}
                />
            )}

            {view === 'browse' && (
                <BrowseSchoolsList
                    allSchools={allSchools}
                    mySchoolIds={mySchools.map(s => s.schoolId)}
                    onAdd={handleAddSchoolToList}
                    onAddNewSchool={() => openModal('add')}
                    onEditSchool={(school) => openModal('editMaster', school)}
                    onVerify={handleVerifySchool}
                    loading={loading}
                    isStaff={isStaff}
                    userId={user?.uid}
                />
            )}
            
            {motion && <motion.AnimatePresence>
                {isSchoolModalOpen && (
                    <SchoolModal 
                        isOpen={isSchoolModalOpen}
                        onClose={() => setIsSchoolModalOpen(false)}
                        school={editingSchool}
                        mode={modalMode}
                        onSaveMySchool={handleUpdateMySchool}
                        onSaveMasterSchool={handleSaveMasterSchool}
                        isGuest={isGuest}
                        isStaff={isStaff}
                    />
                )}
            </motion.AnimatePresence>}
            {!motion && isSchoolModalOpen && (
                 <SchoolModal 
                    isOpen={isSchoolModalOpen}
                    onClose={() => setIsSchoolModalOpen(false)}
                    school={editingSchool}
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

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, collection, query, where, orderBy, onSnapshot, doc, deleteDoc, addDoc, updateDoc, setDoc } from '../firebase';
import { getMockData } from '../mockData';
import { PROGRAM_PREREQUISITES } from '../constants';
import { calculateGPA } from '../utils/helpers';
import LoadingScreen from '../components/LoadingScreen';
import CourseModal from '../components/modals/CourseModal';

const CourseRow = ({ course, onEdit, onDelete }) => {
    return (
        <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{course.name}</td>
            <td className="px-6 py-4">{course.code}</td>
            <td className="px-6 py-4">{course.credits}</td>
            <td className="px-6 py-4 font-bold">{course.grade}</td>
            <td className="px-6 py-4 text-center">
                {course.isScience && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 inline-block" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                )}
            </td>
            <td className="px-6 py-4 flex items-center gap-2">
                <button onClick={() => onEdit(course)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Edit</button>
                <button onClick={() => onDelete(course.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">Delete</button>
            </td>
        </tr>
    );
};

const CourseLog = ({ isGuest }) => {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const motion = window.motion;

    useEffect(() => {
        if (isGuest) {
            setCourses(getMockData().courses || []);
            setLoading(false);
            return;
        }
        if (!user || !db) {
            setLoading(false);
            return;
        }

        const q = query(collection(db, "courses"), where("userId", "==", user.uid), orderBy("year", "desc"), orderBy("semester", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const coursesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCourses(coursesData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching courses:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, isGuest]);

    const handleAddOrUpdate = () => {
        setIsModalOpen(false);
        setEditingCourse(null);
    };

    const handleEdit = (course) => {
        setEditingCourse(course);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (isGuest) {
            setCourses(courses.filter(c => c.id !== id));
            return;
        }
        if (window.confirm("Are you sure you want to delete this course?")) {
            try {
                await deleteDoc(doc(db, "courses", id));
            } catch (error) {
                console.error("Error deleting course:", error);
            }
        }
    };
    
    const cumulativeGpa = calculateGPA(courses);
    const scienceGpa = calculateGPA(courses, true);

    const groupedCourses = courses.reduce((acc, course) => {
        const key = `${course.year} - ${course.semester}`;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(course);
        return acc;
    }, {});

    return (
        <div className="space-y-8">
            <div className="flex justify-end">
                 <button onClick={() => { setEditingCourse(null); setIsModalOpen(true); }} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center justify-center gap-2 transform hover:scale-105 transition-transform">
                    Add Course
                </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Cumulative GPA</h3>
                    <p className="text-4xl font-extrabold text-blue-600 dark:text-blue-400 mt-2">{cumulativeGpa}</p>
                </div>
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Science GPA (BCPM)</h3>
                    <p className="text-4xl font-extrabold text-green-600 dark:text-green-400 mt-2">{scienceGpa}</p>
                </div>
            </div>

            <div className="space-y-6">
                {loading ? <p>Loading courses...</p> : Object.keys(groupedCourses).length === 0 ? (
                     <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No courses logged</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by adding your first course.</p>
                    </div>
                ) : (
                    Object.entries(groupedCourses).map(([group, coursesInGroup]) => (
                        <div key={group} className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg">
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{group}</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">Course Name</th>
                                            <th scope="col" className="px-6 py-3">Code</th>
                                            <th scope="col" className="px-6 py-3">Credits</th>
                                            <th scope="col" className="px-6 py-3">Grade</th>
                                            <th scope="col" className="px-6 py-3 text-center">Science</th>
                                            <th scope="col" className="px-6 py-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {coursesInGroup.map(course => <CourseRow key={course.id} course={course} onEdit={handleEdit} onDelete={handleDelete} />)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {motion && <motion.AnimatePresence>
                {isModalOpen && (
                    <CourseModal 
                        isOpen={isModalOpen}
                        onClose={() => { setIsModalOpen(false); setEditingCourse(null); }}
                        onSuccess={handleAddOrUpdate}
                        course={editingCourse}
                        isGuest={isGuest}
                    />
                )}
            </motion.AnimatePresence>}
            {!motion && isModalOpen && (
                 <CourseModal 
                    isOpen={isModalOpen}
                    onClose={() => { setIsModalOpen(false); setEditingCourse(null); }}
                    onSuccess={handleAddOrUpdate}
                    course={editingCourse}
                    isGuest={isGuest}
                />
            )}
        </div>
    );
};

const PrerequisiteTracker = ({ isGuest }) => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isGuest) {
            const mock = getMockData();
            setProfile(mock.profile);
            setCourses(mock.courses);
            setLoading(false);
            return;
        }

        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribes = [];
        const profileDocRef = doc(db, 'profiles', user.uid);
        unsubscribes.push(onSnapshot(profileDocRef, (docSnap) => {
            setProfile(docSnap.exists() ? docSnap.data() : { track: 'Pre-Med' });
        }));

        const q = query(collection(db, "courses"), where("userId", "==", user.uid));
        unsubscribes.push(onSnapshot(q, (querySnapshot) => {
            setCourses(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        }));
        
        return () => unsubscribes.forEach(unsub => unsub());
    }, [user, isGuest]);

    const findMatchingCourse = (prereq, takenCourses) => {
        const takenCoursesCopy = [...takenCourses];
        const match = takenCoursesCopy.find(takenCourse => {
            const courseIdentifier = `${takenCourse.name.toLowerCase()} ${takenCourse.code.toLowerCase()}`;
            return prereq.keywords.some(keyword => courseIdentifier.includes(keyword));
        });
        return match;
    };

    if (loading) return <LoadingScreen />;

    const userTrack = profile?.track || 'Pre-Med';
    const requirements = PROGRAM_PREREQUISITES[userTrack];

    if (!requirements) {
        return (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Prerequisite Tracker</h3>
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                    Prerequisite tracking is not yet available for the '{userTrack}' track.
                    You can set your track in Settings.
                </p>
            </div>
        );
    }
    
    let completedCount = 0;
    let totalCount = 0;
    
    let usedCourseIds = new Set();

    const requirementStatus = Object.entries(requirements).map(([category, prereqs]) => {
        const processedPrereqs = prereqs.map(prereq => {
            totalCount++;
            const availableCourses = courses.filter(c => !usedCourseIds.has(c.id));
            const matchingCourse = findMatchingCourse(prereq, availableCourses);
            if (matchingCourse) {
                usedCourseIds.add(matchingCourse.id);
                completedCount++;
            }
            return { ...prereq, completedBy: matchingCourse };
        });
        return { category, prereqs: processedPrereqs };
    });

    const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            Prerequisites for <span className="text-blue-600 dark:text-blue-400">{userTrack}</span>
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Based on your profile settings.</p>
                    </div>
                    <div className="w-full sm:w-auto text-right">
                        <p className="font-bold text-lg">{completedCount} / {totalCount} Completed</p>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-1">
                            <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${completionPercentage}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {requirementStatus.map(({ category, prereqs }) => (
                    <div key={category} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b pb-2 border-gray-200 dark:border-gray-700">{category}</h4>
                        <ul className="space-y-3">
                            {prereqs.map(prereq => (
                                <li key={prereq.name} className="flex items-start">
                                    <div className="flex-shrink-0 mt-1">
                                        {prereq.completedBy ? (
                                             <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{prereq.name}</p>
                                        {prereq.completedBy ? (
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Completed with: {prereq.completedBy.name} ({prereq.completedBy.grade})</p>
                                        ) : (
                                            <p className="text-xs text-gray-400 dark:text-gray-500">Pending</p>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AddPlannedCourseForm = ({ userId, isGuest, onClose }) => {
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || isGuest) return;
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'plannedCourses'), {
                name,
                code,
                userId,
                createdAt: new Date(),
            });
            setName('');
            setCode('');
            onClose();
        } catch (error) {
            console.error("Error adding planned course:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-2">
            <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Course Name (e.g., Physics II)"
                required
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
            />
            <input 
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Course Code (e.g., PHYS 221)"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
            />
            <div className="flex gap-2">
                <button type="button" onClick={onClose} className="w-full py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500">
                    Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="w-full py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {isSubmitting ? '...' : 'Add'}
                </button>
            </div>
        </form>
    );
};

const CoursePlanner = ({ isGuest }) => {
    const { user } = useAuth();
    const [takenCourses, setTakenCourses] = useState([]);
    const [plannedCourses, setPlannedCourses] = useState([]);
    const [plan, setPlan] = useState({});
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showAddCourseForm, setShowAddCourseForm] = useState(false);

    useEffect(() => {
        if (isGuest) {
            setTakenCourses(getMockData().courses || []);
            setPlannedCourses(getMockData().plannedCourses || []);
            setPlan(getMockData().coursePlan || {});
            setLoading(false);
            return;
        }
        if (!user || !db) {
            setLoading(false);
            return;
        }

        const coursesQuery = query(collection(db, "courses"), where("userId", "==", user.uid));
        const unsubscribeTaken = onSnapshot(coursesQuery, (snapshot) => {
            setTakenCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'taken' })));
            setLoading(false);
        });

        const plannedQuery = query(collection(db, "plannedCourses"), where("userId", "==", user.uid));
        const unsubscribePlanned = onSnapshot(plannedQuery, (snapshot) => {
            setPlannedCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'planned' })));
        });

        const planDocRef = doc(db, 'coursePlans', user.uid);
        const unsubscribePlan = onSnapshot(planDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setPlan(docSnap.data().plan || {});
            }
        });

        return () => {
            unsubscribeTaken();
            unsubscribePlanned();
            unsubscribePlan();
        };
    }, [user, isGuest]);
    
    useEffect(() => {
        if (takenCourses.length > 0 && !loading) {
            setPlan(prevPlan => {
                const newPlan = { ...prevPlan };
                takenCourses.forEach(course => {
                    const semesterId = `${course.semester}-${course.year}`;
                    if (!newPlan[semesterId]) {
                        newPlan[semesterId] = [];
                    }
                    if (!newPlan[semesterId].some(p => p.id === course.id)) {
                        newPlan[semesterId].push(course);
                    }
                });
                return newPlan;
            });
        }
    }, [takenCourses, loading]);


    const generateSemesters = () => {
        const semesters = [];
        const currentYear = new Date().getFullYear();
        for (let i = -2; i < 5; i++) {
            const year = currentYear + i;
            semesters.push({ id: `Fall-${year}`, name: `Fall ${year}` });
            semesters.push({ id: `Spring-${year + 1}`, name: `Spring ${year + 1}` });
            semesters.push({ id: `Summer-${year + 1}`, name: `Summer ${year + 1}` });
        }
        return semesters;
    };
    const upcomingSemesters = generateSemesters();

    const handleDragStart = (e, course) => {
        e.dataTransfer.setData('course', JSON.stringify(course));
    };

    const handleDragOver = (e) => e.preventDefault();

    const handleDrop = (e, semesterId) => {
        e.preventDefault();
        const course = JSON.parse(e.dataTransfer.getData('course'));
        
        setPlan(prevPlan => {
            const newPlan = { ...prevPlan };
            Object.keys(newPlan).forEach(sem => {
                newPlan[sem] = newPlan[sem].filter(c => c.id !== course.id);
            });
            const semesterCourses = newPlan[semesterId] || [];
            if (!semesterCourses.some(c => c.id === course.id)) {
                newPlan[semesterId] = [...semesterCourses, course];
            }
            return newPlan;
        });
    };
    
    const removeFromPlan = (courseId, semesterId) => {
        setPlan(prevPlan => {
            const newPlan = { ...prevPlan };
            if (newPlan[semesterId]) {
                newPlan[semesterId] = newPlan[semesterId].filter(c => c.id !== courseId);
            }
            return newPlan;
        });
    };

    const handleSavePlan = async () => {
        if (isGuest) return;
        setIsSaving(true);
        try {
            const planDocRef = doc(db, 'coursePlans', user.uid);
            await setDoc(planDocRef, { plan });
        } catch (error) {
            console.error("Error saving plan:", error);
        } finally {
            setIsSaving(false);
        }
    };
    
    const allAvailableCourses = [...takenCourses, ...plannedCourses];
    const unassignedCourses = allAvailableCourses.filter(course => 
        !Object.values(plan).flat().some(plannedCourse => plannedCourse.id === course.id)
    );

    if (loading) return <LoadingScreen />;

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-1/3 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg flex flex-col">
                <h3 className="text-lg font-bold mb-4">Course Bank</h3>
                <div className="space-y-2 flex-grow overflow-y-auto pr-2">
                    {unassignedCourses.map(course => (
                        <div 
                            key={course.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, course)}
                            className={`p-2 rounded-lg cursor-grab active:cursor-grabbing ${course.type === 'taken' ? 'bg-gray-100 dark:bg-gray-700' : 'bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-700'}`}
                        >
                            <p className="font-semibold">{course.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{course.code}</p>
                        </div>
                    ))}
                     {unassignedCourses.length === 0 && !showAddCourseForm && <p className="text-sm text-gray-500">All courses have been planned.</p>}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {showAddCourseForm ? (
                        <AddPlannedCourseForm 
                            userId={user?.uid} 
                            isGuest={isGuest}
                            onClose={() => setShowAddCourseForm(false)} 
                        />
                    ) : (
                        <button 
                            onClick={() => setShowAddCourseForm(true)}
                            className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-semibold py-2 px-4 rounded-lg"
                        >
                            + Add Planned Course
                        </button>
                    )}
                </div>
            </div>

            <div className="lg:w-2/3">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Your Course Plan</h3>
                    <button 
                        onClick={handleSavePlan}
                        disabled={isSaving}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'Save Plan'}
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {upcomingSemesters.map(semester => (
                        <div 
                            key={semester.id}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, semester.id)}
                            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg min-h-[150px] border-2 border-dashed border-gray-300 dark:border-gray-600"
                        >
                            <h4 className="font-bold border-b border-gray-200 dark:border-gray-700 pb-2 mb-2">{semester.name}</h4>
                            <div className="space-y-2">
                                {plan[semester.id] && plan[semester.id].map(course => (
                                    <div key={course.id} className={`p-2 rounded-lg relative ${course.type === 'taken' ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-yellow-100 dark:bg-yellow-900/50'}`}>
                                        <p className="font-semibold">{course.name}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">{course.code}</p>
                                        <button 
                                            onClick={() => removeFromPlan(course.id, semester.id)}
                                            className="absolute top-1 right-1 text-gray-400 hover:text-red-500"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


export default function CoursesPage({ isGuest }) {
    const [view, setView] = useState('log');

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Course Tracker</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {view === 'log' && 'Log your academic journey and track your GPA.'}
                        {view === 'planner' && 'Plan your future semesters with a drag-and-drop interface.'}
                        {view === 'prereqs' && 'Track your prerequisite completion for your chosen program.'}
                    </p>
                </div>
                <div className="bg-gray-200 dark:bg-gray-700 p-1 rounded-lg flex">
                    <button 
                        onClick={() => setView('log')}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md ${view === 'log' ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow' : 'text-gray-600 dark:text-gray-300'}`}
                    >
                        Course Log
                    </button>
                    <button 
                        onClick={() => setView('planner')}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md ${view === 'planner' ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow' : 'text-gray-600 dark:text-gray-300'}`}
                    >
                        Course Planner
                    </button>
                    <button 
                        onClick={() => setView('prereqs')}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md ${view === 'prereqs' ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow' : 'text-gray-600 dark:text-gray-300'}`}
                    >
                        Prerequisites
                    </button>
                </div>
            </div>
            {view === 'log' && <CourseLog isGuest={isGuest} />}
            {view === 'planner' && <CoursePlanner isGuest={isGuest} />}
            {view === 'prereqs' && <PrerequisiteTracker isGuest={isGuest} />}
        </div>
    );
};

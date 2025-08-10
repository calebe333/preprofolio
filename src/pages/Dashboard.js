import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, onSnapshot, query, collection, where, doc, orderBy } from '../firebase';
import { CATEGORIES } from '../constants';
import { calculateGPA } from '../utils/helpers';
import GoalModal from '../components/modals/GoalModal';
import LoadingScreen from '../components/LoadingScreen';
import { getMockData } from '../mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AnimatedProgressBar = ({ progress, color }) => {
    const motion = window.motion;
    if (!motion) {
        return <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: color }}></div>;
    }
    return (
        <motion.div 
            className="h-full rounded-full"
            style={{ backgroundColor: color, originX: 0 }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progress / 100 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
    );
}

const ProgressSummary = ({ experiences, goals }) => {
    const summary = CATEGORIES.map(cat => {
        const current = experiences.filter(e => e.category === cat.name).reduce((acc, curr) => acc + (curr.hours || 0), 0);
        const goal = goals[cat.name] || 0;
        const progress = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
        return { name: cat.name, current, goal, progress, color: cat.color };
    });

    const totalHours = experiences.reduce((acc, curr) => acc + (curr.hours || 0), 0);
    const totalGoal = Object.values(goals).reduce((acc, curr) => acc + (parseInt(curr, 10) || 0), 0);
    const totalProgress = totalGoal > 0 ? Math.min((totalHours / totalGoal) * 100, 100) : 0;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg h-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Hour Progress</h3>
            <div className="space-y-1 mb-4">
                <div className="flex justify-between items-baseline mb-1">
                    <span className="font-bold text-md text-gray-800 dark:text-gray-200">Total Hours</span>
                    <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">{totalHours.toFixed(1)} / {totalGoal}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <AnimatedProgressBar progress={totalProgress} color={'#3B82F6'} />
                </div>
            </div>
            <div className="space-y-3">
                {summary.filter(s => s.goal > 0).map((item) => (
                    <div key={item.name}>
                        <div className="flex justify-between text-sm font-medium mb-1">
                            <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                            <span className="text-gray-500 dark:text-gray-400">{item.current.toFixed(1)} / {item.goal} hrs</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                           <AnimatedProgressBar progress={item.progress} color={item.color} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const RecentExperiences = ({ experiences, setCurrentPage }) => {
    const recent = experiences.slice(0, 5);
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recent Experiences</h3>
                <button onClick={() => setCurrentPage('experiences')} className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">View All</button>
            </div>
            <div className="space-y-3">
                {recent.length > 0 ? recent.map(exp => (
                    <div key={exp.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">{exp.location}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{exp.category}</p>
                        </div>
                        <div className="text-right">
                             <p className="font-bold text-gray-800 dark:text-gray-200">{exp.hours.toFixed(1)} hrs</p>
                             <p className="text-sm text-gray-500 dark:text-gray-400">{exp.date?.toDate().toLocaleDateString()}</p>
                        </div>
                    </div>
                )) : <p className="text-center text-gray-500 dark:text-gray-400 pt-8">No experiences logged yet.</p>}
            </div>
        </div>
    );
};

const MonthlyChart = ({ experiences }) => {
    const monthlyData = experiences.reduce((acc, exp) => {
        if (!exp.date || !exp.date.toDate) return acc;
        const month = exp.date.toDate().toLocaleString('default', { month: 'short', year: '2-digit' });
        if (!acc[month]) {
            acc[month] = { name: month };
            CATEGORIES.forEach(cat => acc[month][cat.name] = 0);
        }
        acc[month][exp.category] = (acc[month][exp.category] || 0) + exp.hours;
        return acc;
    }, {});

    const sortedBarData = Object.values(monthlyData).sort((a, b) => new Date(a.name) - new Date(b.name));

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg h-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Monthly Hour Distribution</h3>
            {sortedBarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={sortedBarData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => `${value.toFixed(1)} hrs`} />
                        <Legend />
                        {CATEGORIES.map(cat => (
                            <Bar key={cat.name} dataKey={cat.name} stackId="a" fill={cat.color} />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            ) : <p className="text-center text-gray-500 dark:text-gray-400 pt-16">Log hours to see your monthly progress chart.</p>}
        </div>
    );
}

const StatsCard = ({ icon, title, value, color }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg flex items-center gap-4 transition-all hover:shadow-xl hover:scale-105">
        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    </div>
);

export default function Dashboard({ isGuest, setCurrentPage }) {
    const { user } = useAuth();
    const [experiences, setExperiences] = useState([]);
    const [courses, setCourses] = useState([]);
    const [goals, setGoals] = useState({});
    const [loading, setLoading] = useState(true);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    
    useEffect(() => {
        if (isGuest) {
            const mock = getMockData();
            setExperiences(mock.experiences);
            setCourses(mock.courses);
            setGoals(mock.goals);
            setLoading(false);
            return;
        }
        if (!user || !db) {
            setLoading(false);
            return;
        };

        const unsubscribes = [];
        
        const fetchData = async () => {
            setLoading(true);
            const expQuery = query(collection(db, "experiences"), where("userId", "==", user.uid), orderBy("date", "desc"));
            unsubscribes.push(onSnapshot(expQuery, (snap) => setExperiences(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))));

            const courseQuery = query(collection(db, "courses"), where("userId", "==", user.uid));
            unsubscribes.push(onSnapshot(courseQuery, (snap) => setCourses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))));

            const goalDocRef = doc(db, "goals", user.uid);
            unsubscribes.push(onSnapshot(goalDocRef, (docSnap) => setGoals(docSnap.exists() ? docSnap.data() : {})));
            setLoading(false);
        }
        fetchData();

        return () => unsubscribes.forEach(unsub => unsub());
    }, [user, isGuest]);
    
    const motion = window.motion;
    const displayName = isGuest ? "Guest" : user?.displayName?.split(' ')[0];
    const totalHours = experiences.reduce((acc, curr) => acc + (curr.hours || 0), 0);
    const cumulativeGpa = calculateGPA(courses);
    const scienceGpa = calculateGPA(courses, true);

    if (loading) return <LoadingScreen />;

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back, {displayName}!</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Here's a snapshot of your progress.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} title="Total Hours" value={totalHours.toFixed(1)} color="bg-blue-500" />
                <StatsCard icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>} title="Cumulative GPA" value={cumulativeGpa} color="bg-green-500" />
                <StatsCard icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>} title="Science GPA" value={scienceGpa} color="bg-purple-500" />
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg flex flex-col justify-center items-center gap-4 transition-all hover:shadow-xl">
                    <button onClick={() => setCurrentPage('experiences')} className="w-full text-center bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold py-2 px-4 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900">Log Experience</button>
                    <button onClick={() => setIsGoalModalOpen(true)} className="w-full text-center bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 font-semibold py-2 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">Set Goals</button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                    <MonthlyChart experiences={experiences} />
                </div>
                <div className="lg:col-span-2">
                    <ProgressSummary experiences={experiences} goals={goals} />
                </div>
                <div className="lg:col-span-5">
                    <RecentExperiences experiences={experiences} setCurrentPage={setCurrentPage} />
                </div>
            </div>

            {motion && <motion.AnimatePresence>
                {isGoalModalOpen && (
                    <GoalModal
                        isOpen={isGoalModalOpen}
                        onClose={() => setIsGoalModalOpen(false)}
                        onSuccess={() => setIsGoalModalOpen(false)}
                        currentGoals={goals}
                        isGuest={isGuest}
                    />
                )}
            </motion.AnimatePresence>}
            {!motion && isGoalModalOpen && (
                 <GoalModal
                    isOpen={isGoalModalOpen}
                    onClose={() => setIsGoalModalOpen(false)}
                    onSuccess={() => setIsGoalModalOpen(false)}
                    currentGoals={goals}
                    isGuest={isGuest}
                />
            )}
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, collection, query, where, orderBy, onSnapshot, deleteDoc, doc, updateDoc, addDoc, setDoc, serverTimestamp } from '../firebase';
import { getMockData } from '../mockData';
import { PROGRAM_PREREQUISITES } from '../constants';
import { calculateGPA } from '../utils/helpers';
import LoadingScreen from '../components/LoadingScreen';

// All child components for the Courses page are here. They can be split further if needed.

const CourseModal = ({ isOpen, onClose, onSuccess, course, isGuest }) => { /* ... Modal logic and JSX ... */ };
const CourseRow = ({ course, onEdit, onDelete }) => { /* ... Row logic and JSX ... */ };
const AddPlannedCourseForm = ({ userId, isGuest, onClose }) => { /* ... Form logic and JSX ... */ };
const CoursePlanner = ({ isGuest }) => { /* ... Planner logic and JSX ... */ };
const PrerequisiteTracker = ({ isGuest }) => { /* ... Tracker logic and JSX ... */ };
const CourseLog = ({ isGuest }) => { /* ... Log logic and JSX ... */ };


export default function CoursesPage({ isGuest }) {
    const [view, setView] = useState('log'); // 'log', 'planner', or 'prereqs'

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

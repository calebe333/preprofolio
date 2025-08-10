import { SEED_SCHOOLS } from './constants';

export const getMockData = () => ({
    experiences: [
        { id: 'mock1', category: 'Patient Care Experience', date: { toDate: () => new Date('2024-07-15') }, hours: 40, location: 'Community Hospital ER', notes: 'Assisted with patient vitals and transport.', isMeaningful: true },
        { id: 'mock2', category: 'Volunteer Work', date: { toDate: () => new Date('2024-06-20') }, hours: 25, location: 'Local Soup Kitchen', notes: 'Served meals and helped with cleanup.', isMeaningful: false },
        { id: 'mock3', category: 'Research', date: { toDate: () => new Date('2024-05-01') }, hours: 50, location: 'University Lab', notes: 'Conducted data analysis for a study on neuroplasticity.', isMeaningful: true },
    ],
    goals: {
        'Patient Care Experience': 200,
        'Healthcare Experience': 100,
        'Research': 150,
        'Shadowing': 50,
        'Volunteer Work': 100,
        'Other': 0
    },
    courses: [
        { id: 'mock_course_1', name: 'General Chemistry I', code: 'CHEM 101', credits: 4, grade: 'A', semester: 'Fall', year: 2023, isScience: true },
        { id: 'mock_course_2', name: 'Introduction to Psychology', code: 'PSYC 101', credits: 3, grade: 'B+', semester: 'Fall', year: 2023, isScience: false },
        { id: 'mock_course_3', name: 'Organic Chemistry I', code: 'CHEM 231', credits: 4, grade: 'A-', semester: 'Spring', year: 2024, isScience: true },
    ],
    plannedCourses: [
        { id: 'planned_1', name: 'Physics I', code: 'PHYS 220' },
    ],
    coursePlan: {
        'Fall-2024': [{ id: 'mock_course_3', name: 'Organic Chemistry I', code: 'CHEM 231' }]
    },
    profile: {
        track: 'Pre-Med',
        applicationYear: new Date().getFullYear() + 1,
        bio: 'Aspiring physician with a passion for emergency medicine.'
    },
    mySchools: [
        { schoolId: 'school1', name: 'Johns Hopkins University School of Medicine', location: 'Baltimore, MD', program: 'MD', status: 'Researching', notes: 'Top choice, love their research focus.' },
    ],
    allSchools: SEED_SCHOOLS,
});

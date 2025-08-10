export const CATEGORIES = [
    { name: 'Patient Care Experience', color: '#3B82F6' },
    { name: 'Healthcare Experience', color: '#10B981' },
    { name: 'Research', color: '#F59E0B' },
    { name: 'Shadowing', color: '#8B5CF6' },
    { name: 'Volunteer Work', color: '#EF4444' },
    { name: 'Other', color: '#6B7280' },
];

export const CATEGORY_NAMES = CATEGORIES.map(c => c.name);

export const PROGRAM_PREREQUISITES = {
    'Pre-Med': {
        'General Chemistry': [{ name: 'General Chemistry I w/ Lab', keywords: ['general chemistry i', 'chem 1'] }, { name: 'General Chemistry II w/ Lab', keywords: ['general chemistry ii', 'chem 2'] }],
        'Organic Chemistry': [{ name: 'Organic Chemistry I w/ Lab', keywords: ['organic chemistry i', 'ochem 1'] }, { name: 'Organic Chemistry II w/ Lab', keywords: ['organic chemistry ii', 'ochem 2'] }],
        'Biochemistry': [{ name: 'Biochemistry', keywords: ['biochemistry', 'biochem'] }],
        'Biology': [{ name: 'General Biology I w/ Lab', keywords: ['general biology i', 'bio 1'] }, { name: 'General Biology II w/ Lab', keywords: ['general biology ii', 'bio 2'] }],
        'Physics': [{ name: 'Physics I w/ Lab', keywords: ['physics i'] }, { name: 'Physics II w/ Lab', keywords: ['physics ii'] }],
        'Math': [{ name: 'Calculus I', keywords: ['calculus i', 'calc 1'] }, { name: 'Statistics', keywords: ['statistics', 'stats'] }],
        'English': [{ name: 'English Composition', keywords: ['english composition', 'writing'] }],
    },
    'Pre-PA': {
        'Anatomy & Physiology': [{ name: 'Anatomy & Physiology I w/ Lab', keywords: ['anatomy and physiology i', 'a&p 1'] }, { name: 'Anatomy & Physiology II w/ Lab', keywords: ['anatomy and physiology ii', 'a&p 2'] }],
        'Chemistry': [{ name: 'General Chemistry I w/ Lab', keywords: ['general chemistry i', 'chem 1'] }, { name: 'Organic Chemistry I w/ Lab', keywords: ['organic chemistry i', 'ochem 1'] }],
        'Biology': [{ name: 'General Biology I w/ Lab', keywords: ['general biology i', 'bio 1'] }, { name: 'Microbiology w/ Lab', keywords: ['microbiology', 'microbio'] }],
        'Math': [{ name: 'Statistics', keywords: ['statistics', 'stats'] }],
        'Psychology': [{ name: 'Introduction to Psychology', keywords: ['psychology'] }],
        'Medical Terminology': [{ name: 'Medical Terminology', keywords: ['medical terminology'] }],
    },
    'Pre-Dental': {
        'General Chemistry': [{ name: 'General Chemistry I w/ Lab', keywords: ['general chemistry i', 'chem 1'] }, { name: 'General Chemistry II w/ Lab', keywords: ['general chemistry ii', 'chem 2'] }],
        'Organic Chemistry': [{ name: 'Organic Chemistry I w/ Lab', keywords: ['organic chemistry i', 'ochem 1'] }, { name: 'Organic Chemistry II w/ Lab', keywords: ['organic chemistry ii', 'ochem 2'] }],
        'Biochemistry': [{ name: 'Biochemistry', keywords: ['biochemistry', 'biochem'] }],
        'Biology': [{ name: 'General Biology I w/ Lab', keywords: ['general biology i', 'bio 1'] }, { name: 'General Biology II w/ Lab', keywords: ['general biology ii', 'bio 2'] }],
        'Physics': [{ name: 'Physics I w/ Lab', keywords: ['physics i'] }],
    }
};

export const TIMELINE_MILESTONES = {
    'Pre-Med': [
        { id: 'early_gpa', title: 'Focus on Strong GPA', description: 'Establish a strong academic foundation, especially in science (BCPM) courses. Aim for a competitive GPA from the start.', category: 'Early Preparation' },
        // ... all other timeline milestones
    ],
    'Pre-PA': [
        { id: 'pa_early_gpa', title: 'Focus on Strong GPA', description: 'Maintain a high GPA, particularly in science prerequisite courses, as this is a key factor for PA programs.', category: 'Early Preparation' },
        // ... all other timeline milestones
    ],
    'Pre-Dental': [
        { id: 'dental_early_gpa', title: 'Maintain High GPA', description: 'Focus on achieving a high overall and science GPA, as this is a critical screening metric for dental schools.', category: 'Early Preparation' },
        // ... all other timeline milestones
    ]
};

export const SEED_SCHOOLS = [
    { id: 'school1', name: 'Johns Hopkins University School of Medicine', location: 'Baltimore, MD', program: 'MD', avgMCAT: '521', avgGPA: '3.94', verified: true },
    { id: 'school2', name: 'Harvard Medical School', location: 'Boston, MA', program: 'MD', avgMCAT: '520', avgGPA: '3.9', verified: true },
    // ... all other seed schools
];

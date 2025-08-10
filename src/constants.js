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
        { id: 'early_exp', title: 'Gain Clinical & Volunteer Experience', description: 'Start seeking out meaningful patient care, shadowing, and volunteer opportunities to explore the field and show commitment.', category: 'Early Preparation' },
        { id: 'early_research', title: 'Get Involved in Research', description: 'If interested, join a research lab. This demonstrates intellectual curiosity and can lead to strong letters of recommendation.', category: 'Early Preparation' },
        { id: 'early_lor', title: 'Build Relationships with Professors', description: 'Get to know your professors in and out of the classroom. You will need strong letters of recommendation (LORs) later.', category: 'Early Preparation' },
        { id: 'mcat_prep', title: 'Begin MCAT Preparation', description: 'Create a structured study plan for the MCAT. This typically requires 300-400 hours over 3-6 months.', category: 'Pre-Application Year' },
        { id: 'personal_statement', title: 'Draft Personal Statement', description: 'Start brainstorming and writing your personal statement. Reflect on your journey and motivations for pursuing medicine.', category: 'Pre-Application Year' },
        { id: 'request_lors', title: 'Request Letters of Recommendation', description: 'Formally ask your chosen letter writers at least 3-4 months before your application submission. Provide them with your CV, personal statement, and a list of schools.', category: 'Pre-Application Year' },
        { id: 'research_schools', title: 'Finalize School List', description: 'Research medical schools and create a balanced list of target, reach, and safety schools based on your stats and mission fit.', category: 'Pre-Application Year' },
        { id: 'take_mcat', title: 'Take the MCAT', description: 'Take the MCAT by late spring of your application year to ensure your score is available for verification.', category: 'Primary Application' },
        { id: 'primary_app', title: 'Submit Primary Application (AMCAS)', description: 'The AMCAS application typically opens in early May. Submit as early as possible after it opens.', category: 'Primary Application' },
        { id: 'casper_preview', title: 'Complete CASPer/AAMC PREview', description: 'Register for and complete any required situational judgment tests. Check your schools\' requirements.', category: 'Secondary Application' },
        { id: 'secondary_app', title: 'Receive & Submit Secondary Applications', description: 'Secondaries are sent after your primary is verified. Aim for a two-week turnaround for each one.', category: 'Secondary Application' },
        { id: 'interview_prep', title: 'Prepare for Interviews', description: 'Practice common interview questions (MMI and traditional). Conduct mock interviews with your school\'s career center.', category: 'Interviews' },
        { id: 'interviews', title: 'Interview Season', description: 'Interviews typically run from September through March. Be professional, prepared, and be yourself!', category: 'Interviews' },
        { id: 'update_letters', title: 'Send Update Letters/Letters of Intent', description: 'If appropriate, send meaningful updates to schools you have interviewed at, or a letter of intent to your top choice.', category: 'Post-Interview' },
        { id: 'acceptance', title: 'Receive Acceptance Offers', description: 'Offers can come any time after your interview, often starting in October. Celebrate your hard work!', category: 'Decisions & Matriculation' },
        { id: 'choose_school', title: 'Choose Your School', description: 'By the AAMC deadline (typically late April), narrow down your acceptances and commit to one school.', category: 'Decisions & Matriculation' },
        { id: 'financial_aid', title: 'Complete Financial Aid', description: 'Complete the FAFSA and any school-specific financial aid applications.', category: 'Decisions & Matriculation' },
    ],
    'Pre-PA': [
        { id: 'pa_early_gpa', title: 'Focus on Strong GPA', description: 'Maintain a high GPA, particularly in science prerequisite courses, as this is a key factor for PA programs.', category: 'Early Preparation' },
        { id: 'pa_early_pce', title: 'Accrue Patient Care Experience (PCE) Hours', description: 'Start gaining high-quality, hands-on PCE early. Many programs have significant hour requirements.', category: 'Early Preparation' },
        { id: 'pa_early_lor', title: 'Build Professional Relationships', description: 'Develop strong relationships with professors, PAs you shadow, and work supervisors for future LORs.', category: 'Early Preparation' },
        { id: 'pa_gre_prep', title: 'Prepare for and Take the GRE', description: 'If required by your target schools, create a study plan and take the GRE well before application deadlines.', category: 'Pre-Application Year' },
        { id: 'pa_personal_statement', title: 'Draft Personal Statement (Narrative)', description: 'Begin writing your CASPA personal narrative. Focus on your journey and why you are a good fit for the PA profession.', category: 'Pre-Application Year' },
        { id: 'pa_request_lors', title: 'Request Letters of Recommendation', description: 'Request LORs from clinicians, professors, and supervisors who know you well. Give them ample time and information.', category: 'Pre-Application Year' },
        { id: 'pa_caspa_open', title: 'CASPA Application Opens', description: 'The Centralized Application Service for Physician Assistants usually opens in late April. Prepare your application materials in advance.', category: 'Primary Application' },
        { id: 'pa_submit_caspa', title: 'Submit CASPA Application', description: 'Submit your primary application as early as possible, as many PA programs use rolling admissions.', category: 'Primary Application' },
        { id: 'pa_casper', title: 'Complete CASPer/Situational Judgment Tests', description: 'Check if your target programs require the CASPer or other tests and complete them in a timely manner.', category: 'Secondary Application' },
        { id: 'pa_supplemental_apps', title: 'Complete Supplemental Applications', description: 'Many programs have their own secondary applications. Submit them promptly, usually within 1-2 weeks of receipt.', category: 'Secondary Application' },
        { id: 'pa_interview_prep', title: 'Prepare for Interviews', description: 'PA school interviews can be varied (group, MMI, traditional). Research formats and practice extensively.', category: 'Interviews' },
        { id: 'pa_interviews', title: 'Interview Season', description: 'PA school interviews often occur in the fall and winter. Professionalism is key.', category: 'Interviews' },
        { id: 'pa_acceptance', title: 'Receive Acceptance Offers', description: 'PA programs often use a rolling admissions process, with offers sent throughout the cycle.', category: 'Decisions & Matriculation' },
        { id: 'pa_choose_school', title: 'Make Your Decision', description: 'Review your offers and accept a position at your chosen program, being mindful of deposit deadlines.', category: 'Decisions & Matriculation' },
    ],
    'Pre-Dental': [
        { id: 'dental_early_gpa', title: 'Maintain High GPA', description: 'Focus on achieving a high overall and science GPA, as this is a critical screening metric for dental schools.', category: 'Early Preparation' },
        { id: 'dental_early_shadowing', title: 'Gain Dental Shadowing Hours', description: 'Start shadowing general dentists and specialists to understand the profession. Aim for 100+ hours.', category: 'Early Preparation' },
        { id: 'dental_manual_dexterity', title: 'Develop Manual Dexterity', description: 'Engage in hobbies that require fine motor skills, such as playing an instrument, drawing, or model building.', category: 'Early Preparation' },
        { id: 'dat_prep', title: 'Prepare for and Take the DAT', description: 'The Dental Admission Test is crucial. Plan a rigorous study schedule (3-4 months) and aim to take it in the spring or early summer of your application year.', category: 'Pre-Application Year' },
        { id: 'dental_personal_statement', title: 'Draft Personal Statement', description: 'Write a compelling personal statement that explains your motivation for dentistry and highlights your unique qualities.', category: 'Pre-Application Year' },
        { id: 'dental_request_lors', title: 'Request Letters of Recommendation', description: 'Secure letters from science professors and dentists you have shadowed. Ask them well in advance.', category: 'Pre-Application Year' },
        { id: 'aadsas_open', title: 'AADSAS Application Opens', description: 'The Associated American Dental Schools Application Service typically opens in June. Have your materials ready to submit early.', category: 'Primary Application' },
        { id: 'submit_aadsas', title: 'Submit AADSAS Application', description: 'Submit your application early in the cycle to take advantage of rolling admissions.', category: 'Primary Application' },
        { id: 'dental_secondaries', title: 'Complete Secondary Applications', description: 'Some schools may send secondary applications. Complete and return these promptly.', category: 'Secondary Application' },
        { id: 'dental_interview_prep', title: 'Prepare for Interviews', description: 'Practice answering common questions and be prepared to discuss your manual dexterity skills and knowledge of the dental field.', category: 'Interviews' },
        { id: 'dental_interviews', title: 'Interview Season', description: 'Dental school interviews often run from September to February.', category: 'Interviews' },
        { id: 'acceptance_day', title: 'Decision Day', description: 'The first day schools can extend offers is typically December 1st. You may receive calls or emails.', category: 'Decisions & Matriculation' },
        { id: 'dental_choose_school', title: 'Accept an Offer', description: 'You will have a deadline to place a deposit and secure your seat at your chosen school. Be mindful of traffic rules.', category: 'Decisions & Matriculation' },
    ]
};

export const SEED_SCHOOLS = [
    { id: 'school1', name: 'Johns Hopkins University School of Medicine', location: 'Baltimore, MD', program: 'MD', avgMCAT: '521', avgGPA: '3.94', verified: true },
    { id: 'school2', name: 'Harvard Medical School', location: 'Boston, MA', program: 'MD', avgMCAT: '520', avgGPA: '3.9', verified: true },
    { id: 'school3', name: 'Stanford University School of Medicine', location: 'Stanford, CA', program: 'MD', avgMCAT: '519', avgGPA: '3.89', verified: true },
    { id: 'school4', name: 'Duke University School of Medicine', location: 'Durham, NC', program: 'MD', avgMCAT: '518', avgGPA: '3.85', verified: true },
    { id: 'school5', name: 'University of Pennsylvania (Perelman)', location: 'Philadelphia, PA', program: 'MD', avgMCAT: '521', avgGPA: '3.91', verified: true },
    { id: 'school6', name: 'Yale School of Medicine', location: 'New Haven, CT', program: 'MD', avgMCAT: '519', avgGPA: '3.87', verified: true },
    { id: 'school7', name: 'University of Iowa Carver College of Medicine', location: 'Iowa City, IA', program: 'PA', avgGPA: '3.71', avgGRE: '310', verified: true },
    { id: 'school8', name: 'Baylor College of Medicine', location: 'Houston, TX', program: 'PA', avgGPA: '3.8', avgGRE: '315', verified: true },
    { id: 'school9', name: 'University of the Pacific (Dugoni)', location: 'San Francisco, CA', program: 'DDS', avgDAT: '22', avgGPA: '3.6', verified: true },
    { id: 'school10', name: 'UCLA School of Dentistry', location: 'Los Angeles, CA', program: 'DDS', avgDAT: '23', avgGPA: '3.75', verified: true },
    { id: 'school11', name: 'Wake Forest School of Medicine', location: 'Winston-Salem, NC', program: 'PA', avgGPA: '3.65', avgGRE: '308', verified: false },
];

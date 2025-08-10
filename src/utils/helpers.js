export const calculateGPA = (courses, scienceOnly = false) => {
    const gradePoints = {
        'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0
    };
    let totalPoints = 0;
    let totalCredits = 0;

    const coursesToCalculate = scienceOnly ? courses.filter(c => c.isScience) : courses;

    coursesToCalculate.forEach(course => {
        if (gradePoints[course.grade] !== undefined && course.credits > 0) {
            totalPoints += gradePoints[course.grade] * parseFloat(course.credits);
            totalCredits += parseFloat(course.credits);
        }
    });

    if (totalCredits === 0) return 'N/A';
    return (totalPoints / totalCredits).toFixed(2);
};

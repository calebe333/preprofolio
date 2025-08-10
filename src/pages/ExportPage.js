import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, getDoc, doc, query, collection, where, orderBy, getDocs } from '../firebase';
import { getMockData } from '../mockData';
import { calculateGPA } from '../utils/helpers';
import LoadingScreen from '../components/LoadingScreen';

export default function ExportPage({ isGuest }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState({});
    const [experiences, setExperiences] = useState([]);
    const [courses, setCourses] = useState([]);
    const [isExporting, setIsExporting] = useState(false);
    const [exportMessage, setExportMessage] = useState('');
    const [scriptsReady, setScriptsReady] = useState(false);

    const loadScript = (src) => {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                return resolve();
            }
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Script load error for ${src}`));
            document.body.appendChild(script);
        });
    };
    
    useEffect(() => {
        loadScript('https://unpkg.com/jspdf@latest/dist/jspdf.umd.min.js')
            .then(() => loadScript('https://unpkg.com/jspdf-autotable@3.8.1/dist/jspdf.plugin.autotable.js'))
            .then(() => loadScript('https://unpkg.com/papaparse@5.3.2/papaparse.min.js'))
            .then(() => {
                setScriptsReady(true);
            })
            .catch(error => {
                console.error("Failed to load export scripts:", error);
                setExportMessage("Could not load export libraries. Please refresh and try again.");
            });
    }, []);

    useEffect(() => {
        if (isGuest) {
            const mock = getMockData();
            setProfile(mock.profile);
            setExperiences(mock.experiences);
            setCourses(mock.courses);
            setLoading(false);
            return;
        }

        if (!user) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const profileDocRef = doc(db, 'profiles', user.uid);
                const profileSnap = await getDoc(profileDocRef);
                if (profileSnap.exists()) setProfile(profileSnap.data());

                const expQuery = query(collection(db, "experiences"), where("userId", "==", user.uid), orderBy("date", "desc"));
                const expSnap = await getDocs(expQuery);
                setExperiences(expSnap.docs.map(d => ({...d.data(), id: d.id})));

                const courseQuery = query(collection(db, "courses"), where("userId", "==", user.uid), orderBy("year", "desc"), orderBy("semester", "desc"));
                const courseSnap = await getDocs(courseQuery);
                setCourses(courseSnap.docs.map(d => ({...d.data(), id: d.id})));

            } catch (error) {
                console.error("Error fetching data for export:", error);
                setExportMessage("Could not fetch data for the report.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, isGuest]);

    const handleExportPDF = () => {
        if (!window.jspdf) {
            setExportMessage("PDF library not loaded. Please wait or refresh.");
            return;
        }

        setIsExporting(true);
        setExportMessage('');
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('Pre-Professional Report Card', 105, 20, { align: 'center' });
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(`Report generated on: ${new Date().toLocaleDateString()}`, 105, 28, { align: 'center' });

            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('Applicant Profile', 14, 45);
            doc.setLineWidth(0.5);
            doc.line(14, 47, 196, 47);

            const profileName = isGuest ? "Guest User" : user?.displayName || 'N/A';
            const profileEmail = isGuest ? "guest@example.com" : user?.email || 'N/A';
            const profileTrack = profile.track === 'Other' ? profile.customTrack : profile.track;

            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.text(`Name: ${profileName}`, 16, 55);
            doc.text(`Email: ${profileEmail}`, 16, 61);
            doc.text(`Track: ${profileTrack || 'N/A'}`, 105, 55);
            doc.text(`Application Year: ${profile.applicationYear || 'N/A'}`, 105, 61);

            const totalHours = experiences.reduce((sum, exp) => sum + (exp.hours || 0), 0);
            const cumulativeGpa = calculateGPA(courses);
            const scienceGpa = calculateGPA(courses, true);

            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('Academic & Experience Summary', 14, 75);
            doc.line(14, 77, 196, 77);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.text(`Cumulative GPA: ${cumulativeGpa}`, 16, 85);
            doc.text(`Science (BCPM) GPA: ${scienceGpa}`, 105, 85);
            doc.text(`Total Experience Hours: ${totalHours.toFixed(1)}`, 16, 91);

            const expBody = experiences.map(exp => [
                exp.date?.toDate ? exp.date.toDate().toLocaleDateString() : 'N/A',
                exp.category,
                exp.location,
                exp.hours.toFixed(1),
                exp.notes || ''
            ]);
            doc.autoTable({
                head: [['Date', 'Category', 'Location/Org', 'Hours', 'Notes']],
                body: expBody,
                startY: 100,
                headStyles: { fillColor: [22, 160, 133] },
            });
            
            const courseBody = courses.map(c => [
                `${c.semester} ${c.year}`,
                c.name,
                c.code,
                c.credits,
                c.grade,
                c.isScience ? 'Yes' : 'No'
            ]);
            doc.autoTable({
                head: [['Term', 'Course Name', 'Code', 'Credits', 'Grade', 'Science']],
                body: courseBody,
                startY: doc.autoTable.previous.finalY + 15,
                headStyles: { fillColor: [41, 128, 185] },
            });

            doc.save(`PreProFolio_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error("PDF Export error:", error);
            setExportMessage("Failed to export PDF. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };
    
    const downloadCsv = (data, filename) => {
        if (!window.Papa) {
            setExportMessage("CSV library not loaded. Please wait or refresh.");
            return;
        }
        const csv = window.Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportExperiencesCSV = () => {
        const data = experiences.map(exp => ({
            Date: exp.date?.toDate ? exp.date.toDate().toLocaleDateString() : 'N/A',
            Category: exp.category,
            Hours: exp.hours,
            Location: exp.location,
            Notes: exp.notes,
        }));
        downloadCsv(data, `PreProFolio_Experiences_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const handleExportCoursesCSV = () => {
        const data = courses.map(c => ({
            Year: c.year,
            Semester: c.semester,
            'Course Name': c.name,
            'Course Code': c.code,
            Credits: c.credits,
            Grade: c.grade,
            'Is Science (BCPM)': c.isScience ? 'Yes' : 'No',
        }));
        downloadCsv(data, `PreProFolio_Courses_${new Date().toISOString().split('T')[0]}.csv`);
    };

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Export Your Report</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Generate a comprehensive report of your academic and experiential progress.</p>
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col items-center text-center p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <h3 className="text-xl font-bold mb-2">PDF Report Card</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">Generate a single, printable PDF document summarizing your entire profile. Ideal for sharing with advisors or including in applications.</p>
                        <button 
                            onClick={handleExportPDF}
                            disabled={isExporting || !scriptsReady}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isExporting ? 'Exporting...' : !scriptsReady ? 'Loading...' : 'Export as PDF'}
                        </button>
                    </div>
                    <div className="flex flex-col items-center text-center p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                        <h3 className="text-xl font-bold mb-2">CSV Data Export</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">Download your data in CSV format for use in spreadsheets like Excel or Google Sheets. Perfect for custom analysis and record-keeping.</p>
                        <div className="w-full space-y-3">
                            <button 
                                onClick={handleExportExperiencesCSV}
                                disabled={isExporting || !scriptsReady}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {!scriptsReady ? 'Loading...' : 'Export Experiences (CSV)'}
                            </button>
                             <button 
                                onClick={handleExportCoursesCSV}
                                disabled={isExporting || !scriptsReady}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {!scriptsReady ? 'Loading...' : 'Export Courses (CSV)'}
                            </button>
                        </div>
                    </div>
                </div>
                {exportMessage && <p className="text-center mt-6 text-red-500">{exportMessage}</p>}
            </div>
        </div>
    );
};

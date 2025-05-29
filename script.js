document.addEventListener('DOMContentLoaded', () => {
    const textArea = document.getElementById('main-text');
    const wordCountSpan = document.getElementById('word-count');
    const charCountSpan = document.getElementById('char-count');
    const studentNameInput = document.getElementById('student-name');
    const examNumberInput = document.getElementById('exam-number');
    const printBtn = document.getElementById('print-btn');
    const saveBtn = document.getElementById('save-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');

    // --- Local Storage Settings for Exam Data ---
    const EXAM_DATA_STORAGE_KEY = 'examEditorData';
    const EXPIRATION_MINUTES = 205;
    const EXPIRATION_MS = EXPIRATION_MINUTES * 60 * 1000;

    // --- Theme Settings ---
    const THEME_STORAGE_KEY = 'examEditorTheme';
    const themes = ['theme-light', 'theme-dark', 'theme-high-contrast-light', 'theme-high-contrast-dark'];
    let currentThemeIndex = 0;

    // --- Function to Apply Theme ---
    function applyTheme(themeClass) {
        document.body.classList.remove(...themes); // Remove any existing theme classes
        if (themeClass !== 'theme-light') { // 'theme-light' is default, no class needed unless explicitly set
            document.body.classList.add(themeClass);
        }
        localStorage.setItem(THEME_STORAGE_KEY, themeClass);
        // Update currentThemeIndex based on the applied theme
        currentThemeIndex = themes.indexOf(themeClass);
        if (themeToggleBtn) {
            // Optional: Update button text to reflect current or next theme
            // For simplicity, we'll keep "Change Theme"
        }
    }

    // --- Function to Load Theme ---
    function loadTheme() {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && themes.includes(savedTheme)) {
            applyTheme(savedTheme);
        } else {
            applyTheme(themes[0]); // Default to light theme
        }
    }

    // --- Event Listener for Theme Toggle Button ---
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            currentThemeIndex = (currentThemeIndex + 1) % themes.length;
            applyTheme(themes[currentThemeIndex]);
        });
    }
    
    // --- Load initial theme ---
    loadTheme();


    // --- Function to Save Exam Data to Local Storage ---
    function saveExamDataToLocalStorage() {
        const dataToSave = {
            studentName: studentNameInput.value,
            examNumber: examNumberInput.value,
            mainText: textArea.value,
            timestamp: Date.now()
        };
        try {
            localStorage.setItem(EXAM_DATA_STORAGE_KEY, JSON.stringify(dataToSave));
        } catch (e) {
            console.error("Error saving exam data to localStorage:", e);
        }
    }

    // --- Function to Load Exam Data from Local Storage ---
    function loadExamDataFromLocalStorage() {
        try {
            const storedDataString = localStorage.getItem(EXAM_DATA_STORAGE_KEY);
            if (storedDataString) {
                const storedData = JSON.parse(storedDataString);
                const currentTime = Date.now();
                if (storedData.timestamp && (currentTime - storedData.timestamp < EXPIRATION_MS)) {
                    studentNameInput.value = storedData.studentName || '';
                    examNumberInput.value = storedData.examNumber || '';
                    textArea.value = storedData.mainText || '';
                    textArea.dispatchEvent(new Event('input'));
                } else {
                    localStorage.removeItem(EXAM_DATA_STORAGE_KEY);
                }
            }
        } catch (e) {
            console.error("Error loading exam data from localStorage:", e);
        }
    }
    
    loadExamDataFromLocalStorage(); // Load exam data

    // Event listeners for saving exam data
    if (studentNameInput) studentNameInput.addEventListener('input', saveExamDataToLocalStorage);
    if (examNumberInput) examNumberInput.addEventListener('input', saveExamDataToLocalStorage);
    
    if (textArea) {
        textArea.addEventListener('input', () => {
            saveExamDataToLocalStorage(); // Save exam data first
            // Update word/char count
            const text = textArea.value;
            charCountSpan.textContent = `${text.length} characters`;
            const words = text.trim().split(/\s+/).filter(word => word.length > 0);
            wordCountSpan.textContent = text.length === 0 ? `0 words` : `${words.length} words`;
        });
    } else {
         if (wordCountSpan || charCountSpan) {
            console.error("Textarea not found for word/char count or saving.");
        }
    }


    // --- Print Button Functionality ---
    if (printBtn && studentNameInput && examNumberInput && textArea) {
        printBtn.addEventListener('click', () => {
            const name = studentNameInput.value || "N/A";
            const examNumber = examNumberInput.value || "N/A";
            const mainText = textArea.value;
            const formattedText = mainText.replace(/\r\n|\r|\n/g, '<br>');
            const iframe = document.createElement('iframe');
            iframe.style.cssText = 'position:absolute;width:0;height:0;border:0;';
            document.body.appendChild(iframe);
            const doc = iframe.contentWindow.document;
            doc.open();
            doc.write(`
                <html>
                <head>
                    <title>Print Document</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 0.5in; }
                        p { margin-bottom: 10px; }
                        .label { font-weight: bold; }
                        .content { white-space: pre-wrap; word-wrap: break-word; margin-top: 15px; padding: 0; border: none; }
                        @media print { body { margin: 0.75in; } }
                    </style>
                </head>
                <body>
                    <p><span class="label">Name:</span> ${name}</p>
                    <p><span class="label">Exam Number:</span> ${examNumber}</p>
                    <div class="content">${formattedText}</div>
                </body>
                </html>
            `);
            doc.close();
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            setTimeout(() => { document.body.removeChild(iframe); }, 500);
        });
    } else {
        console.error("One or more elements for printing not found.");
    }

    // --- Save as Text File Button Functionality ---
    if (saveBtn && textArea && studentNameInput && examNumberInput) {
        saveBtn.addEventListener('click', () => {
            const studentName = studentNameInput.value.trim() || "student";
            const examNumber = examNumberInput.value.trim() || "exam";
            let textToSave = `Student Name: ${studentNameInput.value}\n`;
            textToSave += `Exam Number: ${examNumberInput.value}\n\n`;
            textToSave += `-------------------------------------\n\n`;
            textToSave += textArea.value;
            const blob = new Blob([textToSave], { type: 'text/plain;charset=utf-8' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            const safeStudentName = studentName.replace(/[^a-z0-9_.-]/gi, '_');
            const safeExamNumber = examNumber.replace(/[^a-z0-9_.-]/gi, '_');
            link.download = `${safeStudentName}_${safeExamNumber}_exam_answer.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        });
    } else {
        console.error("One or more elements for saving not found.");
    }
});
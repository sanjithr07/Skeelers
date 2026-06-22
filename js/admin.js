document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('newsForm');
    const heroInput = document.getElementById('heroImage');
    const heroPreview = document.getElementById('heroPreviewText');
    const additionalInput = document.getElementById('additionalImages');
    const additionalPreview = document.getElementById('additionalPreviewText');
    const overlay = document.getElementById('loadingOverlay');
    const toast = document.getElementById('toast');
    const jsonInput = document.getElementById('jsonInput');
    const copyTemplateBtn = document.getElementById('copyTemplateBtn');
    const newsIdInput = document.getElementById('newsId');

    // Handle file input text updates
    heroInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            heroPreview.textContent = e.target.files[0].name;
            heroPreview.style.color = 'var(--text-primary)';
            heroPreview.style.fontWeight = '600';
        } else {
            heroPreview.textContent = 'No file chosen';
            heroPreview.style.color = 'var(--text-secondary)';
            heroPreview.style.fontWeight = 'normal';
        }
    });

    additionalInput.addEventListener('change', (e) => {
        const count = e.target.files.length;
        if (count > 6) {
            showToast('You can only select up to 6 additional photos.', true);
            e.target.value = ''; // Reset
            additionalPreview.textContent = 'No files chosen';
            additionalPreview.style.color = 'var(--text-secondary)';
            additionalPreview.style.fontWeight = 'normal';
            return;
        }

        if (count > 0) {
            additionalPreview.textContent = `${count} file(s) chosen`;
            additionalPreview.style.color = 'var(--text-primary)';
            additionalPreview.style.fontWeight = '600';
        } else {
            additionalPreview.textContent = 'No files chosen';
            additionalPreview.style.color = 'var(--text-secondary)';
            additionalPreview.style.fontWeight = 'normal';
        }
    });

    function showToast(msg, isError = false) {
        toast.textContent = msg;
        toast.className = `toast show ${isError ? 'error' : ''}`;
        setTimeout(() => {
            toast.className = `toast ${isError ? 'error' : ''}`;
        }, 3000);
    }

    function formatDate(dateString) {
        // convert YYYY-MM-DD to Month DD, YYYY
        const options = { year: 'numeric', month: 'long', day: '2-digit' };
        // Must append T00:00:00 to prevent timezone shifting the day backward
        const d = new Date(dateString + 'T00:00:00');
        return d.toLocaleDateString('en-US', options);
    }

    function parseDateToYYYYMMDD(dateStr) {
        if (!dateStr) return '';
        // If it's already YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return dateStr;
        }
        // Try JS Date parsing
        const timestamp = Date.parse(dateStr);
        if (!isNaN(timestamp)) {
            const d = new Date(timestamp);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        }
        return '';
    }

    // JSON Quick Import Logic
    const jsonTemplate = {
        id: "",
        title: "",
        date: "YYYY-MM-DD",
        tag: "Event/Achievement/Championship/News",
        shortDescription: "",
        fullDescription: ""
    };

    copyTemplateBtn.addEventListener('click', () => {
        const templateString = JSON.stringify(jsonTemplate, null, 2);
        navigator.clipboard.writeText(templateString)
            .then(() => showToast('Template copied to clipboard!'))
            .catch(err => {
                console.error('Failed to copy: ', err);
                showToast('Failed to copy template.', true);
            });
    });

    jsonInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (!val) return;
        try {
            const data = JSON.parse(val);
            if (data.id !== undefined) {
                newsIdInput.value = data.id;
            }
            if (data.title !== undefined) {
                document.getElementById('title').value = data.title;
            }
            if (data.date !== undefined) {
                const formatted = parseDateToYYYYMMDD(data.date);
                if (formatted) {
                    document.getElementById('date').value = formatted;
                }
            }
            if (data.tag !== undefined) {
                const tagSelect = document.getElementById('tag');
                const valLower = data.tag.toLowerCase();
                for (let opt of tagSelect.options) {
                    if (opt.value.toLowerCase() === valLower) {
                        tagSelect.value = opt.value;
                        break;
                    }
                }
            }
            if (data.shortDescription !== undefined) {
                document.getElementById('shortDescription').value = data.shortDescription;
            }
            if (data.fullDescription !== undefined) {
                const rawDesc = String(data.fullDescription);
                document.getElementById('fullDescription').value = rawDesc.replace(/\\n/g, '\n');
            }
            showToast('Form fields populated!');
        } catch (err) {
            if (val.startsWith('{') && val.endsWith('}')) {
                console.warn('JSON parsing error:', err);
            }
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validate
        if (additionalInput.files.length > 6) {
            showToast('Maximum 6 additional photos allowed.', true);
            return;
        }

        overlay.classList.add('active');

        // Dynamically compute the folder name from the date input value
        const dateVal = document.getElementById('date').value; // e.g. "2026-06-18"
        let folderName = 'news';
        if (dateVal) {
            const parts = dateVal.split('-');
            if (parts.length === 3) {
                const year = parts[0];
                const monthNum = parseInt(parts[1], 10);
                const day = parseInt(parts[2], 10);
                const months = [
                    "january", "february", "march", "april", "may", "june",
                    "july", "august", "september", "october", "november", "december"
                ];
                const monthName = months[monthNum - 1] || 'news';
                folderName = `${day}${monthName}${year}`; // e.g. "18june2026"
            }
        }

        const formData = new FormData();
        formData.append('id', newsIdInput.value);
        formData.append('title', document.getElementById('title').value);
        formData.append('date', formatDate(document.getElementById('date').value));
        formData.append('tag', document.getElementById('tag').value);
        formData.append('folderName', folderName);
        formData.append('shortDescription', document.getElementById('shortDescription').value);
        formData.append('fullDescription', document.getElementById('fullDescription').value);

        if (heroInput.files.length > 0) {
            formData.append('heroImage', heroInput.files[0]);
        }

        for (let i = 0; i < additionalInput.files.length; i++) {
            formData.append('additionalImages', additionalInput.files[i]);
        }

        try {
            const response = await fetch('/api/news', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                showToast('Successfully published!');
                form.reset();
                heroPreview.textContent = 'No file chosen';
                heroPreview.style.color = 'var(--text-secondary)';
                additionalPreview.textContent = 'No files chosen';
                additionalPreview.style.color = 'var(--text-secondary)';
                
                // Redirect to homepage after a short delay
                setTimeout(() => {
                    window.location.href = 'index.html#club-life';
                }, 1500);
            } else {
                showToast(result.message || 'Error publishing.', true);
            }
        } catch (error) {
            console.error(error);
            showToast('Server error. Is the local server running?', true);
        } finally {
            overlay.classList.remove('active');
        }
    });

    // Dark Mode Toggle Logic
    const darkModeToggle = document.getElementById('darkModeToggle');
    const isDarkMode = localStorage.getItem('adminDarkMode') === 'true';

    if (isDarkMode) {
        document.body.classList.add('dark-theme');
    }

    darkModeToggle.addEventListener('click', () => {
        const currentlyDark = document.body.classList.contains('dark-theme');
        if (currentlyDark) {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('adminDarkMode', 'false');
        } else {
            document.body.classList.add('dark-theme');
            localStorage.setItem('adminDarkMode', 'true');
        }
    });
});

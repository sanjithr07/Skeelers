document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('newsForm');
    const heroInput = document.getElementById('heroImage');
    const heroPreview = document.getElementById('heroPreviewText');
    const additionalInput = document.getElementById('additionalImages');
    const additionalPreview = document.getElementById('additionalPreviewText');
    const overlay = document.getElementById('loadingOverlay');
    const toast = document.getElementById('toast');

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

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validate
        if (additionalInput.files.length > 6) {
            showToast('Maximum 6 additional photos allowed.', true);
            return;
        }

        overlay.classList.add('active');

        const formData = new FormData();
        formData.append('title', document.getElementById('title').value);
        formData.append('date', formatDate(document.getElementById('date').value));
        formData.append('tag', document.getElementById('tag').value);
        formData.append('folderName', document.getElementById('folderName').value);
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
});

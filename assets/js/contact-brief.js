/* Native WordPress projection of the existing local-only enquiry flow. */
(function(){
const enquiryForm = document.getElementById('mgl-enquiry-form');

function enquiryValue(form, name) {
    const field = form.elements.namedItem(name);
    return field ? String(field.value || '').trim() : '';
}

function buildEnquirySummary(form) {
    const lines = [
        'Meta Grey Label — Brokerage Project Brief',
        '',
        'Name: ' + enquiryValue(form, 'name'),
        'Company / Brand: ' + (enquiryValue(form, 'company') || 'Not provided'),
        'Contact: ' + enquiryValue(form, 'contact'),
        'Target Market: ' + (enquiryValue(form, 'market') || 'Not provided'),
        '',
        'Launch Model: ' + enquiryValue(form, 'model'),
        'Trading Platform: ' + enquiryValue(form, 'platform'),
        'Execution / Liquidity: ' + (enquiryValue(form, 'execution') || 'Not provided'),
        'Client Operations: ' + (enquiryValue(form, 'operations') || 'Not provided'),
        '',
        'Launch Window: ' + (enquiryValue(form, 'timeline') || 'Not provided'),
        'Current Status: ' + (enquiryValue(form, 'status') || 'Not provided'),
        '',
        'Additional Requirements:',
        enquiryValue(form, 'message') || 'None provided'
    ];
    return lines.join('\n');
}

function validateEnquiryForm(form) {
    let valid = true;
    form.querySelectorAll('[required]').forEach(function (field) {
        const filled = String(field.value || '').trim().length > 0;
        field.setAttribute('aria-invalid', String(!filled));
        if (!filled) valid = false;
    });
    return valid;
}

if (enquiryForm) {
    const output = document.getElementById('mgl-enquiry-output');
    const summary = document.getElementById('mgl-enquiry-summary');
    const status = document.getElementById('mgl-enquiry-status');
    const copyButton = document.getElementById('mgl-copy-enquiry');
    const shareLink = document.getElementById('mgl-share-enquiry');

    enquiryForm.querySelectorAll('input, select, textarea').forEach(function (field) {
        field.addEventListener('input', function () {
            field.removeAttribute('aria-invalid');
        });
        field.addEventListener('change', function () {
            field.removeAttribute('aria-invalid');
        });
    });

    enquiryForm.addEventListener('submit', function (event) {
        event.preventDefault();

        if (!validateEnquiryForm(enquiryForm)) {
            const firstInvalid = enquiryForm.querySelector('[aria-invalid="true"]');
            if (status) status.textContent = 'Please complete the required fields first.';
            firstInvalid?.focus();
            return;
        }

        const prepared = buildEnquirySummary(enquiryForm);
        if (summary) summary.textContent = prepared;
        if (shareLink) {
            const shareText = prepared + '\n\nProject page: ' + window.location.href;
            shareLink.href = 'https://wa.me/447988028424?text=' + encodeURIComponent(shareText);
        }
        if (output) {
            output.hidden = false;
            output.scrollIntoView({
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
                block: 'start'
            });
        }
        if (status) status.textContent = 'Project brief prepared. No data has been transmitted.';
    });

    copyButton?.addEventListener('click', async function () {
        const text = summary?.textContent || '';
        if (!text) return;

        try {
            await navigator.clipboard.writeText(text);
            copyButton.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i> Copied';
            window.setTimeout(function () {
                copyButton.innerHTML = '<i class="fa-regular fa-copy" aria-hidden="true"></i> Copy enquiry';
            }, 1800);
        } catch (error) {
            const selection = window.getSelection();
            const range = document.createRange();
            if (summary) {
                range.selectNodeContents(summary);
                selection?.removeAllRanges();
                selection?.addRange(range);
            }
            if (status) status.textContent = 'Select the prepared brief and copy it manually.';
        }
    });
}


})();

(function () {
	var assessmentSheetEndpoint = 'https://script.google.com/macros/s/AKfycbwuoSgmSdLimrMdLIOMiXY_G43IPMKaLB2IC8eI-vIFqLfDBdLqzR4oSBi8FULQqk0x/exec';
	var toggle = document.querySelector('.menu-toggle');
	var nav = document.querySelector('#site-nav');
	if (toggle && nav) {
		toggle.addEventListener('click', function () {
			var open = nav.classList.toggle('is-open');
			toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
			toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
		});
		nav.querySelectorAll('a').forEach(function (link) {
			link.addEventListener('click', function () {
				nav.classList.remove('is-open');
				toggle.setAttribute('aria-expanded', 'false');
				toggle.setAttribute('aria-label', 'Open menu');
			});
		});
		document.addEventListener('keydown', function (event) {
			if (event.key === 'Escape' && nav.classList.contains('is-open')) {
				nav.classList.remove('is-open');
				toggle.setAttribute('aria-expanded', 'false');
				toggle.setAttribute('aria-label', 'Open menu');
				toggle.focus();
			}
		});
	}
	var year = document.querySelector('#year');
	if (year) {
		year.textContent = new Date().getFullYear();
	}
	function keepFocusInside(event, modal) {
		if (event.key !== 'Tab' || !modal || !modal.classList.contains('is-open')) return;
		var controls = Array.prototype.filter.call(modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex="0"]'), function (control) {
			return control.getClientRects().length > 0;
		});
		if (!controls.length) return;
		var first = controls[0];
		var last = controls[controls.length - 1];
		if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
		else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
	}

	var billing = document.querySelector('[data-updateproof-billing]');
	var billingForm = billing ? billing.querySelector('[data-updateproof-checkout-form]') : null;
	var billingModal = document.querySelector('.billing-modal');
	var billingLastFocus = null;
	function openBillingModal(plan) {
		if (!billingModal) return;
		billingLastFocus = document.activeElement;
		var planSelect = billingModal.querySelector('[name="plan"]');
		if (plan && planSelect) planSelect.value = plan;
		billingModal.classList.add('is-open');
		billingModal.setAttribute('aria-hidden', 'false');
		document.body.classList.add('modal-open');
		var email = billingModal.querySelector('[name="email"]');
		if (email) window.setTimeout(function () { email.focus(); }, 80);
	}
	function closeBillingModal() {
		if (!billingModal) return;
		billingModal.classList.remove('is-open');
		billingModal.setAttribute('aria-hidden', 'true');
		document.body.classList.remove('modal-open');
		if (billingLastFocus && billingLastFocus.isConnected && billingLastFocus.focus) billingLastFocus.focus();
	}
	document.querySelectorAll('[data-updateproof-plan]').forEach(function (link) {
		link.addEventListener('click', function (event) {
			event.preventDefault();
			openBillingModal(link.getAttribute('data-updateproof-plan'));
		});
	});
	document.querySelectorAll('[data-updateproof-open-billing]').forEach(function (link) {
		link.addEventListener('click', function (event) {
			event.preventDefault();
			openBillingModal();
		});
	});
	document.querySelectorAll('[data-updateproof-close-billing]').forEach(function (control) {
		control.addEventListener('click', closeBillingModal);
	});
	document.addEventListener('keydown', function (event) {
		if (event.key === 'Escape') closeBillingModal();
		keepFocusInside(event, billingModal);
	});
	if (billingModal) {
		var showDownload = billingModal.querySelector('[data-updateproof-show-download]');
		if (showDownload) {
			showDownload.addEventListener('click', function () {
				var panel = billingModal.querySelector('[data-updateproof-download-panel]');
				if (panel) {
					panel.classList.add('is-highlighted');
					panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
					var key = panel.querySelector('[name="license_key"]');
					if (key) window.setTimeout(function () { key.focus(); }, 250);
				}
			});
		}
	}
	if (billing && billingForm) {
		var billingMessage = billingForm.querySelector('[data-billing-message]');
		var apiBase = (billing.getAttribute('data-api-base') || '').replace(/\/+$/, '');
		var paymentButton = billingForm.querySelector('button[type="submit"]');

		function requestJson(url, payload) {
			return fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			}).then(function (response) {
				return response.text().then(function (body) {
					var data = {};
					try { data = body ? JSON.parse(body) : {}; } catch (ignore) {}
					if (!response.ok || !data.success) {
						throw new Error(data.message || 'The UpdateProof service rejected the request.');
					}
					return data;
				});
			});
		}

		function showLicenseSuccess(license) {
			billing.classList.add('has-license');
			billingMessage.className = 'billing-message billing-message-success';
			billingMessage.textContent = '';

			var heading = document.createElement('strong');
			heading.textContent = 'Payment successful - your Pro license is ready.';
			billingMessage.appendChild(heading);
			billingMessage.appendChild(document.createElement('br'));
			billingMessage.appendChild(document.createTextNode('Save this license key: '));

			var key = document.createElement('code');
			key.textContent = license.license_key || '';
			billingMessage.appendChild(key);

			var copy = document.createElement('button');
			copy.type = 'button';
			copy.className = 'billing-copy-key';
			copy.textContent = 'Copy license key';
			copy.addEventListener('click', function () {
				var value = license.license_key || '';
				if (navigator.clipboard && navigator.clipboard.writeText) {
					navigator.clipboard.writeText(value).then(function () {
						copy.textContent = 'Copied';
					});
				} else {
					copy.textContent = 'Select the key above';
				}
			});
			billingMessage.appendChild(document.createTextNode(' '));
			billingMessage.appendChild(copy);
			if (license.download_url) {
				billingMessage.appendChild(document.createElement('br'));
				var download = document.createElement('a');
				download.className = 'billing-download-link';
				download.href = license.download_url;
				download.textContent = 'Download UpdateProof Pro';
				download.setAttribute('download', '');
				billingMessage.appendChild(download);
			}
			billingMessage.appendChild(document.createElement('br'));
			billingMessage.appendChild(document.createTextNode('Next: install UpdateProof Pro, open UpdateProof Pro in WordPress, and paste this key.'));
			billingMessage.appendChild(document.createElement('br'));
			billingMessage.appendChild(document.createTextNode(license.email_sent ? 'A copy was also sent to your email. The email download link remains available for 7 days.' : (license.email_queued ? 'Your license email is being sent now. The email download link remains available for 7 days.' : 'If the email does not arrive, use the saved key above to request another download link.')));
		}

		billingForm.addEventListener('submit', function (event) {
			event.preventDefault();
			var email = billingForm.querySelector('[name="email"]').value.trim();
			var plan = billingForm.querySelector('[name="plan"]').value;
			if (!apiBase || !window.Razorpay) {
				billingMessage.textContent = 'Secure checkout is not configured yet. Please contact UpdateProof support.';
				return;
			}
			paymentButton.disabled = true;
			billingMessage.className = 'billing-message';
			billingMessage.textContent = 'Preparing secure payment...';

			requestJson(apiBase + '/api/razorpay/subscription', { plan: plan, email: email }).then(function (order) {
				billingMessage.textContent = 'Opening secure payment...';
				var checkout = new window.Razorpay({
					key: order.key_id,
					name: 'UpdateProof',
					description: order.plan + ' annual subscription',
					subscription_id: order.subscription_id,
					prefill: { email: order.email },
					theme: { color: '#173763' },
					handler: function (payment) {
						billingMessage.textContent = 'Payment received. Verifying your license...';
						requestJson(apiBase + '/api/razorpay/verify', payment).then(function (license) {
							showLicenseSuccess(license);
							paymentButton.disabled = false;
						}).catch(function (error) {
							if (error && error.name === 'TypeError') {
								billingMessage.textContent = 'Payment completed, but license verification could not be reached. Do not pay again. Save payment ID ' + payment.razorpay_payment_id + ' and contact support.';
							} else {
								billingMessage.textContent = error.message || 'Payment verification failed. Do not pay again; contact support.';
							}
							paymentButton.disabled = false;
						});
					},
					modal: {
						ondismiss: function () {
							billingMessage.textContent = 'Payment window closed. No license was issued.';
							paymentButton.disabled = false;
						}
					}
				});
				checkout.on('payment.failed', function (response) {
					var description = response && response.error && response.error.description
						? response.error.description
						: 'Payment failed.';
					billingMessage.textContent = 'Payment failed: ' + description;
					paymentButton.disabled = false;
				});
				checkout.open();
			}).catch(function (error) {
				billingMessage.textContent = error && error.name === 'TypeError'
					? 'We could not reach secure checkout. Please try again.'
					: (error.message || 'The annual subscription could not be created.');
				paymentButton.disabled = false;
			});
		});
	}

	var downloadForm = document.querySelector('[data-updateproof-download-form]');
	if (downloadForm) {
		var downloadMessage = downloadForm.querySelector('[data-download-message]');
		var downloadApiBase = (downloadForm.getAttribute('data-api-base') || '').replace(/\/+$/, '');
		var downloadButton = downloadForm.querySelector('button[type="submit"]');
		function downloadRequestJson(url, payload) {
			return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(function (response) {
				return response.text().then(function (body) {
					var data = {};
					try { data = body ? JSON.parse(body) : {}; } catch (ignore) {}
					if (!response.ok || !data.success) throw new Error(data.message || 'The UpdateProof service rejected the request.');
					return data;
				});
			});
		}
		downloadForm.addEventListener('submit', function (event) {
			event.preventDefault();
			var licenseKey = downloadForm.querySelector('[name="license_key"]').value.trim();
			if (!downloadApiBase || !licenseKey) {
				downloadMessage.textContent = 'Enter your UpdateProof Pro license key.';
				return;
			}
			downloadButton.disabled = true;
			downloadMessage.className = 'billing-message';
			downloadMessage.textContent = 'Checking your license...';
			downloadRequestJson(downloadApiBase + '/api/license/download', { license_key: licenseKey }).then(function (result) {
				downloadMessage.className = 'billing-message billing-message-success';
				downloadMessage.textContent = '';
				var link = document.createElement('a');
				link.className = 'billing-download-link';
				link.href = result.download_url;
				link.textContent = 'Download UpdateProof Pro ' + (result.version || '');
				downloadMessage.appendChild(link);
				downloadMessage.appendChild(document.createElement('br'));
				downloadMessage.appendChild(document.createTextNode('This secure download link expires in 15 minutes.'));
			}).catch(function (error) {
				downloadMessage.textContent = error.message || 'We could not create a download link.';
			}).then(function () {
				downloadButton.disabled = false;
			});
		});
	}

	var assessment = document.querySelector('[data-maintenance-assessment]');
	if (assessment) {
		var assessmentDialog = assessment.querySelector('.assessment-dialog');
		var assessmentQuestions = [
			{ category: 'Step 1: Pre-update safety', title: 'Do you capture a safety snapshot before updates?', help: 'A snapshot creates a clear starting point for risk review and comparison.', options: [
				{ label: 'Every time', detail: 'I record the site state before maintenance.', value: 2 },
				{ label: 'Sometimes', detail: 'It depends on the size or urgency of the update.', value: 1 },
				{ label: 'Not yet', detail: 'I usually update first and inspect later.', value: 0 }
			] },
			{ category: 'Step 2: Important pages', title: 'How do you check important pages after an update?', help: 'Your homepage loading is not enough; key templates and conversion paths need evidence too.', options: [
				{ label: 'A defined page list', detail: 'I check the same important URLs before and after.', value: 2 },
				{ label: 'A quick visual look', detail: 'I inspect a few pages manually when I remember.', value: 1 },
				{ label: 'Only the homepage', detail: 'I rely on the site appearing to load.', value: 0 }
			] },
			{ category: 'Step 3: Approval', title: 'Can you review what will change before it is applied?', help: 'A review step makes maintenance deliberate and gives you a record of the decision.', options: [
				{ label: 'Yes, with an approval step', detail: 'I review the update set and risk before proceeding.', value: 2 },
				{ label: 'I review it in the dashboard', detail: 'I look at available updates but do not record approval.', value: 1 },
				{ label: 'No review step', detail: 'Updates are applied as soon as they are available.', value: 0 }
			] },
			{ category: 'Step 4: Visual verification', title: 'Do you compare before-and-after screenshots?', help: 'A visual diff can reveal layout, styling, or content changes that a simple HTTP check misses.', options: [
				{ label: 'Yes, automatically', detail: 'I keep a baseline and compare it after maintenance.', value: 2 },
				{ label: 'Sometimes manually', detail: 'I look at screenshots or pages when a change seems risky.', value: 1 },
				{ label: 'No', detail: 'I do not currently compare visual output.', value: 0 }
			] },
			{ category: 'Step 5: Workflow testing', title: 'Do you test workflows, not only page rendering?', help: 'Forms, login, search, and checkout can fail even when a page returns a healthy status.', options: [
				{ label: 'I test critical workflows', detail: 'I check the actions that matter to visitors or customers.', value: 2 },
				{ label: 'I test them occasionally', detail: 'I do this for major changes or when someone reports an issue.', value: 1 },
				{ label: 'Not currently', detail: 'I only confirm that pages load.', value: 0 }
			] },
			{ category: 'Step 6: History and proof', title: 'Can you show what happened after maintenance?', help: 'A simple history helps you troubleshoot quickly and gives clients confidence.', options: [
				{ label: 'Yes, with saved reports', detail: 'I can review results, timing, and the update decision.', value: 2 },
				{ label: 'Partly', detail: 'I keep notes or rely on scattered logs.', value: 1 },
				{ label: 'No', detail: 'There is no consistent record after an update.', value: 0 }
			] },
			{ category: 'Step 7: Ongoing awareness', title: 'Would you know quickly if a site regressed later?', help: 'Post-update confidence is stronger when important pages are checked again on a repeatable rhythm.', options: [
				{ label: 'Yes, through repeatable checks', detail: 'I have scheduled or external monitoring for key paths.', value: 2 },
				{ label: 'Only if someone reports it', detail: 'I do not have a regular follow-up check.', value: 1 },
				{ label: 'I would not know quickly', detail: 'There is no ongoing signal after maintenance.', value: 0 }
			] }
		];
		var assessmentViews = assessment.querySelectorAll('[data-assessment-view]');
		var assessmentProgressWrap = assessment.querySelector('[data-assessment-progress-wrap]');
		var assessmentProgress = assessment.querySelector('[data-assessment-progress]');
		var assessmentQuestionNumber = assessment.querySelector('[data-assessment-question-number]');
		var assessmentPercent = assessment.querySelector('[data-assessment-percent]');
		var assessmentCategory = assessment.querySelector('[data-assessment-category]');
		var assessmentQuestionTitle = assessment.querySelector('[data-assessment-question-title]');
		var assessmentQuestionHelp = assessment.querySelector('[data-assessment-question-help]');
		var assessmentOptions = assessment.querySelector('[data-assessment-options]');
		var assessmentBack = assessment.querySelector('[data-assessment-back]');
		var assessmentNext = assessment.querySelector('[data-assessment-next]');
		var assessmentEncouragementContinue = assessment.querySelector('[data-assessment-encouragement-continue]');
		var assessmentAccessNext = assessment.querySelector('[data-assessment-access-next]');
		var assessmentAccessBack = assessment.querySelector('[data-assessment-access-back]');
		var assessmentAccessEmailWrap = assessment.querySelector('[data-assessment-access-email-wrap]');
		var assessmentAccessEmail = assessment.querySelector('[data-assessment-access-email]');
		var assessmentAccessMarketing = assessment.querySelector('[data-assessment-access-marketing]');
		var assessmentFeedbackForm = assessment.querySelector('[data-assessment-feedback-form]');
		var assessmentFeedbackBack = assessment.querySelector('[data-assessment-feedback-back]');
		var assessmentFeedbackStatus = assessment.querySelector('[data-assessment-feedback-status]');
		var assessmentProcessingBar = assessment.querySelector('[data-assessment-processing-bar]');
		var assessmentProcessingStatus = assessment.querySelector('[data-assessment-processing-status]');
		var assessmentScreenEmailForm = assessment.querySelector('[data-assessment-screen-email-form]');
		var assessmentScreenEmail = assessment.querySelector('[data-assessment-screen-email]');
		var assessmentScreenMarketing = assessment.querySelector('[data-assessment-screen-marketing]');
		var assessmentScreenEmailStatus = assessment.querySelector('[data-assessment-screen-email-status]');
		var assessmentExit = assessment.querySelector('[data-assessment-exit]');
		var assessmentRestart = assessment.querySelector('[data-assessment-restart]');
		var assessmentState = { index: 0, answers: [], assessmentId: '', lastFocus: null, score: 0, resultTitle: '', delivery: '', email: '', marketingOptIn: false, feedback: {} };
		if (assessmentRestart) assessmentRestart.href = 'assessment.html' + window.location.search;
		if (assessmentExit) {
			var cameFromHomepage = false;
			if (document.referrer) {
				try {
					var referrerPath = new URL(document.referrer).pathname.replace(/\/+$/, '');
					cameFromHomepage = referrerPath === '' || /\/index\.html$/i.test(referrerPath);
				} catch (error) {}
			}
			if (!cameFromHomepage) assessmentExit.href = 'assessment.html';
		}

		function addAssessmentAnswers(payload) {
			assessmentQuestions.forEach(function (question, index) {
				var answerIndex = assessmentState.answers[index];
				payload.set('q' + (index + 1) + '_answer', typeof answerIndex === 'number' ? question.options[answerIndex].label : '');
			});
		}

		function getAssessmentDetails() {
			var score = assessmentState.answers.reduce(function (total, answer, index) { return total + (typeof answer === 'number' ? assessmentQuestions[index].options[answer].value : 0); }, 0);
			var resultTitle = score >= 11 ? 'Ready to standardize' : (score >= 6 ? 'Building a safety net' : 'Start with the basics');
			var readinessLabel = score >= 12 ? 'Excellent' : (score >= 9 ? 'Good' : (score >= 6 ? 'Moderate' : 'Low'));
			var readinessTone = score >= 12 ? 'excellent' : (score >= 9 ? 'good' : (score >= 6 ? 'moderate' : 'low'));
			var resultHeading = score >= 11 ? 'You are close to a repeatable maintenance rhythm.' : (score >= 6 ? 'You have a useful foundation to build on.' : 'Your maintenance process needs a clearer safety net.');
			var resultCopy = score >= 11 ? 'Your answers show a strong habit of checking changes and preserving evidence. The next step is making that discipline easy to repeat and explain to clients or stakeholders.' : (score >= 6 ? 'You have several good habits in place, but a few gaps could still let a broken workflow or visual change slip through. Focus on the paths that matter most to visitors and customers.' : 'The biggest risk is not knowing what changed or whether important workflows still work. Start with a pre-update snapshot and a short list of critical pages.');
			var readinessFocus = score >= 11 ? 'Turn your current checks into a repeatable, client-ready maintenance report.' : (score >= 6 ? 'Define a baseline and repeat the same checks after every important update.' : 'Start with one pre-update snapshot and a 5–10 URL list of critical pages.');
			var blindSpots = [];
			var recommendations = [];
			assessmentQuestions.forEach(function (question, index) {
				if (typeof assessmentState.answers[index] === 'number' && question.options[assessmentState.answers[index]].value === 0) blindSpots.push(question.category.replace(/^Step \d+: /, '') + ' needs a defined check.');
			});
			if (!blindSpots.length) blindSpots.push('Keep the workflow consistent as your site and update volume grow.');
			recommendations.push('Capture a baseline before maintenance and verify the same critical paths afterward.');
			if (score < 11) recommendations.push('Separate page rendering checks from workflow checks such as forms, login, search, or checkout.');
			recommendations.push('Save a short result history so you can explain what changed to yourself or a client.');
			return { score: score, resultTitle: resultTitle, readinessLabel: readinessLabel, readinessTone: readinessTone, resultHeading: resultHeading, resultCopy: resultCopy, readinessFocus: readinessFocus, blindSpots: blindSpots, recommendations: recommendations };
		}

		function saveAssessmentResult(details, context) {
			if (!assessmentSheetEndpoint || !assessmentState.assessmentId) return Promise.resolve();
			var payload = new URLSearchParams();
			payload.set('type', 'assessment_result');
			payload.set('assessment_id', assessmentState.assessmentId);
			payload.set('source', 'shared-maintenance-assessment');
			payload.set('assessment_version', 'v4');
			payload.set('score', String(details.score));
			payload.set('result_band', (context && context.result_band) || details.resultTitle);
			addAssessmentAnswers(payload);
			payload.set('page_url', window.location.href);
			payload.set('feedback', (context && context.feedback) || assessmentState.feedback.feedback || '');
			payload.set('recipient_email', (context && context.recipient_email) || assessmentState.email || '');
			return fetch(assessmentSheetEndpoint, { method: 'POST', body: payload, mode: 'no-cors', keepalive: true });
		}

		function saveAssessmentProgress() {
			var details = getAssessmentDetails();
			var answeredCount = assessmentState.answers.filter(function (answer) { return typeof answer === 'number'; }).length;
			saveAssessmentResult(details, { result_band: answeredCount === assessmentQuestions.length ? details.resultTitle : 'In progress' }).catch(function () {});
		}

		function assessmentShowView(name) {
			assessmentViews.forEach(function (view) { view.hidden = view.getAttribute('data-assessment-view') !== name; });
		}
		function renderAssessmentProgress() {
			assessmentProgress.innerHTML = '';
			var currentAnswered = typeof assessmentState.answers[assessmentState.index] === 'number';
			assessmentQuestions.forEach(function (_, index) {
				var segment = document.createElement('span');
				if (index < assessmentState.index || (index === assessmentState.index && currentAnswered)) segment.className = 'is-complete';
				else if (index === assessmentState.index) segment.className = 'is-current';
				assessmentProgress.appendChild(segment);
			});
			assessmentQuestionNumber.textContent = 'Question ' + (assessmentState.index + 1) + ' of ' + assessmentQuestions.length;
			var completedQuestions = assessmentState.index + (currentAnswered ? 1 : 0);
			assessmentPercent.textContent = Math.round((completedQuestions / assessmentQuestions.length) * 100) + '% complete';
		}
		function renderAssessmentQuestion() {
			var question = assessmentQuestions[assessmentState.index];
			assessmentShowView('question');
			assessmentDialog.scrollTop = 0;
			assessmentProgressWrap.hidden = false;
			renderAssessmentProgress();
			assessmentCategory.textContent = question.category;
			assessmentQuestionTitle.textContent = question.title;
			assessmentQuestionHelp.textContent = question.help;
			assessmentOptions.innerHTML = '';
			question.options.forEach(function (option, optionIndex) {
				var choice = document.createElement('label');
				choice.className = 'assessment-option';
				var radio = document.createElement('input');
				radio.type = 'radio';
				radio.name = 'assessment-answer';
				radio.value = String(optionIndex);
				radio.checked = assessmentState.answers[assessmentState.index] === optionIndex;
				if (radio.checked) choice.classList.add('is-selected');
				choice.innerHTML = '<span><strong></strong><small></small></span>';
				choice.insertBefore(radio, choice.firstChild);
				choice.querySelector('strong').textContent = option.label;
				choice.querySelector('small').textContent = option.detail;
				radio.addEventListener('change', function () {
					assessmentState.answers[assessmentState.index] = optionIndex;
					renderAssessmentProgress();
					assessmentOptions.querySelectorAll('.assessment-option').forEach(function (item) {
						item.classList.remove('is-selected');
					});
					choice.classList.add('is-selected');
					assessmentNext.disabled = false;
				});
				assessmentOptions.appendChild(choice);
			});
			assessmentBack.disabled = assessmentState.index === 0;
			assessmentNext.disabled = typeof assessmentState.answers[assessmentState.index] !== 'number';
			assessmentQuestionTitle.focus({ preventScroll: true });
		}
		function renderAssessmentEncouragement() {
			assessmentShowView('encouragement');
			assessmentDialog.scrollTop = 0;
			if (assessmentEncouragementContinue) assessmentEncouragementContinue.focus({ preventScroll: true });
		}
		function renderAssessmentAccess() {
			assessmentProgressWrap.hidden = true;
			assessmentShowView('access');
			assessmentDialog.scrollTop = 0;
			assessmentAccessNext.disabled = false;
			assessmentAccessEmailWrap.hidden = false;
			assessmentAccessEmail.required = false;
			assessment.querySelector('[data-assessment-access-title]').focus({ preventScroll: true });
		}
		function renderAssessmentFeedback() {
			assessmentShowView('feedback');
			assessmentDialog.scrollTop = 0;
			assessment.querySelector('[data-assessment-feedback-title]').focus({ preventScroll: true });
		}
		function renderAssessmentProcessing() {
			assessmentProgressWrap.hidden = true;
			assessmentShowView('processing');
			assessmentDialog.scrollTop = 0;
			if (assessmentProcessingBar) {
				assessmentProcessingBar.style.width = '0%';
				assessmentProcessingBar.parentElement.setAttribute('aria-valuenow', '0');
			}
			if (assessmentProcessingStatus) assessmentProcessingStatus.textContent = 'Reviewing your answers...';
			assessment.querySelector('[data-assessment-processing-title]').focus({ preventScroll: true });
			return new Promise(function (resolve) {
				var steps = [
					{ delay: 450, progress: 28, text: 'Finding your strongest habits...' },
					{ delay: 950, progress: 55, text: 'Spotting opportunities to improve...' },
					{ delay: 1450, progress: 79, text: 'Writing your practical next steps...' },
					{ delay: 2050, progress: 100, text: 'Your guidance is ready.' }
				];
				steps.forEach(function (step) {
					window.setTimeout(function () {
						if (assessmentProcessingBar) {
							assessmentProcessingBar.style.width = step.progress + '%';
							assessmentProcessingBar.parentElement.setAttribute('aria-valuenow', String(step.progress));
						}
						if (assessmentProcessingStatus) assessmentProcessingStatus.textContent = step.text;
						if (step.progress === 100) resolve();
					}, step.delay);
				});
			});
		}
		function renderAssessmentThankYou() {
			var details = getAssessmentDetails();
			assessmentState.score = details.score;
			assessmentState.resultTitle = details.resultTitle;
			assessment.querySelector('[data-assessment-score]').textContent = details.score + '/14';
			var readinessBadge = assessment.querySelector('[data-assessment-readiness-badge]');
			var scoreCard = assessment.querySelector('[data-assessment-screen-result]');
			['excellent', 'good', 'moderate', 'low'].forEach(function (tone) {
				if (readinessBadge) readinessBadge.classList.remove('is-' + tone);
				if (scoreCard) scoreCard.classList.remove('is-' + tone);
			});
			if (readinessBadge) {
				readinessBadge.textContent = details.readinessLabel;
				readinessBadge.classList.add('is-' + details.readinessTone);
			}
			if (scoreCard) scoreCard.classList.add('is-' + details.readinessTone);
			var previewFocus = assessment.querySelector('[data-assessment-preview-focus]');
			var previewMeaning = assessment.querySelector('[data-assessment-preview-meaning]');
			var previewAction = assessment.querySelector('[data-assessment-preview-action]');
			if (previewFocus) previewFocus.textContent = details.blindSpots[0];
			if (previewMeaning) previewMeaning.textContent = details.resultCopy;
			if (previewAction) previewAction.textContent = details.readinessFocus;
			assessment.querySelector('[data-assessment-thankyou-copy]').textContent = assessmentState.delivery === 'email' ? 'Your detailed readiness report will be sent to ' + assessmentState.email + '.' : 'Your score is shown below. You can request the detailed report by email whenever you are ready.';
			assessment.querySelector('[data-assessment-screen-result]').hidden = assessmentState.delivery !== 'screen';
			assessment.querySelector('[data-assessment-screen-email-wrap]').hidden = assessmentState.delivery !== 'screen';
			assessmentShowView('thankyou');
			assessmentDialog.scrollTop = 0;
			var confetti = assessment.querySelector('[data-assessment-confetti]');
			if (confetti) {
				confetti.innerHTML = '';
				for (var index = 0; index < 32; index += 1) {
					var piece = document.createElement('span');
					piece.style.setProperty('--confetti-x', ((index * 37) % 120) - 10 + '%');
					piece.style.setProperty('--confetti-delay', (index % 8) * 45 + 'ms');
					piece.style.setProperty('--confetti-rotation', ((index * 47) % 360) + 'deg');
					piece.className = 'assessment-confetti-piece';
					confetti.appendChild(piece);
				}
			}
			assessment.querySelector('[data-assessment-thankyou-title]').focus({ preventScroll: true });
		}
		function resetAssessmentState() {
			assessmentState.index = 0;
			assessmentState.answers = [];
			assessmentState.assessmentId = '';
			assessmentState.score = 0;
			assessmentState.resultTitle = '';
			assessmentState.delivery = '';
			assessmentState.email = '';
			assessmentState.marketingOptIn = false;
			assessmentState.feedback = {};
			if (assessmentFeedbackForm) assessmentFeedbackForm.reset();
			if (assessmentAccessEmail) assessmentAccessEmail.value = '';
			if (assessmentAccessMarketing) assessmentAccessMarketing.checked = true;
			if (assessmentScreenMarketing) assessmentScreenMarketing.checked = true;
			if (assessmentFeedbackStatus) assessmentFeedbackStatus.textContent = '';
			if (assessmentScreenEmailStatus) assessmentScreenEmailStatus.textContent = '';
		}
		function createAssessmentId() {
			var randomPart = window.crypto && typeof window.crypto.randomUUID === 'function' ? window.crypto.randomUUID().replace(/-/g, '') : Math.random().toString(36).slice(2) + Date.now().toString(36);
			return 'assessment-' + Date.now().toString(36) + '-' + randomPart.slice(0, 16);
		}
		function startAssessment() {
			resetAssessmentState();
			assessmentState.assessmentId = createAssessmentId();
			renderAssessmentQuestion();
		}
		function openAssessment() {
			assessmentState.lastFocus = document.activeElement;
			assessment.classList.add('is-open');
			assessment.setAttribute('aria-hidden', 'false');
			document.body.classList.add('assessment-open');
			resetAssessmentState();
			assessmentProgressWrap.hidden = true;
			assessmentShowView('intro');
			assessmentDialog.scrollTop = 0;
			var start = assessment.querySelector('[data-assessment-start]');
			if (start) window.setTimeout(function () { start.focus(); }, 50);
		}
		function closeAssessment() {
			assessment.classList.remove('is-open');
			assessment.setAttribute('aria-hidden', 'true');
			document.body.classList.remove('assessment-open');
			if (assessmentState.lastFocus && assessmentState.lastFocus.focus) assessmentState.lastFocus.focus();
		}
		document.querySelectorAll('[data-updateproof-open-assessment]').forEach(function (link) {
			link.addEventListener('click', function (event) { event.preventDefault(); openAssessment(); });
		});
		assessment.querySelectorAll('[data-updateproof-close-assessment]').forEach(function (control) {
			control.addEventListener('click', function (event) { event.preventDefault(); closeAssessment(); });
		});
		assessment.querySelector('[data-assessment-start]').addEventListener('click', startAssessment);
		assessmentBack.addEventListener('click', function () { if (assessmentState.index > 0) { assessmentState.index -= 1; renderAssessmentQuestion(); } });
		assessmentNext.addEventListener('click', function () {
			if (typeof assessmentState.answers[assessmentState.index] !== 'number') return;
			saveAssessmentProgress();
			if (assessmentState.index === 3) { renderAssessmentEncouragement(); return; }
			if (assessmentState.index < assessmentQuestions.length - 1) { assessmentState.index += 1; renderAssessmentQuestion(); } else { renderAssessmentAccess(); }
		});
		if (assessmentEncouragementContinue) assessmentEncouragementContinue.addEventListener('click', function () { assessmentState.index = 4; renderAssessmentQuestion(); });
		if (assessmentAccessBack) assessmentAccessBack.addEventListener('click', function () { assessmentState.index = 6; renderAssessmentQuestion(); });
		if (assessmentAccessNext) assessmentAccessNext.addEventListener('click', function () {
			if (assessmentAccessEmail.value.trim() && !assessmentAccessEmail.reportValidity()) return;
			assessmentState.email = assessmentAccessEmail.value.trim();
			assessmentState.delivery = assessmentState.email ? 'email' : 'screen';
			assessmentState.marketingOptIn = Boolean(assessmentState.email && assessmentAccessMarketing.checked);
			renderAssessmentFeedback();
		});
		if (assessmentFeedbackBack) assessmentFeedbackBack.addEventListener('click', function () { renderAssessmentAccess(); });
		if (assessmentFeedbackForm) assessmentFeedbackForm.addEventListener('submit', function (event) {
			event.preventDefault();
			if (!assessmentFeedbackForm.reportValidity()) return;
			var submit = assessmentFeedbackForm.querySelector('button[type="submit"]');
			if (submit) submit.disabled = true;
			assessmentState.feedback = {};
			new FormData(assessmentFeedbackForm).forEach(function (value, key) { assessmentState.feedback[key] = String(value); });
			var details = getAssessmentDetails();
			var savePromise = saveAssessmentResult(details, { result_band: details.resultTitle, feedback: assessmentState.feedback.feedback || '' }).catch(function () {});
			renderAssessmentProcessing().then(function () {
				return savePromise;
			}).then(renderAssessmentThankYou);
		});
		if (assessmentScreenEmailForm) assessmentScreenEmailForm.addEventListener('submit', function (event) {
			event.preventDefault();
			if (!assessmentScreenEmailForm.reportValidity()) return;
			var email = assessmentScreenEmail.value.trim();
			var submit = assessmentScreenEmailForm.querySelector('button[type="submit"]');
			if (submit) submit.disabled = true;
			if (assessmentScreenEmailStatus) assessmentScreenEmailStatus.textContent = 'Requesting your detailed report...';
			assessmentState.email = email;
			assessmentState.marketingOptIn = assessmentScreenMarketing.checked;
			saveAssessmentResult(getAssessmentDetails(), { recipient_email: email }).then(function () {
				if (assessmentScreenEmailStatus) assessmentScreenEmailStatus.textContent = 'Thank you — your detailed report will be sent to your inbox.';
			}).catch(function () {
				if (submit) submit.disabled = false;
				if (assessmentScreenEmailStatus) assessmentScreenEmailStatus.textContent = 'We could not save your email right now. Please try again.';
			});
		});
		document.addEventListener('keydown', function (event) {
			if (event.key === 'Escape' && assessment.classList.contains('is-open')) closeAssessment();
			keepFocusInside(event, assessment);
		});
	}
}());



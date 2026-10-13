(function () {
	var toggle = document.querySelector('.menu-toggle');
	var nav = document.querySelector('#site-nav');
	if (toggle && nav) {
		toggle.addEventListener('click', function () {
			var open = nav.classList.toggle('is-open');
			toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
		});
		nav.querySelectorAll('a').forEach(function (link) {
			link.addEventListener('click', function () {
				nav.classList.remove('is-open');
				toggle.setAttribute('aria-expanded', 'false');
			});
		});
	}
	var year = document.querySelector('#year');
	if (year) {
		year.textContent = new Date().getFullYear();
	}

	var billing = document.querySelector('[data-updateproof-billing]');
	var billingForm = billing ? billing.querySelector('[data-updateproof-checkout-form]') : null;
	var billingModal = document.querySelector('.billing-modal');
	function openBillingModal(plan) {
		if (!billingModal) return;
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

	var assessment = document.querySelector('[data-updateproof-assessment]');
	if (assessment) {
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
		var assessmentScored = assessment.querySelector('[data-assessment-scored]');
		var assessmentQuestionTitle = assessment.querySelector('[data-assessment-question-title]');
		var assessmentQuestionHelp = assessment.querySelector('[data-assessment-question-help]');
		var assessmentOptions = assessment.querySelector('[data-assessment-options]');
		var assessmentBack = assessment.querySelector('[data-assessment-back]');
		var assessmentNext = assessment.querySelector('[data-assessment-next]');
		var assessmentState = { index: 0, answers: [], lastFocus: null };

		function assessmentShowView(name) {
			assessmentViews.forEach(function (view) { view.hidden = view.getAttribute('data-assessment-view') !== name; });
		}
		function renderAssessmentProgress() {
			assessmentProgress.innerHTML = '';
			assessmentQuestions.forEach(function (_, index) {
				var segment = document.createElement('span');
				if (index <= assessmentState.index) segment.className = index === assessmentState.index ? 'is-current' : 'is-complete';
				assessmentProgress.appendChild(segment);
			});
			assessmentQuestionNumber.textContent = 'Question ' + (assessmentState.index + 1) + ' of ' + assessmentQuestions.length;
			assessmentPercent.textContent = Math.round(((assessmentState.index + 1) / assessmentQuestions.length) * 100) + '% complete';
		}
		function renderAssessmentQuestion() {
			var question = assessmentQuestions[assessmentState.index];
			assessmentShowView('question');
			assessmentProgressWrap.hidden = false;
			renderAssessmentProgress();
			assessmentCategory.textContent = question.category;
			assessmentScored.textContent = 'Scored Â· ' + question.options[0].value + ' pts';
			assessmentQuestionTitle.textContent = question.title;
			assessmentQuestionHelp.textContent = question.help;
			assessmentOptions.innerHTML = '';
			question.options.forEach(function (option, optionIndex) {
				var choice = document.createElement('button');
				choice.type = 'button';
				choice.className = 'assessment-option';
				choice.setAttribute('aria-pressed', assessmentState.answers[assessmentState.index] === optionIndex ? 'true' : 'false');
				if (assessmentState.answers[assessmentState.index] === optionIndex) choice.classList.add('is-selected');
				choice.innerHTML = '<input type="radio" tabindex="-1" aria-hidden="true"><span><strong></strong><small></small></span>';
				choice.querySelector('strong').textContent = option.label;
				choice.querySelector('small').textContent = option.detail;
				choice.addEventListener('click', function () {
					assessmentState.answers[assessmentState.index] = optionIndex;
					assessmentOptions.querySelectorAll('.assessment-option').forEach(function (item) {
						item.classList.remove('is-selected');
						item.setAttribute('aria-pressed', 'false');
					});
					choice.classList.add('is-selected');
					choice.setAttribute('aria-pressed', 'true');
					assessmentNext.disabled = false;
				});
				assessmentOptions.appendChild(choice);
			});
			assessmentBack.disabled = assessmentState.index === 0;
			assessmentNext.disabled = typeof assessmentState.answers[assessmentState.index] !== 'number';
		}
		function renderAssessmentResult() {
			var score = assessmentState.answers.reduce(function (total, answer, index) { return total + assessmentQuestions[index].options[answer].value; }, 0);
			var resultTitle = score >= 11 ? 'Strong evidence rhythm' : (score >= 6 ? 'Some blind spots remain' : 'High-risk, low-evidence workflow');
			var resultHeading = score >= 11 ? 'You are close to a repeatable maintenance rhythm.' : (score >= 6 ? 'You have a useful foundation to build on.' : 'Your maintenance process needs a clearer safety net.');
			var resultCopy = score >= 11 ? 'Your answers show a strong habit of checking changes and preserving evidence. Make those checks repeatable so confidence does not depend on memory.' : (score >= 6 ? 'A few missing checks could still let a broken workflow or visual change slip through. Start with the paths that matter most to visitors and customers.' : 'The biggest risk is not knowing what changed or whether important workflows still work. Begin with a pre-update snapshot and a short list of critical pages.');
			var blindSpots = [];
			var recommendations = [];
			assessmentQuestions.forEach(function (question, index) {
				if (assessmentQuestions[index].options[assessmentState.answers[index]].value === 0) blindSpots.push(question.category.replace(/^Step \d+: /, '') + ' needs a defined check.');
			});
			if (!blindSpots.length) blindSpots.push('Keep the workflow consistent as your site and update volume grow.');
			recommendations.push('Capture a baseline before maintenance and verify the same critical paths afterward.');
			if (score < 11) recommendations.push('Separate page rendering checks from workflow checks such as forms, login, search, or checkout.');
			recommendations.push('Save a short result history so you can explain what changed to yourself or a client.');
			assessment.querySelector('[data-assessment-score]').textContent = score + '/14';
			assessment.querySelector('[data-assessment-result-title]').textContent = resultTitle;
			assessment.querySelector('[data-assessment-result-heading]').textContent = resultHeading;
			assessment.querySelector('[data-assessment-result-copy]').textContent = resultCopy;
			function fillList(selector, items) {
				var list = assessment.querySelector(selector);
				list.innerHTML = '';
				items.forEach(function (item) { var li = document.createElement('li'); li.textContent = item; list.appendChild(li); });
			}
			fillList('[data-assessment-blindspots]', blindSpots);
			fillList('[data-assessment-recommendations]', recommendations);
			assessmentProgressWrap.hidden = true;
			assessmentShowView('result');
		}
		function openAssessment() {
			assessmentState.lastFocus = document.activeElement;
			assessment.classList.add('is-open');
			assessment.setAttribute('aria-hidden', 'false');
			document.body.classList.add('assessment-open');
			assessmentState.index = 0;
			assessmentState.answers = [];
			assessmentProgressWrap.hidden = true;
			assessmentShowView('intro');
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
		assessment.querySelector('[data-assessment-start]').addEventListener('click', function () { renderAssessmentQuestion(); });
		assessmentBack.addEventListener('click', function () { if (assessmentState.index > 0) { assessmentState.index -= 1; renderAssessmentQuestion(); } });
		assessmentNext.addEventListener('click', function () {
			if (typeof assessmentState.answers[assessmentState.index] !== 'number') return;
			if (assessmentState.index < assessmentQuestions.length - 1) { assessmentState.index += 1; renderAssessmentQuestion(); } else { renderAssessmentResult(); }
		});
		assessment.querySelector('[data-assessment-restart]').addEventListener('click', function () { assessmentState.index = 0; assessmentState.answers = []; assessmentShowView('intro'); });
		var assessmentBillingLink = assessment.querySelector('[data-updateproof-open-billing]');
		if (assessmentBillingLink) assessmentBillingLink.addEventListener('click', function () { closeAssessment(); });
		document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && assessment.classList.contains('is-open')) closeAssessment(); });
	}
}());



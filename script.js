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
			billingMessage.appendChild(document.createElement('br'));
			billingMessage.appendChild(document.createTextNode('Next: install UpdateProof Pro, open UpdateProof Pro in WordPress, and paste this key.'));
			billingMessage.appendChild(document.createElement('br'));
			billingMessage.appendChild(document.createTextNode(license.email_sent ? 'A copy was also sent to your email.' : 'If the email does not arrive, use the saved key above.'));
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
}());


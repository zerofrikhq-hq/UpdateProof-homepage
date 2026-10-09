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

		billingForm.addEventListener('submit', function (event) {
			event.preventDefault();
			var email = billingForm.querySelector('[name="email"]').value.trim();
			var plan = billingForm.querySelector('[name="plan"]').value;
			if (!apiBase || !window.Razorpay) {
				billingMessage.textContent = 'Secure checkout is not configured yet. Please contact UpdateProof support.';
				return;
			}
			paymentButton.disabled = true;
			billingMessage.textContent = 'Preparing secure payment…';
			fetch(apiBase + '/api/razorpay/subscription', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ plan: plan, email: email })
			}).then(function (response) {
				return response.json().then(function (data) {
					if (!response.ok || !data.success) {
						throw new Error(data.message || 'The annual subscription could not be created.');
					}
					return data;
				});
			}).then(function (order) {
				billingMessage.textContent = 'Opening secure payment…';
				var checkout = new window.Razorpay({
					key: order.key_id,
					name: 'UpdateProof',
					description: order.plan + ' annual subscription',
					subscription_id: order.subscription_id,
					prefill: { email: order.email },
					theme: { color: '#173763' },
					handler: function (payment) {
						billingMessage.textContent = 'Payment received. Verifying your license…';
						fetch(apiBase + '/api/razorpay/verify', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify(payment)
						}).then(function (response) {
							return response.json().then(function (data) {
								if (!response.ok || !data.success) {
									throw new Error(data.message || 'Payment verification failed.');
								}
								return data;
							});
						}).then(function (license) {
							billingMessage.textContent = 'Payment verified. Save this license key: ' + license.license_key;
							paymentButton.disabled = false;
						}).catch(function (error) {
							billingMessage.textContent = error.message;
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
				billingMessage.textContent = error.message;
				paymentButton.disabled = false;
			});
		});
	}
}());

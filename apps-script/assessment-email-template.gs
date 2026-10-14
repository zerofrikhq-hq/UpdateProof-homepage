/*
 * Paste this function into the Apps Script project that sends the Resend email.
 * It replaces the old short report template. The existing sendAssessmentEmail
 * function can keep using the returned subject, html, and text values.
 */

function assessmentEmailEscape(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function assessmentEmailGuidance() {
  return [
    {
      question: 'Do you capture a safety snapshot before updates?',
      answers: {
        'Every time': ['You have a dependable baseline before maintenance begins.', 'Keep the snapshot lightweight and label it with the update date so it remains easy to compare later.'],
        'Sometimes': ['You have the right idea, but the protection depends on the situation.', 'Make the snapshot a standard step before every meaningful update, especially when several plugins or themes change together.'],
        'Not yet': ['Updates are starting without a recorded baseline, which makes unexpected changes harder to explain or reverse.', 'Capture a restore point and note the important page states before applying maintenance.']
      }
    },
    {
      question: 'How do you check important pages after an update?',
      answers: {
        'A defined page list': ['You already have a repeatable way to cover the pages that matter most.', 'Keep the list focused on high-value templates and review it whenever the site structure or business priorities change.'],
        'A quick visual look': ['You are checking the site, but the coverage can vary from one update to the next.', 'Create a short list of critical URLs so the same pages are checked consistently after maintenance.'],
        'Only the homepage': ['A homepage check can miss problems on landing pages, posts, account areas, or conversion paths.', 'Add the most important visitor and customer journeys to a repeatable post-update check.']
      }
    },
    {
      question: 'Can you review what will change before it is applied?',
      answers: {
        'Yes, with an approval step': ['You have a deliberate decision point before maintenance is applied.', 'Record the approved update set and the reason for proceeding so the decision is easy to revisit.'],
        'I review it in the dashboard': ['You inspect available changes, but there is not yet a durable approval record.', 'Add a simple approval note covering what will change, when it will happen, and who agreed to it.'],
        'No review step': ['Changes are being applied without a clear risk review beforehand.', 'Introduce a quick pre-update review to identify high-risk plugins, themes, integrations, and timing constraints.']
      }
    },
    {
      question: 'Do you compare before-and-after screenshots?',
      answers: {
        'Yes, automatically': ['You have a strong way to catch visual regressions that status checks can miss.', 'Keep your baseline pages representative and review meaningful differences before marking maintenance complete.'],
        'Sometimes manually': ['You can catch visual changes, but the method may be inconsistent or difficult to repeat.', 'Choose a small set of important pages and compare them on every meaningful update.'],
        'No': ['A layout, styling, or content regression could go unnoticed even when pages technically load.', 'Start with before-and-after screenshots for the homepage and the most valuable page or workflow.']
      }
    },
    {
      question: 'Do you test workflows, not only page rendering?',
      answers: {
        'I test critical workflows': ['You are checking whether visitors can complete important actions, not just whether pages render.', 'Document the exact steps for each workflow so another person can repeat the same checks.'],
        'I test them occasionally': ['You test workflows when risk is obvious, but smaller failures can still slip through between reviews.', 'Make forms, login, search, checkout, or other key actions part of the standard maintenance checklist.'],
        'Not currently': ['A site can look healthy while forms, login, search, or checkout are failing underneath.', 'Choose the one or two workflows that matter most and test them after every important update.']
      }
    },
    {
      question: 'Can you show what happened after maintenance?',
      answers: {
        'Yes, with saved reports': ['You can preserve useful evidence about the update and its outcome.', 'Keep reports tied to the update date and decision so they remain easy to share with clients or stakeholders.'],
        'Partly': ['You have some history, but the evidence may be spread across notes, logs, or messages.', 'Bring the key result, timing, changed items, and follow-up action into one simple record.'],
        'No': ['Without a consistent record, troubleshooting and client communication take longer than they should.', 'Save a short before-and-after record for every important maintenance event.']
      }
    },
    {
      question: 'Would you know quickly if a site regressed later?',
      answers: {
        'Yes, through repeatable checks': ['You have an ongoing signal after maintenance, not just a one-time confirmation.', 'Review the monitoring coverage periodically so it still reflects the site’s most important paths.'],
        'Only if someone reports it': ['There is a gap between completing maintenance and learning that something broke later.', 'Add lightweight recurring checks for key pages and workflows so issues surface earlier.'],
        'I would not know quickly': ['A later regression could remain invisible until a visitor or client finds it.', 'Begin with a small scheduled check for the homepage, critical landing pages, and one key workflow.']
      }
    }
  ];
}

function buildAssessmentEmail(params) {
  var score = String(params.score || '0');
  var resultBand = String(params.result_band || 'Readiness result');
  var recipient = String(params.recipient_email || '');
  var guidance = assessmentEmailGuidance();
  var rows = [];
  var textRows = [];

  guidance.forEach(function (item, index) {
    var answer = String(params['q' + (index + 1) + '_answer'] || 'Not answered');
    var explanation = item.answers[answer] || ['Your answer has been recorded for this area.', 'Review this part of your maintenance process and define one small, repeatable improvement.'];
    rows.push(
      '<tr>' +
        '<td style="padding:20px 0;border-top:1px solid #eaecf0;vertical-align:top;width:34%;">' +
          '<div style="font-size:12px;color:#667085;line-height:1.5;">Question ' + (index + 1) + '</div>' +
          '<div style="font-size:15px;font-weight:700;line-height:1.45;color:#101828;margin-top:4px;">' + assessmentEmailEscape(item.question) + '</div>' +
        '</td>' +
        '<td style="padding:20px 0 20px 22px;border-top:1px solid #eaecf0;vertical-align:top;">' +
          '<div style="display:inline-block;background:#eef4ff;color:#175cd3;border-radius:999px;padding:5px 9px;font-size:12px;font-weight:700;">Your answer: ' + assessmentEmailEscape(answer) + '</div>' +
          '<div style="font-size:13px;font-weight:700;line-height:1.5;color:#101828;margin-top:13px;">What this tells you</div>' +
          '<div style="font-size:13px;line-height:1.6;color:#475467;margin-top:3px;">' + assessmentEmailEscape(explanation[0]) + '</div>' +
          '<div style="font-size:13px;font-weight:700;line-height:1.5;color:#101828;margin-top:11px;">Suggested improvement</div>' +
          '<div style="font-size:13px;line-height:1.6;color:#475467;margin-top:3px;">' + assessmentEmailEscape(explanation[1]) + '</div>' +
        '</td>' +
      '</tr>'
    );
    textRows.push('Question ' + (index + 1) + ': ' + item.question + '\nYour answer: ' + answer + '\nWhat this tells you: ' + explanation[0] + '\nSuggested improvement: ' + explanation[1]);
  });

  var feedback = String(params.feedback || '').trim();
  var feedbackHtml = feedback
    ? '<div style="margin-top:28px;padding:18px 20px;background:#f8fafc;border:1px solid #eaecf0;border-radius:12px;"><div style="font-size:12px;font-weight:700;color:#175cd3;text-transform:uppercase;letter-spacing:.08em;">Your feedback</div><div style="font-size:14px;line-height:1.6;color:#475467;margin-top:8px;">' + assessmentEmailEscape(feedback) + '</div></div>'
    : '';
  var feedbackText = feedback ? '\n\nYour feedback:\n' + feedback : '';
  var subject = 'Your WordPress Maintenance Readiness Report — ' + score + '/14';
  var text = 'Your WordPress Maintenance Readiness Report\n\nResult: ' + resultBand + '\nScore: ' + score + '/14\n\nHere is a practical explanation of every answer:\n\n' + textRows.join('\n\n') + feedbackText + '\n\nUse this report as a checklist for your next maintenance cycle.\n\nMade by Zerofrik: https://zerofrik.com';
  var html = '<!doctype html><html><body style="margin:0;background:#f2f4f7;font-family:Arial,Helvetica,sans-serif;color:#101828;">' +
    '<div style="padding:32px 16px;"><table role="presentation" style="max-width:720px;width:100%;margin:0 auto;background:#ffffff;border:1px solid #eaecf0;border-radius:16px;padding:32px;" cellpadding="0" cellspacing="0"><tr><td>' +
    '<div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#175cd3;">WordPress Maintenance Readiness</div>' +
    '<h1 style="font-size:28px;line-height:1.2;margin:12px 0 8px;color:#101828;">Your personalized readiness report</h1>' +
    '<p style="font-size:15px;line-height:1.6;color:#475467;margin:0;">Here is what your answers mean and the practical improvement to consider for each area.</p>' +
    '<div style="margin:24px 0;padding:20px;background:#eef4ff;border:1px solid #c7d7fe;border-radius:12px;"><div style="font-size:12px;color:#475467;">Overall result</div><div style="font-size:22px;font-weight:700;color:#175cd3;margin-top:4px;">' + assessmentEmailEscape(resultBand) + '</div><div style="font-size:32px;font-weight:700;color:#101828;margin-top:6px;">' + assessmentEmailEscape(score) + '<span style="font-size:15px;color:#667085;"> / 14</span></div></div>' +
    '<h2 style="font-size:20px;line-height:1.3;margin:28px 0 4px;color:#101828;">Your answer-by-answer guidance</h2>' +
    '<p style="font-size:13px;line-height:1.6;color:#667085;margin:0 0 4px;">Use these suggestions to choose one improvement for your next maintenance cycle.</p>' +
    '<table role="presentation" style="width:100%;border-collapse:collapse;margin-top:4px;" cellpadding="0" cellspacing="0">' + rows.join('') + '</table>' +
    feedbackHtml +
    '<p style="font-size:13px;line-height:1.6;color:#667085;margin:30px 0 0;padding-top:18px;border-top:1px solid #eaecf0;">Keep this report as a baseline. Revisit the assessment after you improve one part of your process and compare what changes.</p>' +
    '<p style="font-size:12px;line-height:1.5;color:#98a2b3;margin:24px 0 0;text-align:center;">Made by <a href="https://zerofrik.com" style="color:#667085;font-weight:700;text-decoration:none;">Zerofrik</a></p>' +
    '</td></tr></table></div></body></html>';

  return { subject: subject, html: html, text: text };
}

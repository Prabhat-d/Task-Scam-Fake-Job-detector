/**
 * Turns a scan result into a plain list of reasons for the verdict:
 *  - against: why it looks fake (every red flag + a few extra checks)
 *  - for:     why it looks safe (verified company, official email, old website, no money asked …)
 *  - unknown: what could not be checked
 * Used by the "Why this verdict" section on the result page and by the PDF report.
 */
const L = (en, hi, pa) => ({ en, hi, pa });

/** Red flags that mean "they want money from you". */
const MONEY_FLAGS = ['pay_to_work', 'verification_fee', 'prepaid_task', 'frozen', 'exit_fee'];

export function buildReasons(scan) {
  const against = [];
  const pro = [];
  const unknown = [];
  const flags = scan?.redFlags || [];
  const company = scan?.company || {};
  const domain = scan?.domain || {};
  const entities = scan?.entities || [];
  const flagIds = new Set(flags.map((f) => f.id));

  flags.forEach((f) =>
    against.push({ id: f.id, severity: f.severity, title: f.title, detail: f.explanation, evidence: f.evidence || '' })
  );

  // Extra signals that are not separate red flags in the analyser.
  const upis = entities.filter((e) => e.type === 'upi');
  if (upis.length && scan.verdict !== 'genuine') {
    against.push({
      id: 'upi_present',
      severity: 'high',
      title: L('Asks for payment to a personal UPI ID', 'निजी UPI ID पर पेमेंट मांगा गया', 'ਨਿੱਜੀ UPI ID \'ਤੇ ਪੇਮੈਂਟ ਮੰਗੀ ਗਈ'),
      detail: L(
        'Real employers never collect money through a personal UPI ID.',
        'असली कंपनियाँ कभी निजी UPI ID से पैसे नहीं लेतीं।',
        'ਅਸਲ ਕੰਪਨੀਆਂ ਕਦੇ ਨਿੱਜੀ UPI ID ਰਾਹੀਂ ਪੈਸੇ ਨਹੀਂ ਲੈਂਦੀਆਂ।'
      ),
      evidence: upis.map((e) => e.value).join(', '),
    });
  }
  const tg = entities.filter((e) => e.type === 'telegram');
  if (tg.length && !flagIds.has('private_group') && scan.verdict !== 'genuine') {
    against.push({
      id: 'telegram_contact',
      severity: 'medium',
      title: L('Moves the conversation to Telegram', 'बातचीत टेलीग्राम पर ले जाई जा रही है', 'ਗੱਲਬਾਤ ਟੈਲੀਗ੍ਰਾਮ \'ਤੇ ਲਿਜਾਈ ਜਾ ਰਹੀ ਹੈ'),
      detail: L(
        'Companies hire through official portals and email, not Telegram handles.',
        'कंपनियाँ ऑफिशियल पोर्टल और ईमेल से भर्ती करती हैं, टेलीग्राम से नहीं।',
        'ਕੰਪਨੀਆਂ ਅਧਿਕਾਰਤ ਪੋਰਟਲ ਤੇ ਈਮੇਲ ਰਾਹੀਂ ਭਰਤੀ ਕਰਦੀਆਂ ਹਨ, ਟੈਲੀਗ੍ਰਾਮ ਰਾਹੀਂ ਨਹੀਂ।'
      ),
      evidence: tg.map((e) => e.value).join(', '),
    });
  }

  // Reassuring signs.
  if (company.status === 'active' && company.cin) {
    pro.push({
      id: 'mca_active',
      title: company.nameMatch
        ? L('Company is registered and active (MCA verified)', 'कंपनी रजिस्टर्ड और सक्रिय है (MCA से जाँची गई)', 'ਕੰਪਨੀ ਰਜਿਸਟਰਡ ਤੇ ਸਰਗਰਮ ਹੈ (MCA ਤੋਂ ਜਾਂਚੀ)')
        : L('A real company with a similar name exists', 'मिलते-जुलते नाम की असली कंपनी मौजूद है', 'ਮਿਲਦੇ-ਜੁਲਦੇ ਨਾਂ ਦੀ ਅਸਲ ਕੰਪਨੀ ਮੌਜੂਦ ਹੈ'),
      detail: company.nameMatch
        ? L(
            'The name matches an active company in the Ministry of Corporate Affairs registry.',
            'नाम कॉर्पोरेट मामलों के मंत्रालय के रिकॉर्ड में एक सक्रिय कंपनी से मेल खाता है।',
            'ਨਾਂ ਕਾਰਪੋਰੇਟ ਮਾਮਲਿਆਂ ਦੇ ਮੰਤਰਾਲੇ ਦੇ ਰਿਕਾਰਡ ਵਿੱਚ ਇੱਕ ਸਰਗਰਮ ਕੰਪਨੀ ਨਾਲ ਮੇਲ ਖਾਂਦਾ ਹੈ।'
          )
        : L(
            'But the message does not use its exact registered name, so it may be impersonation.',
            'पर मैसेज में उसका सही रजिस्टर्ड नाम नहीं है, यह नकल हो सकती है।',
            'ਪਰ ਮੈਸੇਜ ਵਿੱਚ ਉਸਦਾ ਸਹੀ ਰਜਿਸਟਰਡ ਨਾਂ ਨਹੀਂ ਹੈ, ਇਹ ਨਕਲ ਹੋ ਸਕਦੀ ਹੈ।'
          ),
      evidence: `${company.name} · CIN ${company.cin}`,
    });
  }
  if (domain.emailType === 'corporate' && domain.matchesOfficial) {
    pro.push({
      id: 'official_email',
      title: L('HR email is from the official company domain', 'HR ईमेल कंपनी के ऑफिशियल डोमेन से है', 'HR ਈਮੇਲ ਕੰਪਨੀ ਦੇ ਅਧਿਕਾਰਤ ਡੋਮੇਨ ਤੋਂ ਹੈ'),
      detail: L('The sender address matches the company\'s own website.', 'भेजने वाले का पता कंपनी की अपनी वेबसाइट से मेल खाता है।', 'ਭੇਜਣ ਵਾਲੇ ਦਾ ਪਤਾ ਕੰਪਨੀ ਦੀ ਆਪਣੀ ਵੈੱਬਸਾਈਟ ਨਾਲ ਮੇਲ ਖਾਂਦਾ ਹੈ।'),
      evidence: domain.hrEmail || domain.domain || '',
    });
  } else if (domain.emailType === 'corporate' && !flagIds.has('free_mail')) {
    pro.push({
      id: 'corporate_email',
      title: L('HR uses a company email, not Gmail', 'HR कंपनी ईमेल इस्तेमाल करता है, Gmail नहीं', 'HR ਕੰਪਨੀ ਈਮੇਲ ਵਰਤਦਾ ਹੈ, Gmail ਨਹੀਂ'),
      detail: L('Still confirm the domain belongs to the company.', 'फिर भी पक्का करें कि डोमेन उसी कंपनी का है।', 'ਫਿਰ ਵੀ ਪੱਕਾ ਕਰੋ ਕਿ ਡੋਮੇਨ ਉਸੇ ਕੰਪਨੀ ਦਾ ਹੈ।'),
      evidence: domain.hrEmail || '',
    });
  }
  if (domain.domain && domain.ageDays != null && domain.ageDays >= 365) {
    const years = Math.floor(domain.ageDays / 365);
    pro.push({
      id: 'old_domain',
      title: L(`Website is over ${years} year(s) old`, `वेबसाइट ${years} साल से ज़्यादा पुरानी है`, `ਵੈੱਬਸਾਈਟ ${years} ਸਾਲ ਤੋਂ ਵੱਧ ਪੁਰਾਣੀ ਹੈ`),
      detail: L('Scam sites are usually only days or weeks old.', 'ठगी वाली साइटें आमतौर पर कुछ ही दिन पुरानी होती हैं।', 'ਠੱਗੀ ਵਾਲੀਆਂ ਸਾਈਟਾਂ ਆਮ ਤੌਰ \'ਤੇ ਕੁਝ ਹੀ ਦਿਨ ਪੁਰਾਣੀਆਂ ਹੁੰਦੀਆਂ ਹਨ।'),
      evidence: domain.domain,
    });
  }
  if (!flags.some((f) => MONEY_FLAGS.includes(f.id)) && !upis.length) {
    pro.push({
      id: 'no_money',
      title: L('No request for money found', 'पैसे की कोई मांग नहीं मिली', 'ਪੈਸੇ ਦੀ ਕੋਈ ਮੰਗ ਨਹੀਂ ਮਿਲੀ'),
      detail: L('No fees, deposits or payment IDs were found in the message.', 'मैसेज में कोई फीस, डिपॉज़िट या पेमेंट ID नहीं मिली।', 'ਮੈਸੇਜ ਵਿੱਚ ਕੋਈ ਫੀਸ, ਡਿਪਾਜ਼ਿਟ ਜਾਂ ਪੇਮੈਂਟ ID ਨਹੀਂ ਮਿਲੀ।'),
      evidence: '',
    });
  }
  const contactEntities = entities.filter((e) => e.type !== 'amount');
  if (contactEntities.length && !contactEntities.some((e) => e.seenCount > 0)) {
    pro.push({
      id: 'not_reported',
      title: L('Contacts not reported before', 'संपर्क पहले रिपोर्ट नहीं हुए', 'ਸੰਪਰਕ ਪਹਿਲਾਂ ਰਿਪੋਰਟ ਨਹੀਂ ਹੋਏ'),
      detail: L('None of the numbers, IDs or links are in our scam database yet.', 'कोई भी नंबर, ID या लिंक अभी हमारे ठगी डेटाबेस में नहीं है।', 'ਕੋਈ ਵੀ ਨੰਬਰ, ID ਜਾਂ ਲਿੰਕ ਹਾਲੇ ਸਾਡੇ ਠੱਗੀ ਡੇਟਾਬੇਸ ਵਿੱਚ ਨਹੀਂ ਹੈ।'),
      evidence: '',
    });
  }

  // What could not be checked.
  if (company.status === 'not_provided') {
    unknown.push({
      id: 'no_company',
      title: L('Company not checked', 'कंपनी नहीं जाँची गई', 'ਕੰਪਨੀ ਨਹੀਂ ਜਾਂਚੀ ਗਈ'),
      detail: L('No company name was found, so MCA registration could not be verified.', 'कोई कंपनी नाम नहीं मिला, इसलिए MCA रजिस्ट्रेशन नहीं जाँचा जा सका।', 'ਕੋਈ ਕੰਪਨੀ ਨਾਂ ਨਹੀਂ ਮਿਲਿਆ, ਇਸ ਲਈ MCA ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਨਹੀਂ ਜਾਂਚੀ ਜਾ ਸਕੀ।'),
    });
  }
  if (!domain.domain && !domain.hrEmail) {
    unknown.push({
      id: 'no_domain',
      title: L('Website / email not checked', 'वेबसाइट / ईमेल नहीं जाँचे गए', 'ਵੈੱਬਸਾਈਟ / ਈਮੇਲ ਨਹੀਂ ਜਾਂਚੇ ਗਏ'),
      detail: L('No website or HR email was found in the message.', 'मैसेज में कोई वेबसाइट या HR ईमेल नहीं मिला।', 'ਮੈਸੇਜ ਵਿੱਚ ਕੋਈ ਵੈੱਬਸਾਈਟ ਜਾਂ HR ਈਮੇਲ ਨਹੀਂ ਮਿਲੀ।'),
    });
  }

  return { against, for: pro, unknown };
}

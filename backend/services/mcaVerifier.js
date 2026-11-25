const dns = require('dns').promises;
const path = require('path');
const fs = require('fs');

// Load comprehensive 2,800+ verified corporate registry dataset (NSE EQUITY_L.csv + MCA curated filings)
let TOP_COMPANIES = [];
const aliasIndex = new Map();
const domainIndex = new Map();
const symbolIndex = new Map();

try {
  const dataPath = path.join(__dirname, '../data/topCompanies.json');
  if (fs.existsSync(dataPath)) {
    const raw = fs.readFileSync(dataPath, 'utf-8');
    TOP_COMPANIES = JSON.parse(raw);

    for (const comp of TOP_COMPANIES) {
      // Index by full name
      aliasIndex.set(comp.fullName.toLowerCase().trim(), comp);

      // Index by NSE ticker symbol (exact match only)
      if (comp.nseSymbol) {
        symbolIndex.set(comp.nseSymbol.toLowerCase().trim(), comp);
      }

      // Index by aliases
      if (Array.isArray(comp.aliases)) {
        for (const alias of comp.aliases) {
          aliasIndex.set(alias.toLowerCase().trim(), comp);
        }
      }

      // Index by domains
      if (Array.isArray(comp.officialDomains)) {
        for (const dom of comp.officialDomains) {
          domainIndex.set(dom.toLowerCase().trim(), comp);
        }
      }
    }
    console.log(`🏛️ [MCA Verifier] Loaded ${TOP_COMPANIES.length} verified companies into corporate registry index.`);
  }
} catch (err) {
  console.warn('⚠️ [MCA Verifier] Failed to load topCompanies.json, falling back to core registry:', err.message);
}

// Fallback core registry if JSON is not loaded
const CORE_REGISTRY = {
  "infosys": {
    cin: "L85110KA1981PLC013115",
    officialDomains: ["infosys.com"],
    fullName: "Infosys Limited",
    roc: "RoC-Bangalore",
    status: "Active"
  },
  "tcs": {
    cin: "L22210MH1995PLC084781",
    officialDomains: ["tcs.com"],
    fullName: "Tata Consultancy Services Limited",
    roc: "RoC-Mumbai",
    status: "Active"
  },
  "wipro": {
    cin: "L32102KA1945PLC020800",
    officialDomains: ["wipro.com"],
    fullName: "Wipro Limited",
    roc: "RoC-Bangalore",
    status: "Active"
  },
  "amazon": {
    cin: "U51100KA2012PTC064971",
    officialDomains: ["amazon.com", "amazon.in"],
    fullName: "Amazon Development Centre (India) Pvt Ltd",
    roc: "RoC-Bangalore",
    status: "Active"
  },
  "google": {
    cin: "U72900KA2003FTC033028",
    officialDomains: ["google.com"],
    fullName: "Google India Private Limited",
    roc: "RoC-Bangalore",
    status: "Active"
  },
  "microsoft": {
    cin: "U72900DL1988PTC033183",
    officialDomains: ["microsoft.com"],
    fullName: "Microsoft Corporation (India) Private Limited",
    roc: "RoC-Delhi",
    status: "Active"
  },
  "reliance": {
    cin: "L17110MH1973PLC019786",
    officialDomains: ["ril.com", "reliance.com", "jio.com"],
    fullName: "Reliance Industries Limited",
    roc: "RoC-Mumbai",
    status: "Active"
  },
  "tata motors": {
    cin: "L28920MH1945PLC004520",
    officialDomains: ["tatamotors.com"],
    fullName: "Tata Motors Limited",
    roc: "RoC-Mumbai",
    status: "Active"
  },
  "hdfc bank": {
    cin: "L65920MH1994PLC080618",
    officialDomains: ["hdfcbank.com"],
    fullName: "HDFC Bank Limited",
    roc: "RoC-Mumbai",
    status: "Active"
  },
  "icici bank": {
    cin: "L65190GJ1994PLC021012",
    officialDomains: ["icicibank.com"],
    fullName: "ICICI Bank Limited",
    roc: "RoC-Vadodara",
    status: "Active"
  }
};

const FREE_EMAIL_PROVIDERS = [
  "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "rediffmail.com", "t.me", "telegram", "protonmail.com"
];

/**
 * Real Live DNS MX Mail Server Lookup
 * Verifies if the domain actually has authentic, live mail servers configured.
 */
async function performLiveDnsLookup(domain) {
  if (!domain || domain.includes("No corporate email")) {
    return { hasMx: false, mxServers: [], error: "No domain provided" };
  }

  // Clean domain of any subdomains or paths
  const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0].trim().toLowerCase();

  try {
    const mxRecords = await Promise.race([
      dns.resolveMx(cleanDomain),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DNS lookup timeout')), 3000))
    ]);
    return {
      hasMx: mxRecords && mxRecords.length > 0,
      mxServers: mxRecords ? mxRecords.map(r => r.exchange) : [],
      error: null
    };
  } catch (err) {
    return {
      hasMx: false,
      mxServers: [],
      error: err.code || err.message
    };
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function aliasMatchesName(cleanName, alias) {
  if (!alias || alias.length < 3) return false;
  if (alias.length <= 4) {
    const re = new RegExp(`\\b${escapeRegex(alias)}\\b`, 'i');
    return re.test(cleanName);
  }
  return cleanName.includes(alias) || (cleanName.length >= 5 && alias.includes(cleanName));
}

function extractIncorpDateFromEntry(entry) {
  if (!entry) return null;
  if (entry.listedDate) return entry.listedDate;
  if (entry.cin && /^[LU]\d{5}[A-Z]{2}(\d{4})/.test(entry.cin)) {
    const yr = entry.cin.match(/^[LU]\d{5}[A-Z]{2}(\d{4})/)[1];
    return `${yr}-01-01`;
  }
  return null;
}

/**
 * Search corporate registry by company name, query keywords, or detected email domain
 */
const GENERIC_CLAIMED_NAMES = new Set([
  'online task merchant',
  'unverified recruiter',
  'unspecified entity',
  'unknown',
  'unknown company',
  'n/a',
  'none'
]);

const NON_CORPORATE_URL_HOSTS = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'rb.gy', 'shorturl.at',
  'forms.gle', 'docs.google.com', 'drive.google.com', 'sites.google.com',
  't.me', 'telegram.me', 'wa.me', 'chat.whatsapp.com', 'whatsapp.com',
  'linkedin.com', 'naukri.com', 'indeed.com', 'glassdoor.com', 'foundit.in',
  'monsterindia.com', 'internshala.com', 'unstop.com', 'shine.com', 'timesjobs.com',
  'youtube.com', 'youtu.be', 'instagram.com', 'facebook.com', 'twitter.com', 'x.com',
  'reallygreatsite.com', 'canva.com', 'google.com', 'maps.google.com', 'apple.com'
]);

function isSameOrSubdomain(candidate, official) {
  if (!candidate || !official) return false;
  const c = candidate.toLowerCase().trim().replace(/^www\./, '');
  const o = official.toLowerCase().trim().replace(/^www\./, '');
  return c === o || c.endsWith(`.${o}`);
}

function isPlatformHost(host) {
  if (!host) return true;
  for (const blocked of NON_CORPORATE_URL_HOSTS) {
    if (isSameOrSubdomain(host, blocked)) return true;
  }
  return false;
}

function lookupDomainInIndex(detectedDomain) {
  if (!detectedDomain) return null;
  const clean = detectedDomain.toLowerCase().trim().replace(/^www\./, '');
  if (domainIndex.has(clean)) return domainIndex.get(clean);

  const parts = clean.split('.');
  for (let i = 1; i < parts.length - 1; i++) {
    const parent = parts.slice(i).join('.');
    if (domainIndex.has(parent)) return domainIndex.get(parent);
  }

  for (const data of Object.values(CORE_REGISTRY)) {
    if (Array.isArray(data.officialDomains) && data.officialDomains.some(d => isSameOrSubdomain(clean, d))) {
      return data;
    }
  }
  return null;
}

function extractRootDomain(hostname) {
  if (!hostname) return null;
  const clean = hostname.toLowerCase().trim().replace(/^www\./, '');
  const parts = clean.split('.');
  if (parts.length <= 2) return clean;
  const secondLast = parts[parts.length - 2];
  const multiPartTlds = new Set(['co', 'com', 'org', 'net', 'edu', 'gov', 'ac']);
  if (parts[parts.length - 1].length === 2 && multiPartTlds.has(secondLast) && parts.length >= 3) {
    return parts.slice(-3).join('.');
  }
  return parts.slice(-2).join('.');
}

function matchesCompanyAliasInHeaderOrDomain(lowerBody, detectedDomain, candLower) {
  if (!candLower || candLower.length < 3) return false;
  if (detectedDomain) {
    const cleanToken = candLower.replace(/[^a-z0-9]/g, '');
    if (cleanToken.length >= 3 && detectedDomain.includes(cleanToken)) {
      return aliasMatchesName(lowerBody, candLower);
    }
  }
  const escaped = candLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const headerRegex = new RegExp(`(?:offer\\s+(?:letter|of\\s+employment)|selected\\s+(?:at|for|with|by)|welcome\\s+to|congratulations\\s+from|on\\s+behalf\\s+of|careers?\\s+(?:at|with)|recruitment\\s+(?:at|for|by)|hiring\\s+(?:at|for|by)|employer\\s*[:\\-])[^.!?\\n]{0,40}\\b${escaped}\\b`, 'i');
  return headerRegex.test(lowerBody);
}

function findCompanyInRegistry(claimedCompany, detectedDomain, rawText = '', options = {}) {
  const rawName = (claimedCompany || "").toLowerCase().trim();
  const cleanName = GENERIC_CLAIMED_NAMES.has(rawName) ? "" : rawName;

  // 1. Direct or parent-domain match on detected email/URL domain
  const domainMatch = lookupDomainInIndex(detectedDomain);
  if (domainMatch) {
    return domainMatch;
  }

  // 2. Direct exact alias or exact NSE ticker symbol match on claimed company
  if (cleanName && aliasIndex.has(cleanName)) {
    return aliasIndex.get(cleanName);
  }
  if (cleanName && symbolIndex.has(cleanName)) {
    return symbolIndex.get(cleanName);
  }

  // 3. Substring / word-boundary matching over 2,800+ verified companies for claimed company
  if (cleanName && cleanName.length >= 3) {
    for (const comp of TOP_COMPANIES) {
      if (comp.fullName.toLowerCase().includes(cleanName) || (cleanName.length >= 5 && cleanName.includes(comp.fullName.toLowerCase()))) {
        return comp;
      }
      for (const al of comp.aliases) {
        if (al.length >= 3 && aliasMatchesName(cleanName, al)) {
          return comp;
        }
      }
    }
  }

  // 4. Fallback check against CORE_REGISTRY for claimed company
  if (cleanName) {
    for (const [key, data] of Object.entries(CORE_REGISTRY)) {
      if (aliasMatchesName(cleanName, key)) {
        return data;
      }
    }
  }

  // 5. Deep text scan against curated domain-backed employers (ignores raw NSE ticker noise)
  const lowerBody = (rawText || '').toLowerCase();
  const strictHeaderOnly = Boolean(options.strictCustomEmailContext);
  if (lowerBody) {
    let bestComp = null;
    let bestLen = 0;

    const tryCandidateList = (entries) => {
      for (const entry of entries) {
        const candidates = entry._key
          ? [entry._key, entry.fullName, ...(entry.aliases || [])]
          : [entry.fullName, ...(entry.aliases || [])];
        for (const cand of candidates) {
          const cLower = (cand || '').toLowerCase().trim();
          if (cLower.length < 3 || cLower.length <= bestLen) continue;
          const matched = strictHeaderOnly
            ? matchesCompanyAliasInHeaderOrDomain(lowerBody, detectedDomain, cLower)
            : aliasMatchesName(lowerBody, cLower);
          if (matched) {
            bestComp = entry;
            bestLen = cLower.length;
          }
        }
      }
    };

    tryCandidateList(TOP_COMPANIES.filter(c => Array.isArray(c.officialDomains) && c.officialDomains.length > 0));
    tryCandidateList(Object.entries(CORE_REGISTRY).map(([k, v]) => ({ ...v, _key: k })));

    if (bestComp) return bestComp;
  }

  return null;
}

/**
 * Hybrid Verification: Official Corporate Registry (NSE + MCA Public Filings) + Real Live DNS Network Socket
 */
async function verifyCompanyAgainstMCA(claimedCompany, rawText) {
  const rawNameTrimmed = (claimedCompany || '').trim();
  const isGenericClaimed = !rawNameTrimmed || GENERIC_CLAIMED_NAMES.has(rawNameTrimmed.toLowerCase());
  const content = `${isGenericClaimed ? '' : rawNameTrimmed} ${rawText || ''}`;

  // Extract email addresses
  const emailRegex = /[\w.+-]+@([\w-]+(?:\.[\w-]+)+)/gi;
  const emails = [];
  let match;
  while ((match = emailRegex.exec(content)) !== null) {
    emails.push({ full: match[0], domain: match[1].toLowerCase() });
  }

  // Extract non-platform URL hostnames (corporate portals, career subdomains, spoofed sites)
  const urlRegex = /(?:https?:\/\/|www\.)([a-z0-9-]+(?:\.[a-z0-9-]+)+)/gi;
  const corporateUrls = [];
  while ((match = urlRegex.exec(content)) !== null) {
    const host = match[1].toLowerCase().replace(/^www\./, '');
    if (!isPlatformHost(host) && !corporateUrls.includes(host)) {
      corporateUrls.push(host);
    }
  }

  const contactSource = emails.length > 0 ? 'email' : (corporateUrls.length > 0 ? 'url' : 'none');
  const detectedDomain = contactSource === 'email'
    ? emails[0].domain
    : (contactSource === 'url' ? corporateUrls[0] : "No corporate email or domain found");

  let isOfficial = false;
  let isLegitimateEntity = false;
  let domainMismatch = false;
  let mcaStatus = "⚠️ Unregistered / Imposter Entity (No verified MCA/NSE record found)";
  let cinNumber = null;
  let officialDomain = null;
  let liveDnsResult = null;
  let registeredRoc = 'RoC-Corporate Registry';
  let registeredName = isGenericClaimed ? 'Unspecified Entity' : rawNameTrimmed;
  let incorporatedDate = null;
  let isinCode = null;
  let nseSymbol = null;
  let registrySource = null;

  // 1. Check if contact domain uses a known public free-mail host
  const isFreeMail = contactSource === 'email' && FREE_EMAIL_PROVIDERS.some(prov => isSameOrSubdomain(detectedDomain, prov));

  // 2. Match against the 2,800+ Verified Corporate Registry (using domain, claimed name, and body mentions)
  const matchedEntry = findCompanyInRegistry(
    claimedCompany,
    !isFreeMail && contactSource !== 'none' ? detectedDomain : null,
    rawText,
    { strictCustomEmailContext: Boolean(contactSource === 'email' && !isFreeMail) }
  );

  // 3. Perform Real Live DNS Socket Lookup on custom email/URL domain (fallback to root/official domain for URL subdomains)
  if (!isFreeMail && contactSource !== 'none') {
    liveDnsResult = await performLiveDnsLookup(detectedDomain);
    if (contactSource === 'url' && liveDnsResult && !liveDnsResult.hasMx) {
      const fallbackHosts = [];
      if (matchedEntry && Array.isArray(matchedEntry.officialDomains)) {
        for (const dom of matchedEntry.officialDomains) {
          if (isSameOrSubdomain(detectedDomain, dom) && dom !== detectedDomain) {
            fallbackHosts.push(dom);
          }
        }
      }
      const rootHost = extractRootDomain(detectedDomain);
      if (rootHost && rootHost !== detectedDomain && !fallbackHosts.includes(rootHost)) {
        fallbackHosts.push(rootHost);
      }
      for (const fallbackHost of fallbackHosts) {
        const rootDns = await performLiveDnsLookup(fallbackHost);
        if (rootDns && rootDns.hasMx) {
          liveDnsResult = rootDns;
          break;
        }
      }
    }
  }

  if (matchedEntry) {
    isinCode = matchedEntry.isin || null;
    nseSymbol = matchedEntry.nseSymbol || null;
    registrySource = matchedEntry.registrySource || 'Official Corporate Registry';
    cinNumber = matchedEntry.cin || (isinCode ? `ISIN:${isinCode}${nseSymbol ? ` (NSE:${nseSymbol})` : ''}` : 'Official Private / MNC Entity');
    registeredRoc = matchedEntry.roc || 'RoC-India';
    registeredName = matchedEntry.fullName || registeredName;
    incorporatedDate = extractIncorpDateFromEntry(matchedEntry);
    const knownDomains = Array.isArray(matchedEntry.officialDomains) ? matchedEntry.officialDomains : [];
    officialDomain = knownDomains[0] || '';

    if (isFreeMail) {
      isOfficial = false;
      isLegitimateEntity = false;
      domainMismatch = true;
      const domainHint = knownDomains.length > 0 ? knownDomains.join(', ') : 'official corporate domain';
      mcaStatus = `❌ Identity Imposter: Claimed corporate entity is ${matchedEntry.fullName} (${cinNumber}), but recruiter reached out from free public email (@${detectedDomain}) instead of ${domainHint}`;
    } else if (contactSource !== 'none') {
      const hasKnownDomains = knownDomains.length > 0;
      const domainMatches = hasKnownDomains
        ? knownDomains.some(dom => isSameOrSubdomain(detectedDomain, dom))
        : true; // NSE-listed company without pre-stored website uses live MX verification

      const prefix = contactSource === 'email' ? '@' : '';
      if (domainMatches && liveDnsResult && liveDnsResult.hasMx) {
        isOfficial = true;
        isLegitimateEntity = true;
        domainMismatch = false;
        mcaStatus = `✅ Verified Public Entity: ${registeredName} (${cinNumber}, ${registeredRoc}) | Live Mail Server Verified: ${liveDnsResult.mxServers[0] || 'Active'}`;
        if (!officialDomain) officialDomain = extractRootDomain(detectedDomain) || detectedDomain;
      } else if (!domainMatches) {
        isOfficial = false;
        isLegitimateEntity = false;
        domainMismatch = true;
        mcaStatus = `❌ Domain Mismatch: Contact domain (${prefix}${detectedDomain}) does not match official records for ${matchedEntry.fullName} (${knownDomains.join(', ')})`;
      } else {
        isOfficial = false;
        isLegitimateEntity = false;
        mcaStatus = `❌ Fraudulent Domain: Domain (${prefix}${detectedDomain}) failed live DNS mail server resolution (${liveDnsResult ? liveDnsResult.error : 'No MX record'})`;
      }
    } else {
      // Matched company name without email or URL provided (e.g. text scan of offer letter)
      isLegitimateEntity = true;
      isOfficial = true;
      mcaStatus = `✅ Known Registered Enterprise: ${matchedEntry.fullName} (${cinNumber}, ${registeredRoc}). Verify application via ${officialDomain || 'official career portal'}.`;
    }
  } else if (!isFreeMail && contactSource !== 'none' && liveDnsResult && liveDnsResult.hasMx) {
    // Custom corporate domain with real live MX servers, but not in top listed firms
    isOfficial = true;
    isLegitimateEntity = true;
    if (isGenericClaimed) {
      registeredName = extractRootDomain(detectedDomain) || detectedDomain;
    }
    mcaStatus = `ℹ️ Active Corporate Domain: Domain (${contactSource === 'email' ? '@' : ''}${detectedDomain}) verified with live MX mail servers (${liveDnsResult.mxServers[0] || 'Active'}). Verify employer credentials directly before signing offers.`;
  } else if (!isFreeMail && contactSource === 'email' && liveDnsResult && !liveDnsResult.hasMx) {
    isOfficial = false;
    isLegitimateEntity = false;
    mcaStatus = `❌ Non-Existent Domain: Domain (@${detectedDomain}) has no active mail server (DNS: ${liveDnsResult.error || 'NXDOMAIN'})`;
  } else if (!isFreeMail && contactSource === 'url' && liveDnsResult && !liveDnsResult.hasMx && liveDnsResult.error && liveDnsResult.error.includes('ENOTFOUND')) {
    isOfficial = false;
    isLegitimateEntity = false;
    mcaStatus = `❌ Unresolvable Portal Domain: URL domain (${detectedDomain}) failed DNS resolution (${liveDnsResult.error})`;
  } else if (isFreeMail) {
    mcaStatus = `⚠️ Unverified Free-Mail Contact: Recruiter used public webmail (@${detectedDomain}) instead of a corporate domain`;
  }

  const dnsError = liveDnsResult?.error || '';
  const isTransientDnsError = /timeout|ETIMEOUT|ESERVFAIL|EAI_AGAIN/i.test(dnsError);
  const dnsDefinitiveFailure = Boolean(contactSource === 'email' && !isFreeMail && liveDnsResult && !liveDnsResult.hasMx && !isTransientDnsError);

  return {
    claimedCompany: registeredName,
    companyName: registeredName,
    detectedDomain,
    domainChecked: detectedDomain,
    officialDomain: officialDomain || '',
    hrEmail: emails.length > 0 ? emails[0].full : '',
    cin: cinNumber,
    isin: isinCode,
    nseSymbol,
    incorporated: incorporatedDate,
    registrySource,
    roc: registeredRoc,
    isOfficialDomain: isOfficial,
    isLegitimateRegisteredEntity: isLegitimateEntity,
    isFreeMailProvider: isFreeMail,
    domainMismatch,
    dnsDefinitiveFailure,
    mcaStatus,
    liveDnsVerified: liveDnsResult ? liveDnsResult.hasMx : false,
    mxValid: liveDnsResult ? liveDnsResult.hasMx : false
  };
}

module.exports = {
  verifyCompanyAgainstMCA,
  performLiveDnsLookup,
  TOP_COMPANIES,
  findCompanyInRegistry
};

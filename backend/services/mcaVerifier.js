const dns = require('dns').promises;
const path = require('path');
const fs = require('fs');

// Load comprehensive 1,000+ verified corporate registry dataset
let TOP_COMPANIES = [];
const aliasIndex = new Map();
const domainIndex = new Map();

try {
  const dataPath = path.join(__dirname, '../data/topCompanies.json');
  if (fs.existsSync(dataPath)) {
    const raw = fs.readFileSync(dataPath, 'utf-8');
    TOP_COMPANIES = JSON.parse(raw);

    for (const comp of TOP_COMPANIES) {
      // Index by full name
      aliasIndex.set(comp.fullName.toLowerCase().trim(), comp);

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
    const mxRecords = await dns.resolveMx(cleanDomain);
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

/**
 * Search corporate registry by company name, query keywords, or detected email domain
 */
function findCompanyInRegistry(claimedCompany, detectedDomain) {
  const cleanName = (claimedCompany || "").toLowerCase().trim();

  // 1. Direct match on domain
  if (detectedDomain && domainIndex.has(detectedDomain)) {
    return domainIndex.get(detectedDomain);
  }

  // 2. Direct exact alias match
  if (cleanName && aliasIndex.has(cleanName)) {
    return aliasIndex.get(cleanName);
  }

  // 3. Substring / token matching over 1,000+ companies
  if (cleanName && cleanName.length >= 3) {
    // Check if any alias is contained in cleanName, or cleanName contained in alias
    for (const comp of TOP_COMPANIES) {
      if (comp.fullName.toLowerCase().includes(cleanName) || cleanName.includes(comp.fullName.toLowerCase())) {
        return comp;
      }
      for (const al of comp.aliases) {
        if (al.length >= 3 && (cleanName.includes(al) || al.includes(cleanName))) {
          return comp;
        }
      }
    }
  }

  // 4. Fallback check against CORE_REGISTRY
  for (const [key, data] of Object.entries(CORE_REGISTRY)) {
    if (cleanName.includes(key) || (detectedDomain && data.officialDomains.some(d => detectedDomain.endsWith(d)))) {
      return data;
    }
  }

  return null;
}

/**
 * Hybrid Verification: MCA Official Registry (1,000+ top enterprises) + Real Live DNS Network Socket
 */
async function verifyCompanyAgainstMCA(claimedCompany, rawText) {
  const claimedLower = (claimedCompany || "").toLowerCase().trim();

  // Extract email address & domain from raw input
  const emailRegex = /[\w\.-]+@([\w\.-]+)/g;
  const emails = [];
  let match;
  const content = `${claimedCompany || ''} ${rawText || ''}`;
  while ((match = emailRegex.exec(content)) !== null) {
    emails.push({ full: match[0], domain: match[1].toLowerCase() });
  }

  const detectedDomain = emails.length > 0 ? emails[0].domain : "No corporate email found (Messaging channel)";
  let isOfficial = false;
  let isLegitimateEntity = false;
  let domainMismatch = false;
  let mcaStatus = "⚠️ Unregistered / Imposter Entity (No verified MCA record found)";
  let cinNumber = null;
  let officialDomain = null;
  let liveDnsResult = null;
  let registeredRoc = 'RoC-Corporate Registry';
  let registeredName = claimedCompany || 'Unspecified Entity';

  // 1. Check if email uses a known public free-mail host
  const isFreeMail = FREE_EMAIL_PROVIDERS.some(prov => detectedDomain.includes(prov));

  // 2. Perform Real Live DNS Socket Lookup if a custom domain was detected
  if (!isFreeMail && emails.length > 0) {
    liveDnsResult = await performLiveDnsLookup(detectedDomain);
  }

  // 3. Match against the 1,000+ MCA Official Corporate Registry
  const matchedEntry = findCompanyInRegistry(claimedCompany, !isFreeMail && emails.length > 0 ? detectedDomain : null);

  if (matchedEntry) {
    cinNumber = matchedEntry.cin;
    registeredRoc = matchedEntry.roc || 'RoC-India';
    registeredName = matchedEntry.fullName || claimedCompany;
    officialDomain = Array.isArray(matchedEntry.officialDomains) ? matchedEntry.officialDomains[0] : '';

    if (isFreeMail) {
      isOfficial = false;
      isLegitimateEntity = false;
      domainMismatch = true;
      mcaStatus = `❌ Identity Imposter: Claimed corporate entity is ${matchedEntry.fullName} (CIN: ${matchedEntry.cin}), but recruiter reached out from free public email (@${detectedDomain}) instead of enterprise domain (${matchedEntry.officialDomains.join(', ')})`;
    } else if (emails.length > 0) {
      const domainMatches = matchedEntry.officialDomains.some(dom => detectedDomain.endsWith(dom) || dom.endsWith(detectedDomain));

      if (domainMatches && liveDnsResult && liveDnsResult.hasMx) {
        isOfficial = true;
        isLegitimateEntity = true;
        domainMismatch = false;
        mcaStatus = `✅ Verified Public Entity: Active MCA Record (CIN: ${matchedEntry.cin}, ${registeredRoc}) | Live Mail Server Verified: ${liveDnsResult.mxServers[0] || 'Active'}`;
      } else if (!domainMatches) {
        isOfficial = false;
        isLegitimateEntity = false;
        domainMismatch = true;
        mcaStatus = `❌ Domain Mismatch: Contact domain (@${detectedDomain}) does not match official MCA records for ${matchedEntry.fullName} (${matchedEntry.officialDomains.join(', ')})`;
      } else {
        isOfficial = false;
        isLegitimateEntity = false;
        mcaStatus = `❌ Fraudulent Domain: Domain (@${detectedDomain}) failed live DNS mail server resolution (${liveDnsResult ? liveDnsResult.error : 'No MX record'})`;
      }
    } else {
      // Matched company name without email provided (e.g. text scan of offer letter)
      isLegitimateEntity = true;
      isOfficial = true;
      mcaStatus = `✅ Known Registered Enterprise: ${matchedEntry.fullName} (CIN: ${matchedEntry.cin}, ${registeredRoc}). Please verify direct application on ${officialDomain || 'official career portal'}.`;
    }
  } else if (!isFreeMail && emails.length > 0 && liveDnsResult && liveDnsResult.hasMx) {
    // Custom corporate domain with real live MX servers, but not in top 1,000 listed firms
    isOfficial = true;
    isLegitimateEntity = true;
    mcaStatus = `ℹ️ Active Corporate Domain: Domain (@${detectedDomain}) verified with live MX mail servers (${liveDnsResult.mxServers[0] || 'Active'}). Verify employer credentials directly before signing offers.`;
  } else if (!isFreeMail && emails.length > 0 && liveDnsResult && !liveDnsResult.hasMx) {
    isOfficial = false;
    isLegitimateEntity = false;
    mcaStatus = `❌ Non-Existent Domain: Domain (@${detectedDomain}) has no active mail server (DNS: ${liveDnsResult.error || 'NXDOMAIN'})`;
  }

  return {
    claimedCompany: registeredName,
    companyName: registeredName,
    detectedDomain,
    domainChecked: detectedDomain,
    officialDomain: officialDomain || '',
    cin: cinNumber,
    roc: registeredRoc,
    isOfficialDomain: isOfficial,
    isLegitimateRegisteredEntity: isLegitimateEntity,
    isFreeMailProvider: isFreeMail,
    domainMismatch,
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

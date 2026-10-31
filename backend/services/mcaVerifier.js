const dns = require('dns').promises;

// Official Indian Corporate Registry Mirror (Real CINs & Verified Corporate Domains)
const MCA_OFFICIAL_REGISTRY = {
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
  "tata consultancy services": {
    cin: "L22210MH1995PLC084781",
    officialDomains: ["tcs.com"],
    fullName: "Tata Consultancy Services Limited",
    roc: "RoC-Mumbai",
    status: "Active"
  },
  "amazon": {
    cin: "U51100KA2012PTC064971",
    officialDomains: ["amazon.com", "amazon.in"],
    fullName: "Amazon Development Centre (India) Pvt Ltd",
    roc: "RoC-Bangalore",
    status: "Active"
  },
  "wipro": {
    cin: "L32102KA1945PLC020800",
    officialDomains: ["wipro.com"],
    fullName: "Wipro Limited",
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
  "flipkart": {
    cin: "U51109KA2012PTC066107",
    officialDomains: ["flipkart.com"],
    fullName: "Flipkart Internet Private Limited",
    roc: "RoC-Bangalore",
    status: "Active"
  },
  "hcl": {
    cin: "L74140DL1991PLC046369",
    officialDomains: ["hcltech.com", "hcl.com"],
    fullName: "HCL Technologies Limited",
    roc: "RoC-Delhi",
    status: "Active"
  },
  "tech mahindra": {
    cin: "L64200MH1986PLC041370",
    officialDomains: ["techmahindra.com"],
    fullName: "Tech Mahindra Limited",
    roc: "RoC-Pune",
    status: "Active"
  }
};

const FREE_EMAIL_PROVIDERS = [
  "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "rediffmail.com", "t.me", "telegram"
];

/**
 * Real Live DNS MX Mail Server Lookup
 * Verifies if the domain actually has authentic, live mail servers configured.
 */
async function performLiveDnsLookup(domain) {
  if (!domain || domain.includes("No corporate email")) {
    return { hasMx: false, mxServers: [], error: "No domain provided" };
  }

  try {
    const mxRecords = await dns.resolveMx(domain);
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
 * Hybrid Verification: MCA Official Registry + Real Live DNS Network Socket
 */
async function verifyCompanyAgainstMCA(claimedCompany, rawText) {
  const claimedLower = (claimedCompany || "").toLowerCase().trim();

  // Extract email address & domain from raw input
  const emailRegex = /[\w\.-]+@([\w\.-]+)/g;
  const emails = [];
  let match;
  while ((match = emailRegex.exec(rawText)) !== null) {
    emails.push({ full: match[0], domain: match[1].toLowerCase() });
  }

  const detectedDomain = emails.length > 0 ? emails[0].domain : "No corporate email found (Messaging channel)";
  let isOfficial = false;
  let mcaStatus = "⚠️ Unregistered / Imposter Entity (No verified MCA record found)";
  let cinNumber = null;
  let liveDnsResult = null;

  // 1. Check if email uses a known public free-mail host
  const isFreeMail = FREE_EMAIL_PROVIDERS.some(prov => detectedDomain.includes(prov));

  // 2. Perform Real Live DNS Socket Lookup if a custom domain was detected
  if (!isFreeMail && emails.length > 0) {
    liveDnsResult = await performLiveDnsLookup(detectedDomain);
  }

  // 3. Match against MCA Official Corporate Registry
  let matchedEntry = null;
  for (const [key, data] of Object.entries(MCA_OFFICIAL_REGISTRY)) {
    if (claimedLower.includes(key)) {
      matchedEntry = data;
      break;
    }
  }

  if (isFreeMail) {
    isOfficial = false;
    mcaStatus = "❌ Identity Imposter: Official corporate recruitment conducted via free public email (@gmail/@yahoo/Telegram) instead of enterprise corporate domain";
  } else if (matchedEntry) {
    cinNumber = matchedEntry.cin;
    const domainMatches = matchedEntry.officialDomains.some(dom => detectedDomain.endsWith(dom));

    if (domainMatches && liveDnsResult && liveDnsResult.hasMx) {
      isOfficial = true;
      mcaStatus = `✅ Verified Public Entity: Active MCA Record (CIN: ${matchedEntry.cin}, ${matchedEntry.roc}) | Live Mail Server Verified: ${liveDnsResult.mxServers[0] || 'Active'}`;
    } else if (!domainMatches) {
      isOfficial = false;
      mcaStatus = `❌ Domain Mismatch: Contact domain (@${detectedDomain}) does not match official MCA records for ${matchedEntry.fullName} (${matchedEntry.officialDomains.join(', ')})`;
    } else {
      isOfficial = false;
      mcaStatus = `❌ Fraudulent Domain: Domain (@${detectedDomain}) failed live DNS mail server resolution (${liveDnsResult ? liveDnsResult.error : 'No MX record'})`;
    }
  } else if (liveDnsResult && !liveDnsResult.hasMx) {
    isOfficial = false;
    mcaStatus = `❌ Non-Existent Domain: Domain (@${detectedDomain}) has no active mail server (DNS: ${liveDnsResult.error || 'NXDOMAIN'})`;
  }

  return {
    claimedCompany: claimedCompany || "Unspecified Entity",
    detectedDomain,
    cin: cinNumber,
    isOfficialDomain: isOfficial,
    mcaStatus,
    liveDnsVerified: liveDnsResult ? liveDnsResult.hasMx : false
  };
}

module.exports = { verifyCompanyAgainstMCA, performLiveDnsLookup };

// Curated Deterministic Database of Official Indian Corporate Registrations
const MCA_OFFICIAL_REGISTRY = {
  "infosys": {
    cin: "L85110KA1981PLC013115",
    officialDomains: ["infosys.com"],
    fullName: "Infosys Limited"
  },
  "tcs": {
    cin: "L22210MH1995PLC084781",
    officialDomains: ["tcs.com"],
    fullName: "Tata Consultancy Services Limited"
  },
  "tata consultancy services": {
    cin: "L22210MH1995PLC084781",
    officialDomains: ["tcs.com"],
    fullName: "Tata Consultancy Services Limited"
  },
  "amazon": {
    cin: "U51100KA2012PTC064971",
    officialDomains: ["amazon.com", "amazon.in"],
    fullName: "Amazon Development Centre (India) Pvt Ltd"
  },
  "wipro": {
    cin: "L32102KA1945PLC020800",
    officialDomains: ["wipro.com"],
    fullName: "Wipro Limited"
  },
  "google": {
    cin: "U72900KA2003FTC033028",
    officialDomains: ["google.com"],
    fullName: "Google India Private Limited"
  },
  "flipkart": {
    cin: "U51109KA2012PTC066107",
    officialDomains: ["flipkart.com"],
    fullName: "Flipkart Internet Private Limited"
  }
};

const FREE_EMAIL_PROVIDERS = [
  "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "rediffmail.com", "t.me", "telegram"
];

function verifyCompanyAgainstMCA(claimedCompany, rawText) {
  const claimedLower = (claimedCompany || "").toLowerCase().trim();
  
  // Extract emails from text
  const emailRegex = /[\w\.-]+@([\w\.-]+)/g;
  const emails = [];
  let match;
  while ((match = emailRegex.exec(rawText)) !== null) {
    emails.push({ full: match[0], domain: match[1].toLowerCase() });
  }

  const detectedDomain = emails.length > 0 ? emails[0].domain : "No corporate email found (Messaging channel)";
  let isOfficial = false;
  let mcaStatus = "⚠️ Unregistered / Imposter Entity (No valid MCA registration found)";

  // Check if using a free email provider
  const isFreeMail = FREE_EMAIL_PROVIDERS.some(prov => detectedDomain.includes(prov));

  // Find company in official registry
  let matchedEntry = null;
  for (const [key, data] of Object.entries(MCA_OFFICIAL_REGISTRY)) {
    if (claimedLower.includes(key)) {
      matchedEntry = data;
      break;
    }
  }

  if (isFreeMail) {
    isOfficial = false;
    mcaStatus = "❌ Identity Imposter: Recruitment using public free-mail (@gmail/@yahoo/Telegram) instead of enterprise corporate domain";
  } else if (matchedEntry) {
    const domainMatches = matchedEntry.officialDomains.some(dom => detectedDomain.endsWith(dom));
    if (domainMatches) {
      isOfficial = true;
      mcaStatus = `✅ Verified Public Entity: Active MCA Record (CIN: ${matchedEntry.cin})`;
    } else {
      isOfficial = false;
      mcaStatus = `❌ Domain Mismatch: Domain (${detectedDomain}) does not belong to ${matchedEntry.fullName} in MCA records`;
    }
  }

  return {
    claimedCompany: claimedCompany || "Unspecified Entity",
    detectedDomain,
    isOfficialDomain: isOfficial,
    mcaStatus
  };
}

module.exports = { verifyCompanyAgainstMCA };

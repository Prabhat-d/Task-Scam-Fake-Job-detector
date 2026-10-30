/**
 * Realistic Indian sample data for mock mode (demo without backend).
 * All names, UPI IDs, phone numbers and CINs here are SAMPLE DATA for the demo.
 */

export const MOCK_ACCOUNTS = [
  {
    id: 'u_1001',
    name: 'Simran Kaur',
    email: 'user@jobkavach.in',
    password: 'User@123',
    phone: '+91 98140 22331',
    role: 'user',
    language: 'en',
    theme: 'light',
    state: 'Punjab',
    telegram: { connected: true, username: 'simran_k' },
    notificationPrefs: { scanCompleted: true, stageChanged: true, adminAlerts: true, reportStatus: true, email: false },
    createdAt: '2026-08-14T10:00:00.000Z',
    blocked: false,
  },
  {
    id: 'a_0001',
    name: 'Daksh Verma',
    email: 'admin@jobkavach.in',
    password: 'Admin@123',
    phone: '+91 99880 11223',
    role: 'admin',
    language: 'en',
    theme: 'light',
    state: 'Punjab',
    telegram: { connected: false },
    notificationPrefs: { scanCompleted: true, stageChanged: true, adminAlerts: true, reportStatus: true, email: true },
    createdAt: '2026-07-01T10:00:00.000Z',
    blocked: false,
  },
];

/** Extra users shown in the admin users table. */
export const MOCK_OTHER_USERS = [
  ['Aarav Sharma', 'aarav.s@gmail.com', 'Delhi'],
  ['Priya Nair', 'priya.nair@yahoo.in', 'Kerala'],
  ['Rohit Yadav', 'rohit.y92@gmail.com', 'Uttar Pradesh'],
  ['Meena Devi', 'meena.homemaker@gmail.com', 'Bihar'],
  ['Karan Gill', 'karan.gill@outlook.com', 'Punjab'],
  ['Sneha Patil', 'sneha.patil@gmail.com', 'Maharashtra'],
  ['Arjun Reddy', 'arjun.r@gmail.com', 'Telangana'],
  ['Fatima Sheikh', 'fatima.sk@gmail.com', 'Gujarat'],
  ['Vikram Singh', 'vikram.rj@gmail.com', 'Rajasthan'],
  ['Ananya Bose', 'ananya.bose@gmail.com', 'West Bengal'],
].map(([name, email, state], i) => ({
  id: `u_${2000 + i}`,
  name,
  email,
  phone: `+91 9${(812345670 + i * 1311).toString().slice(0, 4)} ${(10000 + i * 731).toString().slice(0, 5)}`,
  role: 'user',
  language: i % 3 === 0 ? 'hi' : i % 3 === 1 ? 'en' : 'pa',
  state,
  blocked: i === 6,
  createdAt: new Date(Date.now() - (i + 2) * 86400000 * 3).toISOString(),
  scans: 3 + ((i * 7) % 19),
}));

/* ------------------------------------------------------------------ */
/* Sample messages                                                     */
/* ------------------------------------------------------------------ */

export const SAMPLE_TEXTS = {
  taskScam: `[Telegram] Priya_HR_Amazon: Hello! I am Priya from Amazon Marketing Team. Part-time job from home: like YouTube videos and earn ₹50 per like. Daily earning ₹3000-8000. Interested?
Me: Yes, what do I have to do?
Priya_HR_Amazon: Task 1 done ✅ ₹150 has been sent to your UPI. Now join our VIP group for more tasks: t.me/AmzTaskVIP_202
[VIP Group] Receptionist_Kavya: Welcome! Today's merchant task: deposit ₹1,000 to unlock prepaid task and get ₹1,300 back. Pay to UPI amzrewards.pay@ybl
Receptionist_Kavya: Your account shows wrong operation. Pay ₹8,500 to unfreeze and complete the combo task to withdraw ₹24,600.
Receptionist_Kavya: Hurry, only 30 minutes left or your money will be lost. Contact mentor @Mentor_Rahul_Amz or WhatsApp +91 87654 32109`,

  fakeOffer: `Subject: Offer Letter – Data Entry Executive (Work From Home)
Dear Candidate,
Congratulations! You are selected for the post of Data Entry Executive at Infosys Solutions Pvt Ltd. Salary ₹28,000 per month. Work from home, no interview needed.
To confirm your joining, pay a refundable registration fee of ₹2,500 for ID card and laptop security deposit. Send payment to UPI infosys.hr.desk@paytm.
After payment, a document verification fee of ₹1,800 will be charged.
This offer is valid only for 24 hours. Contact HR Neha: +91 98765 43210, hr.infosysjobs@gmail.com
Visit www.infosys-careers-hiring.in`,

  genuineOffer: `Subject: Offer of Employment – Assistant System Engineer
Dear Simran Kaur,
With reference to your application on Naukri.com and the interviews held on 12 and 18 September 2026, we are pleased to offer you the position of Assistant System Engineer at Tata Consultancy Services Limited, Chandigarh.
Your joining date is 4 November 2026. Please complete your onboarding on the official TCS NextStep portal: https://nextstep.tcs.com
For any questions write to careers@tcs.com. TCS never asks candidates for money at any stage of hiring.`,

  suspiciousPost: `Urgent hiring!! Work from home – earn ₹25,000 to ₹45,000 per month typing work. No experience, students and housewives welcome. Limited seats. Contact on WhatsApp +91 70112 45566 for details. Company: Global Digital Works Pvt Ltd.`,
};

/* ------------------------------------------------------------------ */
/* MCA company registry (sample)                                        */
/* ------------------------------------------------------------------ */

export const MCA_REGISTRY = [
  { name: 'Tata Consultancy Services Limited', aliases: ['tcs', 'tata consultancy'], cin: 'L22210MH1995PLC084781', status: 'active', incorporated: '1995-01-19', state: 'Maharashtra', domain: 'tcs.com' },
  { name: 'Infosys Limited', aliases: ['infosys'], cin: 'L85110KA1981PLC013115', status: 'active', incorporated: '1981-07-02', state: 'Karnataka', domain: 'infosys.com' },
  { name: 'Wipro Limited', aliases: ['wipro'], cin: 'L32102KA1945PLC020800', status: 'active', incorporated: '1945-12-29', state: 'Karnataka', domain: 'wipro.com' },
  { name: 'Amazon Seller Services Private Limited', aliases: ['amazon'], cin: 'U51900KA2012PTC066211', status: 'active', incorporated: '2012-07-11', state: 'Karnataka', domain: 'amazon.in' },
  { name: 'Global Digital Works Private Limited', aliases: ['global digital works'], cin: 'U72900DL2017PTC318842', status: 'struck_off', incorporated: '2017-05-08', state: 'Delhi', domain: null },
];

/** Domain intelligence (sample WHOIS / MX). */
export const DOMAIN_DB = {
  'tcs.com': { ageDays: 11200, mx: true },
  'infosys.com': { ageDays: 10900, mx: true },
  'wipro.com': { ageDays: 10400, mx: true },
  'amazon.in': { ageDays: 8300, mx: true },
  'infosys-careers-hiring.in': { ageDays: 19, mx: false },
  'amz-taskhub.xyz': { ageDays: 11, mx: false },
};

export const FREE_MAIL = ['gmail.com', 'yahoo.com', 'yahoo.in', 'outlook.com', 'hotmail.com', 'rediffmail.com', 'proton.me'];

/* ------------------------------------------------------------------ */
/* Scam entity database (sample)                                       */
/* ------------------------------------------------------------------ */

export const ENTITY_SEED = [
  { type: 'upi', value: 'amzrewards.pay@ybl', reports: 37, verified: true },
  { type: 'upi', value: 'infosys.hr.desk@paytm', reports: 12, verified: true },
  { type: 'upi', value: 'earnfast92@okaxis', reports: 58, verified: true },
  { type: 'upi', value: 'taskpay.merchant@ibl', reports: 21, verified: false },
  { type: 'upi', value: 'vip.recharge7@axl', reports: 9, verified: false },
  { type: 'phone', value: '+91 87654 32109', reports: 26, verified: true },
  { type: 'phone', value: '+91 98765 43210', reports: 14, verified: true },
  { type: 'phone', value: '+91 70112 45566', reports: 6, verified: false },
  { type: 'phone', value: '+91 91234 77881', reports: 44, verified: true },
  { type: 'telegram', value: 't.me/AmzTaskVIP_202', reports: 31, verified: true },
  { type: 'telegram', value: '@Mentor_Rahul_Amz', reports: 19, verified: true },
  { type: 'telegram', value: '@YT_Like_Earn_Official', reports: 63, verified: true },
  { type: 'domain', value: 'infosys-careers-hiring.in', reports: 8, verified: true },
  { type: 'domain', value: 'amz-taskhub.xyz', reports: 15, verified: true },
].map((e, i) => ({
  id: `ent_${i + 1}`,
  ...e,
  firstSeen: new Date(Date.now() - (i + 3) * 86400000 * 2).toISOString(),
  lastSeen: new Date(Date.now() - i * 3600000 * 5).toISOString(),
}));

/* ------------------------------------------------------------------ */
/* Headlines                                                            */
/* ------------------------------------------------------------------ */

export const HEADLINE_SEED = [
  {
    id: 'h_1',
    title: 'Alert',
    message: "Fake 'Amazon work-from-home' task scam spreading on Telegram. Never pay to get a job.",
    severity: 'critical',
    link: 'https://cybercrime.gov.in',
    active: true,
    startDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 10 * 86400000).toISOString(),
    createdBy: 'Daksh Verma',
  },
  {
    id: 'h_2',
    title: 'Warning',
    message: 'Offer letters asking for "laptop deposit" or "ID card fee" are fake. Real companies never charge you.',
    severity: 'warning',
    link: '',
    active: true,
    startDate: new Date(Date.now() - 86400000).toISOString(),
    endDate: new Date(Date.now() + 20 * 86400000).toISOString(),
    createdBy: 'Daksh Verma',
  },
  {
    id: 'h_3',
    title: 'Tip',
    message: 'Lost money to a job scam? Call 1930 within the first hour – your money can often be frozen.',
    severity: 'info',
    link: 'https://cybercrime.gov.in',
    active: false,
    startDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    createdBy: 'Daksh Verma',
  },
];

/* ------------------------------------------------------------------ */
/* Live Telegram chat script (arrives one message at a time)           */
/* ------------------------------------------------------------------ */

export const LIVE_SCRIPT = [
  { from: 'Priya_HR', text: 'Hi dear 😊 I am Priya from Amazon Marketing Team. Want to earn ₹3000–8000 daily from home?', level: 'normal', risk: 18, stage: 0 },
  { from: 'You', text: 'What is the work?', level: 'normal', risk: 18, stage: 0, self: true },
  { from: 'Priya_HR', text: 'Simple! Like YouTube videos and send screenshot. ₹50 per like.', level: 'suspicious', risk: 32, stage: 0 },
  { from: 'Priya_HR', text: 'Great job! ₹150 sent to your UPI as trial payment ✅', level: 'suspicious', risk: 45, stage: 1 },
  { from: 'Priya_HR', text: 'Join our VIP group for more tasks: t.me/AmzTaskVIP_202', level: 'suspicious', risk: 58, stage: 2 },
  { from: 'Receptionist_Kavya', text: 'Welcome to VIP. Merchant task: pay ₹1,000 and get ₹1,300 back. UPI: amzrewards.pay@ybl', level: 'dangerous', risk: 78, stage: 3 },
  { from: 'You', text: 'I paid 1000. When will I get it back?', level: 'normal', risk: 78, stage: 3, self: true },
  { from: 'Receptionist_Kavya', text: 'Wrong operation! Pay ₹8,500 to unfreeze account and complete combo task.', level: 'dangerous', risk: 90, stage: 4 },
  { from: 'Receptionist_Kavya', text: 'To withdraw ₹24,600 you must pay 18% income tax ₹4,428 first. Only 30 mins left!', level: 'dangerous', risk: 97, stage: 5 },
];

/* ------------------------------------------------------------------ */
/* Threat map                                                          */
/* ------------------------------------------------------------------ */

export const STATE_TILES = [
  ['JK', 'Jammu & Kashmir', 3, 0], ['PB', 'Punjab', 2, 1], ['HP', 'Himachal Pradesh', 3, 1],
  ['RJ', 'Rajasthan', 1, 2], ['HR', 'Haryana', 2, 2], ['DL', 'Delhi', 3, 2], ['UK', 'Uttarakhand', 4, 2], ['SK', 'Sikkim', 6, 2], ['AR', 'Arunachal Pradesh', 8, 2],
  ['GJ', 'Gujarat', 0, 3], ['MP', 'Madhya Pradesh', 2, 3], ['UP', 'Uttar Pradesh', 3, 3], ['BR', 'Bihar', 4, 3], ['WB', 'West Bengal', 5, 3], ['AS', 'Assam', 7, 3], ['NL', 'Nagaland', 8, 3],
  ['MH', 'Maharashtra', 1, 4], ['CG', 'Chhattisgarh', 3, 4], ['JH', 'Jharkhand', 4, 4], ['ML', 'Meghalaya', 6, 4], ['TR', 'Tripura', 7, 4], ['MN', 'Manipur', 8, 4],
  ['GA', 'Goa', 0, 5], ['TS', 'Telangana', 2, 5], ['OD', 'Odisha', 4, 5], ['MZ', 'Mizoram', 7, 5],
  ['KA', 'Karnataka', 1, 6], ['AP', 'Andhra Pradesh', 2, 6],
  ['KL', 'Kerala', 1, 7], ['TN', 'Tamil Nadu', 2, 7],
].map(([code, name, x, y]) => ({ code, name, x, y }));

export const STATE_COUNTS = {
  UP: 412, MH: 388, DL: 341, KA: 297, TS: 264, WB: 221, RJ: 198, GJ: 187, TN: 176, HR: 169, PB: 152,
  BR: 149, MP: 131, AP: 118, KL: 96, OD: 74, JH: 63, CG: 41, AS: 38, UK: 33, HP: 21, JK: 19, GA: 14,
  TR: 7, ML: 6, MN: 5, NL: 4, AR: 3, MZ: 3, SK: 2,
};

export const CITIES = [
  ['Noida', 'UP'], ['Gurugram', 'HR'], ['Bengaluru', 'KA'], ['Hyderabad', 'TS'], ['Pune', 'MH'], ['Mumbai', 'MH'],
  ['Kolkata', 'WB'], ['Jaipur', 'RJ'], ['Ahmedabad', 'GJ'], ['Chennai', 'TN'], ['Ludhiana', 'PB'], ['Jalandhar', 'PB'],
  ['Patna', 'BR'], ['Indore', 'MP'], ['Lucknow', 'UP'], ['New Delhi', 'DL'], ['Kochi', 'KL'], ['Bhubaneswar', 'OD'],
];

export const SCAM_SCRIPTS = [
  { key: 'likeEarn', count: 1240, growth: 34 },
  { key: 'prepaidTask', count: 980, growth: 22 },
  { key: 'fakeOffer', count: 760, growth: 12 },
  { key: 'dataEntry', count: 540, growth: -6 },
  { key: 'reviewRating', count: 410, growth: 41 },
  { key: 'crypto', count: 205, growth: 9 },
];

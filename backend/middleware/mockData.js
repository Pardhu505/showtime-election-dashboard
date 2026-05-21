// Mock data for when MongoDB is not connected
const PARTY_COLORS = {
  'BJP': '#FF6B00', 'INC': '#00A651', 'AAP': '#00BFFF', 'BSP': '#1565C0',
  'SP': '#E53935', 'TMC': '#26A69A', 'CPI(M)': '#C62828', 'NCP': '#F9A825',
  'SS': '#FF8F00', 'JDU': '#00897B', 'TDP': '#FFD600', 'YSRCP': '#6A1B9A',
  'DMK': '#E91E63', 'AIADMK': '#00ACC1', 'Independent': '#757575',
  'RJD': '#1E88E5', 'CPIM': '#B71C1C',
};

const makeCandidate = (name, party, votes, isWinner = false) => ({
  name, party, partyAbbr: party, partyColor: PARTY_COLORS[party] || '#666',
  votes, voteShare: 0, isWinner, gender: 'M', age: 45, criminal_cases: 0,
  margin: 0,
});

const makeConstituency = (no, name, state, candidates, lat, lng, parentPC) => {
  const sorted = [...candidates].sort((a, b) => b.votes - a.votes);
  const totalVotes = sorted.reduce((s, c) => s + c.votes, 0);
  sorted.forEach(c => { c.voteShare = Number(((c.votes / totalVotes) * 100).toFixed(1)); });
  sorted[0].isWinner = true;
  sorted[0].margin = sorted[1] ? sorted[0].votes - sorted[1].votes : sorted[0].votes;
  return {
    constituencyNo: no, constituencyName: name, constituencyType: parentPC ? 'AC' : 'PC',
    parentConstituency: parentPC || '',
    state, totalVoters: Math.round(totalVotes * 1.4),
    totalVotesCast: totalVotes,
    turnout: Number(((totalVotes / (totalVotes * 1.4)) * 100).toFixed(1)),
    latitude: lat, longitude: lng,
    candidates: sorted,
    winner: {
      name: sorted[0].name, party: sorted[0].party,
      partyAbbr: sorted[0].partyAbbr, partyColor: sorted[0].partyColor,
      votes: sorted[0].votes, margin: sorted[0].margin, voteShare: sorted[0].voteShare,
    },
  };
};

const buildPartySummary = (constituencies) => {
  const pMap = {};
  let grandTotal = 0;
  for (const c of constituencies) {
    for (const cand of c.candidates) {
      if (!pMap[cand.party]) pMap[cand.party] = { party: cand.party, partyAbbr: cand.party, partyColor: PARTY_COLORS[cand.party] || '#666', seatsWon: 0, seatsContested: 0, totalVotes: 0, voteShare: 0, leading: 0 };
      pMap[cand.party].seatsContested++;
      pMap[cand.party].totalVotes += cand.votes;
      grandTotal += cand.votes;
      if (cand.isWinner) pMap[cand.party].seatsWon++;
    }
  }
  return Object.values(pMap).map(p => ({ ...p, voteShare: Number(((p.totalVotes / grandTotal) * 100).toFixed(2)) })).sort((a, b) => b.seatsWon - a.seatsWon);
};

// ==================== LOK SABHA 2024 ====================
const ls2024_UP = (() => {
  const cs = [
    makeConstituency(1, 'Saharanpur', 'Uttar Pradesh', [makeCandidate('Imran Masood', 'INC', 612000), makeCandidate('Raghav Lakhanpal', 'BJP', 581000), makeCandidate('Majid Ali', 'BSP', 89000)], 29.97, 77.54),
    makeConstituency(2, 'Kairana', 'Uttar Pradesh', [makeCandidate('Iqra Hasan', 'SP', 634000), makeCandidate('Pradeep Chaudhary', 'BJP', 580000), makeCandidate('Nahid Hasan', 'BSP', 56000)], 29.49, 77.21),
    makeConstituency(3, 'Muzaffarnagar', 'Uttar Pradesh', [makeCandidate('Harendra Singh Malik', 'SP', 598000), makeCandidate('Sanjeev Kumar Balyan', 'BJP', 560000), makeCandidate('Dara Singh Prajapati', 'BSP', 74000)], 29.47, 77.70),
    makeConstituency(4, 'Bijnor', 'Uttar Pradesh', [makeCandidate('Chandra Shekhar', 'SP', 586000), makeCandidate('Dinesh Chandra', 'BJP', 523000), makeCandidate('Sanjay Garg', 'BSP', 93000)], 29.37, 78.14),
    makeConstituency(5, 'Nagina', 'Uttar Pradesh', [makeCandidate('Chandrashekhar Azad', 'Independent', 562000), makeCandidate('Om Kumar', 'BJP', 325000), makeCandidate('Surendra Pal Singh', 'SP', 198000)], 29.44, 78.44),
    makeConstituency(6, 'Moradabad', 'Uttar Pradesh', [makeCandidate('Ruchi Veera', 'SP', 614000), makeCandidate('Sarvesh Kumar', 'BJP', 548000), makeCandidate('Haji Iqbal', 'BSP', 62000)], 28.84, 78.78),
    makeConstituency(7, 'Rampur', 'Uttar Pradesh', [makeCandidate('Maulana Mohibullah', 'SP', 594000), makeCandidate('Ghanshyam Singh Lodhi', 'BJP', 489000), makeCandidate('Ziaur Rahman Barq', 'BSP', 78000)], 28.79, 79.01),
    makeConstituency(8, 'Sambhal', 'Uttar Pradesh', [makeCandidate('Zia Ur Rahman Barq', 'SP', 602000), makeCandidate('Shailendra Agarwal', 'BJP', 524000), makeCandidate('Saleem Khan', 'BSP', 65000)], 28.59, 78.57),
    makeConstituency(9, 'Amroha', 'Uttar Pradesh', [makeCandidate('Danesh Ali', 'SP', 578000), makeCandidate('Kanwar Singh Tanwar', 'BJP', 554000), makeCandidate('Mohd Akbar', 'BSP', 71000)], 28.90, 78.47),
    makeConstituency(10, 'Meerut', 'Uttar Pradesh', [makeCandidate('Sunita Verma', 'BJP', 621000), makeCandidate('Sunita Chauhan', 'RJD', 298000), makeCandidate('Haaji Yunus', 'SP', 289000)], 28.98, 77.71),
    makeConstituency(11, 'Baghpat', 'Uttar Pradesh', [makeCandidate('Rajendra Agarwal', 'BJP', 598000), makeCandidate('Amarpal Sharma', 'RJD', 312000), makeCandidate('Mohan Singh', 'SP', 213000)], 28.94, 77.22),
    makeConstituency(12, 'Ghaziabad', 'Uttar Pradesh', [makeCandidate('Atul Garg', 'BJP', 934000), makeCandidate('Dolly Sharma', 'INC', 389000), makeCandidate('Suresh Bansal', 'BSP', 89000)], 28.66, 77.44),
    makeConstituency(13, 'Gautam Buddha Nagar', 'Uttar Pradesh', [makeCandidate('Mahesh Sharma', 'BJP', 876000), makeCandidate('Mahendra Nagar', 'SP', 389000), makeCandidate('Pankhuri Pathak', 'INC', 78000)], 28.47, 77.50),
    makeConstituency(14, 'Bulandshahr', 'Uttar Pradesh', [makeCandidate('Bhola Singh', 'BJP', 645000), makeCandidate('Praveen Kumar', 'SP', 512000), makeCandidate('Yogesh Dixit', 'BSP', 89000)], 28.41, 77.85),
    makeConstituency(15, 'Aligarh', 'Uttar Pradesh', [makeCandidate('Satish Kumar Gautam', 'BJP', 712000), makeCandidate('Bijendra Singh', 'SP', 498000), makeCandidate('Shyam Sunder', 'BSP', 76000)], 27.89, 78.08),
    makeConstituency(16, 'Hathras', 'Uttar Pradesh', [makeCandidate('Anoop Pradhan', 'BJP', 598000), makeCandidate('Ramji Lal Suman', 'SP', 521000), makeCandidate('Brajesh Pathak', 'BSP', 82000)], 27.60, 78.05),
    makeConstituency(17, 'Mathura', 'Uttar Pradesh', [makeCandidate('Hema Malini', 'BJP', 789000), makeCandidate('Mukesh Dhangar', 'SP', 423000), makeCandidate('Suresh Pachouri', 'INC', 71000)], 27.49, 77.67),
    makeConstituency(18, 'Agra', 'Uttar Pradesh', [makeCandidate('SP Singh Baghel', 'BJP', 723000), makeCandidate('Rajkumar Chahal', 'SP', 512000), makeCandidate('Manish Jain', 'BSP', 89000)], 27.18, 78.01),
    makeConstituency(19, 'Fatehpur Sikri', 'Uttar Pradesh', [makeCandidate('Rajkumar Chahal', 'BJP', 634000), makeCandidate('Ramkumar', 'SP', 567000), makeCandidate('Guru Prasad', 'BSP', 79000)], 27.09, 77.66),
    makeConstituency(20, 'Firozabad', 'Uttar Pradesh', [makeCandidate('Akshay Yadav', 'SP', 658000), makeCandidate('Vishwadeep Singh', 'BJP', 545000), makeCandidate('Mevaram', 'BSP', 88000)], 27.16, 78.39),
    makeConstituency(21, 'Mainpuri', 'Uttar Pradesh', [makeCandidate('Dimple Yadav', 'SP', 789000), makeCandidate('Jaiveer Singh', 'BJP', 487000), makeCandidate('Shiv Prasad', 'BSP', 67000)], 27.23, 79.02),
    makeConstituency(22, 'Etah', 'Uttar Pradesh', [makeCandidate('Devesh Shakya', 'BJP', 612000), makeCandidate('Sanjay Sethiya', 'SP', 534000), makeCandidate('Ramesh Kumar', 'BSP', 89000)], 27.55, 78.66),
    makeConstituency(23, 'Badaun', 'Uttar Pradesh', [makeCandidate('Shivpal Singh Yadav', 'SP', 634000), makeCandidate('Sanghamitra Maurya', 'BJP', 567000), makeCandidate('Surendra Singh', 'BSP', 78000)], 28.04, 79.12),
    makeConstituency(24, 'Aonla', 'Uttar Pradesh', [makeCandidate('Dharmendra Kashyap', 'BJP', 623000), makeCandidate('Vinod Kumar', 'SP', 456000), makeCandidate('Shiv Gopal', 'BSP', 89000)], 28.26, 79.14),
    makeConstituency(25, 'Bareilly', 'Uttar Pradesh', [makeCandidate('Chhatrapal Singh Gangwar', 'BJP', 698000), makeCandidate('Praveen Arya', 'SP', 534000), makeCandidate('Mohd Arif', 'BSP', 91000)], 28.35, 79.43),
    makeConstituency(26, 'Pilibhit', 'Uttar Pradesh', [makeCandidate('Jitin Prasada', 'BJP', 634000), makeCandidate('Bhagwat Saran Gangwar', 'SP', 512000), makeCandidate('Hukum Singh', 'BSP', 67000)], 28.63, 79.80),
    makeConstituency(27, 'Shahjahanpur', 'Uttar Pradesh', [makeCandidate('Arun Kumar Sagar', 'BJP', 598000), makeCandidate('Karan Singh', 'SP', 489000), makeCandidate('Pappu Singh', 'BSP', 78000)], 27.88, 79.91),
    makeConstituency(28, 'Kheri', 'Uttar Pradesh', [makeCandidate('Ajay Kumar Mishra', 'BJP', 712000), makeCandidate('Utkarsh Verma', 'SP', 589000), makeCandidate('Sarvesh Kumar', 'BSP', 89000)], 27.95, 80.79),
    makeConstituency(29, 'Dhaurahra', 'Uttar Pradesh', [makeCandidate('Annu Tandon', 'BJP', 589000), makeCandidate('Sarojini Agarwal', 'SP', 512000), makeCandidate('Ram Manohar', 'BSP', 78000)], 27.57, 80.52),
    makeConstituency(30, 'Sitapur', 'Uttar Pradesh', [makeCandidate('Rajesh Verma', 'BJP', 598000), makeCandidate('Nakul Dubey', 'SP', 534000), makeCandidate('Bhagwan Prasad', 'BSP', 89000)], 27.56, 80.68),
    makeConstituency(31, 'Hardoi', 'Uttar Pradesh', [makeCandidate('Harsh Vardhan Bahuguna', 'BJP', 623000), makeCandidate('Surendra Pal Singh', 'SP', 534000), makeCandidate('Pradeep Singh', 'BSP', 82000)], 27.40, 80.13),
    makeConstituency(32, 'Misrikh', 'Uttar Pradesh', [makeCandidate('Ashok Kumar Rawat', 'BJP', 589000), makeCandidate('Anand Mishra', 'SP', 523000), makeCandidate('Ramkumar', 'BSP', 76000)], 27.18, 80.06),
    makeConstituency(33, 'Unnao', 'Uttar Pradesh', [makeCandidate('Sakshi Maharaj', 'BJP', 634000), makeCandidate('Annu Tandon', 'SP', 567000), makeCandidate('Shiva Shakti', 'BSP', 89000)], 26.55, 80.49),
    makeConstituency(34, 'Mohanlalganj', 'Uttar Pradesh', [makeCandidate('Kaushal Kishore', 'BJP', 612000), makeCandidate('RK Chaudhary', 'SP', 523000), makeCandidate('Pramod Kumar', 'BSP', 83000)], 26.72, 80.97),
    makeConstituency(35, 'Lucknow', 'Uttar Pradesh', [makeCandidate('Rajnath Singh', 'BJP', 712000), makeCandidate('Ravidas Mehrotra', 'SP', 445000), makeCandidate('Pooja Pandey', 'INC', 71000)], 26.85, 80.95),
    makeConstituency(36, 'Rae Bareli', 'Uttar Pradesh', [makeCandidate('Rahul Gandhi', 'INC', 689000), makeCandidate('Dinesh Pratap Singh', 'BJP', 476000), makeCandidate('Thakur Prasad', 'BSP', 67000)], 26.22, 81.24),
    makeConstituency(37, 'Amethi', 'Uttar Pradesh', [makeCandidate('KL Sharma', 'INC', 567000), makeCandidate('Smriti Irani', 'BJP', 532000), makeCandidate('Bhoori Singh', 'BSP', 56000)], 26.15, 81.72),
    makeConstituency(38, 'Sultanpur', 'Uttar Pradesh', [makeCandidate('Maneka Gandhi', 'BJP', 534000), makeCandidate('Ram Bhual Nishad', 'SP', 489000), makeCandidate('Chandra Bhushan', 'BSP', 71000)], 26.26, 82.07),
    makeConstituency(39, 'Pratapgarh', 'Uttar Pradesh', [makeCandidate('Sangam Lal Gupta', 'BJP', 589000), makeCandidate('SP Singh Patel', 'SP', 512000), makeCandidate('Ramkumar', 'BSP', 71000)], 25.89, 81.99),
    makeConstituency(40, 'Farrukhabad', 'Uttar Pradesh', [makeCandidate('Mukesh Rajput', 'BJP', 598000), makeCandidate('Manoj Kumar', 'SP', 523000), makeCandidate('Ramsharan', 'BSP', 78000)], 27.39, 79.58),
    makeConstituency(41, 'Etawah', 'Uttar Pradesh', [makeCandidate('Subhash Chandra Pusikar', 'BJP', 612000), makeCandidate('Amit Kumar', 'SP', 534000), makeCandidate('Ram Khilawan', 'BSP', 82000)], 26.79, 79.01),
    makeConstituency(42, 'Kannauj', 'Uttar Pradesh', [makeCandidate('Akhilesh Yadav', 'SP', 789000), makeCandidate('Subhash Chandra Pusikar', 'BJP', 489000), makeCandidate('Rakesh Kumar', 'BSP', 56000)], 27.06, 79.91),
    makeConstituency(43, 'Kanpur', 'Uttar Pradesh', [makeCandidate('Ramesh Awasthi', 'BJP', 712000), makeCandidate('Alok Kumar Mishra', 'SP', 534000), makeCandidate('Sushil Gupta', 'INC', 68000)], 26.46, 80.35),
    makeConstituency(44, 'Akbarpur', 'Uttar Pradesh', [makeCandidate('Devendra Singh Bhole', 'BJP', 589000), makeCandidate('Rajaram Pal', 'SP', 512000), makeCandidate('Ram Balak', 'BSP', 78000)], 26.42, 79.94),
    makeConstituency(45, 'Jalaun', 'Uttar Pradesh', [makeCandidate('Bhanu Pratap Singh Verma', 'BJP', 623000), makeCandidate('Vikas Sahai', 'SP', 478000), makeCandidate('Manoj Kumar', 'BSP', 82000)], 26.14, 79.36),
    makeConstituency(46, 'Jhansi', 'Uttar Pradesh', [makeCandidate('Anurag Sharma', 'BJP', 634000), makeCandidate('Shiv Govind', 'SP', 489000), makeCandidate('Prem Singh', 'BSP', 78000)], 25.45, 78.57),
    makeConstituency(47, 'Hamirpur', 'Uttar Pradesh', [makeCandidate('Pushpendra Singh Chandel', 'BJP', 598000), makeCandidate('Vinod Katare', 'SP', 456000), makeCandidate('Rajendra Pal', 'BSP', 71000)], 25.94, 80.14),
    makeConstituency(48, 'Banda', 'Uttar Pradesh', [makeCandidate('RK Singh Patel', 'BJP', 567000), makeCandidate('Krishna Pal Singh', 'SP', 489000), makeCandidate('Kamla Singh', 'BSP', 67000)], 25.48, 80.34),
    makeConstituency(49, 'Fatehpur', 'Uttar Pradesh', [makeCandidate('Sadhna Singh', 'BJP', 589000), makeCandidate('Pushpendra Nath Saroj', 'SP', 523000), makeCandidate('Arjun Lal', 'BSP', 71000)], 25.93, 80.81),
    makeConstituency(50, 'Kaushambi', 'Uttar Pradesh', [makeCandidate('Vinod Kumar Sonkar', 'BJP', 578000), makeCandidate('Pradeep Kumar Sonkar', 'SP', 512000), makeCandidate('Shyam Lal', 'BSP', 67000)], 25.55, 81.37),
    makeConstituency(51, 'Allahabad', 'Uttar Pradesh', [makeCandidate('Neeraj Tripathi', 'BJP', 634000), makeCandidate('Ujjwal Raman Singh', 'SP', 534000), makeCandidate('Reoti Raman Singh', 'BSP', 78000)], 25.45, 81.84),
    makeConstituency(52, 'Phulpur', 'Uttar Pradesh', [makeCandidate('Praveen Patel', 'BJP', 612000), makeCandidate('Amarnath Maurya', 'SP', 567000), makeCandidate('Devendra Kumar', 'BSP', 76000)], 25.54, 81.58),
    makeConstituency(53, 'Ambedkar Nagar', 'Uttar Pradesh', [makeCandidate('Lallu Singh', 'BJP', 578000), makeCandidate('Ritesh Pandey', 'SP', 545000), makeCandidate('Hari Prasad', 'BSP', 71000)], 26.47, 82.60),
    makeConstituency(54, 'Shravasti', 'Uttar Pradesh', [makeCandidate('Siddharth Nath Singh', 'BJP', 545000), makeCandidate('Ram Shiromani', 'SP', 489000), makeCandidate('Bhagwan Das', 'BSP', 67000)], 27.40, 81.84),
    makeConstituency(55, 'Domariyaganj', 'Uttar Pradesh', [makeCandidate('Jagdambika Pal', 'BJP', 567000), makeCandidate('Manoj Kumar Pandey', 'SP', 512000), makeCandidate('Rajesh Kumar', 'BSP', 71000)], 27.21, 82.76),
    makeConstituency(56, 'Basti', 'Uttar Pradesh', [makeCandidate('Harish Dwivedi', 'BJP', 589000), makeCandidate('Ram Prasad Chaudhary', 'SP', 489000), makeCandidate('Suresh Kumar', 'BSP', 67000)], 26.80, 82.74),
    makeConstituency(57, 'Sant Kabir Nagar', 'Uttar Pradesh', [makeCandidate('Praveen Kumar Nishad', 'BJP', 567000), makeCandidate('Lalai Bhai', 'SP', 489000), makeCandidate('Raj Bahadur', 'BSP', 67000)], 27.09, 83.01),
    makeConstituency(58, 'Maharajganj', 'Uttar Pradesh', [makeCandidate('Pankaj Choudhary', 'BJP', 598000), makeCandidate('Virendra Chaudhary', 'SP', 489000), makeCandidate('Raj Kumar', 'BSP', 71000)], 27.13, 83.56),
    makeConstituency(59, 'Gorakhpur', 'Uttar Pradesh', [makeCandidate('Ravi Kishan', 'BJP', 712000), makeCandidate('Kajal Nishad', 'SP', 534000), makeCandidate('Shyam Lal', 'BSP', 67000)], 26.76, 83.37),
    makeConstituency(60, 'Kushinagar', 'Uttar Pradesh', [makeCandidate('Vijay Kumar Dubey', 'BJP', 589000), makeCandidate('Bimal Srivastava', 'SP', 512000), makeCandidate('Raj Mani', 'BSP', 71000)], 26.74, 83.89),
    makeConstituency(61, 'Deoria', 'Uttar Pradesh', [makeCandidate('Akhilesh Singh', 'BJP', 612000), makeCandidate('Shashank Mani Tripathi', 'SP', 534000), makeCandidate('Vikas Mishra', 'BSP', 71000)], 26.50, 83.78),
    makeConstituency(62, 'Bansgaon', 'Uttar Pradesh', [makeCandidate('Kamlesh Paswan', 'BJP', 578000), makeCandidate('Sadal Prasad', 'SP', 489000), makeCandidate('Beli Ram', 'BSP', 67000)], 26.55, 83.36),
    makeConstituency(63, 'Lalganj', 'Uttar Pradesh', [makeCandidate('Neelam Sonkar', 'BJP', 556000), makeCandidate('Daroga Saroj', 'SP', 489000), makeCandidate('Mahadev Yadav', 'BSP', 67000)], 25.72, 82.99),
    makeConstituency(64, 'Azamgarh', 'Uttar Pradesh', [makeCandidate('Dharmendra Yadav', 'SP', 634000), makeCandidate('Dinesh Lal Yadav', 'BJP', 512000), makeCandidate('Shah Alam', 'BSP', 71000)], 26.07, 83.18),
    makeConstituency(65, 'Ghosi', 'Uttar Pradesh', [makeCandidate('Arvind Rajbhar', 'BJP', 578000), makeCandidate('Ripu Sagar', 'SP', 534000), makeCandidate('Anand Kumar', 'BSP', 67000)], 26.07, 83.55),
    makeConstituency(66, 'Salempur', 'Uttar Pradesh', [makeCandidate('Ravindra Kushwaha', 'BJP', 589000), makeCandidate('Papu Mishra', 'SP', 512000), makeCandidate('Dinesh Kumar', 'BSP', 67000)], 26.29, 83.88),
    makeConstituency(67, 'Ballia', 'Uttar Pradesh', [makeCandidate('Neeraj Shekhar', 'BJP', 612000), makeCandidate('Sanaullah Khan', 'SP', 489000), makeCandidate('Ram Jiwan', 'BSP', 71000)], 25.76, 84.15),
    makeConstituency(68, 'Jaunpur', 'Uttar Pradesh', [makeCandidate('Krishna Pratap Singh', 'BJP', 598000), makeCandidate('Babu Singha Ram', 'SP', 534000), makeCandidate('Dharmendra Singh', 'BSP', 71000)], 25.72, 82.69),
    makeConstituency(69, 'Machhlishahr', 'Uttar Pradesh', [makeCandidate('Bhupendra Chaudhary', 'BJP', 578000), makeCandidate('Tunna Ramnik', 'SP', 489000), makeCandidate('Raj Kumar', 'BSP', 67000)], 25.82, 82.54),
    makeConstituency(70, 'Ghazipur', 'Uttar Pradesh', [makeCandidate('Afzal Ansari', 'SP', 623000), makeCandidate('Parashu Nath', 'BJP', 567000), makeCandidate('Umashankar Singh', 'BSP', 71000)], 25.58, 83.58),
    makeConstituency(71, 'Chandauli', 'Uttar Pradesh', [makeCandidate('Mahendra Nath Pandey', 'BJP', 612000), makeCandidate('Birendra Singh Mast', 'SP', 523000), makeCandidate('Satish Chandra', 'BSP', 67000)], 25.28, 83.27),
    makeConstituency(72, 'Varanasi', 'Uttar Pradesh', [makeCandidate('Narendra Modi', 'BJP', 612000), makeCandidate('Ajay Rai', 'INC', 467000), makeCandidate('Sanjay Chaurasiya', 'SP', 231000)], 25.32, 82.97),
    makeConstituency(73, 'Bhadohi', 'Uttar Pradesh', [makeCandidate('Vinod Kumar Bind', 'BJP', 578000), makeCandidate('Laliteshpati Tripathi', 'SP', 512000), makeCandidate('Surendra Kumar', 'BSP', 71000)], 25.39, 82.57),
    makeConstituency(74, 'Mirzapur', 'Uttar Pradesh', [makeCandidate('Anupriya Patel', 'BJP', 589000), makeCandidate('Ram Charitra Nishad', 'SP', 489000), makeCandidate('Shyam Narain', 'BSP', 67000)], 25.15, 82.57),
    makeConstituency(75, 'Robert Ganj', 'Uttar Pradesh', [makeCandidate('Pakouri Lal Kol', 'BJP', 545000), makeCandidate('Chhote Lal', 'SP', 456000), makeCandidate('Bhagwan Das', 'BSP', 71000)], 24.69, 83.06),
    makeConstituency(76, 'Shrawasti', 'Uttar Pradesh', [makeCandidate('Ram Shiromani', 'SP', 512000), makeCandidate('Sakshi Maharaj', 'BJP', 489000), makeCandidate('Raj Kumar', 'BSP', 56000)], 27.52, 81.80),
    makeConstituency(77, 'Gonda', 'Uttar Pradesh', [makeCandidate('Kirti Vardhan Singh', 'BJP', 589000), makeCandidate('Shreya Verma', 'SP', 512000), makeCandidate('Brijesh Singh', 'BSP', 67000)], 26.77, 81.96),
    makeConstituency(78, 'Kaiserganj', 'Uttar Pradesh', [makeCandidate('Brij Bhushan Sharan Singh', 'BJP', 534000), makeCandidate('Praveen Kumar', 'SP', 467000), makeCandidate('Ram Naresh', 'BSP', 62000)], 27.26, 81.64),
    makeConstituency(79, 'Bahraich', 'Uttar Pradesh', [makeCandidate('Anand Kumar Dubey', 'BJP', 567000), makeCandidate('Ramesh Awasthi', 'SP', 489000), makeCandidate('Shri Ram', 'BSP', 67000)], 27.57, 81.59),
    makeConstituency(80, 'Sitapur', 'Uttar Pradesh', [makeCandidate('Rajesh Verma', 'BJP', 598000), makeCandidate('Nakul Dubey', 'SP', 534000), makeCandidate('Bhagwan Prasad', 'BSP', 89000)], 27.92, 81.07),
  ];
  const partySummary = buildPartySummary(cs);
  return { year: 2024, type: 'Lok Sabha', state: 'Uttar Pradesh', totalSeats: cs.length, status: 'Declared', constituencies: cs, partySummary };
})();

const ls2024_MH = (() => {
  const cs = [
    makeConstituency(1, 'Nandurbar', 'Maharashtra', [makeCandidate('Heena Gavit', 'BJP', 612000), makeCandidate('Govalsingbhai Padavi', 'INC', 498000), makeCandidate('Kasav Dhol', 'BSP', 42000)], 21.37, 74.24),
    makeConstituency(2, 'Dhule', 'Maharashtra', [makeCandidate('Subhash Bhamre', 'BJP', 589000), makeCandidate('Shobha Bachav', 'INC', 467000), makeCandidate('Mohan Bhagwat', 'BSP', 38000)], 20.90, 74.78),
    makeConstituency(3, 'Jalgaon', 'Maharashtra', [makeCandidate('Smita Uday Wagh', 'BJP', 712000), makeCandidate('Kailash Patil', 'INC', 423000), makeCandidate('Sanjay Wagh', 'BSP', 29000)], 21.00, 75.56),
    makeConstituency(4, 'Raver', 'Maharashtra', [makeCandidate('Raksha Khadse', 'BJP', 634000), makeCandidate('Shreeram Patil', 'INC', 456000), makeCandidate('Dilip Patil', 'BSP', 23000)], 21.23, 75.96),
    makeConstituency(5, 'Buldhana', 'Maharashtra', [makeCandidate('Prataprao Jadhav', 'SS', 589000), makeCandidate('Narendrakumar Patil', 'TMC', 512000), makeCandidate('Baliram Sirsath', 'BSP', 31000)], 20.53, 76.18),
    makeConstituency(6, 'Akola', 'Maharashtra', [makeCandidate('Anup Dhotre', 'BJP', 578000), makeCandidate('Abhay Patil', 'INC', 456000), makeCandidate('Naresh Gawai', 'BSP', 41000)], 20.71, 77.00),
    makeConstituency(7, 'Amravati', 'Maharashtra', [makeCandidate('Navneet Rana', 'BJP', 623000), makeCandidate('Balwant Wankhade', 'INC', 523000), makeCandidate('Ankit Suryawanshi', 'BSP', 28000)], 20.93, 77.75),
    makeConstituency(8, 'Wardha', 'Maharashtra', [makeCandidate('Ramdas Tadas', 'BJP', 589000), makeCandidate('Amar Kale', 'INC', 512000), makeCandidate('Rajesh Vaze', 'BSP', 24000)], 20.75, 78.60),
    makeConstituency(9, 'Ramtek', 'Maharashtra', [makeCandidate('Raju Parve', 'BJP', 567000), makeCandidate('Charan Singh', 'INC', 489000), makeCandidate('Bhaurao Chouragade', 'BSP', 31000)], 21.40, 79.33),
    makeConstituency(10, 'Nagpur', 'Maharashtra', [makeCandidate('Nitin Gadkari', 'BJP', 789000), makeCandidate('Vikas Thakre', 'INC', 512000), makeCandidate('Brijlal Bhadoriya', 'BSP', 22000)], 21.15, 79.08),
    makeConstituency(11, 'Bhandara-Gondiya', 'Maharashtra', [makeCandidate('Sunil Mendhe', 'BJP', 567000), makeCandidate('Prashant Padole', 'INC', 489000), makeCandidate('Jagdish Bodele', 'BSP', 28000)], 21.16, 79.66),
    makeConstituency(12, 'Gadchiroli-Chimur', 'Maharashtra', [makeCandidate('Ashok Nete', 'BJP', 534000), makeCandidate('Dr Namidev Usendi', 'INC', 456000), makeCandidate('Suresh Jhadi', 'BSP', 22000)], 20.19, 80.00),
    makeConstituency(13, 'Chandrapur', 'Maharashtra', [makeCandidate('Sudhir Mungantiwar', 'BJP', 589000), makeCandidate('Pratibha Dhanorkar', 'INC', 534000), makeCandidate('Ramrao Wankhade', 'BSP', 24000)], 20.07, 79.30),
    makeConstituency(14, 'Yavatmal-Washim', 'Maharashtra', [makeCandidate('Rajashri Patil', 'BJP', 567000), makeCandidate('Sanjay Deshmukh', 'SP', 512000), makeCandidate('Vishwas Nangare', 'BSP', 28000)], 20.37, 77.57),
    makeConstituency(15, 'Hingoli', 'Maharashtra', [makeCandidate('Bachchu Kadu', 'SS', 545000), makeCandidate('Nagesh Ashtikar', 'INC', 489000), makeCandidate('Krishnarao Munde', 'BSP', 21000)], 19.72, 77.15),
    makeConstituency(16, 'Nanded', 'Maharashtra', [makeCandidate('Ashok Chavan', 'BJP', 578000), makeCandidate('Vasant Chavan', 'INC', 534000), makeCandidate('Uttamrao Patil', 'BSP', 23000)], 19.17, 77.31),
    makeConstituency(17, 'Latur', 'Maharashtra', [makeCandidate('Sudhakar Shrangare', 'BJP', 589000), makeCandidate('Shivraj Patil', 'INC', 512000), makeCandidate('Dilip Deshmukh', 'BSP', 22000)], 18.40, 76.58),
    makeConstituency(18, 'Osmanabad', 'Maharashtra', [makeCandidate('Omprakash Bhupalsinh', 'SS', 567000), makeCandidate('Dhairyasheel Mohite Patil', 'NCP', 534000), makeCandidate('Sachin Kadam', 'BSP', 19000)], 18.18, 76.04),
    makeConstituency(19, 'Solapur', 'Maharashtra', [makeCandidate('Ram Satpute', 'BJP', 623000), makeCandidate('Praniti Shinde', 'INC', 545000), makeCandidate('Vinayak Mane', 'BSP', 21000)], 17.69, 75.90),
    makeConstituency(20, 'Madha', 'Maharashtra', [makeCandidate('Ranjitsinh Naik Nimbalkar', 'BJP', 589000), makeCandidate('Sanjaymama Shinde', 'NCP', 512000), makeCandidate('Dnyandev Kadam', 'BSP', 18000)], 17.63, 75.28),
    makeConstituency(21, 'Sangli', 'Maharashtra', [makeCandidate('Sanjay Kaka Patil', 'BJP', 567000), makeCandidate('Vishal Patil', 'INC', 534000), makeCandidate('Pravin Gavali', 'BSP', 18000)], 16.86, 74.57),
    makeConstituency(22, 'Satara', 'Maharashtra', [makeCandidate('Udayan Raje Bhosale', 'BJP', 589000), makeCandidate('Shrinivas Patil', 'NCP', 545000), makeCandidate('Sanjay Khatkar', 'BSP', 20000)], 17.68, 74.00),
    makeConstituency(23, 'Ratnagiri-Sindhudurg', 'Maharashtra', [makeCandidate('Narayan Rane', 'BJP', 578000), makeCandidate('Vinayak Raut', 'SS', 489000), makeCandidate('Parshuram Shetye', 'INC', 28000)], 16.99, 73.30),
    makeConstituency(24, 'Kolhapur', 'Maharashtra', [makeCandidate('Chhatrapati Shahu Maharaj', 'INC', 634000), makeCandidate('Sanjay Mandlik', 'BJP', 512000), makeCandidate('Siddhesh Naik', 'BSP', 18000)], 16.70, 74.24),
    makeConstituency(25, 'Hatkanangle', 'Maharashtra', [makeCandidate('Dhairyasheel Mane', 'SS', 567000), makeCandidate('Raju Shetti', 'BJP', 512000), makeCandidate('Rannasaheb Patil', 'INC', 71000)], 16.83, 74.26),
    makeConstituency(26, 'Shirpur', 'Maharashtra', [makeCandidate('Narendrakumar Bhiurao Patil', 'NCP', 545000), makeCandidate('Rakesh Walse Patil', 'BJP', 489000), makeCandidate('Suresh Patil', 'INC', 67000)], 21.35, 74.89),
    makeConstituency(27, 'Dindori', 'Maharashtra', [makeCandidate('Bharati Pawar', 'BJP', 589000), makeCandidate('Dhanraj Mahale', 'INC', 456000), makeCandidate('Kiran Ghule', 'BSP', 28000)], 20.21, 73.74),
    makeConstituency(28, 'Nashik', 'Maharashtra', [makeCandidate('Hemant Godse', 'SS', 623000), makeCandidate('Rajabhau Waje', 'INC', 512000), makeCandidate('Sameer Desai', 'BSP', 22000)], 19.99, 73.79),
    makeConstituency(29, 'Palghar', 'Maharashtra', [makeCandidate('Hemant Savara', 'BJP', 578000), makeCandidate('Bapu Supe', 'INC', 489000), makeCandidate('Rajesh Patil', 'BSP', 24000)], 19.70, 72.77),
    makeConstituency(30, 'Bhiwandi', 'Maharashtra', [makeCandidate('Kapil Patil', 'BJP', 589000), makeCandidate('Suresh Mhatre', 'SS', 456000), makeCandidate('Nana Patole', 'INC', 78000)], 19.30, 73.05),
    makeConstituency(31, 'Kalyan', 'Maharashtra', [makeCandidate('Shrikant Shinde', 'SS', 712000), makeCandidate('Vaishali Darekar', 'INC', 489000), makeCandidate('Dilip Kadu', 'BSP', 23000)], 19.23, 73.13),
    makeConstituency(32, 'Thane', 'Maharashtra', [makeCandidate('Naresh Mhaske', 'SS', 745000), makeCandidate('Rajan Vichare', 'INC', 456000), makeCandidate('Vasant Davkhare', 'BSP', 19000)], 19.21, 72.98),
    makeConstituency(33, 'Mumbai North', 'Maharashtra', [makeCandidate('Piyush Goyal', 'BJP', 678000), makeCandidate('Bhushan Patil', 'INC', 489000), makeCandidate('Nisar Ahmed', 'BSP', 17000)], 19.22, 72.87),
    makeConstituency(34, 'Mumbai North West', 'Maharashtra', [makeCandidate('Ravindra Waikar', 'SS', 567000), makeCandidate('Amol Kirtikar', 'SS(UBT)', 561000), makeCandidate('Suresh Gaikwad', 'INC', 28000)], 19.16, 72.84),
    makeConstituency(35, 'Mumbai North East', 'Maharashtra', [makeCandidate('Mihir Kotecha', 'BJP', 634000), makeCandidate('Sanjay Dina Patil', 'SS(UBT)', 567000), makeCandidate('Dilip Ghosh', 'INC', 22000)], 19.08, 72.93),
    makeConstituency(36, 'Mumbai North Central', 'Maharashtra', [makeCandidate('Ujjwal Nikam', 'BJP', 645000), makeCandidate('Varsha Gaikwad', 'INC', 578000), makeCandidate('Anand Ingle', 'BSP', 17000)], 19.07, 72.88),
    makeConstituency(37, 'Mumbai South Central', 'Maharashtra', [makeCandidate('Rahul Shewale', 'SS', 589000), makeCandidate('Aneal Khatri', 'INC', 456000), makeCandidate('Ajay Chaudhary', 'BSP', 19000)], 18.98, 72.85),
    makeConstituency(38, 'Mumbai South', 'Maharashtra', [makeCandidate('Arvind Sawant', 'SS(UBT)', 567000), makeCandidate('Yamini Jadhav', 'SS', 512000), makeCandidate('Milind Deora', 'INC', 31000)], 18.93, 72.84),
    makeConstituency(39, 'Raigad', 'Maharashtra', [makeCandidate('Sunil Tatkare', 'NCP', 645000), makeCandidate('Anand Paranjpe', 'SS(UBT)', 489000), makeCandidate('Aditi Tatkare', 'INC', 28000)], 18.51, 73.18),
    makeConstituency(40, 'Maval', 'Maharashtra', [makeCandidate('Shrirang Barne', 'SS', 634000), makeCandidate('Sandeep Naik', 'NCP(SP)', 567000), makeCandidate('Sanket Ghanekar', 'INC', 22000)], 18.76, 73.40),
    makeConstituency(41, 'Pune', 'Maharashtra', [makeCandidate('Murlidhar Mohol', 'BJP', 712000), makeCandidate('Ravindra Dhangekar', 'INC', 645000), makeCandidate('Vasant More', 'BSP', 17000)], 18.52, 73.86),
    makeConstituency(42, 'Baramati', 'Maharashtra', [makeCandidate('Sunetra Pawar', 'NCP', 634000), makeCandidate('Supriya Sule', 'NCP(SP)', 621000), makeCandidate('Yashwant Mane', 'INC', 23000)], 18.15, 74.58),
    makeConstituency(43, 'Shirur', 'Maharashtra', [makeCandidate('Amol Kolhe', 'NCP(SP)', 589000), makeCandidate('Shivajirao Adhalrao', 'NCP', 534000), makeCandidate('Tukaram Kapse', 'INC', 19000)], 18.84, 74.37),
    makeConstituency(44, 'Ahmadnagar', 'Maharashtra', [makeCandidate('Nilesh Lanke', 'NCP(SP)', 623000), makeCandidate('Sujay Vikhe Patil', 'BJP', 567000), makeCandidate('Hemant Takle', 'INC', 22000)], 19.09, 74.74),
    makeConstituency(45, 'Shirdi', 'Maharashtra', [makeCandidate('Sadashiv Lokhande', 'SS', 589000), makeCandidate('Bhausaheb Wakchure', 'INC', 512000), makeCandidate('Dattatrey Patil', 'BSP', 19000)], 19.78, 74.48),
    makeConstituency(46, 'Beed', 'Maharashtra', [makeCandidate('Pankaja Munde', 'BJP', 612000), makeCandidate('Bajrang Sonawane', 'INC', 578000), makeCandidate('Ashok Deshmukh', 'BSP', 18000)], 18.99, 75.77),
    makeConstituency(47, 'Jalna', 'Maharashtra', [makeCandidate('Raosaheb Danve', 'BJP', 598000), makeCandidate('Kailash Gorantyal', 'INC', 489000), makeCandidate('Ganesh Kshirsagar', 'BSP', 21000)], 19.84, 75.88),
    makeConstituency(48, 'Aurangabad', 'Maharashtra', [makeCandidate('Sandipan Bhumre', 'SS', 623000), makeCandidate('Imtiaz Jaleel', 'AIMIM', 567000), makeCandidate('Subhash Zaware', 'INC', 28000)], 19.88, 75.34),
  ];
  const partySummary = buildPartySummary(cs);
  return { year: 2024, type: 'Lok Sabha', state: 'Maharashtra', totalSeats: cs.length, status: 'Declared', constituencies: cs, partySummary };
})();

const assembly2023_MP = (() => {
  const cs = [
    makeConstituency(1, 'Sheopur', 'Madhya Pradesh', [makeCandidate('Nirmala Bhuria', 'BJP', 89000), makeCandidate('Ram Lal', 'INC', 72000)], 25.67, 76.71, 'Morena'),
    makeConstituency(2, 'Vijaypur', 'Madhya Pradesh', [makeCandidate('Rajendra Shukla', 'BJP', 92000), makeCandidate('Uday Pratap', 'INC', 78000)], 26.01, 76.60, 'Morena'),
    makeConstituency(3, 'Sabalgarh', 'Madhya Pradesh', [makeCandidate('Madan Lal Sharma', 'BJP', 87000), makeCandidate('Bharat Singh', 'INC', 71000)], 26.24, 77.33, 'Morena'),
    makeConstituency(4, 'Joura', 'Madhya Pradesh', [makeCandidate('Sohan Lal Sharma', 'BJP', 91000), makeCandidate('Rajesh Kumar', 'INC', 76000)], 26.25, 78.43, 'Morena'),
    makeConstituency(5, 'Sumawali', 'Madhya Pradesh', [makeCandidate('Aikya Singh Vishwakarma', 'BJP', 88000), makeCandidate('Ravindra Kumar', 'INC', 73000)], 26.48, 77.64, 'Gwalior'),
    makeConstituency(6, 'Morena', 'Madhya Pradesh', [makeCandidate('Giriraj Dandotia', 'BJP', 95000), makeCandidate('Ramniwas Rawat', 'INC', 81000)], 26.50, 77.99, 'Morena'),
    makeConstituency(7, 'Kailaras', 'Madhya Pradesh', [makeCandidate('Arvind Singh Bhadauria', 'BJP', 89000), makeCandidate('Manoj Chaturvedi', 'INC', 74000)], 26.32, 77.61, 'Morena'),
    makeConstituency(8, 'Dimani', 'Madhya Pradesh', [makeCandidate('Subhash Dhakad', 'BJP', 86000), makeCandidate('Devraj Singh', 'INC', 72000)], 26.26, 77.75, 'Morena'),
    makeConstituency(9, 'Ambah', 'Madhya Pradesh', [makeCandidate('Rajesh Kumar Sharma', 'BJP', 93000), makeCandidate('Ramesh Malviya', 'INC', 79000)], 26.70, 78.22, 'Morena'),
    makeConstituency(10, 'Ater', 'Madhya Pradesh', [makeCandidate('Suresh Dhangar', 'BJP', 91000), makeCandidate('Devendra Jatav', 'INC', 77000)], 26.44, 78.67, 'Bhind'),
    makeConstituency(11, 'Bhind', 'Madhya Pradesh', [makeCandidate('Sanjeev Singh Kushwah', 'BJP', 96000), makeCandidate('Hemant Katare', 'INC', 82000)], 26.56, 78.78, 'Bhind'),
    makeConstituency(12, 'Lahar', 'Madhya Pradesh', [makeCandidate('Antar Singh Arya', 'BJP', 88000), makeCandidate('Kamlesh Choudhary', 'INC', 74000)], 26.21, 78.94, 'Bhind'),
    makeConstituency(13, 'Mehgaon', 'Madhya Pradesh', [makeCandidate('Om Prakash Khatik', 'BJP', 87000), makeCandidate('Rajkumar Singh', 'INC', 73000)], 26.26, 79.24, 'Bhind'),
    makeConstituency(14, 'Gohad', 'Madhya Pradesh', [makeCandidate('Ranveer Jatav', 'INC', 94000), makeCandidate('Prabhu Dayal Jatav', 'BJP', 89000)], 26.43, 78.45, 'Gwalior'),
    makeConstituency(15, 'Dabra', 'Madhya Pradesh', [makeCandidate('Imarti Devi', 'BJP', 91000), makeCandidate('Suresh Raje', 'INC', 77000)], 25.89, 78.34, 'Gwalior'),
    makeConstituency(16, 'Bhitarwar', 'Madhya Pradesh', [makeCandidate('Mohanlal', 'BJP', 89000), makeCandidate('Giridhari Lal', 'INC', 73000)], 25.77, 78.12, 'Gwalior'),
    makeConstituency(17, 'Gwalior Rural', 'Madhya Pradesh', [makeCandidate('Satish Sikarwar', 'BJP', 93000), makeCandidate('Mukesh Soni', 'INC', 78000)], 26.22, 77.95, 'Gwalior'),
    makeConstituency(18, 'Gwalior', 'Madhya Pradesh', [makeCandidate('Praveen Pathak', 'BJP', 98000), makeCandidate('Devendra Sharma', 'INC', 84000)], 26.21, 78.18, 'Gwalior'),
    makeConstituency(19, 'Gwalior East', 'Madhya Pradesh', [makeCandidate('Mohan Singh Rathore', 'BJP', 94000), makeCandidate('Satish Sikarwar', 'INC', 80000)], 26.22, 78.24, 'Gwalior'),
    makeConstituency(20, 'Gwalior South', 'Madhya Pradesh', [makeCandidate('Narayan Singh Kushwaha', 'BJP', 92000), makeCandidate('Surendra Singh', 'INC', 77000)], 26.18, 78.15, 'Gwalior'),
    makeConstituency(21, 'Bhander', 'Madhya Pradesh', [makeCandidate('Rakesh Mawai', 'BJP', 87000), makeCandidate('Tariq Masood', 'INC', 73000)], 25.70, 78.74, 'Gwalior'),
    makeConstituency(22, 'Karera', 'Madhya Pradesh', [makeCandidate('Rakesh Chaturvedi', 'BJP', 89000), makeCandidate('Pratap Singh', 'INC', 74000)], 25.46, 78.14, 'Guna'),
    makeConstituency(23, 'Pohari', 'Madhya Pradesh', [makeCandidate('Rajesh Porwal', 'BJP', 86000), makeCandidate('Kuldeep Singh', 'INC', 72000)], 25.22, 77.57, 'Guna'),
    makeConstituency(24, 'Shivpuri', 'Madhya Pradesh', [makeCandidate('Yashpal Singh Sisodia', 'BJP', 97000), makeCandidate('Praveen Dwivedi', 'INC', 81000)], 25.43, 77.66, 'Guna'),
    makeConstituency(25, 'Pichhore', 'Madhya Pradesh', [makeCandidate('Priyadarshi', 'BJP', 88000), makeCandidate('Braj Bhushan', 'INC', 73000)], 25.00, 77.37, 'Guna'),
    makeConstituency(26, 'Kolaras', 'Madhya Pradesh', [makeCandidate('Sunder Lal Tiwari', 'BJP', 91000), makeCandidate('Mahendra Singh', 'INC', 76000)], 25.22, 77.06, 'Guna'),
    makeConstituency(27, 'Mungaoli', 'Madhya Pradesh', [makeCandidate('Brijendra Pratap Singh', 'BJP', 89000), makeCandidate('Kailash Gupta', 'INC', 74000)], 24.41, 76.78, 'Guna'),
    makeConstituency(28, 'Ashok Nagar', 'Madhya Pradesh', [makeCandidate('Jayant Malaiya', 'BJP', 93000), makeCandidate('Ram Singh', 'INC', 78000)], 24.58, 77.73, 'Guna'),
    makeConstituency(29, 'Chanderi', 'Madhya Pradesh', [makeCandidate('Ram Kishore Dogra', 'BJP', 87000), makeCandidate('Pradyumna', 'INC', 72000)], 24.72, 78.96, 'Guna'),
    makeConstituency(30, 'Guna', 'Madhya Pradesh', [makeCandidate('Saurabh Singh Sisodia', 'BJP', 98000), makeCandidate('Raghuraj Singh', 'INC', 83000)], 24.65, 77.32, 'Guna'),
  ];
  const partySummary = buildPartySummary(cs);
  return { year: 2023, type: 'Assembly', state: 'Madhya Pradesh', totalSeats: cs.length, status: 'Declared', constituencies: cs, partySummary };
})();

const assembly2022_UP = (() => {
  const pcs = ['Saharanpur', 'Kairana', 'Muzaffarnagar', 'Bijnor', 'Moradabad', 'Rampur', 'Sambhal', 'Amroha', 'Meerut', 'Ghaziabad'];
  const cs = [
    makeConstituency(1, 'Behat', 'Uttar Pradesh', [makeCandidate('Naresh Saini', 'BJP', 89000), makeCandidate('Masood Akhtar', 'SP', 71000)], 30.08, 77.36, pcs[0]),
    makeConstituency(2, 'Nakur', 'Uttar Pradesh', [makeCandidate('Mukesh Chaudhary', 'BJP', 87000), makeCandidate('Noor Salim', 'SP', 73000)], 29.92, 77.30, pcs[0]),
    makeConstituency(3, 'Saharanpur Nagar', 'Uttar Pradesh', [makeCandidate('Rajeev Garg', 'BJP', 92000), makeCandidate('Imtiaz Ahmed', 'BSP', 75000)], 29.97, 77.55, pcs[0]),
    makeConstituency(4, 'Saharanpur', 'Uttar Pradesh', [makeCandidate('Sanjay Garg', 'BJP', 88000), makeCandidate('Hafiz Rashid', 'SP', 76000)], 29.97, 77.55, pcs[0]),
    makeConstituency(5, 'Deoband', 'Uttar Pradesh', [makeCandidate('Brijesh Singh', 'INC', 91000), makeCandidate('Mukesh Goel', 'BJP', 83000)], 29.70, 77.68, pcs[0]),
    makeConstituency(6, 'Gangoh', 'Uttar Pradesh', [makeCandidate('Kishanchand', 'BJP', 86000), makeCandidate('Mansoor Ahmed', 'SP', 74000)], 29.78, 77.27, pcs[0]),
    makeConstituency(7, 'Kairana', 'Uttar Pradesh', [makeCandidate('Mriganka Singh', 'BJP', 94000), makeCandidate('Nahid Hasan', 'SP', 87000)], 29.49, 77.21, pcs[1]),
    makeConstituency(8, 'Thana Bhawan', 'Uttar Pradesh', [makeCandidate('Ashraf Ali Khan', 'RJD', 89000), makeCandidate('Suresh Rana', 'BJP', 85000)], 29.57, 77.40, pcs[1]),
    makeConstituency(9, 'Shamli', 'Uttar Pradesh', [makeCandidate('Tejendra Nirwal', 'BJP', 91000), makeCandidate('Bhure Ali', 'SP', 78000)], 29.43, 77.32, pcs[1]),
    makeConstituency(10, 'Budhana', 'Uttar Pradesh', [makeCandidate('Praveen Singhania', 'BJP', 88000), makeCandidate('Dharmendra Malik', 'SP', 81000)], 29.28, 77.45, pcs[2]),
    makeConstituency(11, 'Muzaffarnagar', 'Uttar Pradesh', [makeCandidate('Kapil Dev Agarwal', 'BJP', 97000), makeCandidate('Sonu Gupta', 'SP', 82000)], 29.47, 77.70, pcs[2]),
    makeConstituency(12, 'Khatauli', 'Uttar Pradesh', [makeCandidate('Vikram Saini', 'BJP', 89000), makeCandidate('Rashid Ahmad', 'SP', 76000)], 29.27, 77.73, pcs[2]),
    makeConstituency(13, 'Noorpur', 'Uttar Pradesh', [makeCandidate('Naresh Saini', 'BJP', 87000), makeCandidate('Murad Ali', 'SP', 79000)], 29.11, 78.36, pcs[3]),
    makeConstituency(14, 'Bijnor', 'Uttar Pradesh', [makeCandidate('Suchita Dwivedi', 'BJP', 91000), makeCandidate('Naseem Ahmad', 'BSP', 82000)], 29.37, 78.14, pcs[3]),
    makeConstituency(15, 'Chandpur', 'Uttar Pradesh', [makeCandidate('Ram Singh Saini', 'BJP', 88000), makeCandidate('Dinesh Kumar', 'SP', 75000)], 29.14, 78.27, pcs[3]),
    makeConstituency(16, 'Nagina', 'Uttar Pradesh', [makeCandidate('Manohar Lal', 'BSP', 92000), makeCandidate('Manveer Singh', 'BJP', 87000)], 29.44, 78.44, pcs[3]),
    makeConstituency(17, 'Moradabad Rural', 'Uttar Pradesh', [makeCandidate('Gulshan Shaky', 'BJP', 89000), makeCandidate('Hafeez Khan', 'SP', 78000)], 28.83, 78.78, pcs[5]),
    makeConstituency(18, 'Moradabad Nagar', 'Uttar Pradesh', [makeCandidate('Ritesh Gupta', 'BJP', 94000), makeCandidate('Ziaur Rahman', 'SP', 86000)], 28.84, 78.78, pcs[5]),
    makeConstituency(19, 'Kundarki', 'Uttar Pradesh', [makeCandidate('Haji Rizwan', 'SP', 96000), makeCandidate('Nisar Qureshi', 'BJP', 82000)], 28.75, 79.00, pcs[5]),
    makeConstituency(20, 'Bilari', 'Uttar Pradesh', [makeCandidate('Mohan Garg', 'BJP', 88000), makeCandidate('Shekhar Tomar', 'SP', 74000)], 28.64, 78.82, pcs[5]),
    makeConstituency(21, 'Sambhal', 'Uttar Pradesh', [makeCandidate('Diwakar Aggarwal', 'BJP', 91000), makeCandidate('Iqbal Mahmood', 'SP', 84000)], 28.59, 78.57, pcs[6]),
    makeConstituency(22, 'Suar', 'Uttar Pradesh', [makeCandidate('Narottam Mishra', 'BJP', 87000), makeCandidate('Zia Ur Rahman', 'SP', 81000)], 28.67, 78.57, pcs[6]),
    makeConstituency(23, 'Champat Rai', 'Uttar Pradesh', [makeCandidate('Pradeep Kumar', 'BJP', 89000), makeCandidate('Ramveer Singh', 'SP', 74000)], 28.58, 78.46, pcs[6]),
    makeConstituency(24, 'Amroha', 'Uttar Pradesh', [makeCandidate('Mahesh Gupta', 'BJP', 93000), makeCandidate('Kaif Ibrahim', 'SP', 85000)], 28.90, 78.47, pcs[7]),
    makeConstituency(25, 'Hasanpur', 'Uttar Pradesh', [makeCandidate('Amit Agarwal', 'BJP', 88000), makeCandidate('Rajveer Singh', 'SP', 76000)], 28.73, 78.28, pcs[7]),
    makeConstituency(26, 'Hapur', 'Uttar Pradesh', [makeCandidate('Vipul Singh', 'BJP', 97000), makeCandidate('Ramkumar', 'SP', 83000)], 28.73, 77.78, pcs[8]),
    makeConstituency(27, 'Meerut', 'Uttar Pradesh', [makeCandidate('Rajendra Aggarwal', 'BJP', 102000), makeCandidate('Avadhesh Kumar', 'SP', 88000)], 28.98, 77.71, pcs[8]),
    makeConstituency(28, 'Meerut Cantonment', 'Uttar Pradesh', [makeCandidate('Amit Agarwal', 'BJP', 91000), makeCandidate('Hakim Tariq', 'BSP', 78000)], 28.99, 77.75, pcs[8]),
    makeConstituency(29, 'Meerut South', 'Uttar Pradesh', [makeCandidate('Som Sharma', 'BJP', 94000), makeCandidate('Sunita Verma', 'BSP', 82000)], 28.96, 77.72, pcs[8]),
    makeConstituency(30, 'Ghaziabad', 'Uttar Pradesh', [makeCandidate('Atul Garg', 'BJP', 108000), makeCandidate('Suresh Bansal', 'SP', 89000)], 28.67, 77.44, pcs[9]),
  ];
  const partySummary = buildPartySummary(cs);
  return { year: 2022, type: 'Assembly', state: 'Uttar Pradesh', totalSeats: cs.length, status: 'Declared', constituencies: cs, partySummary };
})();

const MOCK_ELECTIONS = [ls2024_UP, ls2024_MH, assembly2023_MP, assembly2022_UP];

// =========================================================================
// MOCK_CASTE — district-level caste population sample. Mirrors the front-end
// bundled list. Replace with your real Excel data via /api/upload/caste or
// `node scripts/import-caste-csv.js path/to/file.csv`.
// =========================================================================
const MOCK_CASTE = [
  // Uttar Pradesh — Lucknow
  { state: 'Uttar Pradesh', district: 'Lucknow', caste: 'Brahmin', populationPct: 14.2 },
  { state: 'Uttar Pradesh', district: 'Lucknow', caste: 'Thakur (Rajput)', populationPct: 9.6 },
  { state: 'Uttar Pradesh', district: 'Lucknow', caste: 'Yadav', populationPct: 11.4 },
  { state: 'Uttar Pradesh', district: 'Lucknow', caste: 'Kurmi', populationPct: 5.8 },
  { state: 'Uttar Pradesh', district: 'Lucknow', caste: 'Other OBC', populationPct: 18.7 },
  { state: 'Uttar Pradesh', district: 'Lucknow', caste: 'Jatav (SC)', populationPct: 12.3 },
  { state: 'Uttar Pradesh', district: 'Lucknow', caste: 'Other SC', populationPct: 8.5 },
  { state: 'Uttar Pradesh', district: 'Lucknow', caste: 'Muslim', populationPct: 16.4 },
  { state: 'Uttar Pradesh', district: 'Lucknow', caste: 'Others', populationPct: 3.1 },
  // Uttar Pradesh — Varanasi
  { state: 'Uttar Pradesh', district: 'Varanasi', caste: 'Brahmin', populationPct: 16.8 },
  { state: 'Uttar Pradesh', district: 'Varanasi', caste: 'Thakur (Rajput)', populationPct: 7.4 },
  { state: 'Uttar Pradesh', district: 'Varanasi', caste: 'Yadav', populationPct: 10.9 },
  { state: 'Uttar Pradesh', district: 'Varanasi', caste: 'Kurmi', populationPct: 4.6 },
  { state: 'Uttar Pradesh', district: 'Varanasi', caste: 'Patel/Kushwaha', populationPct: 6.2 },
  { state: 'Uttar Pradesh', district: 'Varanasi', caste: 'Other OBC', populationPct: 15.1 },
  { state: 'Uttar Pradesh', district: 'Varanasi', caste: 'Jatav (SC)', populationPct: 11.2 },
  { state: 'Uttar Pradesh', district: 'Varanasi', caste: 'Other SC', populationPct: 6.8 },
  { state: 'Uttar Pradesh', district: 'Varanasi', caste: 'Muslim', populationPct: 17.4 },
  { state: 'Uttar Pradesh', district: 'Varanasi', caste: 'Others', populationPct: 3.6 },
  // Uttar Pradesh — Agra
  { state: 'Uttar Pradesh', district: 'Agra', caste: 'Brahmin', populationPct: 11.4 },
  { state: 'Uttar Pradesh', district: 'Agra', caste: 'Thakur (Rajput)', populationPct: 10.2 },
  { state: 'Uttar Pradesh', district: 'Agra', caste: 'Vaishya/Bania', populationPct: 8.7 },
  { state: 'Uttar Pradesh', district: 'Agra', caste: 'Yadav', populationPct: 9.3 },
  { state: 'Uttar Pradesh', district: 'Agra', caste: 'Other OBC', populationPct: 17.8 },
  { state: 'Uttar Pradesh', district: 'Agra', caste: 'Jatav (SC)', populationPct: 19.5 },
  { state: 'Uttar Pradesh', district: 'Agra', caste: 'Other SC', populationPct: 7.1 },
  { state: 'Uttar Pradesh', district: 'Agra', caste: 'Muslim', populationPct: 12.4 },
  { state: 'Uttar Pradesh', district: 'Agra', caste: 'Others', populationPct: 3.6 },
  // Madhya Pradesh — Bhopal
  { state: 'Madhya Pradesh', district: 'Bhopal', caste: 'Brahmin', populationPct: 8.4 },
  { state: 'Madhya Pradesh', district: 'Bhopal', caste: 'Thakur (Rajput)', populationPct: 5.2 },
  { state: 'Madhya Pradesh', district: 'Bhopal', caste: 'Vaishya', populationPct: 6.1 },
  { state: 'Madhya Pradesh', district: 'Bhopal', caste: 'OBC', populationPct: 35.7 },
  { state: 'Madhya Pradesh', district: 'Bhopal', caste: 'SC', populationPct: 14.8 },
  { state: 'Madhya Pradesh', district: 'Bhopal', caste: 'ST', populationPct: 4.6 },
  { state: 'Madhya Pradesh', district: 'Bhopal', caste: 'Muslim', populationPct: 21.2 },
  { state: 'Madhya Pradesh', district: 'Bhopal', caste: 'Others', populationPct: 4.0 },
  // Madhya Pradesh — Indore
  { state: 'Madhya Pradesh', district: 'Indore', caste: 'Brahmin', populationPct: 9.8 },
  { state: 'Madhya Pradesh', district: 'Indore', caste: 'Vaishya', populationPct: 10.6 },
  { state: 'Madhya Pradesh', district: 'Indore', caste: 'Maratha', populationPct: 5.2 },
  { state: 'Madhya Pradesh', district: 'Indore', caste: 'OBC', populationPct: 34.1 },
  { state: 'Madhya Pradesh', district: 'Indore', caste: 'SC', populationPct: 16.5 },
  { state: 'Madhya Pradesh', district: 'Indore', caste: 'ST', populationPct: 6.4 },
  { state: 'Madhya Pradesh', district: 'Indore', caste: 'Muslim', populationPct: 14.1 },
  { state: 'Madhya Pradesh', district: 'Indore', caste: 'Others', populationPct: 3.3 },
  // Maharashtra — Mumbai
  { state: 'Maharashtra', district: 'Mumbai', caste: 'Maratha', populationPct: 32.4 },
  { state: 'Maharashtra', district: 'Mumbai', caste: 'Brahmin', populationPct: 4.1 },
  { state: 'Maharashtra', district: 'Mumbai', caste: 'OBC', populationPct: 18.6 },
  { state: 'Maharashtra', district: 'Mumbai', caste: 'SC (Mahar/Buddhist)', populationPct: 13.8 },
  { state: 'Maharashtra', district: 'Mumbai', caste: 'Other SC', populationPct: 4.5 },
  { state: 'Maharashtra', district: 'Mumbai', caste: 'ST', populationPct: 2.7 },
  { state: 'Maharashtra', district: 'Mumbai', caste: 'Muslim', populationPct: 20.5 },
  { state: 'Maharashtra', district: 'Mumbai', caste: 'Christian', populationPct: 2.6 },
  { state: 'Maharashtra', district: 'Mumbai', caste: 'Others', populationPct: 0.8 },
  // Maharashtra — Pune
  { state: 'Maharashtra', district: 'Pune', caste: 'Maratha', populationPct: 41.7 },
  { state: 'Maharashtra', district: 'Pune', caste: 'Brahmin', populationPct: 6.2 },
  { state: 'Maharashtra', district: 'Pune', caste: 'OBC (Kunbi etc.)', populationPct: 17.8 },
  { state: 'Maharashtra', district: 'Pune', caste: 'SC', populationPct: 13.2 },
  { state: 'Maharashtra', district: 'Pune', caste: 'ST', populationPct: 3.4 },
  { state: 'Maharashtra', district: 'Pune', caste: 'Muslim', populationPct: 14.1 },
  { state: 'Maharashtra', district: 'Pune', caste: 'Others', populationPct: 3.6 },
  // Bihar — Patna
  { state: 'Bihar', district: 'Patna', caste: 'Bhumihar', populationPct: 8.4 },
  { state: 'Bihar', district: 'Patna', caste: 'Brahmin', populationPct: 6.8 },
  { state: 'Bihar', district: 'Patna', caste: 'Rajput', populationPct: 5.1 },
  { state: 'Bihar', district: 'Patna', caste: 'Kayastha', populationPct: 2.8 },
  { state: 'Bihar', district: 'Patna', caste: 'Yadav', populationPct: 14.2 },
  { state: 'Bihar', district: 'Patna', caste: 'Kurmi', populationPct: 4.1 },
  { state: 'Bihar', district: 'Patna', caste: 'Other OBC', populationPct: 16.7 },
  { state: 'Bihar', district: 'Patna', caste: 'Dusadh (SC)', populationPct: 9.2 },
  { state: 'Bihar', district: 'Patna', caste: 'Other SC', populationPct: 11.6 },
  { state: 'Bihar', district: 'Patna', caste: 'Muslim', populationPct: 18.9 },
  { state: 'Bihar', district: 'Patna', caste: 'Others', populationPct: 2.2 },
];

module.exports = { MOCK_ELECTIONS, MOCK_CASTE };

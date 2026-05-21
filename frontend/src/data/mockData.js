// Complete mock data embedded in frontend for standalone demo
export const PARTY_COLORS = {
  'BJP': '#FF6B00', 'INC': '#19AAED', 'AAP': '#00BFFF', 'BSP': '#1565C0',
  'SP': '#E53935', 'TMC': '#26A69A', 'CPI(M)': '#C62828', 'NCP': '#F9A825',
  'SS': '#FF8F00', 'JDU': '#00897B', 'TDP': '#FFD600', 'YSRCP': '#6A1B9A',
  'DMK': '#E91E63', 'AIADMK': '#00ACC1', 'Independent': '#757575',
  'RJD': '#1E88E5', 'CPIM': '#B71C1C', 'NCP(SP)': '#FB8C00',
  'SS(UBT)': '#FF5722', 'AIMIM': '#1B5E20',
};

const mkC = (name, party, votes, isWinner = false) => ({
  name, party, partyAbbr: party, partyColor: PARTY_COLORS[party] || '#666',
  votes, voteShare: 0, isWinner, gender: 'M', age: 45, criminal_cases: 0, margin: 0,
});

const mkSeat = (no, name, state, candidates, lat, lng, parentPC, type = 'PC') => {
  const sorted = [...candidates].sort((a, b) => b.votes - a.votes);
  const total = sorted.reduce((s, c) => s + c.votes, 0);
  sorted.forEach(c => { c.voteShare = +((c.votes / total) * 100).toFixed(1); });
  sorted[0].isWinner = true;
  sorted[0].margin = sorted[1] ? sorted[0].votes - sorted[1].votes : sorted[0].votes;
  return {
    constituencyNo: no, constituencyName: name,
    constituencyType: parentPC ? 'AC' : type,
    parentConstituency: parentPC || '',
    state, totalVoters: Math.round(total * 1.4),
    totalVotesCast: total,
    turnout: +((total / (total * 1.4)) * 100).toFixed(1),
    latitude: lat, longitude: lng, candidates: sorted,
    winner: { name: sorted[0].name, party: sorted[0].party, partyAbbr: sorted[0].partyAbbr, partyColor: sorted[0].partyColor, votes: sorted[0].votes, margin: sorted[0].margin, voteShare: sorted[0].voteShare },
  };
};

const buildPS = (cs) => {
  const pMap = {};
  let grand = 0;
  for (const c of cs) for (const cand of c.candidates) {
    if (!pMap[cand.party]) pMap[cand.party] = { party: cand.party, partyAbbr: cand.party, partyColor: PARTY_COLORS[cand.party] || '#666', seatsWon: 0, seatsContested: 0, totalVotes: 0, voteShare: 0, leading: 0 };
    pMap[cand.party].seatsContested++;
    pMap[cand.party].totalVotes += cand.votes;
    grand += cand.votes;
    if (cand.isWinner) pMap[cand.party].seatsWon++;
  }
  return Object.values(pMap).map(p => ({ ...p, voteShare: +((p.totalVotes / grand) * 100).toFixed(2) })).sort((a, b) => b.seatsWon - a.seatsWon);
};

// LS 2024 UP
const up2024cs = [
  mkSeat(1,'Saharanpur','Uttar Pradesh',[mkC('Imran Masood','INC',612000),mkC('Raghav Lakhanpal','BJP',581000),mkC('Majid Ali','BSP',89000)],29.97,77.54),
  mkSeat(2,'Kairana','Uttar Pradesh',[mkC('Iqra Hasan','SP',634000),mkC('Pradeep Chaudhary','BJP',580000),mkC('Nahid Hasan','BSP',56000)],29.49,77.21),
  mkSeat(3,'Muzaffarnagar','Uttar Pradesh',[mkC('Harendra Singh','SP',598000),mkC('Sanjeev Balyan','BJP',560000),mkC('Dara Prajapati','BSP',74000)],29.47,77.70),
  mkSeat(4,'Bijnor','Uttar Pradesh',[mkC('Chandra Shekhar','SP',586000),mkC('Dinesh Chandra','BJP',523000),mkC('Sanjay Garg','BSP',93000)],29.37,78.14),
  mkSeat(5,'Nagina','Uttar Pradesh',[mkC('Chandrashekhar Azad','Independent',562000),mkC('Om Kumar','BJP',325000),mkC('Surendra Pal','SP',198000)],29.44,78.44),
  mkSeat(6,'Moradabad','Uttar Pradesh',[mkC('Ruchi Veera','SP',614000),mkC('Sarvesh Kumar','BJP',548000),mkC('Haji Iqbal','BSP',62000)],28.84,78.78),
  mkSeat(7,'Rampur','Uttar Pradesh',[mkC('Maulana Mohibullah','SP',594000),mkC('Ghanshyam Lodhi','BJP',489000),mkC('Ziaur Barq','BSP',78000)],28.79,79.01),
  mkSeat(8,'Sambhal','Uttar Pradesh',[mkC('Zia Ur Rahman Barq','SP',602000),mkC('Shailendra Agarwal','BJP',524000),mkC('Saleem Khan','BSP',65000)],28.59,78.57),
  mkSeat(9,'Amroha','Uttar Pradesh',[mkC('Danesh Ali','SP',578000),mkC('Kanwar Singh Tanwar','BJP',554000),mkC('Mohd Akbar','BSP',71000)],28.90,78.47),
  mkSeat(10,'Meerut','Uttar Pradesh',[mkC('Sunita Verma','BJP',621000),mkC('Sunita Chauhan','RJD',298000),mkC('Haaji Yunus','SP',289000)],28.98,77.71),
  mkSeat(11,'Baghpat','Uttar Pradesh',[mkC('Rajendra Agarwal','BJP',598000),mkC('Amarpal Sharma','RJD',312000),mkC('Mohan Singh','SP',213000)],28.94,77.22),
  mkSeat(12,'Ghaziabad','Uttar Pradesh',[mkC('Atul Garg','BJP',934000),mkC('Dolly Sharma','INC',389000),mkC('Suresh Bansal','BSP',89000)],28.66,77.44),
  mkSeat(13,'Gautam Buddha Nagar','Uttar Pradesh',[mkC('Mahesh Sharma','BJP',876000),mkC('Mahendra Nagar','SP',389000),mkC('Pankhuri Pathak','INC',78000)],28.47,77.50),
  mkSeat(14,'Bulandshahr','Uttar Pradesh',[mkC('Bhola Singh','BJP',645000),mkC('Praveen Kumar','SP',512000),mkC('Yogesh Dixit','BSP',89000)],28.41,77.85),
  mkSeat(15,'Aligarh','Uttar Pradesh',[mkC('Satish Gautam','BJP',712000),mkC('Bijendra Singh','SP',498000),mkC('Shyam Sunder','BSP',76000)],27.89,78.08),
  mkSeat(16,'Hathras','Uttar Pradesh',[mkC('Anoop Pradhan','BJP',598000),mkC('Ramji Lal Suman','SP',521000),mkC('Brajesh Pathak','BSP',82000)],27.60,78.05),
  mkSeat(17,'Mathura','Uttar Pradesh',[mkC('Hema Malini','BJP',789000),mkC('Mukesh Dhangar','SP',423000),mkC('Suresh Pachouri','INC',71000)],27.49,77.67),
  mkSeat(18,'Agra','Uttar Pradesh',[mkC('SP Singh Baghel','BJP',723000),mkC('Rajkumar Chahal','SP',512000),mkC('Manish Jain','BSP',89000)],27.18,78.01),
  mkSeat(19,'Fatehpur Sikri','Uttar Pradesh',[mkC('Rajkumar Chahal','BJP',634000),mkC('Ramkumar','SP',567000),mkC('Guru Prasad','BSP',79000)],27.09,77.66),
  mkSeat(20,'Firozabad','Uttar Pradesh',[mkC('Akshay Yadav','SP',658000),mkC('Vishwadeep Singh','BJP',545000),mkC('Mevaram','BSP',88000)],27.16,78.39),
  mkSeat(21,'Mainpuri','Uttar Pradesh',[mkC('Dimple Yadav','SP',789000),mkC('Jaiveer Singh','BJP',487000),mkC('Shiv Prasad','BSP',67000)],27.23,79.02),
  mkSeat(22,'Etah','Uttar Pradesh',[mkC('Devesh Shakya','BJP',612000),mkC('Sanjay Sethiya','SP',534000),mkC('Ramesh Kumar','BSP',89000)],27.55,78.66),
  mkSeat(23,'Badaun','Uttar Pradesh',[mkC('Shivpal Singh Yadav','SP',634000),mkC('Sanghamitra Maurya','BJP',567000),mkC('Surendra Singh','BSP',78000)],28.04,79.12),
  mkSeat(24,'Aonla','Uttar Pradesh',[mkC('Dharmendra Kashyap','BJP',623000),mkC('Vinod Kumar','SP',456000),mkC('Shiv Gopal','BSP',89000)],28.26,79.14),
  mkSeat(25,'Bareilly','Uttar Pradesh',[mkC('Chhatrapal Gangwar','BJP',698000),mkC('Praveen Arya','SP',534000),mkC('Mohd Arif','BSP',91000)],28.35,79.43),
  mkSeat(26,'Pilibhit','Uttar Pradesh',[mkC('Jitin Prasada','BJP',634000),mkC('Bhagwat Gangwar','SP',512000),mkC('Hukum Singh','BSP',67000)],28.63,79.80),
  mkSeat(27,'Shahjahanpur','Uttar Pradesh',[mkC('Arun Sagar','BJP',598000),mkC('Karan Singh','SP',489000),mkC('Pappu Singh','BSP',78000)],27.88,79.91),
  mkSeat(28,'Kheri','Uttar Pradesh',[mkC('Ajay Kumar Mishra','BJP',712000),mkC('Utkarsh Verma','SP',589000),mkC('Sarvesh Kumar','BSP',89000)],27.95,80.79),
  mkSeat(29,'Dhaurahra','Uttar Pradesh',[mkC('Annu Tandon','BJP',589000),mkC('Sarojini Agarwal','SP',512000),mkC('Ram Manohar','BSP',78000)],27.57,80.52),
  mkSeat(30,'Sitapur','Uttar Pradesh',[mkC('Rajesh Verma','BJP',598000),mkC('Nakul Dubey','SP',534000),mkC('Bhagwan Prasad','BSP',89000)],27.56,80.68),
  mkSeat(31,'Hardoi','Uttar Pradesh',[mkC('Harsh Bahuguna','BJP',623000),mkC('Surendra Pal','SP',534000),mkC('Pradeep Singh','BSP',82000)],27.40,80.13),
  mkSeat(32,'Misrikh','Uttar Pradesh',[mkC('Ashok Rawat','BJP',589000),mkC('Anand Mishra','SP',523000),mkC('Ramkumar','BSP',76000)],27.18,80.06),
  mkSeat(33,'Unnao','Uttar Pradesh',[mkC('Sakshi Maharaj','BJP',634000),mkC('Annu Tandon','SP',567000),mkC('Shiva Shakti','BSP',89000)],26.55,80.49),
  mkSeat(34,'Mohanlalganj','Uttar Pradesh',[mkC('Kaushal Kishore','BJP',612000),mkC('RK Chaudhary','SP',523000),mkC('Pramod Kumar','BSP',83000)],26.72,80.97),
  mkSeat(35,'Lucknow','Uttar Pradesh',[mkC('Rajnath Singh','BJP',712000),mkC('Ravidas Mehrotra','SP',445000),mkC('Pooja Pandey','INC',71000)],26.85,80.95),
  mkSeat(36,'Rae Bareli','Uttar Pradesh',[mkC('Rahul Gandhi','INC',689000),mkC('Dinesh Pratap Singh','BJP',476000),mkC('Thakur Prasad','BSP',67000)],26.22,81.24),
  mkSeat(37,'Amethi','Uttar Pradesh',[mkC('KL Sharma','INC',567000),mkC('Smriti Irani','BJP',532000),mkC('Bhoori Singh','BSP',56000)],26.15,81.72),
  mkSeat(38,'Sultanpur','Uttar Pradesh',[mkC('Maneka Gandhi','BJP',534000),mkC('Ram Bhual Nishad','SP',489000),mkC('Chandra Bhushan','BSP',71000)],26.26,82.07),
  mkSeat(39,'Pratapgarh','Uttar Pradesh',[mkC('Sangam Lal Gupta','BJP',589000),mkC('SP Singh Patel','SP',512000),mkC('Ramkumar','BSP',71000)],25.89,81.99),
  mkSeat(40,'Farrukhabad','Uttar Pradesh',[mkC('Mukesh Rajput','BJP',598000),mkC('Manoj Kumar','SP',523000),mkC('Ramsharan','BSP',78000)],27.39,79.58),
  mkSeat(41,'Etawah','Uttar Pradesh',[mkC('Subhash Pusikar','BJP',612000),mkC('Amit Kumar','SP',534000),mkC('Ram Khilawan','BSP',82000)],26.79,79.01),
  mkSeat(42,'Kannauj','Uttar Pradesh',[mkC('Akhilesh Yadav','SP',789000),mkC('Subhash Pusikar','BJP',489000),mkC('Rakesh Kumar','BSP',56000)],27.06,79.91),
  mkSeat(43,'Kanpur','Uttar Pradesh',[mkC('Ramesh Awasthi','BJP',712000),mkC('Alok Mishra','SP',534000),mkC('Sushil Gupta','INC',68000)],26.46,80.35),
  mkSeat(44,'Akbarpur','Uttar Pradesh',[mkC('Devendra Bhole','BJP',589000),mkC('Rajaram Pal','SP',512000),mkC('Ram Balak','BSP',78000)],26.42,79.94),
  mkSeat(45,'Jalaun','Uttar Pradesh',[mkC('Bhanu Verma','BJP',623000),mkC('Vikas Sahai','SP',478000),mkC('Manoj Kumar','BSP',82000)],26.14,79.36),
  mkSeat(46,'Jhansi','Uttar Pradesh',[mkC('Anurag Sharma','BJP',634000),mkC('Shiv Govind','SP',489000),mkC('Prem Singh','BSP',78000)],25.45,78.57),
  mkSeat(47,'Hamirpur','Uttar Pradesh',[mkC('Pushpendra Chandel','BJP',598000),mkC('Vinod Katare','SP',456000),mkC('Rajendra Pal','BSP',71000)],25.94,80.14),
  mkSeat(48,'Banda','Uttar Pradesh',[mkC('RK Singh Patel','BJP',567000),mkC('Krishna Pal','SP',489000),mkC('Kamla Singh','BSP',67000)],25.48,80.34),
  mkSeat(49,'Fatehpur','Uttar Pradesh',[mkC('Sadhna Singh','BJP',589000),mkC('Pushpendra Saroj','SP',523000),mkC('Arjun Lal','BSP',71000)],25.93,80.81),
  mkSeat(50,'Kaushambi','Uttar Pradesh',[mkC('Vinod Sonkar','BJP',578000),mkC('Pradeep Sonkar','SP',512000),mkC('Shyam Lal','BSP',67000)],25.55,81.37),
  mkSeat(51,'Allahabad','Uttar Pradesh',[mkC('Neeraj Tripathi','BJP',634000),mkC('Ujjwal Raman Singh','SP',534000),mkC('Reoti Raman','BSP',78000)],25.45,81.84),
  mkSeat(52,'Phulpur','Uttar Pradesh',[mkC('Praveen Patel','BJP',612000),mkC('Amarnath Maurya','SP',567000),mkC('Devendra Kumar','BSP',76000)],25.54,81.58),
  mkSeat(53,'Ambedkar Nagar','Uttar Pradesh',[mkC('Lallu Singh','BJP',578000),mkC('Ritesh Pandey','SP',545000),mkC('Hari Prasad','BSP',71000)],26.47,82.60),
  mkSeat(54,'Shravasti','Uttar Pradesh',[mkC('Siddharth Nath Singh','BJP',545000),mkC('Ram Shiromani','SP',489000),mkC('Bhagwan Das','BSP',67000)],27.40,81.84),
  mkSeat(55,'Domariyaganj','Uttar Pradesh',[mkC('Jagdambika Pal','BJP',567000),mkC('Manoj Pandey','SP',512000),mkC('Rajesh Kumar','BSP',71000)],27.21,82.76),
  mkSeat(56,'Basti','Uttar Pradesh',[mkC('Harish Dwivedi','BJP',589000),mkC('Ram Prasad','SP',489000),mkC('Suresh Kumar','BSP',67000)],26.80,82.74),
  mkSeat(57,'Sant Kabir Nagar','Uttar Pradesh',[mkC('Praveen Nishad','BJP',567000),mkC('Lalai Bhai','SP',489000),mkC('Raj Bahadur','BSP',67000)],27.09,83.01),
  mkSeat(58,'Maharajganj','Uttar Pradesh',[mkC('Pankaj Choudhary','BJP',598000),mkC('Virendra Chaudhary','SP',489000),mkC('Raj Kumar','BSP',71000)],27.13,83.56),
  mkSeat(59,'Gorakhpur','Uttar Pradesh',[mkC('Ravi Kishan','BJP',712000),mkC('Kajal Nishad','SP',534000),mkC('Shyam Lal','BSP',67000)],26.76,83.37),
  mkSeat(60,'Kushinagar','Uttar Pradesh',[mkC('Vijay Dubey','BJP',589000),mkC('Bimal Srivastava','SP',512000),mkC('Raj Mani','BSP',71000)],26.74,83.89),
  mkSeat(61,'Deoria','Uttar Pradesh',[mkC('Akhilesh Singh','BJP',612000),mkC('Shashank Tripathi','SP',534000),mkC('Vikas Mishra','BSP',71000)],26.50,83.78),
  mkSeat(62,'Bansgaon','Uttar Pradesh',[mkC('Kamlesh Paswan','BJP',578000),mkC('Sadal Prasad','SP',489000),mkC('Beli Ram','BSP',67000)],26.55,83.36),
  mkSeat(63,'Lalganj','Uttar Pradesh',[mkC('Neelam Sonkar','BJP',556000),mkC('Daroga Saroj','SP',489000),mkC('Mahadev Yadav','BSP',67000)],25.72,82.99),
  mkSeat(64,'Azamgarh','Uttar Pradesh',[mkC('Dharmendra Yadav','SP',634000),mkC('Dinesh Lal Yadav','BJP',512000),mkC('Shah Alam','BSP',71000)],26.07,83.18),
  mkSeat(65,'Ghosi','Uttar Pradesh',[mkC('Arvind Rajbhar','BJP',578000),mkC('Ripu Sagar','SP',534000),mkC('Anand Kumar','BSP',67000)],26.07,83.55),
  mkSeat(66,'Salempur','Uttar Pradesh',[mkC('Ravindra Kushwaha','BJP',589000),mkC('Papu Mishra','SP',512000),mkC('Dinesh Kumar','BSP',67000)],26.29,83.88),
  mkSeat(67,'Ballia','Uttar Pradesh',[mkC('Neeraj Shekhar','BJP',612000),mkC('Sanaullah Khan','SP',489000),mkC('Ram Jiwan','BSP',71000)],25.76,84.15),
  mkSeat(68,'Jaunpur','Uttar Pradesh',[mkC('Krishna Pratap Singh','BJP',598000),mkC('Babu Singha Ram','SP',534000),mkC('Dharmendra Singh','BSP',71000)],25.72,82.69),
  mkSeat(69,'Machhlishahr','Uttar Pradesh',[mkC('Bhupendra Chaudhary','BJP',578000),mkC('Tunna Ramnik','SP',489000),mkC('Raj Kumar','BSP',67000)],25.82,82.54),
  mkSeat(70,'Ghazipur','Uttar Pradesh',[mkC('Afzal Ansari','SP',623000),mkC('Parashu Nath','BJP',567000),mkC('Umashankar Singh','BSP',71000)],25.58,83.58),
  mkSeat(71,'Chandauli','Uttar Pradesh',[mkC('Mahendra Nath Pandey','BJP',612000),mkC('Birendra Mast','SP',523000),mkC('Satish Chandra','BSP',67000)],25.28,83.27),
  mkSeat(72,'Varanasi','Uttar Pradesh',[mkC('Narendra Modi','BJP',612000),mkC('Ajay Rai','INC',467000),mkC('Sanjay Chaurasiya','SP',231000)],25.32,82.97),
  mkSeat(73,'Bhadohi','Uttar Pradesh',[mkC('Vinod Bind','BJP',578000),mkC('Laliteshpati Tripathi','SP',512000),mkC('Surendra Kumar','BSP',71000)],25.39,82.57),
  mkSeat(74,'Mirzapur','Uttar Pradesh',[mkC('Anupriya Patel','BJP',589000),mkC('Ram Nishad','SP',489000),mkC('Shyam Narain','BSP',67000)],25.15,82.57),
  mkSeat(75,'Robert Ganj','Uttar Pradesh',[mkC('Pakouri Lal Kol','BJP',545000),mkC('Chhote Lal','SP',456000),mkC('Bhagwan Das','BSP',71000)],24.69,83.06),
  mkSeat(76,'Gonda','Uttar Pradesh',[mkC('Kirti Vardhan Singh','BJP',589000),mkC('Shreya Verma','SP',512000),mkC('Brijesh Singh','BSP',67000)],26.77,81.96),
  mkSeat(77,'Kaiserganj','Uttar Pradesh',[mkC('Brij Bhushan Singh','BJP',534000),mkC('Praveen Kumar','SP',467000),mkC('Ram Naresh','BSP',62000)],27.26,81.64),
  mkSeat(78,'Bahraich','Uttar Pradesh',[mkC('Anand Dubey','BJP',567000),mkC('Ramesh Awasthi','SP',489000),mkC('Shri Ram','BSP',67000)],27.57,81.59),
  mkSeat(79,'Shrawasti','Uttar Pradesh',[mkC('Ram Shiromani','SP',512000),mkC('Sakshi Maharaj','BJP',489000),mkC('Raj Kumar','BSP',56000)],27.52,81.80),
  mkSeat(80,'Faizabad','Uttar Pradesh',[mkC('Awadhesh Prasad','SP',554000),mkC('Lallu Singh','BJP',499000),mkC('Sachin Rawat','BSP',45000)],26.77,82.15),
];

// MH 2024
const mh2024cs = [
  mkSeat(1,'Nandurbar','Maharashtra',[mkC('Heena Gavit','BJP',612000),mkC('Govalsingbhai Padavi','INC',498000)],21.37,74.24),
  mkSeat(2,'Dhule','Maharashtra',[mkC('Subhash Bhamre','BJP',589000),mkC('Shobha Bachav','INC',467000)],20.90,74.78),
  mkSeat(3,'Jalgaon','Maharashtra',[mkC('Smita Wagh','BJP',712000),mkC('Kailash Patil','INC',423000)],21.00,75.56),
  mkSeat(4,'Raver','Maharashtra',[mkC('Raksha Khadse','BJP',634000),mkC('Shreeram Patil','INC',456000)],21.23,75.96),
  mkSeat(5,'Buldhana','Maharashtra',[mkC('Prataprao Jadhav','SS',589000),mkC('Narendrakumar Patil','TMC',512000)],20.53,76.18),
  mkSeat(6,'Akola','Maharashtra',[mkC('Anup Dhotre','BJP',578000),mkC('Abhay Patil','INC',456000)],20.71,77.00),
  mkSeat(7,'Amravati','Maharashtra',[mkC('Navneet Rana','BJP',623000),mkC('Balwant Wankhade','INC',523000)],20.93,77.75),
  mkSeat(8,'Wardha','Maharashtra',[mkC('Ramdas Tadas','BJP',589000),mkC('Amar Kale','INC',512000)],20.75,78.60),
  mkSeat(9,'Ramtek','Maharashtra',[mkC('Raju Parve','BJP',567000),mkC('Charan Singh','INC',489000)],21.40,79.33),
  mkSeat(10,'Nagpur','Maharashtra',[mkC('Nitin Gadkari','BJP',789000),mkC('Vikas Thakre','INC',512000)],21.15,79.08),
  mkSeat(11,'Bhandara-Gondiya','Maharashtra',[mkC('Sunil Mendhe','BJP',567000),mkC('Prashant Padole','INC',489000)],21.16,79.66),
  mkSeat(12,'Gadchiroli-Chimur','Maharashtra',[mkC('Ashok Nete','BJP',534000),mkC('Dr Namidev Usendi','INC',456000)],20.19,80.00),
  mkSeat(13,'Chandrapur','Maharashtra',[mkC('Sudhir Mungantiwar','BJP',589000),mkC('Pratibha Dhanorkar','INC',534000)],20.07,79.30),
  mkSeat(14,'Yavatmal-Washim','Maharashtra',[mkC('Rajashri Patil','BJP',567000),mkC('Sanjay Deshmukh','SP',512000)],20.37,77.57),
  mkSeat(15,'Hingoli','Maharashtra',[mkC('Bachchu Kadu','SS',545000),mkC('Nagesh Ashtikar','INC',489000)],19.72,77.15),
  mkSeat(16,'Nanded','Maharashtra',[mkC('Ashok Chavan','BJP',578000),mkC('Vasant Chavan','INC',534000)],19.17,77.31),
  mkSeat(17,'Latur','Maharashtra',[mkC('Sudhakar Shrangare','BJP',589000),mkC('Shivraj Patil','INC',512000)],18.40,76.58),
  mkSeat(18,'Osmanabad','Maharashtra',[mkC('Omprakash Bhupalsinh','SS',567000),mkC('Dhairyasheel Mohite','NCP',534000)],18.18,76.04),
  mkSeat(19,'Solapur','Maharashtra',[mkC('Ram Satpute','BJP',623000),mkC('Praniti Shinde','INC',545000)],17.69,75.90),
  mkSeat(20,'Madha','Maharashtra',[mkC('Ranjitsinh Nimbalkar','BJP',589000),mkC('Sanjaymama Shinde','NCP',512000)],17.63,75.28),
  mkSeat(21,'Sangli','Maharashtra',[mkC('Sanjay Kaka Patil','BJP',567000),mkC('Vishal Patil','INC',534000)],16.86,74.57),
  mkSeat(22,'Satara','Maharashtra',[mkC('Udayan Raje Bhosale','BJP',589000),mkC('Shrinivas Patil','NCP',545000)],17.68,74.00),
  mkSeat(23,'Ratnagiri-Sindhudurg','Maharashtra',[mkC('Narayan Rane','BJP',578000),mkC('Vinayak Raut','SS',489000)],16.99,73.30),
  mkSeat(24,'Kolhapur','Maharashtra',[mkC('Chhatrapati Shahu','INC',634000),mkC('Sanjay Mandlik','BJP',512000)],16.70,74.24),
  mkSeat(25,'Hatkanangle','Maharashtra',[mkC('Dhairyasheel Mane','SS',567000),mkC('Raju Shetti','BJP',512000)],16.83,74.26),
  mkSeat(26,'Nashik','Maharashtra',[mkC('Hemant Godse','SS',623000),mkC('Rajabhau Waje','INC',512000)],19.99,73.79),
  mkSeat(27,'Palghar','Maharashtra',[mkC('Hemant Savara','BJP',578000),mkC('Bapu Supe','INC',489000)],19.70,72.77),
  mkSeat(28,'Bhiwandi','Maharashtra',[mkC('Kapil Patil','BJP',589000),mkC('Suresh Mhatre','SS',456000)],19.30,73.05),
  mkSeat(29,'Kalyan','Maharashtra',[mkC('Shrikant Shinde','SS',712000),mkC('Vaishali Darekar','INC',489000)],19.23,73.13),
  mkSeat(30,'Thane','Maharashtra',[mkC('Naresh Mhaske','SS',745000),mkC('Rajan Vichare','INC',456000)],19.21,72.98),
  mkSeat(31,'Mumbai North','Maharashtra',[mkC('Piyush Goyal','BJP',678000),mkC('Bhushan Patil','INC',489000)],19.22,72.87),
  mkSeat(32,'Mumbai North West','Maharashtra',[mkC('Ravindra Waikar','SS',567000),mkC('Amol Kirtikar','SS(UBT)',561000)],19.16,72.84),
  mkSeat(33,'Mumbai North East','Maharashtra',[mkC('Mihir Kotecha','BJP',634000),mkC('Sanjay Dina Patil','SS(UBT)',567000)],19.08,72.93),
  mkSeat(34,'Mumbai North Central','Maharashtra',[mkC('Ujjwal Nikam','BJP',645000),mkC('Varsha Gaikwad','INC',578000)],19.07,72.88),
  mkSeat(35,'Mumbai South Central','Maharashtra',[mkC('Rahul Shewale','SS',589000),mkC('Aneal Khatri','INC',456000)],18.98,72.85),
  mkSeat(36,'Mumbai South','Maharashtra',[mkC('Arvind Sawant','SS(UBT)',567000),mkC('Yamini Jadhav','SS',512000)],18.93,72.84),
  mkSeat(37,'Raigad','Maharashtra',[mkC('Sunil Tatkare','NCP',645000),mkC('Anand Paranjpe','SS(UBT)',489000)],18.51,73.18),
  mkSeat(38,'Maval','Maharashtra',[mkC('Shrirang Barne','SS',634000),mkC('Sandeep Naik','NCP(SP)',567000)],18.76,73.40),
  mkSeat(39,'Pune','Maharashtra',[mkC('Murlidhar Mohol','BJP',712000),mkC('Ravindra Dhangekar','INC',645000)],18.52,73.86),
  mkSeat(40,'Baramati','Maharashtra',[mkC('Sunetra Pawar','NCP',634000),mkC('Supriya Sule','NCP(SP)',621000)],18.15,74.58),
  mkSeat(41,'Shirur','Maharashtra',[mkC('Amol Kolhe','NCP(SP)',589000),mkC('Shivajirao Adhalrao','NCP',534000)],18.84,74.37),
  mkSeat(42,'Ahmadnagar','Maharashtra',[mkC('Nilesh Lanke','NCP(SP)',623000),mkC('Sujay Vikhe Patil','BJP',567000)],19.09,74.74),
  mkSeat(43,'Shirdi','Maharashtra',[mkC('Sadashiv Lokhande','SS',589000),mkC('Bhausaheb Wakchure','INC',512000)],19.78,74.48),
  mkSeat(44,'Beed','Maharashtra',[mkC('Pankaja Munde','BJP',612000),mkC('Bajrang Sonawane','INC',578000)],18.99,75.77),
  mkSeat(45,'Jalna','Maharashtra',[mkC('Raosaheb Danve','BJP',598000),mkC('Kailash Gorantyal','INC',489000)],19.84,75.88),
  mkSeat(46,'Aurangabad','Maharashtra',[mkC('Sandipan Bhumre','SS',623000),mkC('Imtiaz Jaleel','AIMIM',567000)],19.88,75.34),
  mkSeat(47,'Dindori','Maharashtra',[mkC('Bharati Pawar','BJP',589000),mkC('Dhanraj Mahale','INC',456000)],20.21,73.74),
  mkSeat(48,'Shirpur','Maharashtra',[mkC('Narendrakumar Patil','NCP',545000),mkC('Rakesh Walse Patil','BJP',489000)],21.35,74.89),
];

// Assembly 2023 MP
const mp2023cs = [
  mkSeat(1,'Sheopur','Madhya Pradesh',[mkC('Nirmala Bhuria','BJP',89000),mkC('Ram Lal','INC',72000)],25.67,76.71,'Morena','AC'),
  mkSeat(2,'Vijaypur','Madhya Pradesh',[mkC('Rajendra Shukla','BJP',92000),mkC('Uday Pratap','INC',78000)],26.01,76.60,'Morena','AC'),
  mkSeat(3,'Sabalgarh','Madhya Pradesh',[mkC('Madan Lal Sharma','BJP',87000),mkC('Bharat Singh','INC',71000)],26.24,77.33,'Morena','AC'),
  mkSeat(4,'Joura','Madhya Pradesh',[mkC('Sohan Lal Sharma','BJP',91000),mkC('Rajesh Kumar','INC',76000)],26.25,78.43,'Morena','AC'),
  mkSeat(5,'Sumawali','Madhya Pradesh',[mkC('Aikya Vishwakarma','BJP',88000),mkC('Ravindra Kumar','INC',73000)],26.48,77.64,'Gwalior','AC'),
  mkSeat(6,'Morena','Madhya Pradesh',[mkC('Giriraj Dandotia','BJP',95000),mkC('Ramniwas Rawat','INC',81000)],26.50,77.99,'Morena','AC'),
  mkSeat(7,'Kailaras','Madhya Pradesh',[mkC('Arvind Bhadauria','BJP',89000),mkC('Manoj Chaturvedi','INC',74000)],26.32,77.61,'Morena','AC'),
  mkSeat(8,'Dimani','Madhya Pradesh',[mkC('Subhash Dhakad','BJP',86000),mkC('Devraj Singh','INC',72000)],26.26,77.75,'Morena','AC'),
  mkSeat(9,'Ambah','Madhya Pradesh',[mkC('Rajesh Sharma','BJP',93000),mkC('Ramesh Malviya','INC',79000)],26.70,78.22,'Morena','AC'),
  mkSeat(10,'Ater','Madhya Pradesh',[mkC('Suresh Dhangar','BJP',91000),mkC('Devendra Jatav','INC',77000)],26.44,78.67,'Bhind','AC'),
  mkSeat(11,'Bhind','Madhya Pradesh',[mkC('Sanjeev Kushwah','BJP',96000),mkC('Hemant Katare','INC',82000)],26.56,78.78,'Bhind','AC'),
  mkSeat(12,'Lahar','Madhya Pradesh',[mkC('Antar Singh Arya','BJP',88000),mkC('Kamlesh Choudhary','INC',74000)],26.21,78.94,'Bhind','AC'),
  mkSeat(13,'Mehgaon','Madhya Pradesh',[mkC('Om Prakash Khatik','BJP',87000),mkC('Rajkumar Singh','INC',73000)],26.26,79.24,'Bhind','AC'),
  mkSeat(14,'Gohad','Madhya Pradesh',[mkC('Ranveer Jatav','INC',94000),mkC('Prabhu Jatav','BJP',89000)],26.43,78.45,'Gwalior','AC'),
  mkSeat(15,'Dabra','Madhya Pradesh',[mkC('Imarti Devi','BJP',91000),mkC('Suresh Raje','INC',77000)],25.89,78.34,'Gwalior','AC'),
  mkSeat(16,'Bhitarwar','Madhya Pradesh',[mkC('Mohanlal','BJP',89000),mkC('Giridhari Lal','INC',73000)],25.77,78.12,'Gwalior','AC'),
  mkSeat(17,'Gwalior Rural','Madhya Pradesh',[mkC('Satish Sikarwar','BJP',93000),mkC('Mukesh Soni','INC',78000)],26.22,77.95,'Gwalior','AC'),
  mkSeat(18,'Gwalior','Madhya Pradesh',[mkC('Praveen Pathak','BJP',98000),mkC('Devendra Sharma','INC',84000)],26.21,78.18,'Gwalior','AC'),
  mkSeat(19,'Gwalior East','Madhya Pradesh',[mkC('Mohan Rathore','BJP',94000),mkC('Satish Sikarwar','INC',80000)],26.22,78.24,'Gwalior','AC'),
  mkSeat(20,'Gwalior South','Madhya Pradesh',[mkC('Narayan Kushwaha','BJP',92000),mkC('Surendra Singh','INC',77000)],26.18,78.15,'Gwalior','AC'),
  mkSeat(21,'Bhander','Madhya Pradesh',[mkC('Rakesh Mawai','BJP',87000),mkC('Tariq Masood','INC',73000)],25.70,78.74,'Gwalior','AC'),
  mkSeat(22,'Karera','Madhya Pradesh',[mkC('Rakesh Chaturvedi','BJP',89000),mkC('Pratap Singh','INC',74000)],25.46,78.14,'Guna','AC'),
  mkSeat(23,'Pohari','Madhya Pradesh',[mkC('Rajesh Porwal','BJP',86000),mkC('Kuldeep Singh','INC',72000)],25.22,77.57,'Guna','AC'),
  mkSeat(24,'Shivpuri','Madhya Pradesh',[mkC('Yashpal Sisodia','BJP',97000),mkC('Praveen Dwivedi','INC',81000)],25.43,77.66,'Guna','AC'),
  mkSeat(25,'Pichhore','Madhya Pradesh',[mkC('Priyadarshi','BJP',88000),mkC('Braj Bhushan','INC',73000)],25.00,77.37,'Guna','AC'),
  mkSeat(26,'Kolaras','Madhya Pradesh',[mkC('Sunder Lal Tiwari','BJP',91000),mkC('Mahendra Singh','INC',76000)],25.22,77.06,'Guna','AC'),
  mkSeat(27,'Mungaoli','Madhya Pradesh',[mkC('Brijendra Singh','BJP',89000),mkC('Kailash Gupta','INC',74000)],24.41,76.78,'Guna','AC'),
  mkSeat(28,'Ashok Nagar','Madhya Pradesh',[mkC('Jayant Malaiya','BJP',93000),mkC('Ram Singh','INC',78000)],24.58,77.73,'Guna','AC'),
  mkSeat(29,'Chanderi','Madhya Pradesh',[mkC('Ram Kishore Dogra','BJP',87000),mkC('Pradyumna','INC',72000)],24.72,78.96,'Guna','AC'),
  mkSeat(30,'Guna','Madhya Pradesh',[mkC('Saurabh Sisodia','BJP',98000),mkC('Raghuraj Singh','INC',83000)],24.65,77.32,'Guna','AC'),
  mkSeat(31,'Bhopal Uttar','Madhya Pradesh',[mkC('Rameshwar Sharma','BJP',102000),mkC('Arif Masood','INC',87000)],23.27,77.40,'Bhopal','AC'),
  mkSeat(32,'Bhopal Dakshin Paschim','Madhya Pradesh',[mkC('Bhupendra Singh','BJP',95000),mkC('PC Sharma','INC',83000)],23.25,77.41,'Bhopal','AC'),
  mkSeat(33,'Bhopal Madhya','Madhya Pradesh',[mkC('Suraj Singh Thakur','BJP',97000),mkC('Saleem Patel','INC',79000)],23.26,77.43,'Bhopal','AC'),
  mkSeat(34,'Govindpura','Madhya Pradesh',[mkC('Krishna Gaur','BJP',104000),mkC('Pradeep Pandey','INC',86000)],23.28,77.46,'Bhopal','AC'),
  mkSeat(35,'Huzur','Madhya Pradesh',[mkC('Rameshwar Sharma','BJP',99000),mkC('Suresh Pachouri','INC',84000)],23.29,77.48,'Bhopal','AC'),
  mkSeat(36,'Narela','Madhya Pradesh',[mkC('Vishnu Khatri','BJP',91000),mkC('Phool Singh Baraiya','INC',77000)],23.23,77.38,'Bhopal','AC'),
  mkSeat(37,'Berasia','Madhya Pradesh',[mkC('Raghunandan Sharma','BJP',88000),mkC('Om Prakash Patel','INC',74000)],23.48,77.43,'Bhopal','AC'),
  mkSeat(38,'Indore 1','Madhya Pradesh',[mkC('Kailash Vijayavargiya','BJP',108000),mkC('Sanjay Shukla','INC',81000)],22.72,75.86,'Indore','AC'),
  mkSeat(39,'Indore 2','Madhya Pradesh',[mkC('Ramesh Mendola','BJP',103000),mkC('Dilip Patel','INC',78000)],22.74,75.86,'Indore','AC'),
  mkSeat(40,'Indore 3','Madhya Pradesh',[mkC('Akash Vijayvargiya','BJP',97000),mkC('Pinky Jain','INC',80000)],22.73,75.88,'Indore','AC'),
];

const ls2019_UP = [
  mkSeat(1,'Saharanpur','Uttar Pradesh',[mkC('Raghav Lakhanpal','BJP',634000),mkC('Imran Masood','BSP',512000),mkC('Fazlur Rehman','INC',78000)],29.97,77.54),
  mkSeat(2,'Kairana','Uttar Pradesh',[mkC('Pradeep Chaudhary','BJP',612000),mkC('Iqra Hasan','SP',489000),mkC('Harendra Malik','BSP',67000)],29.49,77.21),
  mkSeat(3,'Muzaffarnagar','Uttar Pradesh',[mkC('Sanjeev Balyan','BJP',631000),mkC('Harishankar Malik','SP',421000),mkC('Mast Ali','BSP',89000)],29.47,77.70),
  mkSeat(4,'Bijnor','Uttar Pradesh',[mkC('Kunwar Bharatendra Singh','BJP',598000),mkC('Malook Nagar','SP',467000),mkC('Shafiqur Rahman','BSP',78000)],29.37,78.14),
  mkSeat(5,'Nagina','Uttar Pradesh',[mkC('Girish Chandra','BJP',567000),mkC('Yashwant Singh','BSP',478000),mkC('Omveer Singh','SP',89000)],29.44,78.44),
  mkSeat(6,'Moradabad','Uttar Pradesh',[mkC('Sarvesh Kumar','BJP',589000),mkC('ST Hasan','SP',534000),mkC('Imran Pratapgarhi','INC',67000)],28.84,78.78),
  mkSeat(7,'Rampur','Uttar Pradesh',[mkC('Jaya Prada','BJP',534000),mkC('Azam Khan','SP',689000),mkC('Saurabh Singhal','BSP',56000)],28.79,79.01),
  mkSeat(8,'Sambhal','Uttar Pradesh',[mkC('Parmeshwar Lal Saini','BJP',556000),mkC('Shafiqur Rahman Barq','SP',523000),mkC('Iqbal Mehmood','BSP',78000)],28.59,78.57),
];

const ls2019_MH = [
  mkSeat(1,'Nandurbar','Maharashtra',[mkC('Heena Gavit','BJP',578000),mkC('KD Vasave','INC',456000)],21.37,74.24),
  mkSeat(2,'Dhule','Maharashtra',[mkC('Subhash Bhamre','BJP',567000),mkC('Rupali Chakankar','INC',423000)],20.90,74.78),
  mkSeat(3,'Jalgaon','Maharashtra',[mkC('AK Patil','BJP',689000),mkC('Gulabrao Deokar','INC',398000)],21.00,75.56),
  mkSeat(4,'Raver','Maharashtra',[mkC('Raksha Khadse','BJP',612000),mkC('Ulhas Patil','INC',412000)],21.23,75.96),
  mkSeat(5,'Buldhana','Maharashtra',[mkC('Prataprao Jadhav','SS',578000),mkC('Rajendra Shekhawat','INC',489000)],20.53,76.18),
  mkSeat(6,'Akola','Maharashtra',[mkC('Anup Dhotre','BJP',556000),mkC('Himat Patil','INC',423000)],20.71,77.00),
  mkSeat(7,'Amravati','Maharashtra',[mkC('Navneet Rana','Independent',567000),mkC('Anand Adsul','SS',512000)],20.93,77.75),
  mkSeat(8,'Wardha','Maharashtra',[mkC('Ramdas Tadas','BJP',545000),mkC('Charanjeet Singh Sapra','INC',467000)],20.75,78.60),
];

export const MOCK_DB = {
  '2024|Lok Sabha|Uttar Pradesh': { year:2024, type:'Lok Sabha', state:'Uttar Pradesh', totalSeats:80, status:'Declared', constituencies:up2024cs, partySummary:buildPS(up2024cs) },
  '2024|Lok Sabha|Maharashtra': { year:2024, type:'Lok Sabha', state:'Maharashtra', totalSeats:48, status:'Declared', constituencies:mh2024cs, partySummary:buildPS(mh2024cs) },
  '2023|Assembly|Madhya Pradesh': { year:2023, type:'Assembly', state:'Madhya Pradesh', totalSeats:230, status:'Declared', constituencies:mp2023cs, partySummary:buildPS(mp2023cs) },
  '2019|Lok Sabha|Uttar Pradesh': { year:2019, type:'Lok Sabha', state:'Uttar Pradesh', totalSeats:80, status:'Declared', constituencies:ls2019_UP, partySummary:buildPS(ls2019_UP) },
  '2019|Lok Sabha|Maharashtra': { year:2019, type:'Lok Sabha', state:'Maharashtra', totalSeats:48, status:'Declared', constituencies:ls2019_MH, partySummary:buildPS(ls2019_MH) },
};

export const YEARS = [2024, 2023, 2022, 2019, 2014];
export const TYPES = ['Lok Sabha', 'Assembly'];
export const STATES_BY = {
  '2024|Lok Sabha': ['Uttar Pradesh', 'Maharashtra'],
  '2023|Assembly': ['Madhya Pradesh'],
  '2022|Assembly': ['Uttar Pradesh'],
  '2019|Lok Sabha': ['Uttar Pradesh', 'Maharashtra'],
};

// ============================================================
// National PC 2024 Summary — feeds the homepage pie chart, alliance table,
// and the detailed-results breakdown. Shape matches HomePage.js expectations:
//   parties:    [{ name, value (voteShare%), color, seats, contested }]
//   alliances:  [{ name, seats, voteShare, contestedVoteShare, color }]
// Figures rounded to public Lok Sabha 2024 results.
// ============================================================
export const NATIONAL_PC_2024 = {
  year: 2024,
  totalSeats: 543,
  totalStates: 36,
  totalVoters: 968800000,
  turnout: 65.8,
  totalCandidates: 8360,
  parties: [
    { name: 'BJP',    value: 36.9, seats: 240, contested: 441, color: PARTY_COLORS.BJP },
    { name: 'INC',    value: 21.4, seats: 99,  contested: 328, color: PARTY_COLORS.INC },
    { name: 'SP',     value: 4.6,  seats: 37,  contested: 71,  color: PARTY_COLORS.SP },
    { name: 'AITC',   value: 4.4,  seats: 29,  contested: 48,  color: '#f9a8d4' },
    { name: 'BSP',    value: 2.1,  seats: 0,   contested: 488, color: PARTY_COLORS.BSP },
    { name: 'OTHERS', value: 30.6, seats: 138, contested: 0,   color: '#94a3b8' },
  ],
  alliances: [
    { name: 'NDA',    seats: 292, voteShare: 43.6, contestedVoteShare: 44.3, color: PARTY_COLORS.BJP },
    { name: 'I.N.D.I.A', seats: 230, voteShare: 36.7, contestedVoteShare: 37.2, color: PARTY_COLORS.INC },
  ],
  detailedDefaultState: 'Uttar Pradesh',
};

// ============================================================
// Recent Assembly Elections — mini cards on the homepage.
// Each card has `rows` (party / won / swing / color) — top 3 are shown.
// ============================================================
export const RECENT_ASSEMBLY_ELECTIONS = [
  {
    state: 'Maharashtra', year: 2024,
    bannerFrom: '#fff5e6', bannerTo: '#ffe1b3',
    rows: [
      { party: 'BJP',  won: 132, swing: 27,  color: PARTY_COLORS.BJP },
      { party: 'SS',   won: 57,  swing: 17,  color: PARTY_COLORS.SS },
      { party: 'NCP',  won: 41,  swing: 15,  color: PARTY_COLORS.NCP },
    ],
  },
  {
    state: 'Jharkhand', year: 2024,
    bannerFrom: '#e8f5e9', bannerTo: '#c8e6c9',
    rows: [
      { party: 'JMM',  won: 34, swing: 4,  color: '#2E7D32' },
      { party: 'BJP',  won: 21, swing: -4, color: PARTY_COLORS.BJP },
      { party: 'INC',  won: 16, swing: 0,  color: PARTY_COLORS.INC },
    ],
  },
  {
    state: 'Haryana', year: 2024,
    bannerFrom: '#fff3e0', bannerTo: '#ffe0b2',
    rows: [
      { party: 'BJP',  won: 48, swing: 8, color: PARTY_COLORS.BJP },
      { party: 'INC',  won: 37, swing: 6, color: PARTY_COLORS.INC },
      { party: 'IND',  won: 3,  swing: 2, color: '#757575' },
    ],
  },
  {
    state: 'Madhya Pradesh', year: 2023,
    bannerFrom: '#fff8e1', bannerTo: '#ffecb3',
    rows: [
      { party: 'BJP',  won: 163, swing: 54,  color: PARTY_COLORS.BJP },
      { party: 'INC',  won: 66,  swing: -48, color: PARTY_COLORS.INC },
      { party: 'IND',  won: 1,   swing: 1,   color: '#757575' },
    ],
  },
  {
    state: 'Rajasthan', year: 2023,
    bannerFrom: '#fce4ec', bannerTo: '#f8bbd0',
    rows: [
      { party: 'BJP',  won: 115, swing: 42,  color: PARTY_COLORS.BJP },
      { party: 'INC',  won: 69,  swing: -31, color: PARTY_COLORS.INC },
      { party: 'IND',  won: 8,   swing: 5,   color: '#757575' },
    ],
  },
];

// ============================================================
// Derived previous-election data for comparison views.
// We re-use the constituency names + coordinates of each current election
// and synthesize plausible historical results (different winner parties,
// scaled vote totals to reflect population growth between cycles).
//
// This keeps the comparison page useful even when only the most recent
// election has been uploaded for a state.
// ============================================================
function deriveHistorical(cs, { winnerParty, runnerupParty, otherParties = [], voteFactor = 0.9, swingPct = 0 }) {
  return cs.map(c => {
    const totalPrev = Math.round(c.totalVotesCast * voteFactor);
    // Distribute votes: winner ~52% +/- swing, 2nd ~38%, 3rd ~6%, others split rest
    const wPct = 0.52 + swingPct;
    const rPct = 0.38 - swingPct;
    const oPct = (1 - wPct - rPct) / Math.max(1, otherParties.length);
    const newCandidates = c.candidates.map((cand, i) => {
      let party, pct;
      if (i === 0) { party = winnerParty; pct = wPct; }
      else if (i === 1) { party = runnerupParty; pct = rPct; }
      else { party = otherParties[(i - 2) % Math.max(1, otherParties.length)] || cand.party; pct = oPct; }
      return mkC(cand.name, party, Math.round(totalPrev * pct));
    });
    return mkSeat(
      c.constituencyNo, c.constituencyName, c.state, newCandidates,
      c.latitude, c.longitude, c.parentConstituency, c.constituencyType === 'AC' ? 'AC' : 'PC'
    );
  });
}

// Override 2019 UP/MH with full-coverage versions (BJP-dominant, matches real 2019 sweep)
const up2019_full = deriveHistorical(up2024cs, { winnerParty: 'BJP', runnerupParty: 'SP', otherParties: ['BSP', 'INC'], voteFactor: 0.92, swingPct: 0.05 });
const mh2019_full = deriveHistorical(mh2024cs, { winnerParty: 'BJP', runnerupParty: 'INC', otherParties: ['NCP', 'SS'], voteFactor: 0.94, swingPct: 0.04 });

// Synthesize 2018 MP Assembly (INC narrowly won that year — 114 vs 109 seats)
const mp2018cs = deriveHistorical(mp2023cs, { winnerParty: 'INC', runnerupParty: 'BJP', otherParties: ['BSP', 'Independent'], voteFactor: 0.88, swingPct: -0.04 });

// Replace / add to MOCK_DB
MOCK_DB['2019|Lok Sabha|Uttar Pradesh'] = { year:2019, type:'Lok Sabha', state:'Uttar Pradesh', totalSeats:80, status:'Declared', constituencies: up2019_full, partySummary: buildPS(up2019_full) };
MOCK_DB['2019|Lok Sabha|Maharashtra']  = { year:2019, type:'Lok Sabha', state:'Maharashtra',  totalSeats:48, status:'Declared', constituencies: mh2019_full, partySummary: buildPS(mh2019_full) };
MOCK_DB['2018|Assembly|Madhya Pradesh'] = { year:2018, type:'Assembly',  state:'Madhya Pradesh', totalSeats:230, status:'Declared', constituencies: mp2018cs, partySummary: buildPS(mp2018cs) };

/**
 * Find the previous comparable election for a given (year, type, state).
 * Returns the MOCK_DB record or null.
 */
// ============================================================
// Previous-election resolver — given a current (year, type, state),
// finds the most recent prior election in MOCK_DB. If no exact match
// exists, synthesizes a plausible comparable dataset from the current
// snapshot so the comparison views always have meaningful data.
// ============================================================
export function findPreviousElection(year, type, state) {
  const y = Number(year);
  // Try 5-year cycle first, then nearby years
  for (const delta of [5, 4, 6, 7, 10]) {
    const key = `${y - delta}|${type}|${state}`;
    if (MOCK_DB[key]) {
      const prev = MOCK_DB[key];
      // If the previous-year dataset is much sparser than the current one (e.g. 8 vs 80 seats),
      // synthesize the missing seats so per-constituency comparison works for all of them.
      const currKey = `${y}|${type}|${state}`;
      const curr = MOCK_DB[currKey];
      if (curr && prev.constituencies.length < curr.constituencies.length * 0.8) {
        return synthesizePreviousElection(curr, y - delta, prev);
      }
      return prev;
    }
  }
  // No prior data — synthesize one from current data, 5 years earlier
  const currKey = `${y}|${type}|${state}`;
  const curr = MOCK_DB[currKey];
  if (curr) return synthesizePreviousElection(curr, y - 5);
  return null;
}

// Deterministic pseudo-random based on a string seed (so output is stable across renders)
function seededRand(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  return () => {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    return h / 0x7fffffff;
  };
}

/**
 * Build a synthetic previous election that mirrors the current dataset's
 * constituencies but with plausible vote-shifts, party flips, and turnout
 * changes so all the comparison columns (party change, margin delta, turnout
 * delta, vote transfer, runner-ups) have meaningful values.
 *
 * @param {object} current  — current MOCK_DB entry
 * @param {number} prevYear — year for the synthesized record
 * @param {object} [partial] — partial previous record (real data) to keep where available
 * @returns {object} a previous-election record with the same shape as MOCK_DB entries
 */
export function synthesizePreviousElection(current, prevYear, partial = null) {
  const realByName = new Map();
  if (partial?.constituencies) {
    for (const c of partial.constituencies) realByName.set(c.constituencyName, c);
  }

  const newConstituencies = current.constituencies.map(curr => {
    // If we have a real previous record for this seat, keep it (no synthesis needed).
    const real = realByName.get(curr.constituencyName);
    if (real) return real;

    const rng = seededRand(`${prevYear}|${curr.constituencyName}|${curr.state}`);

    // Build a synthesized candidate list — same names, perturbed votes.
    let cands = curr.candidates.map(c => ({
      name: c.name,
      party: c.party,
      partyAbbr: c.partyAbbr,
      partyColor: c.partyColor,
      // Scale votes by 0.75x – 1.25x
      votes: Math.max(1000, Math.round(c.votes * (0.75 + rng() * 0.5))),
      gender: c.gender,
      age: Math.max(25, (c.age || 45) - 5),
      criminal_cases: c.criminal_cases || 0,
    }));

    // ~35% of seats: swap winner with runner-up so partyChanged === true in comparison view
    if (cands.length >= 2 && rng() < 0.35) {
      const tmp = cands[0].votes;
      cands[0].votes = Math.round(cands[1].votes * (1.02 + rng() * 0.1));
      cands[1].votes = tmp;
    }

    // ~15% chance: also swap 2nd and 3rd to vary runner-up tables
    if (cands.length >= 3 && rng() < 0.15) {
      const tmp = cands[1].votes;
      cands[1].votes = cands[2].votes;
      cands[2].votes = tmp;
    }

    // Sort by votes desc, compute totals
    cands.sort((a, b) => b.votes - a.votes);
    const total = cands.reduce((s, c) => s + c.votes, 0);
    cands.forEach(c => { c.voteShare = +((c.votes / total) * 100).toFixed(1); });
    cands[0].isWinner = true;
    for (let i = 1; i < cands.length; i++) cands[i].isWinner = false;
    cands[0].margin = cands[1] ? cands[0].votes - cands[1].votes : cands[0].votes;

    // Turnout — vary by ±5 percentage points around current
    const turnoutDelta = (rng() * 10 - 5);
    const newTurnout = Math.max(45, Math.min(92, +(curr.turnout + turnoutDelta).toFixed(1)));
    const newVoters = Math.round(total / (newTurnout / 100));

    return {
      constituencyNo: curr.constituencyNo,
      constituencyName: curr.constituencyName,
      constituencyType: curr.constituencyType,
      parentConstituency: curr.parentConstituency || '',
      state: curr.state,
      totalVoters: newVoters,
      totalVotesCast: total,
      turnout: newTurnout,
      latitude: curr.latitude,
      longitude: curr.longitude,
      candidates: cands,
      winner: {
        name: cands[0].name,
        party: cands[0].party,
        partyAbbr: cands[0].partyAbbr,
        partyColor: cands[0].partyColor,
        votes: cands[0].votes,
        margin: cands[0].margin,
        voteShare: cands[0].voteShare,
      },
    };
  });

  // Recompute party summary
  const pMap = {};
  let grand = 0;
  for (const c of newConstituencies) {
    for (const cand of c.candidates) {
      if (!pMap[cand.party]) {
        pMap[cand.party] = {
          party: cand.party, partyAbbr: cand.party, partyColor: cand.partyColor || PARTY_COLORS[cand.party] || '#666',
          seatsWon: 0, seatsContested: 0, totalVotes: 0, voteShare: 0, leading: 0,
        };
      }
      pMap[cand.party].seatsContested++;
      pMap[cand.party].totalVotes += cand.votes;
      grand += cand.votes;
      if (cand.isWinner) pMap[cand.party].seatsWon++;
    }
  }
  const partySummary = Object.values(pMap)
    .map(p => ({ ...p, voteShare: +((p.totalVotes / grand) * 100).toFixed(2) }))
    .sort((a, b) => b.seatsWon - a.seatsWon);

  return {
    year: prevYear,
    type: current.type,
    state: current.state,
    totalSeats: current.totalSeats,
    status: 'Declared',
    constituencies: newConstituencies,
    partySummary,
    synthesized: true,  // marker so the UI can show a "(estimated)" hint if it wants
  };
}

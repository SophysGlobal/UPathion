// ============================================
// CENTRALIZED SEED DATA
// Set USE_SEED_DATA to false to remove all sample content
// ============================================

export const USE_SEED_DATA = true;

// ============================================
// FEED POSTS
// ============================================
export interface SeedFeedPost {
  id: string;
  authorName: string;
  authorRole?: string;
  authorBadge?: string;
  createdAt: string;
  bodyText: string;
  tags: string[];
  schoolScope: 'current' | 'aspirational' | 'general';
  schoolName?: string;
  likes: number;
  comments: number;
}

export const seedFeedPosts: SeedFeedPost[] = [
  {
    id: '1',
    authorName: 'Sarah M.',
    authorRole: 'Student',
    authorBadge: 'Senior',
    createdAt: '2h ago',
    bodyText: 'Just submitted my college applications! The stress is finally over. Good luck to everyone still working on theirs! 🎉',
    tags: ['#Applications', '#CollegePrep'],
    schoolScope: 'current',
    schoolName: 'Acton-Boxborough Regional High School',
    likes: 42,
    comments: 8,
  },
  {
    id: '2',
    authorName: 'Alex K.',
    authorRole: 'Student',
    authorBadge: 'Freshman',
    createdAt: '4h ago',
    bodyText: 'Looking for study group partners for AP Chemistry. DM me if interested! We meet Tuesdays and Thursdays after school.',
    tags: ['#StudyGroup', '#APChem'],
    schoolScope: 'current',
    schoolName: 'Acton-Boxborough Regional High School',
    likes: 15,
    comments: 12,
  },
  {
    id: '3',
    authorName: 'Ms. Johnson',
    authorRole: 'College Advisor',
    authorBadge: 'Staff',
    createdAt: '6h ago',
    bodyText: 'Reminder: Early decision deadlines are coming up! Make sure to check each school\'s requirements and deadlines.',
    tags: ['#Admissions', '#Deadlines'],
    schoolScope: 'aspirational',
    schoolName: 'Northeastern University',
    likes: 89,
    comments: 23,
  },
  {
    id: '4',
    authorName: 'Mike T.',
    authorRole: 'Student',
    createdAt: '8h ago',
    bodyText: 'Pro tip: Start your scholarship applications early! I found over $10,000 in local scholarships that most people overlook.',
    tags: ['#Scholarships', '#Tips'],
    schoolScope: 'general',
    schoolName: 'Boston University',
    likes: 156,
    comments: 45,
  },
  {
    id: '5',
    authorName: 'Emma L.',
    authorRole: 'Student',
    authorBadge: 'Junior',
    createdAt: '12h ago',
    bodyText: 'The new robotics club is accepting members! We\'re building a drone for the state competition. No experience needed.',
    tags: ['#Clubs', '#Robotics'],
    schoolScope: 'current',
    schoolName: 'Lincoln-Sudbury Regional High School',
    likes: 28,
    comments: 7,
  },
  {
    id: '6',
    authorName: 'Admissions Office',
    authorRole: 'Admissions Staff',
    authorBadge: 'Official',
    createdAt: '1d ago',
    bodyText: 'Virtual campus tours now available every Saturday! Sign up through the admissions portal to explore our facilities from home.',
    tags: ['#CampusTour', '#Admissions'],
    schoolScope: 'aspirational',
    schoolName: 'MIT',
    likes: 67,
    comments: 15,
  },
  {
    id: '7',
    authorName: 'Dr. Williams',
    authorRole: 'Teacher',
    createdAt: '1d ago',
    bodyText: 'The Pomodoro Technique changed my study habits completely. 25 minutes of focus, 5 minute break. Try it during finals week!',
    tags: ['#StudyTips', '#Productivity'],
    schoolScope: 'general',
    schoolName: 'Concord-Carlisle High School',
    likes: 234,
    comments: 56,
  },
  {
    id: '8',
    authorName: 'Jason R.',
    authorRole: 'Student',
    authorBadge: 'Sophomore',
    createdAt: '1d ago',
    bodyText: 'Anyone else struggling with SAT prep? Found this great free resource that really helped me improve my math score by 80 points.',
    tags: ['#SAT', '#TestPrep'],
    schoolScope: 'current',
    schoolName: 'Acton-Boxborough Regional High School',
    likes: 98,
    comments: 34,
  },
  {
    id: '9',
    authorName: 'Financial Aid Office',
    authorRole: 'Staff',
    authorBadge: 'Official',
    createdAt: '2d ago',
    bodyText: 'FAFSA opens October 1st! Make sure you have your family\'s tax documents ready. We\'re here to help with any questions.',
    tags: ['#FAFSA', '#FinancialAid'],
    schoolScope: 'aspirational',
    schoolName: 'Harvard University',
    likes: 145,
    comments: 28,
  },
  {
    id: '10',
    authorName: 'Career Center',
    authorRole: 'Staff',
    createdAt: '2d ago',
    bodyText: 'Summer internship applications are now open! Don\'t wait until the last minute - many positions fill up fast.',
    tags: ['#Internships', '#Career'],
    schoolScope: 'general',
    schoolName: 'Stanford University',
    likes: 178,
    comments: 41,
  },
  {
    id: '11',
    authorName: 'Lisa W.',
    authorRole: 'Student',
    authorBadge: 'Senior',
    createdAt: '2d ago',
    bodyText: 'Just got accepted to my dream school! All those late nights studying were worth it. Never give up on your goals! 🌟',
    tags: ['#Accepted', '#DreamSchool'],
    schoolScope: 'aspirational',
    schoolName: 'Yale University',
    likes: 312,
    comments: 67,
  },
  {
    id: '12',
    authorName: 'Mr. Chen',
    authorRole: 'Counselor',
    authorBadge: 'Staff',
    createdAt: '3d ago',
    bodyText: 'Spring formal tickets go on sale next Monday! Early bird pricing available for the first 100 students.',
    tags: ['#Events', '#SchoolLife'],
    schoolScope: 'current',
    schoolName: 'Westford Academy',
    likes: 89,
    comments: 22,
  },
];

// ============================================
// EXPLORE - PEOPLE
// ============================================
export interface SeedPerson {
  id: string;
  name: string;
  role: 'Student' | 'Teacher' | 'Counselor' | 'Staff';
  badge?: string;
  school: string;
  bio: string;
  avatarColor: string;
}

export const seedPeople: SeedPerson[] = [
  { id: 'p1', name: 'Jordan Lee', role: 'Student', badge: 'Senior', school: 'Acton-Boxborough Regional High School', bio: 'Aspiring computer scientist. Love hackathons and chess.', avatarColor: 'bg-primary/20' },
  { id: 'p2', name: 'Maria Santos', role: 'Student', badge: 'Junior', school: 'Lincoln-Sudbury Regional High School', bio: 'Varsity soccer captain. Planning to major in biology.', avatarColor: 'bg-accent/20' },
  { id: 'p3', name: 'Dr. Emily Chen', role: 'Counselor', school: 'Westford Academy', bio: 'Here to help with college prep and career guidance.', avatarColor: 'bg-secondary' },
  { id: 'p4', name: 'Tyler Brown', role: 'Student', badge: 'Sophomore', school: 'Concord-Carlisle High School', bio: 'Drummer in the jazz band. Also into photography.', avatarColor: 'bg-primary/20' },
  { id: 'p5', name: 'Ms. Rachel Kim', role: 'Teacher', school: 'Acton-Boxborough Regional High School', bio: 'AP Physics teacher. Making science fun since 2015.', avatarColor: 'bg-accent/20' },
  { id: 'p6', name: 'Aiden Patel', role: 'Student', badge: 'Senior', school: 'MIT', bio: 'CS major interested in AI and machine learning research.', avatarColor: 'bg-primary/20' },
];

// ============================================
// EXPLORE - GROUPS
// ============================================
export interface SeedGroup {
  id: string;
  name: string;
  category: string;
  school: string;
  memberCount: number;
  description: string;
}

export const seedGroups: SeedGroup[] = [
  { id: 'g1', name: 'STEM Club', category: 'Academics', school: 'Acton-Boxborough Regional High School', memberCount: 45, description: 'Weekly projects, competitions, and guest speakers.' },
  { id: 'g2', name: 'Creative Writing Society', category: 'Arts', school: 'Lincoln-Sudbury Regional High School', memberCount: 28, description: 'Share your stories and get feedback from peers.' },
  { id: 'g3', name: 'Future Business Leaders', category: 'Career', school: 'Westford Academy', memberCount: 62, description: 'Networking, mentorship, and entrepreneurship workshops.' },
  { id: 'g4', name: 'Environmental Action', category: 'Service', school: 'Concord-Carlisle High School', memberCount: 35, description: 'Campus sustainability and community clean-ups.' },
  { id: 'g5', name: 'Debate Team', category: 'Academics', school: 'MIT', memberCount: 24, description: 'Compete in regional and national debate tournaments.' },
  { id: 'g6', name: 'Film & Media Club', category: 'Arts', school: 'Harvard University', memberCount: 40, description: 'Create short films and documentaries together.' },
];

// ============================================
// EXPLORE - EVENTS
// ============================================
export interface SeedEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  school: string;
  attendees: number;
}

export const seedEvents: SeedEvent[] = [
  { id: 'e1', title: 'College Application Workshop', date: 'Jan 25', time: '3:00 PM', location: 'Library Room 201', school: 'Acton-Boxborough Regional High School', attendees: 34 },
  { id: 'e2', title: 'Spring Formal Dance', date: 'Feb 14', time: '7:00 PM', location: 'Main Gymnasium', school: 'Lincoln-Sudbury Regional High School', attendees: 156 },
  { id: 'e3', title: 'STEM Fair Showcase', date: 'Feb 20', time: '10:00 AM', location: 'Science Wing', school: 'Westford Academy', attendees: 89 },
  { id: 'e4', title: 'Alumni Networking Night', date: 'Mar 5', time: '6:00 PM', location: 'Student Center', school: 'Northeastern University', attendees: 120 },
  { id: 'e5', title: 'SAT Prep Bootcamp', date: 'Mar 12', time: '9:00 AM', location: 'Room 105', school: 'Concord-Carlisle High School', attendees: 45 },
  { id: 'e6', title: 'Campus Open House', date: 'Mar 18', time: '11:00 AM', location: 'Admissions Center', school: 'Boston University', attendees: 200 },
];

// ============================================
// EXPLORE - PLACES
// ============================================
export interface SeedPlace {
  id: string;
  name: string;
  type: string;
  area: string;
  description: string;
}

export const seedPlaces: SeedPlace[] = [
  { id: 'pl1', name: 'Acton Memorial Library', type: 'Library', area: 'Acton, MA', description: 'Quiet study spaces and free tutoring on weekends.' },
  { id: 'pl2', name: 'The Coffee Grind', type: 'Cafe', area: 'Concord, MA', description: 'Popular student hangout with great lattes and WiFi.' },
  { id: 'pl3', name: 'Minuteman Tech Center', type: 'Study Space', area: 'Lexington, MA', description: 'Open lab with computers and printing services.' },
  { id: 'pl4', name: 'Great Meadows Trail', type: 'Recreation', area: 'Concord, MA', description: 'Scenic walking trail perfect for study breaks.' },
  { id: 'pl5', name: 'Harvard Square', type: 'Shopping & Dining', area: 'Cambridge, MA', description: 'Bookstores, restaurants, and street performances.' },
  { id: 'pl6', name: 'Boston Public Library', type: 'Library', area: 'Boston, MA', description: 'Historic library with extensive research resources.' },
];

// ============================================
// SCHOOL COMMUNITY MEMBERS
// ============================================
export interface SeedCommunityMember {
  id: string;
  name: string;
  role: 'student' | 'teacher' | 'counselor' | 'staff';
  gradeOrPosition?: string;
  bio?: string;
  avatar?: string;
}

export function generateSeedCommunityMembers(schoolName: string): SeedCommunityMember[] {
  const isHighSchool = schoolName.toLowerCase().includes('high');
  
  if (isHighSchool) {
    return [
      { id: 'cm1', name: 'Alex Thompson', role: 'student', gradeOrPosition: 'Senior', bio: 'Varsity basketball captain, interested in sports medicine' },
      { id: 'cm2', name: 'Maya Patel', role: 'student', gradeOrPosition: 'Junior', bio: 'Debate team president, aspiring lawyer' },
      { id: 'cm3', name: 'Dr. Sarah Williams', role: 'counselor', gradeOrPosition: 'College Counselor', bio: 'Here to help with college applications and career planning' },
      { id: 'cm4', name: 'James Chen', role: 'student', gradeOrPosition: 'Senior', bio: 'Robotics club lead, MIT hopeful' },
      { id: 'cm5', name: 'Ms. Emily Rodriguez', role: 'teacher', gradeOrPosition: 'AP English', bio: 'Published author, loves creative writing' },
      { id: 'cm6', name: 'Ryan O\'Connor', role: 'student', gradeOrPosition: 'Sophomore', bio: 'Theater enthusiast, plays guitar' },
    ];
  }
  
  return [
    { id: 'cm1', name: 'Jordan Lee', role: 'student', gradeOrPosition: 'Graduate Student', bio: 'PhD candidate in Computer Science, researching AI' },
    { id: 'cm2', name: 'Prof. Michael Brown', role: 'teacher', gradeOrPosition: 'Department Chair', bio: 'Leading researcher in renewable energy' },
    { id: 'cm3', name: 'Sofia Martinez', role: 'student', gradeOrPosition: 'Senior', bio: 'Pre-med student, volunteer at local hospital' },
    { id: 'cm4', name: 'Dr. Lisa Park', role: 'counselor', gradeOrPosition: 'Academic Advisor', bio: 'Helping students navigate their academic journey' },
    { id: 'cm5', name: 'David Kim', role: 'student', gradeOrPosition: 'Junior', bio: 'Business major, startup founder' },
    { id: 'cm6', name: 'Amanda Foster', role: 'staff', gradeOrPosition: 'Career Services', bio: 'Connecting students with internship opportunities' },
  ];
}

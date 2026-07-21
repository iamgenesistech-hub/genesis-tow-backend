// Mock driver data. In the future this will be backed by a real
// drivers table + dispatch logic, but for now we just assign a
// random driver from a fixed pool when a job is created.

const DRIVERS = [
  {
    id: 1,
    name: 'Marcus Reed',
    companyName: 'Genesis Tow',
    photoUrl: 'https://randomuser.me/api/portraits/men/11.jpg',
    phone: '+15551230001',
  },
  {
    id: 2,
    name: 'Alicia Nguyen',
    companyName: 'Genesis Tow',
    photoUrl: 'https://randomuser.me/api/portraits/women/22.jpg',
    phone: '+15551230002',
  },
  {
    id: 3,
    name: 'David Osei',
    companyName: 'Genesis Tow',
    photoUrl: 'https://randomuser.me/api/portraits/men/33.jpg',
    phone: '+15551230003',
  },
  {
    id: 4,
    name: 'Priya Patel',
    companyName: 'Genesis Tow',
    photoUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
    phone: '+15551230004',
  },
  {
    id: 5,
    name: 'Carlos Fernandez',
    companyName: 'Genesis Tow',
    photoUrl: 'https://randomuser.me/api/portraits/men/55.jpg',
    phone: '+15551230005',
  },
  {
    id: 6,
    name: 'Tanya Brooks',
    companyName: 'Genesis Tow',
    photoUrl: 'https://randomuser.me/api/portraits/women/66.jpg',
    phone: '+15551230006',
  },
  {
    id: 7,
    name: 'Jordan Lee',
    companyName: 'Genesis Tow',
    photoUrl: 'https://randomuser.me/api/portraits/men/77.jpg',
    phone: '+15551230007',
  },
];

/**
 * Returns a randomly assigned driver from the mock pool.
 * @returns {{id: number, name: string, companyName: string, photoUrl: string, phone: string}}
 */
function assignRandomDriver() {
  const index = Math.floor(Math.random() * DRIVERS.length);
  return DRIVERS[index];
}

module.exports = { DRIVERS, assignRandomDriver };

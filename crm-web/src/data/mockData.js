export const customers = [
    {
        _id: 'c1',
        name: 'Alice Carter',
        email: 'alice.carter@example.com',
        phone: '+44 7700 900101'
    },
    {
        _id: 'c2',
        name: 'Ben Cooper',
        email: 'ben.cooper@example.com',
        phone: '+44 7700 900102'
    },
    {
        _id: 'c3',
        name: 'Priya Singh',
        email: 'priya.singh@example.com',
        phone: '+44 7700 900103'
    }
];

export const workers = [
    {
        _id: 'w1',
        name: 'James Miller',
        username: 'james.miller',
        password: 'worker123',
        email: 'james.miller@cjjoinery.com',
        phone: '+44 7700 900201',
        hourlyRate: 28,
        skills: ['Carpentry', 'Joinery', 'Installation'],
        availability: 'Busy',
        statusHistory: [
            { _id: 'sh1', date: '2026-03-10', status: 'Busy', note: 'On-site install' }
        ]
    },
    {
        _id: 'w2',
        name: 'Amir Khan',
        username: 'amir.khan',
        password: 'worker123',
        email: 'amir.khan@cjjoinery.com',
        phone: '+44 7700 900202',
        hourlyRate: 25,
        skills: ['Cabinetry', 'Finishing'],
        availability: 'Available',
        statusHistory: [
            { _id: 'sh2', date: '2026-03-09', status: 'Available', note: 'Ready' }
        ]
    },
    {
        _id: 'w3',
        name: 'Olivia Smith',
        username: 'olivia.smith',
        password: 'worker123',
        email: 'olivia.smith@cjjoinery.com',
        phone: '+44 7700 900203',
        hourlyRate: 30,
        skills: ['Site Survey', 'Project Planning'],
        availability: 'On Leave',
        statusHistory: [
            { _id: 'sh3', date: '2026-03-08', status: 'On Leave', note: 'Annual leave' }
        ]
    },
    {
        _id: 'w4',
        name: 'Liam Patel',
        username: 'liam.patel',
        password: 'worker123',
        email: 'liam.patel@cjjoinery.com',
        phone: '+44 7700 900204',
        hourlyRate: 27,
        skills: ['Staircases', 'Custom Woodwork'],
        availability: 'Available',
        statusHistory: [
            { _id: 'sh4', date: '2026-03-11', status: 'Available', note: 'Open slots' }
        ]
    }
];

export const jobs = [
    {
        _id: 'j1',
        title: 'Oak Kitchen Fit-Out',
        description: 'Custom oak cabinets, island, and pantry shelving.',
        status: 'In Progress',
        startDate: '2026-03-01',
        deadline: '2026-03-28',
        expectedHours: 120,
        customerId: 'c1',
        assignedWorkers: ['w1', 'w2'],
        materials: ['Oak', 'Soft-close hinges', 'Quartz countertop'],
        schedules: [
            { workerId: 'w1', dates: ['2026-03-11', '2026-03-12', '2026-03-13'] }
        ],
        dailyLogs: [
            {
                _id: 'dl1',
                workerId: 'w1',
                workerName: 'James Miller',
                date: '2026-03-11',
                description: 'Installed base cabinets and aligned hinges.',
                imageUrl: 'demo-photo-kitchen.jpg',
                location: { lat: 51.5074, lng: -0.1278 },
                createdAt: '2026-03-11T09:30:00.000Z'
            }
        ]
    },
    {
        _id: 'j2',
        title: 'Loft Wardrobe Installation',
        description: 'Built-in wardrobes with sliding doors and lighting.',
        status: 'Scheduled',
        startDate: '2026-03-20',
        deadline: '2026-04-10',
        expectedHours: 80,
        customerId: 'c2',
        assignedWorkers: ['w4'],
        materials: ['Walnut veneer', 'LED strips', 'Glass inserts'],
        schedules: [],
        dailyLogs: []
    },
    {
        _id: 'j3',
        title: 'Reception Desk Upgrade',
        description: 'Modern reception desk with storage and branding panel.',
        status: 'Completed',
        startDate: '2026-02-01',
        deadline: '2026-02-18',
        expectedHours: 60,
        customerId: 'c3',
        assignedWorkers: ['w1'],
        materials: ['Birch ply', 'Matte lacquer', 'Steel brackets'],
        schedules: [],
        dailyLogs: []
    },
    {
        _id: 'j4',
        title: 'Staircase Refurbishment',
        description: 'Replace treads and handrail, full repaint.',
        status: 'Pending',
        startDate: '2026-04-05',
        deadline: '2026-04-25',
        expectedHours: 70,
        customerId: 'c1',
        assignedWorkers: ['w2', 'w4'],
        materials: ['Pine', 'Stain', 'Balusters'],
        schedules: [],
        dailyLogs: []
    },
    {
        _id: 'j5',
        title: 'Retail Display Units',
        description: 'Modular display units for a boutique showroom.',
        status: 'Cancelled',
        startDate: '2026-01-12',
        deadline: '2026-01-30',
        expectedHours: 50,
        customerId: 'c2',
        assignedWorkers: ['w3'],
        materials: ['MDF', 'Laminate', 'Brushed steel'],
        schedules: [],
        dailyLogs: []
    }
];

export const notifications = [
    {
        _id: 'n1',
        type: 'status_change',
        workerId: 'w1',
        workerName: 'James Miller',
        message: 'Status updated to Busy',
        details: { date: '2026-03-11', status: 'Busy', note: 'On-site install' },
        createdAt: '2026-03-11T10:00:00.000Z',
        read: false
    },
    {
        _id: 'n2',
        type: 'daily_log',
        workerId: 'w1',
        workerName: 'James Miller',
        message: 'Daily log added for Oak Kitchen Fit-Out',
        details: { jobId: 'j1', jobTitle: 'Oak Kitchen Fit-Out' },
        createdAt: '2026-03-11T12:30:00.000Z',
        read: false
    }
];

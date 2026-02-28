const mockData = {
    users: [
        {
            _id: 'u1',
            name: 'Pabitra Banerjee',
            email: 'admin@cjjoinery.com',
            password: 'password123', // In real app this is hashed
            role: 'admin',
            phone: '07123456789',
            address: '123 Joinery Lane, London'
        },
        {
            _id: 'u2',
            name: 'John Carpenter',
            email: 'worker@cjjoinery.com',
            role: 'worker',
            phone: '07987654321',
            address: '45 Woodwork St, Manchester'
        }
    ],
    leads: [
        {
            _id: 'l1',
            name: 'Sarah Connor',
            email: 'sarah@example.com',
            phone: '07555123456',
            source: 'Website',
            status: 'New',
            notes: 'Interested in bespoke wardrobe.',
            createdAt: new Date().toISOString()
        },
        {
            _id: 'l2',
            name: 'Kyle Reese',
            email: 'kyle@example.com',
            phone: '07555987654',
            source: 'Referral',
            status: 'Contacted',
            notes: 'Needs kitchen cabinet repair.',
            createdAt: new Date(Date.now() - 86400000).toISOString()
        }
    ],
    jobs: [
        {
            _id: 'j1',
            customerId: { _id: 'c1', name: 'Sarah Connor', email: 'sarah@example.com' },
            title: 'Bespoke Wardrobe Installation',
            description: 'Design and install walk-in wardrobe.',
            status: 'In Progress',
            priority: 'High',
            assignedWorkers: [{ _id: 'w1', name: 'John Carpenter' }],
            startDate: new Date().toISOString(),
            dueDate: new Date(Date.now() + 604800000).toISOString(),
            expectedHours: 40
        },
        {
            _id: 'j2',
            customerId: { _id: 'c2', name: 'Kyle Reese', email: 'kyle@example.com' },
            title: 'Kitchen Cabinet Repair',
            description: 'Fix hinges and replace door.',
            status: 'Pending',
            priority: 'Medium',
            assignedWorkers: [],
            startDate: new Date(Date.now() + 172800000).toISOString(),
            dueDate: new Date(Date.now() + 345600000).toISOString(),
            expectedHours: 5
        }
    ],
    quotes: [
        {
            _id: 'q1',
            customer: { name: 'Sarah Connor' },
            items: [{ description: 'Materials', amount: 500 }, { description: 'Labor', amount: 300 }],
            total: 800,
            status: 'Approved',
            validUntil: new Date(Date.now() + 1209600000).toISOString()
        },
        {
            _id: 'q2',
            customer: { name: 'Kyle Reese' },
            items: [{ description: 'Repair Kit', amount: 50 }, { description: 'Labor', amount: 100 }],
            total: 150,
            status: 'Sent',
            validUntil: new Date(Date.now() + 1209600000).toISOString()
        }
    ],
    invoices: [
        {
            _id: 'i1',
            customer: { name: 'Sarah Connor' },
            amount: 800,
            status: 'Paid',
            dueDate: new Date(Date.now() - 172800000).toISOString()
        }
    ],
    workers: [
        {
            _id: 'w1',
            name: 'John Carpenter',
            skills: ['Joinery', 'Cabinet Making'],
            status: 'Active',
            hourlyRate: 25,
            availability: 'Available'
        },
        {
            _id: 'w2',
            name: 'Bob Builder',
            skills: ['General Repair'],
            status: 'Available',
            hourlyRate: 20,
            availability: 'Busy'
        }
    ]
};

module.exports = mockData;

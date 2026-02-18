const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Worker = require('./models/Worker');
const Job = require('./models/Job');
const Quote = require('./models/Quote');
const connectDB = require('./config/db');

dotenv.config();

const seedData = async () => {
    try {
        await connectDB();

        console.log('Clearing existing data...');
        // await User.deleteMany({});
        // await Worker.deleteMany({});
        // await Job.deleteMany({});
        // await Quote.deleteMany({});

        const usersCount = await User.countDocuments();
        let customer;
        if (usersCount > 0) {
            console.log('Users already exist, fetching first customer...');
            customer = await User.findOne({ role: 'customer' });
            if (!customer) {
                console.log('No customer found, creating one...');
                customer = await User.create({
                    name: 'John Doe',
                    email: 'john@example.com',
                    password: 'password123',
                    phone: '0987654321',
                    role: 'customer',
                    address: { street: '456 High St', city: 'Manchester', postcode: 'M1 1AA' }
                });
            }
        } else {
            console.log('Seeding Users...');
            await User.create({
                name: 'Kyle Admin',
                email: 'admin@cjjoinery.com',
                password: 'password123',
                phone: '1234567890',
                role: 'admin',
                address: { street: '123 Main St', city: 'London', postcode: 'SW1A 1AA' }
            });

            customer = await User.create({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password123',
                phone: '0987654321',
                role: 'customer',
                address: { street: '456 High St', city: 'Manchester', postcode: 'M1 1AA' }
            });
        }

        let workers = await Worker.find({});
        if (workers.length === 0) {
            console.log('Seeding Workers...');
            workers = await Worker.insertMany([
                { name: 'Bob Builder', email: 'bob@cjjoinery.com', phone: '111222333', skills: ['Carpentry', 'Joinery'], hourlyRate: 25, availability: 'Available' },
                { name: 'Alice Plumber', email: 'alice@cjjoinery.com', phone: '444555666', skills: ['Plumbing'], hourlyRate: 30, availability: 'Busy' },
                { name: 'Charlie Electrician', email: 'charlie@cjjoinery.com', phone: '777888999', skills: ['Electrical'], hourlyRate: 35, availability: 'Available' },
            ]);
        }

        const jobsCount = await Job.countDocuments();
        if (jobsCount === 0) {
            console.log('Seeding Quotes...');
            const quote = await Quote.create({
                customerId: customer._id,
                items: [{ description: 'Kitchen Renovation', quantity: 1, price: 5000 }],
                subtotal: 5000,
                vat: 1000,
                total: 6000,
                status: 'Approved',
                validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            });

            console.log('Seeding Jobs...');
            await Job.create([
                {
                    customerId: customer._id,
                    quoteId: quote._id,
                    title: 'Kitchen Renovation Project',
                    description: 'Full kitchen remodel including cabinets and plumbing.',
                    startDate: new Date(),
                    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks form now
                    status: 'In Progress',
                    assignedWorkers: [workers[0]._id, workers[1]._id],
                    materials: ['Wood', 'Pipes', 'Paint'],
                    progressUpdates: [
                        { description: 'Demolition complete', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), updatedBy: customer._id }
                    ]
                },
                {
                    customerId: customer._id,
                    quoteId: quote._id,
                    title: 'Bedroom Wardrobe',
                    description: 'Custom fitted wardrobe.',
                    startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
                    status: 'Scheduled',
                    assignedWorkers: [workers[0]._id],
                    materials: ['Oak Wood', 'Handles']
                }
            ]);
            console.log('Jobs and Quotes seeded.');
        } else {
            console.log('Jobs already exist, skipping job seeding.');
        }

        console.log('Data Imported!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

seedData();

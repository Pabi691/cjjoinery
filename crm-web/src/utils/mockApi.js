import { customers as seedCustomers, workers as seedWorkers, jobs as seedJobs, notifications as seedNotifications } from '../data/mockData';

const db = {
    customers: [...seedCustomers],
    workers: [...seedWorkers],
    jobs: [...seedJobs],
    notifications: [...seedNotifications]
};

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

const toError = (message, status = 400) => Promise.reject({
    response: { status, data: { message } }
});

const findById = (list, id) => list.find((item) => item._id === id);

const expandJob = (job) => ({
    ...job,
    customerId: findById(db.customers, job.customerId) || null,
    assignedWorkers: (job.assignedWorkers || [])
        .map((id) => findById(db.workers, id))
        .filter(Boolean)
});

const attachCurrentJob = (worker) => {
    const currentJob = db.jobs.find((job) =>
        job.status === 'In Progress' && (job.assignedWorkers || []).includes(worker._id)
    );
    return { ...worker, currentJob: currentJob ? expandJob(currentJob) : null };
};

const parseId = (url) => {
    const parts = url.split('/').filter(Boolean);
    return parts[1] || null;
};

const dashboardSummary = () => {
    const activeProjects = db.jobs.filter((job) => ['In Progress', 'Scheduled'].includes(job.status)).length;
    const activeWorkers = db.workers.filter((worker) => worker.availability !== 'On Leave').length;
    const pendingQuotes = 6;
    const totalRevenue = 182500;
    const recentProjects = [...db.jobs]
        .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
        .slice(0, 4)
        .map(expandJob);

    const monthlyRevenue = [
        { name: 'Oct', revenue: 22000 },
        { name: 'Nov', revenue: 30500 },
        { name: 'Dec', revenue: 28000 },
        { name: 'Jan', revenue: 34000 },
        { name: 'Feb', revenue: 31000 },
        { name: 'Mar', revenue: 37000 }
    ];

    return { activeProjects, activeWorkers, pendingQuotes, totalRevenue, recentProjects, monthlyRevenue };
};

const createId = (prefix) => `${prefix}${Math.random().toString(36).slice(2, 8)}`;

export const mockApi = {
    async get(url) {
        await delay();

        if (url === '/dashboard/summary') {
            return { data: dashboardSummary() };
        }

        if (url === '/jobs') {
            return { data: db.jobs.map(expandJob) };
        }

        if (url.startsWith('/jobs/')) {
            const id = parseId(url);
            const job = findById(db.jobs, id);
            if (!job) return toError('Project not found', 404);
            return { data: expandJob(job) };
        }

    if (url === '/workers') {
            return { data: db.workers.map(attachCurrentJob) };
    }

        if (url.startsWith('/workers/')) {
            const id = parseId(url);
            const worker = findById(db.workers, id);
            if (!worker) return toError('Worker not found', 404);
            const jobs = db.jobs
                .filter((job) => (job.assignedWorkers || []).includes(id))
                .map((job) => ({
                    _id: job._id,
                    title: job.title,
                    status: job.status,
                    startDate: job.startDate,
                    deadline: job.deadline
                }));
            return { data: { ...worker, jobs, currentJob: attachCurrentJob(worker).currentJob } };
        }

        if (url === '/notifications') {
            return { data: db.notifications };
        }

        if (url === '/auth/users') {
            return { data: db.customers };
        }

        return toError('Endpoint not implemented', 404);
    },

    async post(url, payload) {
        await delay();

        if (url === '/auth/login') {
            const user = {
                _id: 'u1',
                name: 'CJ Admin',
                email: payload?.email || 'admin@cjjoinery.com',
                role: 'Admin',
                token: 'mock-token'
            };
            return { data: user };
        }

        if (url === '/auth') {
            const user = {
                _id: 'u2',
                name: payload?.name || 'New User',
                email: payload?.email || 'user@cjjoinery.com',
                role: 'User',
                token: 'mock-token'
            };
            return { data: user };
        }

        if (url === '/jobs') {
            const newJob = {
                _id: createId('j'),
                title: payload.title,
                description: payload.description,
                status: payload.status || 'Scheduled',
                deadline: payload.deadline || null,
                startDate: payload.startDate || new Date().toISOString().slice(0, 10),
                expectedHours: payload.expectedHours || 0,
                customerId: payload.customerId || null,
                assignedWorkers: payload.assignedWorkers || [],
                materials: payload.materials || []
            };
            db.jobs.unshift(newJob);
            return { data: expandJob(newJob) };
        }

        if (url === '/workers') {
            const newWorker = {
                _id: createId('w'),
                name: payload.name,
                username: payload.username || payload.email?.split('@')[0] || 'worker',
                password: payload.password || 'worker123',
                email: payload.email,
                phone: payload.phone,
                hourlyRate: Number(payload.hourlyRate || 0),
                skills: payload.skills || [],
                availability: payload.availability || 'Available',
                statusHistory: [
                    {
                        _id: `sh-${Date.now()}`,
                        date: new Date().toISOString().slice(0, 10),
                        status: payload.availability || 'Available',
                        note: 'Created by admin'
                    }
                ]
            };
            db.workers.unshift(newWorker);
            return { data: newWorker };
        }

        return toError('Endpoint not implemented', 404);
    },

    async put(url, payload) {
        await delay();

        if (url.startsWith('/jobs/')) {
            const id = parseId(url);
            const jobIndex = db.jobs.findIndex((job) => job._id === id);
            if (jobIndex === -1) return toError('Project not found', 404);
            db.jobs[jobIndex] = { ...db.jobs[jobIndex], ...payload };
            return { data: expandJob(db.jobs[jobIndex]) };
        }

        if (url.startsWith('/workers/')) {
            const id = parseId(url);
            const workerIndex = db.workers.findIndex((worker) => worker._id === id);
            if (workerIndex === -1) return toError('Worker not found', 404);
            db.workers[workerIndex] = {
                ...db.workers[workerIndex],
                ...payload,
                password: payload.password ? payload.password : db.workers[workerIndex].password
            };
            return { data: db.workers[workerIndex] };
        }

        return toError('Endpoint not implemented', 404);
    }
};

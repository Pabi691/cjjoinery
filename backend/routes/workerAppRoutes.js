const express = require('express');
const router = express.Router();
const {
    loginWorker,
    getWorkerJobs,
    updateWorkerStatus,
    scheduleJob,
    addDailyLog
} = require('../controllers/workerAppController');

router.post('/login', loginWorker);
router.get('/:workerId/jobs', getWorkerJobs);
router.post('/:workerId/status', updateWorkerStatus);
router.post('/:workerId/jobs/:jobId/schedule', scheduleJob);
router.post('/:workerId/jobs/:jobId/daily-log', addDailyLog);

module.exports = router;

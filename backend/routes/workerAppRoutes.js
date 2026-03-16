const express = require('express');
const router = express.Router();
const {
    loginWorker,
    getWorkerJobs,
    updateWorkerStatus,
    scheduleJob,
    addDailyLog,
    getDailyLogImage
} = require('../controllers/workerAppController');
const { dailyLogUpload } = require('../middleware/upload');

router.post('/login', loginWorker);
router.get('/:workerId/jobs', getWorkerJobs);
router.post('/:workerId/status', updateWorkerStatus);
router.post('/:workerId/jobs/:jobId/schedule', scheduleJob);
router.post('/:workerId/jobs/:jobId/daily-log', dailyLogUpload, addDailyLog);
router.get('/jobs/:jobId/daily-logs/:logId/image', getDailyLogImage);

module.exports = router;

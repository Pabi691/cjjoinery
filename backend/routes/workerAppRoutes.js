const express = require('express');
const router = express.Router();
const {
    loginWorker,
    getWorkerJobs,
    updateWorkerStatus,
    scheduleJob,
    addDailyLog,
    getDailyLogImage,
    checkInWorker
} = require('../controllers/workerAppController');
const { dailyLogUpload } = require('../middleware/upload');

const dailyLogUploadHandler = (req, res, next) => {
    dailyLogUpload(req, res, (err) => {
        if (err) {
            res.status(400);
            return res.json({ message: err.message });
        }
        return next();
    });
};

router.post('/login', loginWorker);
router.get('/:workerId/jobs', getWorkerJobs);
router.post('/:workerId/status', updateWorkerStatus);
router.post('/:workerId/check-in', checkInWorker);
router.post('/:workerId/jobs/:jobId/schedule', scheduleJob);
router.post('/:workerId/jobs/:jobId/daily-log', dailyLogUploadHandler, addDailyLog);
router.get('/jobs/:jobId/daily-logs/:logId/image', getDailyLogImage);

module.exports = router;

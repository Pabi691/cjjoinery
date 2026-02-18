const express = require('express');
const router = express.Router();
const { getWorkers, createWorker, getWorkerById, updateWorker } = require('../controllers/workerController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getWorkers)
    .post(protect, createWorker);

router.route('/:id')
    .get(protect, getWorkerById)
    .put(protect, updateWorker);

module.exports = router;

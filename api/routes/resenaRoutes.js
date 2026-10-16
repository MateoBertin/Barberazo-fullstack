const express = require('express');
const resenaController = require('../controllers/resenaController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticateToken, resenaController.getAll);
router.post('/', authenticateToken, resenaController.create);

module.exports = router;

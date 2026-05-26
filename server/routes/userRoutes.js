const express = require('express');
const auth = require('../middleware/auth');
const {
  getProfile,
  searchUsers,
  getAllUsers
} = require('../controllers/userController');

const router = express.Router();

router.get('/profile/:id', auth, getProfile);
router.get('/search-users', auth, searchUsers);
router.get('/users', auth, getAllUsers);

module.exports = router;
const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const authRole = require('../middleware/authRole');
const clubController = require('../controllers/clubcontroller');

// Club CRUD
router.post('/', auth, authRole(['Admin']), clubController.createClub);
router.get('/', auth, clubController.getClubs);

// ✅ IMPORTANT: put this BEFORE /:id
router.get('/my-clubs', auth, clubController.getMyClubs);

router.get('/:id', auth, clubController.getClubById);

// Update
router.put('/:id', auth, clubController.updateClub);

// Delete (admin only)
router.delete('/:id', auth, authRole(['Admin']), clubController.deleteClub);

// Membership
router.post('/:id/join', auth, clubController.joinClub);
router.put('/:id/approve/:userId', auth, clubController.approveMember);
router.put('/:id/reject/:userId', auth, clubController.rejectMember);
router.delete('/:id/members/:userId', auth, clubController.removeMember);

// Resources
router.post('/:id/resources', auth, clubController.addResource);
router.delete(
	'/:id/resources/:resourceId',
	auth,
	clubController.deleteResource,
);

module.exports = router;

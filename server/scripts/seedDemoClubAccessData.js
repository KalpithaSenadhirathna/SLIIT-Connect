require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Club = require('../models/Club');

const PRESERVED_ADMIN_EMAILS = new Set([
	'admin@sliit.com',
	'admin@sliit.lk',
	'test.admin@sliit.lk',
]);

const TEMP_USER_EMAILS = [
	'test.moderator@sliit.lk',
	'test.student@sliit.lk',
	'test.president@sliit.lk',
	'test.secretary@sliit.lk',
	'test.vicepresident@sliit.lk',
	'test123@gmail.com',
];

const TEMP_CLUB_NAME_PATTERNS = [
	/^Test Club$/i,
	/^Test Club at SLIIT$/i,
	/^QA Role Test Club A$/i,
	/^QA Role Test Club B$/i,
	/^xvbd$/i,
	/^Diag Temp Club$/i,
];

const DEMO_USERS = [
	{
		key: 'demoAdmin',
		name: 'SLIIT Connect Admin',
		email: 'admin@sliitconnect.lk',
		password: 'AdminConnect@123',
		role: 'Admin',
	},
	{
		key: 'sisPresident',
		name: 'SIS President',
		email: 'sis.president@sliitconnect.lk',
		password: 'SISPresident@123',
		role: 'Student',
	},
	{
		key: 'sisMember',
		name: 'SIS Member',
		email: 'sis.member@sliitconnect.lk',
		password: 'SISMember@123',
		role: 'Student',
	},
	{
		key: 'cssPresident',
		name: 'CSS President',
		email: 'css.president@sliitconnect.lk',
		password: 'CSSPresident@123',
		role: 'Student',
	},
	{
		key: 'aisMember',
		name: 'AIS Member',
		email: 'ais.member@sliitconnect.lk',
		password: 'AISMember@123',
		role: 'Student',
	},
	{
		key: 'moderator',
		name: 'SLIIT Connect Moderator',
		email: 'moderator@sliitconnect.lk',
		password: 'Moderator@123',
		role: 'Moderator',
	},
];

const DEMO_CLUBS = [
	{
		key: 'sis',
		name: 'SIS - Student Interactive Society',
		category: 'Social',
		description:
			'Builds student collaboration through peer events, mentoring, and campus engagement initiatives.',
		rules:
			'Respect all members. Attend events responsibly. Keep communication professional.',
		isPublic: true,
	},
	{
		key: 'css',
		name: 'CSS - Cyber Security Society',
		category: 'Technology',
		description:
			'Focuses on practical cyber security skills through workshops, labs, and capture-the-flag activities.',
		rules:
			'Practice ethical security. No unauthorized testing on real systems. Follow lab safety policies.',
		isPublic: true,
	},
	{
		key: 'ais',
		name: 'AIS - Artificial Intelligence Society',
		category: 'Technology',
		description:
			'Explores AI fundamentals, applied machine learning projects, and responsible AI practices.',
		rules:
			'Use datasets responsibly. Share reproducible work. Respect academic integrity.',
		isPublic: true,
	},
	{
		key: 'ras',
		name: 'RAS - Robotics and Automation Society',
		category: 'Engineering',
		description:
			'Develops robotics and automation prototypes through team-based engineering projects.',
		rules:
			'Follow lab and hardware safety rules. Track component usage. Document all experiments.',
		isPublic: true,
	},
	{
		key: 'mms',
		name: 'MMS - Media and Multimedia Society',
		category: 'Arts & Culture',
		description:
			'Supports creative media production in photography, video, design, and digital storytelling.',
		rules:
			'Credit contributors. Use licensed assets. Respect privacy and content guidelines.',
		isPublic: true,
	},
	{
		key: 'ess',
		name: 'ESS - Entrepreneurship and Startup Society',
		category: 'Business',
		description:
			'Encourages startup thinking through idea validation, pitch practice, and founder mentorship.',
		rules:
			'Respect confidentiality. Collaborate fairly. Keep discussions constructive and inclusive.',
		isPublic: true,
	},
];

const upsertUser = async ({ name, email, password, role }) => {
	const normalizedEmail = email.trim().toLowerCase();
	const passwordHash = await bcrypt.hash(password, 10);

	await User.updateOne(
		{ email: normalizedEmail },
		{
			$set: {
				name,
				email: normalizedEmail,
				password: passwordHash,
				role,
			},
		},
		{ upsert: true },
	);

	return User.findOne({ email: normalizedEmail }).lean();
};

const ensureMembership = (club, userId, role, status, details) => {
	const existing = club.members.find(
		(member) => member.user && member.user.toString() === userId.toString(),
	);

	if (existing) {
		existing.role = role;
		existing.status = status;
		existing.registrationDetails = {
			...(existing.registrationDetails || {}),
			...details,
		};
		return;
	}

	club.members.push({
		user: userId,
		role,
		status,
		registrationDetails: details,
	});
};

const ensureNotice = (club, title, content, createdBy) => {
	const alreadyExists = (club.resources || []).some(
		(resource) => resource.type === 'Notice' && resource.title === title,
	);

	if (alreadyExists) return;

	club.resources.push({
		type: 'Notice',
		title,
		content,
		createdBy,
	});
};

const isTempClubName = (name) => {
	if (!name) return false;
	return TEMP_CLUB_NAME_PATTERNS.some((pattern) => pattern.test(name));
};

const seed = async () => {
	try {
		if (!process.env.MONGODB_URI) {
			throw new Error('MONGODB_URI is missing in server/.env');
		}

		await mongoose.connect(process.env.MONGODB_URI);

		const allClubs = await Club.find({}, 'name').lean();
		const tempClubIds = allClubs
			.filter((club) => isTempClubName(club.name))
			.map((club) => club._id);
		const tempClubNames = allClubs
			.filter((club) => isTempClubName(club.name))
			.map((club) => club.name);

		let deletedTempClubs = 0;
		if (tempClubIds.length > 0) {
			const deleteRes = await Club.deleteMany({ _id: { $in: tempClubIds } });
			deletedTempClubs = deleteRes.deletedCount || 0;
		}

		const tempUsers = await User.find(
			{
				email: { $in: TEMP_USER_EMAILS },
				role: { $ne: 'Admin' },
			},
			'_id email role',
		).lean();

		const tempUserIds = tempUsers.map((user) => user._id);
		const tempUserEmails = tempUsers.map((user) => user.email);

		let detachedMemberships = 0;
		if (tempUserIds.length > 0) {
			const pullRes = await Club.updateMany(
				{},
				{ $pull: { members: { user: { $in: tempUserIds } } } },
			);
			detachedMemberships = pullRes.modifiedCount || 0;
		}

		let deletedTempUsers = 0;
		if (tempUserIds.length > 0) {
			const deleteUsersRes = await User.deleteMany({
				_id: { $in: tempUserIds },
				email: { $nin: Array.from(PRESERVED_ADMIN_EMAILS) },
				role: { $ne: 'Admin' },
			});
			deletedTempUsers = deleteUsersRes.deletedCount || 0;
		}

		const seededUsers = {};
		for (const userDef of DEMO_USERS) {
			const user = await upsertUser(userDef);
			seededUsers[userDef.key] = user;
		}

		const creatorId = seededUsers.demoAdmin._id;
		const seededClubs = {};

		for (const clubDef of DEMO_CLUBS) {
			const club = await Club.findOneAndUpdate(
				{ name: clubDef.name },
				{
					$set: {
						description: clubDef.description,
						rules: clubDef.rules,
						category: clubDef.category,
						isPublic: clubDef.isPublic,
						coverImage: '',
						createdBy: creatorId,
					},
				},
				{ new: true, upsert: true },
			);
			seededClubs[clubDef.key] = club;
		}

		ensureMembership(
			seededClubs.sis,
			seededUsers.sisPresident._id,
			'President',
			'Approved',
			{
				fullName: seededUsers.sisPresident.name,
				email: seededUsers.sisPresident.email,
				studentId: 'IT20260001',
				degreeProgram: 'Information Technology',
				year: '3',
				reason: 'Assigned as approved president for SIS demo management.',
			},
		);

		ensureMembership(
			seededClubs.sis,
			seededUsers.sisMember._id,
			'Member',
			'Approved',
			{
				fullName: seededUsers.sisMember.name,
				email: seededUsers.sisMember.email,
				studentId: 'IT20260002',
				degreeProgram: 'Information Technology',
				year: '2',
				reason: 'Approved member for SIS membership and view-only checks.',
			},
		);

		ensureMembership(
			seededClubs.css,
			seededUsers.cssPresident._id,
			'President',
			'Approved',
			{
				fullName: seededUsers.cssPresident.name,
				email: seededUsers.cssPresident.email,
				studentId: 'IT20260003',
				degreeProgram: 'Cyber Security',
				year: '3',
				reason: 'Approved president for CSS club-scoped access validation.',
			},
		);

		ensureMembership(
			seededClubs.ais,
			seededUsers.aisMember._id,
			'Member',
			'Approved',
			{
				fullName: seededUsers.aisMember.name,
				email: seededUsers.aisMember.email,
				studentId: 'IT20260004',
				degreeProgram: 'Data Science',
				year: '2',
				reason: 'Approved member for non-management permission checks.',
			},
		);

		ensureNotice(
			seededClubs.sis,
			'SIS Semester Kickoff',
			'Welcome session for new members and project team introductions.',
			creatorId,
		);
		ensureNotice(
			seededClubs.css,
			'CSS Security Workshop',
			'Hands-on workshop covering secure coding and threat modeling basics.',
			creatorId,
		);
		ensureNotice(
			seededClubs.ais,
			'AIS Reading Circle',
			'Weekly paper discussion on applied machine learning in education.',
			creatorId,
		);

		for (const club of Object.values(seededClubs)) {
			await club.save();
		}

		const report = {
			deletedTempClubs,
			deletedTempUsers,
			detachedMemberships,
			preservedAdminEmails: Array.from(PRESERVED_ADMIN_EMAILS),
			removedTempClubNames: tempClubNames,
			removedTempUserEmails: tempUserEmails,
			demoUsers: Object.values(seededUsers).map((user) => ({
				email: user.email,
				role: user.role,
			})),
			demoClubs: Object.values(seededClubs).map((club) => ({
				name: club.name,
				memberCount: (club.members || []).length,
				resourceCount: (club.resources || []).length,
			})),
		};

		console.log('DEMO_CLUB_ACCESS_SEED_READY', JSON.stringify(report, null, 2));
	} catch (error) {
		console.error('DEMO_CLUB_ACCESS_SEED_FAILED', error);
		process.exitCode = 1;
	} finally {
		await mongoose.disconnect();
	}
};

seed();

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Club = require('../models/Club');

const TEST_USERS = [
    {
        key: 'admin',
        name: 'Test Admin',
        email: 'test.admin@sliit.lk',
        password: 'TestAdmin@123',
        role: 'Admin',
    },
    {
        key: 'moderator',
        name: 'Test Moderator',
        email: 'test.moderator@sliit.lk',
        password: 'TestMod@123',
        role: 'Moderator',
    },
    {
        key: 'student',
        name: 'Test Student',
        email: 'test.student@sliit.lk',
        password: 'TestStudent@123',
        role: 'Student',
    },
    {
        key: 'president',
        name: 'Test Club President',
        email: 'test.president@sliit.lk',
        password: 'TestPresident@123',
        role: 'Student',
    },
    {
        key: 'secretary',
        name: 'Test Club Secretary',
        email: 'test.secretary@sliit.lk',
        password: 'TestSecretary@123',
        role: 'Student',
    },
    {
        key: 'vicePresident',
        name: 'Test Club Vice President',
        email: 'test.vicepresident@sliit.lk',
        password: 'TestVP@123',
        role: 'Student',
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

    return User.findOne({ email: normalizedEmail });
};

const ensureMembership = (club, userId, memberRole, memberStatus, details) => {
    const existing = club.members.find(
        (m) => m.user && m.user.toString() === userId.toString(),
    );

    if (existing) {
        existing.role = memberRole;
        existing.status = memberStatus;
        existing.registrationDetails = {
            ...(existing.registrationDetails || {}),
            ...details,
        };
        return;
    }

    club.members.push({
        user: userId,
        role: memberRole,
        status: memberStatus,
        registrationDetails: details,
    });
};

const seed = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is missing in server/.env');
        }

        await mongoose.connect(process.env.MONGODB_URI);

        const seededUsers = {};
        for (const userDef of TEST_USERS) {
            const savedUser = await upsertUser(userDef);
            seededUsers[userDef.key] = savedUser;
        }

        const adminUser = seededUsers.admin;
        const baseClubPayload = {
            description: 'Seeded club for RBAC and sub-role testing.',
            rules: 'Testing only. Do not use for production decisions.',
            category: 'Testing',
            isPublic: true,
            createdBy: adminUser._id,
        };

        const clubA = await Club.findOneAndUpdate(
            { name: 'QA Role Test Club A' },
            { $setOnInsert: { ...baseClubPayload, name: 'QA Role Test Club A' } },
            { upsert: true, new: true },
        );

        const clubB = await Club.findOneAndUpdate(
            { name: 'QA Role Test Club B' },
            { $setOnInsert: { ...baseClubPayload, name: 'QA Role Test Club B' } },
            { upsert: true, new: true },
        );

        ensureMembership(
            clubA,
            seededUsers.president._id,
            'President',
            'Approved',
            {
                fullName: seededUsers.president.name,
                email: seededUsers.president.email,
                studentId: 'IT90000001',
                degreeProgram: 'Information Technology',
                year: '3',
                reason: 'Seeded approved president for club A',
            },
        );

        ensureMembership(
            clubA,
            seededUsers.student._id,
            'Member',
            'Approved',
            {
                fullName: seededUsers.student.name,
                email: seededUsers.student.email,
                studentId: 'IT90000002',
                degreeProgram: 'Information Technology',
                year: '2',
                reason: 'Seeded approved member for club A',
            },
        );

        ensureMembership(
            clubA,
            seededUsers.secretary._id,
            'Secretary',
            'Approved',
            {
                fullName: seededUsers.secretary.name,
                email: seededUsers.secretary.email,
                studentId: 'IT90000003',
                degreeProgram: 'Software Engineering',
                year: '3',
                reason: 'Seeded approved secretary for club A',
            },
        );

        ensureMembership(
            clubB,
            seededUsers.vicePresident._id,
            'VicePresident',
            'Approved',
            {
                fullName: seededUsers.vicePresident.name,
                email: seededUsers.vicePresident.email,
                studentId: 'IT90000004',
                degreeProgram: 'Computer Science',
                year: '4',
                reason: 'Seeded approved vice president for club B',
            },
        );

        ensureMembership(
            clubB,
            seededUsers.student._id,
            'Member',
            'Pending',
            {
                fullName: seededUsers.student.name,
                email: seededUsers.student.email,
                studentId: 'IT90000002',
                degreeProgram: 'Information Technology',
                year: '2',
                reason: 'Seeded pending request for cross-club testing',
            },
        );

        await clubA.save();
        await clubB.save();

        const report = {
            users: Object.values(seededUsers).map((u) => ({
                name: u.name,
                email: u.email,
                role: u.role,
            })),
            clubs: [
                {
                    name: clubA.name,
                    members: clubA.members.length,
                },
                {
                    name: clubB.name,
                    members: clubB.members.length,
                },
            ],
        };

        console.log('ROLE_TEST_SEED_READY', JSON.stringify(report, null, 2));
    } catch (error) {
        console.error('ROLE_TEST_SEED_FAILED', error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

seed();

/**
 * Club Controller
 * Handles all CRUD operations and membership management for Clubs.
 * Built to match the Club model schema and clubRoutes.js expectations.
 */
const Club = require('../models/Club');

const getMemberUserId = (member) => {
    if (!member || !member.user) return null;
    if (typeof member.user === 'object' && member.user._id) return member.user._id.toString();
    return member.user.toString();
};

const canManageClub = async (user, clubId) => {
    const club = await Club.findById(clubId);

    if (!club) {
        return { allowed: false, status: 404, message: 'Club not found' };
    }

    if (user.role === 'Admin') {
        return { allowed: true, club };
    }

    const presidentMember = club.members.find(
        (member) =>
            getMemberUserId(member) === user.id &&
            member.role === 'President' &&
            member.status === 'Approved',
    );

    if (presidentMember) {
        return { allowed: true, club };
    }

    return {
        allowed: false,
        status: 403,
        message: 'Access denied. Only Admin or approved President of this club can perform this action.',
    };
};

// ── Create a new Club (Admin only) ────────────────────────────────────────────
exports.createClub = async (req, res) => {
    try {
        const { name, description, rules, category, coverImage, isPublic } = req.body;

        if (!name || !description) {
            return res.status(400).json({ message: 'Name and description are required' });
        }

        const club = new Club({
            name,
            description,
            rules:       rules       || '',
            category:    category    || 'General',
            coverImage:  coverImage  || '',
            isPublic:    isPublic !== undefined ? isPublic : true,
            createdBy:   req.user.id,
            members:     [],
            resources:   [],
        });

        await club.save();
        res.status(201).json(club);
    } catch (err) {
        console.error('createClub error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// ── Get all Clubs ─────────────────────────────────────────────────────────────
exports.getClubs = async (req, res) => {
    try {
        const limitRaw = Number.parseInt(req.query.limit, 10);
        const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 48) : 12;
        const clubs = await Club.find(
            {},
            'name description category coverImage isPublic createdBy createdAt members resources',
        )
            .sort({ _id: -1 })
            .limit(limit)
            .lean();

        const result = clubs.map((club) => {
            const members = Array.isArray(club.members) ? club.members : [];
            const resources = Array.isArray(club.resources) ? club.resources : [];
            const myMembership = members.find((member) => getMemberUserId(member) === req.user.id);
            const approvedMembersCount = members.filter((member) => member.status === 'Approved').length;

            // Avoid sending large inline base64 payloads in list view; card has a safe fallback image.
            const coverImage =
                typeof club.coverImage === 'string' && club.coverImage.startsWith('data:')
                    ? ''
                    : club.coverImage || '';

            return {
                _id: club._id,
                name: club.name,
                description: club.description,
                category: club.category,
                coverImage,
                isPublic: club.isPublic,
                createdBy: club.createdBy,
                createdAt: club.createdAt,
                approvedMembersCount,
                resourceCount: resources.length,
                myStatus: myMembership?.status || null,
                myRole: myMembership?.role || null,
            };
        });

        res.json(result);
    } catch (err) {
        console.error('getClubs error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// ── Get clubs the current user is a member of ────────────────────────────────
exports.getMyClubs = async (req, res) => {
    try {
        const clubs = await Club.find({
            members: { $elemMatch: { user: req.user.id } },
        })
            .select('name description category coverImage isPublic createdBy createdAt members resources')
            .sort({ _id: -1 });

        const result = clubs.map((club) => {
            const clubObj = club.toObject();
            const members = Array.isArray(clubObj.members) ? clubObj.members : [];
            const resources = Array.isArray(clubObj.resources) ? clubObj.resources : [];
            const member = members.find((m) => getMemberUserId(m) === req.user.id);
            const approvedMembersCount = members.filter((m) => m.status === 'Approved').length;
            const coverImage =
                typeof clubObj.coverImage === 'string' && clubObj.coverImage.startsWith('data:')
                    ? ''
                    : clubObj.coverImage || '';

            return {
                _id: clubObj._id,
                name: clubObj.name,
                description: clubObj.description,
                category: clubObj.category,
                coverImage,
                isPublic: clubObj.isPublic,
                createdBy: clubObj.createdBy,
                createdAt: clubObj.createdAt,
                approvedMembersCount,
                resourceCount: resources.length,
                myStatus: member?.status || null,
                myRole: member?.role || null,
            };
        });

        res.json(result);
    } catch (err) {
        console.error('getMyClubs error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// ── Get a single Club by ID ───────────────────────────────────────────────────
exports.getClubById = async (req, res) => {
    try {
        const club = await Club.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('members.user', 'name email role');

        if (!club) {
            return res.status(404).json({ message: 'Club not found' });
        }

        res.json(club);
    } catch (err) {
        console.error('getClubById error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// ── Update a Club ─────────────────────────────────────────────────────────────
exports.updateClub = async (req, res) => {
    try {
        const check = await canManageClub(req.user, req.params.id);
        if (!check.allowed) return res.status(check.status).json({ message: check.message });

        const { name, description, rules, category, coverImage, isPublic } = req.body;
        const club = check.club;

        if (name)        club.name        = name;
        if (description) club.description = description;
        if (rules !== undefined)      club.rules      = rules;
        if (category !== undefined)   club.category   = category;
        if (coverImage !== undefined) club.coverImage = coverImage;
        if (isPublic !== undefined)   club.isPublic   = isPublic;

        await club.save();
        res.json(club);
    } catch (err) {
        console.error('updateClub error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// ── Delete a Club (Admin only) ────────────────────────────────────────────────
exports.deleteClub = async (req, res) => {
    try {
        const club = await Club.findByIdAndDelete(req.params.id);
        if (!club) {
            return res.status(404).json({ message: 'Club not found' });
        }
        res.json({ message: 'Club deleted successfully' });
    } catch (err) {
        console.error('deleteClub error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// ── Join a Club (creates a Pending membership request) ────────────────────────
exports.joinClub = async (req, res) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) {
            return res.status(404).json({ message: 'Club not found' });
        }

        // Check if already a member
        const existing = club.members.find(
            (m) => m.user && m.user.toString() === req.user.id
        );
        if (existing) {
            return res.status(400).json({ message: 'Already a member or request pending' });
        }

        const { fullName, studentId, email, phone, degreeProgram, year, reason } = req.body;

        club.members.push({
            user:   req.user.id,
            role:   'Member',
            status: 'Pending',
            registrationDetails: {
                fullName:      fullName      || '',
                studentId:     studentId     || '',
                email:         email         || '',
                phone:         phone         || '',
                degreeProgram: degreeProgram || '',
                year:          year          || '',
                reason:        reason        || '',
            },
        });

        await club.save();
        res.json({ message: 'Join request submitted successfully' });
    } catch (err) {
        console.error('joinClub error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// ── Approve a member ──────────────────────────────────────────────────────────
exports.approveMember = async (req, res) => {
    try {
        const check = await canManageClub(req.user, req.params.id);
        if (!check.allowed) return res.status(check.status).json({ message: check.message });
        const club = check.club;

        const member = club.members.find(
            (m) => getMemberUserId(m) === req.params.userId
        );
        if (!member) return res.status(404).json({ message: 'Member not found' });

        member.status = 'Approved';
        await club.save();
        res.json({ message: 'Member approved successfully' });
    } catch (err) {
        console.error('approveMember error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// ── Reject a member ───────────────────────────────────────────────────────────
exports.rejectMember = async (req, res) => {
    try {
        const check = await canManageClub(req.user, req.params.id);
        if (!check.allowed) return res.status(check.status).json({ message: check.message });
        const club = check.club;

        const member = club.members.find(
            (m) => getMemberUserId(m) === req.params.userId
        );
        if (!member) return res.status(404).json({ message: 'Member not found' });

        member.status = 'Rejected';
        await club.save();
        res.json({ message: 'Member rejected' });
    } catch (err) {
        console.error('rejectMember error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// ── Remove a member ───────────────────────────────────────────────────────────
exports.removeMember = async (req, res) => {
    try {
        const check = await canManageClub(req.user, req.params.id);
        if (!check.allowed) return res.status(check.status).json({ message: check.message });
        const club = check.club;

        club.members = club.members.filter(
            (m) => getMemberUserId(m) !== req.params.userId
        );
        await club.save();
        res.json({ message: 'Member removed successfully' });
    } catch (err) {
        console.error('removeMember error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// ── Add a resource (Notice / Event / File) ────────────────────────────────────
exports.addResource = async (req, res) => {
    try {
        const check = await canManageClub(req.user, req.params.id);
        if (!check.allowed) return res.status(check.status).json({ message: check.message });
        const club = check.club;

        const { type, title, content, dueDate, time, location, subject, agenda, tags, joinLink, expiryDate } = req.body;

        if (!type || !title) {
            return res.status(400).json({ message: 'Type and title are required' });
        }

        club.resources.push({
            type,
            title,
            content:    content    || '',
            dueDate:    dueDate    || undefined,
            time:       time       || '',
            location:   location   || '',
            subject:    subject    || '',
            agenda:     agenda     || '',
            tags:       tags       || '',
            joinLink:   joinLink   || '',
            expiryDate: expiryDate || undefined,
            createdBy:  req.user.id,
        });

        await club.save();
        res.status(201).json({ message: 'Resource added successfully' });
    } catch (err) {
        console.error('addResource error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// ── Delete a resource ─────────────────────────────────────────────────────────
exports.deleteResource = async (req, res) => {
    try {
        const check = await canManageClub(req.user, req.params.id);
        if (!check.allowed) return res.status(check.status).json({ message: check.message });
        const club = check.club;

        club.resources = club.resources.filter(
            (r) => r._id.toString() !== req.params.resourceId
        );
        await club.save();
        res.json({ message: 'Resource deleted successfully' });
    } catch (err) {
        console.error('deleteResource error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

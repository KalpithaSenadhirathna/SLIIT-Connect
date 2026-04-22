const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		role: {
			type: String,
			enum: ['Member', 'Secretary', 'VicePresident', 'President'],
			default: 'Member',
		},
		status: {
			type: String,
			enum: ['Pending', 'Approved', 'Rejected'],
			default: 'Pending',
		},
		joinedAt: {
			type: Date,
			default: Date.now,
		},

		registrationDetails: {
			fullName: {
				type: String,
				trim: true,
				default: '',
			},
			studentId: {
				type: String,
				trim: true,
				default: '',
			},
			email: {
				type: String,
				trim: true,
				lowercase: true,
				default: '',
			},
			phone: {
				type: String,
				trim: true,
				default: '',
			},
			degreeProgram: {
				type: String,
				trim: true,
				default: '',
			},
			year: {
				type: String,
				trim: true,
				default: '',
			},
			reason: {
				type: String,
				trim: true,
				default: '',
			},
		},
	},
	{ _id: false },
);

const ResourceSchema = new mongoose.Schema({
	type: {
		type: String,
		enum: ['Notice', 'Event', 'File'],
		required: true,
	},
	title: {
		type: String,
		required: true,
		trim: true,
	},
	content: {
		type: String,
		default: '',
	},

	// Mainly used for events
	dueDate: {
		type: Date,
	},
	time: {
		type: String,
		trim: true,
		default: '',
	},
	location: {
		type: String,
		trim: true,
		default: '',
	},

	// Optional extra fields
	subject: {
		type: String,
		trim: true,
		default: '',
	},
	agenda: {
		type: String,
		trim: true,
		default: '',
	},
	tags: {
		type: String,
		trim: true,
		default: '',
	},
	joinLink: {
		type: String,
		trim: true,
		default: '',
	},
	expiryDate: {
		type: Date,
	},

	createdBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

const ClubSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true,
	},
	description: {
		type: String,
		required: true,
		trim: true,
	},
	rules: {
		type: String,
		trim: true,
		default: '',
	},
	category: {
		type: String,
		trim: true,
		default: 'General',
	},
	coverImage: {
		type: String,
		default: '',
	},
	isPublic: {
		type: Boolean,
		default: true,
	},
	createdBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	members: {
		type: [MemberSchema],
		default: [],
	},
	resources: {
		type: [ResourceSchema],
		default: [],
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

ClubSchema.index({ createdAt: -1 });
ClubSchema.index({ 'members.user': 1 });

module.exports = mongoose.model('Club', ClubSchema);

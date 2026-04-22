import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
	ChevronLeft,
	Lock,
	Unlock,
	CalendarDays,
	Trash2,
	Users,
	Megaphone,
	Clock,
	Pencil,
	FileText,
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const ClubDetails = () => {
	const { id } = useParams();
	const navigate = useNavigate();

	const [club, setClub] = useState(null);
	const [currentUser, setCurrentUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState('feed');

	const [showEditModal, setShowEditModal] = useState(false);
	const [showNoticeModal, setShowNoticeModal] = useState(false);
	const [showEventModal, setShowEventModal] = useState(false);
	const [showFileModal, setShowFileModal] = useState(false);

	const [editData, setEditData] = useState({
		name: '',
		description: '',
		rules: '',
		category: '',
		coverImage: '',
		isPublic: true,
	});

	const [noticeData, setNoticeData] = useState({
		type: 'Notice',
		title: '',
		content: '',
	});

	const [eventData, setEventData] = useState({
		type: 'Event',
		title: '',
		content: '',
		dueDate: '',
		time: '',
		location: '',
	});

	const [fileData, setFileData] = useState({
		type: 'File',
		title: '',
		content: '',
	});

	const getToken = () => localStorage.getItem('token');

	const getAuthHeaders = () => {
		const token = getToken();
		return {
			Authorization: `Bearer ${token}`,
			'x-auth-token': token,
		};
	};

	const getUserId = (user) => {
		if (!user) return null;
		return user._id || user.id || null;
	};

	const currentUserId = getUserId(currentUser);

	const fetchClubDetails = async () => {
		try {
			setLoading(true);

			const [clubRes, meRes] = await Promise.all([
				axios.get(`${API_BASE}/clubs/${id}`, {
					headers: getAuthHeaders(),
				}),
				axios.get(`${API_BASE}/auth/me`, {
					headers: getAuthHeaders(),
				}),
			]);

			const clubData = clubRes.data;
			const meData = meRes.data;

			setClub(clubData);
			setCurrentUser(meData);

			setEditData({
				name: clubData.name || '',
				description: clubData.description || '',
				rules: clubData.rules || '',
				category: clubData.category || '',
				coverImage: clubData.coverImage || '',
				isPublic: clubData.isPublic ?? true,
			});
		} catch (err) {
			console.error(err);
			alert(err.response?.data?.message || 'Failed to load club details');
			navigate('/clubs');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchClubDetails();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	const isSystemAdmin = (currentUser?.role || '').toLowerCase() === 'admin';

	const currentMemberRecord = useMemo(() => {
		if (!club?.members || !currentUserId) return null;

		return (
			club.members.find((member) => {
				const memberUserId =
					typeof member.user === 'object'
						? getUserId(member.user)
						: member.user;

				return memberUserId?.toString() === currentUserId?.toString();
			}) || null
		);
	}, [club, currentUserId]);

	const isApprovedPresident =
		currentMemberRecord &&
		currentMemberRecord.role === 'President' &&
		currentMemberRecord.status === 'Approved';

	const canManageClub = isSystemAdmin || isApprovedPresident;

	const approvedMembers =
		club?.members?.filter((member) => member.status === 'Approved') || [];
	const pendingMembers =
		club?.members?.filter((member) => member.status === 'Pending') || [];
	const notices =
		club?.resources?.filter((resource) => resource.type === 'Notice') || [];
	const events =
		club?.resources?.filter((resource) => resource.type === 'Event') || [];
	const files =
		club?.resources?.filter((resource) => resource.type === 'File') || [];

	const handleUpdateClub = async (e) => {
		e.preventDefault();

		if (!editData.name.trim()) return alert('Club name is required');
		if (!editData.description.trim()) return alert('Description is required');
		if (!editData.category.trim()) return alert('Category is required');

		try {
			const res = await axios.put(`${API_BASE}/clubs/${id}`, editData, {
				headers: getAuthHeaders(),
			});

			setClub(res.data);
			setShowEditModal(false);
			alert('Club updated successfully');
		} catch (err) {
			console.error(err);
			alert(err.response?.data?.message || 'Failed to update club');
		}
	};

	const handleDeleteClub = async () => {
		const confirmed = window.confirm(
			'Are you sure you want to delete this club?',
		);
		if (!confirmed) return;

		try {
			await axios.delete(`${API_BASE}/clubs/${id}`, {
				headers: getAuthHeaders(),
			});

			alert('Club deleted successfully');
			navigate('/clubs');
		} catch (err) {
			console.error(err);
			alert(err.response?.data?.message || 'Failed to delete club');
		}
	};

	const handleApproveMember = async (userId) => {
		try {
			await axios.put(
				`${API_BASE}/clubs/${id}/approve/${userId}`,
				{},
				{ headers: getAuthHeaders() },
			);
			alert('Member approved successfully');
			fetchClubDetails();
		} catch (err) {
			console.error(err);
			alert(err.response?.data?.message || 'Failed to approve member');
		}
	};

	const handleRejectMember = async (userId) => {
		try {
			await axios.put(
				`${API_BASE}/clubs/${id}/reject/${userId}`,
				{},
				{ headers: getAuthHeaders() },
			);
			alert('Member rejected successfully');
			fetchClubDetails();
		} catch (err) {
			console.error(err);
			alert(err.response?.data?.message || 'Failed to reject member');
		}
	};

	const handleRemoveMember = async (userId) => {
		const confirmed = window.confirm(
			'Are you sure you want to remove this member?',
		);
		if (!confirmed) return;

		try {
			await axios.delete(`${API_BASE}/clubs/${id}/members/${userId}`, {
				headers: getAuthHeaders(),
			});
			alert('Member removed successfully');
			fetchClubDetails();
		} catch (err) {
			console.error(err);
			alert(err.response?.data?.message || 'Failed to remove member');
		}
	};

	const handleAddNotice = async (e) => {
		e.preventDefault();

		if (!noticeData.title.trim()) return alert('Notice title is required');
		if (!noticeData.content.trim()) return alert('Notice content is required');

		try {
			await axios.post(`${API_BASE}/clubs/${id}/resources`, noticeData, {
				headers: getAuthHeaders(),
			});

			setNoticeData({
				type: 'Notice',
				title: '',
				content: '',
			});

			setShowNoticeModal(false);
			setActiveTab('notices');
			alert('Notice added successfully');
			fetchClubDetails();
		} catch (err) {
			console.error(err);
			alert(err.response?.data?.message || 'Failed to add notice');
		}
	};

	const handleAddEvent = async (e) => {
		e.preventDefault();

		if (!eventData.title.trim()) return alert('Event title is required');
		if (!eventData.content.trim())
			return alert('Event description is required');
		if (!eventData.dueDate) return alert('Event date is required');

		try {
			await axios.post(`${API_BASE}/clubs/${id}/resources`, eventData, {
				headers: getAuthHeaders(),
			});

			setEventData({
				type: 'Event',
				title: '',
				content: '',
				dueDate: '',
				time: '',
				location: '',
			});

			setShowEventModal(false);
			setActiveTab('events');
			alert('Event added successfully');
			fetchClubDetails();
		} catch (err) {
			console.error(err);
			alert(err.response?.data?.message || 'Failed to add event');
		}
	};

	const handleFileChange = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onloadend = () => {
			setFileData({
				type: 'File',
				title: file.name,
				content: reader.result,
			});
		};
		reader.readAsDataURL(file);
	};

	const handleAddFile = async (e) => {
		e.preventDefault();

		if (!fileData.title.trim()) return alert('File title is required');
		if (!fileData.content) return alert('Please select a file');

		try {
			await axios.post(`${API_BASE}/clubs/${id}/resources`, fileData, {
				headers: getAuthHeaders(),
			});

			setFileData({
				type: 'File',
				title: '',
				content: '',
			});

			setShowFileModal(false);
			setActiveTab('files');
			alert('File added successfully');
			fetchClubDetails();
		} catch (err) {
			console.error(err);
			alert(err.response?.data?.message || 'Failed to add file');
		}
	};

	const handleDeleteResource = async (resourceId) => {
		const confirmed = window.confirm(
			'Are you sure you want to delete this item?',
		);
		if (!confirmed) return;

		try {
			await axios.delete(`${API_BASE}/clubs/${id}/resources/${resourceId}`, {
				headers: getAuthHeaders(),
			});

			alert('Resource deleted successfully');
			fetchClubDetails();
		} catch (err) {
			console.error(err);
			alert(err.response?.data?.message || 'Failed to delete resource');
		}
	};

	if (loading) {
		return <div style={{ padding: '30px' }}>Loading...</div>;
	}

	if (!club) {
		return <div style={{ padding: '30px' }}>Club not found</div>;
	}

	return (
		<div className='club-details-container'>
			<button
				className='back-link'
				onClick={() => navigate('/clubs')}>
				<ChevronLeft size={18} />
				Back to Clubs
			</button>

			<div className='club-cover-area'>
				<img
					src={
						club.coverImage ||
						'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80'
					}
					alt={club.name}
					className='cover-image'
				/>

				<div className='corner-badges'>
					<span className='badge-pill privacy-pill'>
						{club.isPublic ? (
							<>
								<Unlock size={14} />
								Public
							</>
						) : (
							<>
								<Lock size={14} />
								Private
							</>
						)}
					</span>

					<span className='badge-pill date-pill'>
						<CalendarDays size={14} />
						{new Date(club.createdAt).toLocaleDateString()}
					</span>
				</div>

				<div className='cover-overlay'>
					<div className='cover-content'>
						<h1 className='club-title'>{club.name}</h1>
						<p className='club-desc'>{club.description}</p>
						<p className='club-sub'>{club.category}</p>

						{canManageClub && (
							<div className='admin-actions'>
								<button
									className='btn btn-edit'
									onClick={() => setShowEditModal(true)}>
									<Pencil size={16} />
									Update Club
								</button>

								<button
									className='btn btn-notice'
									onClick={() => setShowNoticeModal(true)}>
									<Megaphone size={16} />
									Add Notice
								</button>

								<button
									className='btn btn-event'
									onClick={() => setShowEventModal(true)}>
									<CalendarDays size={16} />
									Add Event
								</button>

								<button
									className='btn btn-file'
									onClick={() => setShowFileModal(true)}>
									<FileText size={16} />
									Add File
								</button>

								{isSystemAdmin && (
									<button
										className='btn btn-delete'
										onClick={handleDeleteClub}>
										<Trash2 size={16} />
										Delete Club
									</button>
								)}
							</div>
						)}
					</div>
				</div>
			</div>

			<div className='tabs'>
				<button
					className={`tab ${activeTab === 'feed' ? 'active' : ''}`}
					onClick={() => setActiveTab('feed')}>
					Feed
				</button>
				<button
					className={`tab ${activeTab === 'notices' ? 'active' : ''}`}
					onClick={() => setActiveTab('notices')}>
					Notices
				</button>
				<button
					className={`tab ${activeTab === 'events' ? 'active' : ''}`}
					onClick={() => setActiveTab('events')}>
					Events
				</button>
				<button
					className={`tab ${activeTab === 'files' ? 'active' : ''}`}
					onClick={() => setActiveTab('files')}>
					Files
				</button>
				<button
					className={`tab ${activeTab === 'members' ? 'active' : ''}`}
					onClick={() => setActiveTab('members')}>
					Members
				</button>

				{canManageClub && (
					<button
						className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
						onClick={() => setActiveTab('requests')}>
						Requests
					</button>
				)}
			</div>

			{activeTab === 'feed' && (
				<div className='dashboard-grid'>
					<div className='stat-card'>
						<Users size={20} />
						<div>
							<h3>{approvedMembers.length}</h3>
							<p>Members</p>
						</div>
					</div>

					<div className='stat-card'>
						<Megaphone size={20} />
						<div>
							<h3>{notices.length}</h3>
							<p>Notices</p>
						</div>
					</div>

					<div className='stat-card'>
						<Clock size={20} />
						<div>
							<h3>{events.length}</h3>
							<p>Events</p>
						</div>
					</div>
				</div>
			)}

			{activeTab === 'notices' && (
				<div className='content-section'>
					<h3>Club Notices</h3>
					{notices.length === 0 ? (
						<p>No notices available.</p>
					) : (
						notices.map((notice) => (
							<div
								key={notice._id}
								className='content-card'>
								<div className='card-header-row'>
									<h4>{notice.title}</h4>
									{canManageClub && (
										<button
											className='mini-delete-btn'
											onClick={() => handleDeleteResource(notice._id)}>
											<Trash2 size={14} />
										</button>
									)}
								</div>
								<p>{notice.content}</p>
							</div>
						))
					)}
				</div>
			)}

			{activeTab === 'events' && (
				<div className='content-section'>
					<h3>Club Events</h3>
					{events.length === 0 ? (
						<p>No events available.</p>
					) : (
						events.map((event) => (
							<div
								key={event._id}
								className='content-card'>
								<div className='card-header-row'>
									<h4>{event.title}</h4>
									{canManageClub && (
										<button
											className='mini-delete-btn'
											onClick={() => handleDeleteResource(event._id)}>
											<Trash2 size={14} />
										</button>
									)}
								</div>
								<p>{event.content}</p>
								{event.dueDate && (
									<p>
										<strong>Date:</strong>{' '}
										{new Date(event.dueDate).toLocaleString()}
									</p>
								)}
								{event.location && (
									<p>
										<strong>Location:</strong> {event.location}
									</p>
								)}
								{event.time && (
									<p>
										<strong>Time:</strong> {event.time}
									</p>
								)}
							</div>
						))
					)}
				</div>
			)}

			{activeTab === 'files' && (
				<div className='content-section'>
					<h3>Club Files</h3>
					{files.length === 0 ? (
						<p>No files available.</p>
					) : (
						files.map((file) => (
							<div
								key={file._id}
								className='content-card'>
								<div className='card-header-row'>
									<h4>{file.title}</h4>
									{canManageClub && (
										<button
											className='mini-delete-btn'
											onClick={() => handleDeleteResource(file._id)}>
											<Trash2 size={14} />
										</button>
									)}
								</div>

								<a
									href={file.content}
									download={file.title}
									target='_blank'
									rel='noreferrer'
									className='file-link'>
									Open / Download File
								</a>
							</div>
						))
					)}
				</div>
			)}

			{activeTab === 'members' && (
				<div className='content-section'>
					<h3>Club Members</h3>
					<div className='member-grid'>
						{approvedMembers.length === 0 ? (
							<p>No approved members yet.</p>
						) : (
							approvedMembers.map((member, index) => {
								const memberId =
									typeof member.user === 'object'
										? getUserId(member.user)
										: member.user;

								return (
									<div
										className='member-card'
										key={memberId || index}>
										<h4>{member.user?.name || 'Unknown User'}</h4>
										<p>Role: {member.role}</p>
										<p>Status: {member.status}</p>

										{canManageClub &&
											member.role !== 'President' &&
											memberId?.toString() !== currentUserId?.toString() && (
												<button
													className='btn btn-delete'
													onClick={() => handleRemoveMember(memberId)}>
													Remove Member
												</button>
											)}
									</div>
								);
							})
						)}
					</div>
				</div>
			)}

			{activeTab === 'requests' && canManageClub && (
				<div className='content-section'>
					<h3>Pending Requests</h3>
					{pendingMembers.length === 0 ? (
						<p>No pending requests.</p>
					) : (
						pendingMembers.map((member, index) => {
							const pendingUserId =
								typeof member.user === 'object'
									? getUserId(member.user)
									: member.user;

							return (
								<div
									className='request-card'
									key={pendingUserId || index}>
									<h4>
										{member.user?.name ||
											member.registrationDetails?.fullName ||
											'Unknown User'}
									</h4>
									<p>
										<strong>Student ID:</strong>{' '}
										{member.registrationDetails?.studentId || '-'}
									</p>
									<p>
										<strong>Email:</strong>{' '}
										{member.registrationDetails?.email || '-'}
									</p>
									<p>
										<strong>Phone:</strong>{' '}
										{member.registrationDetails?.phone || '-'}
									</p>
									<p>
										<strong>Degree:</strong>{' '}
										{member.registrationDetails?.degreeProgram || '-'}
									</p>
									<p>
										<strong>Year:</strong>{' '}
										{member.registrationDetails?.year || '-'}
									</p>
									<p>
										<strong>Reason:</strong>{' '}
										{member.registrationDetails?.reason || '-'}
									</p>

									<div className='request-actions'>
										<button
											className='btn btn-approve'
											onClick={() => handleApproveMember(pendingUserId)}>
											Approve
										</button>
										<button
											className='btn btn-reject'
											onClick={() => handleRejectMember(pendingUserId)}>
											Reject
										</button>
									</div>
								</div>
							);
						})
					)}
				</div>
			)}

			{showEditModal && canManageClub && (
				<div className='modal-overlay'>
					<div className='modal-content'>
						<h3>Update Club</h3>
						<form onSubmit={handleUpdateClub}>
							<div className='form-group'>
								<label>Club Name</label>
								<input
									type='text'
									value={editData.name}
									onChange={(e) =>
										setEditData({ ...editData, name: e.target.value })
									}
									required
								/>
							</div>

							<div className='form-group'>
								<label>Description</label>
								<textarea
									rows='3'
									value={editData.description}
									onChange={(e) =>
										setEditData({
											...editData,
											description: e.target.value,
										})
									}
									required
								/>
							</div>

							<div className='form-group'>
								<label>Rules</label>
								<textarea
									rows='3'
									value={editData.rules}
									onChange={(e) =>
										setEditData({ ...editData, rules: e.target.value })
									}
								/>
							</div>

							<div className='form-group'>
								<label>Category</label>
								<input
									type='text'
									value={editData.category}
									onChange={(e) =>
										setEditData({ ...editData, category: e.target.value })
									}
									required
								/>
							</div>

							<div className='form-group'>
								<label>Cover Image URL</label>
								<input
									type='text'
									value={editData.coverImage}
									onChange={(e) =>
										setEditData({
											...editData,
											coverImage: e.target.value,
										})
									}
								/>
							</div>

							<div className='form-group'>
								<label>Privacy</label>
								<select
									value={editData.isPublic ? 'public' : 'private'}
									onChange={(e) =>
										setEditData({
											...editData,
											isPublic: e.target.value === 'public',
										})
									}>
									<option value='public'>Public</option>
									<option value='private'>Private</option>
								</select>
							</div>

							<div className='modal-actions'>
								<button
									type='button'
									className='btn btn-cancel'
									onClick={() => setShowEditModal(false)}>
									Cancel
								</button>
								<button
									type='submit'
									className='btn btn-save'>
									Save Changes
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{showNoticeModal && canManageClub && (
				<div className='modal-overlay'>
					<div className='modal-content'>
						<h3>Add Notice</h3>
						<form onSubmit={handleAddNotice}>
							<div className='form-group'>
								<label>Title</label>
								<input
									type='text'
									value={noticeData.title}
									onChange={(e) =>
										setNoticeData({ ...noticeData, title: e.target.value })
									}
									required
								/>
							</div>

							<div className='form-group'>
								<label>Content</label>
								<textarea
									rows='4'
									value={noticeData.content}
									onChange={(e) =>
										setNoticeData({ ...noticeData, content: e.target.value })
									}
									required
								/>
							</div>

							<div className='modal-actions'>
								<button
									type='button'
									className='btn btn-cancel'
									onClick={() => setShowNoticeModal(false)}>
									Cancel
								</button>
								<button
									type='submit'
									className='btn btn-save'>
									Publish Notice
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{showEventModal && canManageClub && (
				<div className='modal-overlay'>
					<div className='modal-content'>
						<h3>Add Event</h3>
						<form onSubmit={handleAddEvent}>
							<div className='form-group'>
								<label>Event Title</label>
								<input
									type='text'
									value={eventData.title}
									onChange={(e) =>
										setEventData({ ...eventData, title: e.target.value })
									}
									required
								/>
							</div>

							<div className='form-group'>
								<label>Description</label>
								<textarea
									rows='4'
									value={eventData.content}
									onChange={(e) =>
										setEventData({
											...eventData,
											content: e.target.value,
										})
									}
									required
								/>
							</div>

							<div className='form-group'>
								<label>Date & Time</label>
								<input
									type='datetime-local'
									value={eventData.dueDate}
									onChange={(e) =>
										setEventData({
											...eventData,
											dueDate: e.target.value,
										})
									}
									required
								/>
							</div>

							<div className='form-group'>
								<label>Location</label>
								<input
									type='text'
									value={eventData.location}
									onChange={(e) =>
										setEventData({
											...eventData,
											location: e.target.value,
										})
									}
								/>
							</div>

							<div className='form-group'>
								<label>Time Label</label>
								<input
									type='text'
									placeholder='e.g. 10.00 AM - 12.00 PM'
									value={eventData.time}
									onChange={(e) =>
										setEventData({ ...eventData, time: e.target.value })
									}
								/>
							</div>

							<div className='modal-actions'>
								<button
									type='button'
									className='btn btn-cancel'
									onClick={() => setShowEventModal(false)}>
									Cancel
								</button>
								<button
									type='submit'
									className='btn btn-save'>
									Add Event
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{showFileModal && canManageClub && (
				<div className='modal-overlay'>
					<div className='modal-content'>
						<h3>Add File</h3>
						<form onSubmit={handleAddFile}>
							<div className='form-group'>
								<label>Select File</label>
								<input
									type='file'
									onChange={handleFileChange}
									required
								/>
							</div>

							<div className='form-group'>
								<label>File Title</label>
								<input
									type='text'
									value={fileData.title}
									onChange={(e) =>
										setFileData({ ...fileData, title: e.target.value })
									}
									required
								/>
							</div>

							<div className='modal-actions'>
								<button
									type='button'
									className='btn btn-cancel'
									onClick={() => setShowFileModal(false)}>
									Cancel
								</button>
								<button
									type='submit'
									className='btn btn-save'>
									Add File
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			<style jsx>{`
				.club-details-container {
					padding: 20px 40px 40px;
					font-family: 'Inter', sans-serif;
					max-width: 1200px;
					margin: 0 auto;
				}

				.back-link {
					display: inline-flex;
					align-items: center;
					gap: 6px;
					background: none;
					border: none;
					color: #666;
					font-weight: 500;
					font-size: 0.95rem;
					cursor: pointer;
					margin-bottom: 20px;
				}

				.club-cover-area {
					height: 320px;
					border-radius: 24px;
					overflow: hidden;
					position: relative;
					margin-bottom: 30px;
					box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
				}

				.cover-image {
					width: 100%;
					height: 100%;
					object-fit: cover;
				}

				.corner-badges {
					position: absolute;
					top: 20px;
					right: 20px;
					display: flex;
					flex-direction: column;
					gap: 10px;
					z-index: 10;
					align-items: flex-end;
				}

				.badge-pill {
					padding: 8px 16px;
					border-radius: 30px;
					font-size: 0.85rem;
					font-weight: 600;
					display: flex;
					align-items: center;
					gap: 8px;
					backdrop-filter: blur(10px);
				}

				.privacy-pill {
					background: rgba(255, 255, 255, 0.9);
					color: #1a1a1a;
				}

				.date-pill {
					background: rgba(0, 0, 0, 0.5);
					color: white;
				}

				.cover-overlay {
					position: absolute;
					inset: 0;
					background: linear-gradient(
						to top,
						rgba(0, 0, 0, 0.85) 0%,
						rgba(0, 0, 0, 0.2) 60%,
						transparent 100%
					);
					display: flex;
					align-items: flex-end;
					padding: 40px;
				}

				.cover-content {
					color: white;
					max-width: 850px;
				}

				.club-title {
					margin: 0 0 10px 0;
					font-size: 2.2rem;
					font-weight: 800;
				}

				.club-desc {
					margin: 0;
					font-size: 1.05rem;
					opacity: 0.95;
					line-height: 1.5;
				}

				.club-sub {
					margin-top: 8px;
					font-size: 0.95rem;
					opacity: 0.9;
				}

				.admin-actions {
					display: flex;
					gap: 12px;
					margin-top: 20px;
					flex-wrap: wrap;
				}

				.tabs {
					display: flex;
					gap: 15px;
					border-bottom: 2px solid #f0f0f0;
					margin-bottom: 30px;
					overflow-x: auto;
				}

				.tab {
					padding: 12px 24px;
					background: none;
					border: none;
					font-size: 1.05rem;
					font-weight: 600;
					color: #a0aec0;
					cursor: pointer;
					position: relative;
					white-space: nowrap;
				}

				.tab.active {
					color: #1a4f76;
				}

				.tab.active::after {
					content: '';
					position: absolute;
					bottom: -2px;
					left: 0;
					right: 0;
					height: 3px;
					background: #16a34a;
					border-radius: 4px 4px 0 0;
				}

				.dashboard-grid {
					display: grid;
					grid-template-columns: repeat(3, 1fr);
					gap: 20px;
				}

				.stat-card {
					background: white;
					border-radius: 16px;
					padding: 20px;
					display: flex;
					align-items: center;
					gap: 12px;
					box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
				}

				.content-section {
					background: white;
					border-radius: 18px;
					padding: 24px;
					box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
				}

				.content-card,
				.request-card,
				.member-card {
					border: 1px solid #e5e7eb;
					border-radius: 14px;
					padding: 16px;
					margin-top: 16px;
				}

				.card-header-row {
					display: flex;
					justify-content: space-between;
					align-items: center;
					gap: 12px;
				}

				.mini-delete-btn {
					border: none;
					background: #fee2e2;
					color: #991b1b;
					border-radius: 8px;
					padding: 8px;
					cursor: pointer;
				}

				.file-link {
					display: inline-block;
					margin-top: 10px;
					color: #2563eb;
					font-weight: 600;
					text-decoration: none;
				}

				.member-grid {
					display: grid;
					grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
					gap: 16px;
					margin-top: 16px;
				}

				.request-actions {
					display: flex;
					gap: 10px;
					margin-top: 14px;
				}

				.btn {
					border: none;
					border-radius: 10px;
					padding: 10px 16px;
					font-weight: 600;
					cursor: pointer;
					display: inline-flex;
					align-items: center;
					gap: 8px;
				}

				.btn-edit {
					background: #dbeafe;
					color: #1d4ed8;
				}

				.btn-delete {
					background: #fee2e2;
					color: #b91c1c;
				}

				.btn-notice {
					background: #ecfccb;
					color: #3f6212;
				}

				.btn-event {
					background: #ede9fe;
					color: #6d28d9;
				}

				.btn-file {
					background: #e0f2fe;
					color: #0369a1;
				}

				.btn-approve {
					background: #dcfce7;
					color: #166534;
				}

				.btn-reject {
					background: #fee2e2;
					color: #991b1b;
				}

				.btn-save {
					background: #111827;
					color: white;
				}

				.btn-cancel {
					background: #e2e8f0;
					color: #334155;
				}

				.modal-overlay {
					position: fixed;
					inset: 0;
					background: rgba(15, 23, 42, 0.55);
					display: flex;
					align-items: center;
					justify-content: center;
					z-index: 2000;
					padding: 20px;
					overflow-y: auto;
				}

				.modal-content {
					width: 100%;
					max-width: 600px;
					background: white;
					border-radius: 24px;
					padding: 28px;
					box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
					max-height: 90vh;
					overflow-y: auto;
				}

				.form-group {
					margin-bottom: 16px;
				}

				.form-group label {
					display: block;
					margin-bottom: 8px;
					font-weight: 600;
					color: #334155;
				}

				.form-group input,
				.form-group textarea,
				.form-group select {
					width: 100%;
					border: 1px solid #dbe2ea;
					border-radius: 14px;
					padding: 12px 14px;
					font-size: 14px;
					outline: none;
				}

				.modal-actions {
					display: flex;
					justify-content: flex-end;
					gap: 12px;
					margin-top: 20px;
				}

				@media (max-width: 768px) {
					.club-details-container {
						padding: 20px;
					}

					.club-cover-area {
						height: 250px;
					}

					.cover-overlay {
						padding: 24px;
					}

					.club-title {
						font-size: 1.7rem;
					}

					.dashboard-grid {
						grid-template-columns: 1fr;
					}
				}
			`}</style>
		</div>
	);
};

export default ClubDetails;

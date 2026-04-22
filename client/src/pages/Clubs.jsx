/**
 * Clubs Discovery Page
 * Allows users to browse available clubs and submit join registrations.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Plus, Users, ChevronRight, Search, Flag, Info } from 'lucide-react';

import SkeletonGroup from '../components/Groups/SkeletonGroup';
import EmptyState from '../components/Groups/EmptyState';

const Clubs = () => {
    const navigate = useNavigate();

    const [userRole, setUserRole] = useState('student');
    const [activeTab, setActiveTab] = useState('discover');
    const [currentUserId, setCurrentUserId] = useState(null);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [selectedClubId, setSelectedClubId] = useState(null);

    const [newClubData, setNewClubData] = useState({
        name: '',
        description: '',
        category: 'Academic',
        rules: '',
        coverImage: '',
        isPublic: true
    });

    const [registrationForm, setRegistrationForm] = useState({
        fullName: '',
        studentId: '',
        email: '',
        phone: '',
        degreeProgram: '',
        year: '',
        reason: ''
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [imagePreview, setImagePreview] = useState(null);

    const getMemberRecord = (club) => {
        if (!club || !Array.isArray(club.members) || !currentUserId) return null;

        return (
            club.members.find((member) => {
                const memberUserId =
                    typeof member.user === 'object'
                        ? member.user?._id || member.user?.id
                        : member.user;

                return memberUserId?.toString() === currentUserId?.toString();
            }) || null
        );
    };

    const fetchData = async () => {
        setLoading(true);
        setError('');

        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            setLoading(false);
            return;
        }

        try {
            const clubsEndpoint =
                activeTab === 'my_clubs'
                    ? 'http://localhost:5000/api/clubs/my-clubs'
                    : 'http://localhost:5000/api/clubs?limit=12';

            const [userRes, clubsRes] = await Promise.all([
                axios.get('http://localhost:5000/api/auth/me', {
                    headers: { 'x-auth-token': token }
                }),
                axios.get(clubsEndpoint, {
                    headers: { 'x-auth-token': token }
                })
            ]);

            if (userRes.data) {
                const role = userRes.data.role?.toLowerCase() || 'student';
                setUserRole(role);
                setCurrentUserId(userRes.data._id || userRes.data.id || null);

                if (!registrationForm.fullName && !registrationForm.email) {
                    setRegistrationForm((prev) => ({
                        ...prev,
                        fullName: userRes.data.name || '',
                        email: userRes.data.email || ''
                    }));
                }
            }

            setClubs(clubsRes.data || []);
        } catch (err) {
            console.error('Error fetching clubs:', err);
            const serverMsg = err.response?.data?.error || err.response?.data?.message;
            setError(serverMsg ? `Failed to load clubs: ${serverMsg}` : 'Failed to load clubs. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const canCreateClub = userRole === 'admin';

    const handleCreateClub = async (e) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/clubs', newClubData, {
                headers: { 'x-auth-token': token }
            });

            setShowCreateModal(false);
            setNewClubData({
                name: '',
                description: '',
                category: 'Academic',
                rules: '',
                coverImage: '',
                isPublic: true
            });
            setImagePreview(null);
            fetchData();
        } catch (err) {
            console.error('Error creating club:', err);
            alert(`Failed to create club: ${err.response?.data?.message || err.message}`);
        }
    };

    const handleOpenRegisterModal = (clubId) => {
        setSelectedClubId(clubId);
        setShowRegisterModal(true);
    };

    const handleRegisterClub = async (e) => {
        e.preventDefault();

        if (!selectedClubId) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `http://localhost:5000/api/clubs/${selectedClubId}/join`,
                registrationForm,
                { headers: { 'x-auth-token': token } }
            );

            setShowRegisterModal(false);
            setSelectedClubId(null);
            setRegistrationForm((prev) => ({
                ...prev,
                studentId: '',
                phone: '',
                degreeProgram: '',
                year: '',
                reason: ''
            }));
            setActiveTab('my_clubs');
            fetchData();
        } catch (err) {
            console.error('Error registering for club:', err);
            alert(err.response?.data?.message || 'Failed to submit registration');
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setNewClubData({ ...newClubData, coverImage: reader.result });
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const filteredClubs = clubs.filter((club) =>
        (club.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="clubs-container">
            <div className="clubs-header-section">
                <div className="filters-row">
                    <div className="status-tabs">
                        <button
                            className={`status-pill ${activeTab === 'discover' ? 'active teaching' : ''}`}
                            onClick={() => setActiveTab('discover')}
                        >
                            <Search size={18} />
                            Discover Clubs
                        </button>
                        <button
                            className={`status-pill ${activeTab === 'my_clubs' ? 'active enrolled' : ''}`}
                            onClick={() => setActiveTab('my_clubs')}
                        >
                            <Flag size={18} />
                            My Clubs
                        </button>
                    </div>

                    <div className="search-box-premium">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Find your community..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="header-actions">
                        {canCreateClub && (
                            <button className="create-btn" onClick={() => setShowCreateModal(true)}>
                                <Plus size={18} />
                                New Club
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="clubs-grid">
                {loading ? (
                    Array(6).fill(0).map((_, i) => <SkeletonGroup key={i} />)
                ) : error ? (
                    <div className="error-container">
                        <p className="error-text">{error}</p>
                        <button onClick={fetchData} className="retry-btn">Retry</button>
                    </div>
                ) : filteredClubs.length === 0 ? (
                    <EmptyState
                        title={activeTab === 'my_clubs' ? "You haven't joined any clubs yet" : 'No clubs found'}
                        description={
                            activeTab === 'my_clubs'
                                ? 'Discover and join clubs that match your interests!'
                                : `No clubs matching "${searchTerm}".`
                        }
                        onClearSearch={() => setSearchTerm('')}
                        icon={Flag}
                    />
                ) : (
                    filteredClubs.map((club) => {
                        const memberRecord = getMemberRecord(club);
                        const clubCreatorId =
                            typeof club.createdBy === 'object' ? club.createdBy?._id : club.createdBy;
                        const isOwner = clubCreatorId?.toString() === currentUserId?.toString();
                        const myStatus =
                            activeTab === 'my_clubs'
                                ? club.myStatus
                                : club.myStatus || memberRecord?.status;

                        return (
                            <motion.div
                                key={club._id}
                                className="club-card"
                                onClick={() => navigate(`/clubs/${club._id}`)}
                                style={{ cursor: 'pointer' }}
                                whileHover={{ y: -5 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="card-image-wrapper">
                                    <img
                                        src={
                                            club.coverImage ||
                                            'https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
                                        }
                                        alt={club.name}
                                        className="card-image"
                                    />
                                    <div className="card-category-badge">{club.category || 'General'}</div>
                                </div>

                                <div className="card-content">
                                    <h3 className="card-title">{club.name}</h3>
                                    <p className="card-description">
                                        {club.description?.length > 100
                                            ? `${club.description.substring(0, 100)}...`
                                            : club.description}
                                    </p>
                                </div>

                                <div className="card-footer">
                                    <div className="footer-icons">
                                        <span className="icon-club" title="Members">
                                            <Users size={16} />
                                            <span className="icon-text">
                                                {(club.approvedMembersCount ?? club.members?.filter((m) => m.status === 'Approved').length) || 0}
                                            </span>
                                        </span>
                                        <span className="icon-club" title="Resources">
                                            <Info size={16} />
                                            <span className="icon-text">{(club.resourceCount ?? club.resources?.length) || 0}</span>
                                        </span>
                                    </div>

                                    <div className="card-status-indicator">
                                        {isOwner ? (
                                            <span className="status-badge owner">Owner</span>
                                        ) : myStatus === 'Approved' ? (
                                            <span className="status-badge member">Member</span>
                                        ) : myStatus === 'Pending' ? (
                                            <span className="status-badge pending">Pending</span>
                                        ) : myStatus === 'Rejected' ? (
                                            <span className="status-badge rejected">Rejected</span>
                                        ) : activeTab === 'discover' && userRole === 'student' ? (
                                            <button
                                                className="register-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenRegisterModal(club._id);
                                                }}
                                            >
                                                Register
                                            </button>
                                        ) : (
                                            <span className="join-link">
                                                View Details <ChevronRight size={16} />
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {showCreateModal && (
                <div
                    className="modal-overlay"
                    onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}
                >
                    <motion.div
                        className="modal-content"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <h3>Create New Club</h3>
                        <form onSubmit={handleCreateClub}>
                            <div className="form-group">
                                <label>Club Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newClubData.name}
                                    onChange={(e) => setNewClubData({ ...newClubData, name: e.target.value })}
                                    placeholder="e.g. SLIIT Coding Club"
                                />
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <select
                                    value={newClubData.category}
                                    onChange={(e) => setNewClubData({ ...newClubData, category: e.target.value })}
                                    className="form-select"
                                >
                                    <option value="Academic">Academic</option>
                                    <option value="Sports">Sports</option>
                                    <option value="Arts & Culture">Arts & Culture</option>
                                    <option value="Technology">Technology</option>
                                    <option value="Charity">Charity</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    rows="3"
                                    required
                                    value={newClubData.description}
                                    onChange={(e) =>
                                        setNewClubData({ ...newClubData, description: e.target.value })
                                    }
                                    placeholder="Tell us what this club is about..."
                                />
                            </div>
                            <div className="form-group">
                                <label>Cover Image (Optional)</label>
                                <input type="file" accept="image/*" onChange={handleImageChange} />
                                {imagePreview && (
                                    <div className="image-preview">
                                        <img src={imagePreview} alt="Preview" />
                                    </div>
                                )}
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="submit-btn"
                                    disabled={!newClubData.name || !newClubData.description}
                                >
                                    Create Club
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {showRegisterModal && (
                <div
                    className="modal-overlay"
                    onClick={(e) => e.target === e.currentTarget && setShowRegisterModal(false)}
                >
                    <motion.div
                        className="modal-content"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <h3>Club Registration</h3>
                        <form onSubmit={handleRegisterClub}>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={registrationForm.fullName}
                                    onChange={(e) =>
                                        setRegistrationForm({ ...registrationForm, fullName: e.target.value })
                                    }
                                />
                            </div>
                            <div className="form-group">
                                <label>Student ID</label>
                                <input
                                    type="text"
                                    required
                                    value={registrationForm.studentId}
                                    onChange={(e) =>
                                        setRegistrationForm({ ...registrationForm, studentId: e.target.value })
                                    }
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    required
                                    value={registrationForm.email}
                                    onChange={(e) =>
                                        setRegistrationForm({ ...registrationForm, email: e.target.value })
                                    }
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input
                                    type="text"
                                    required
                                    value={registrationForm.phone}
                                    onChange={(e) =>
                                        setRegistrationForm({ ...registrationForm, phone: e.target.value })
                                    }
                                />
                            </div>
                            <div className="form-group">
                                <label>Degree Program</label>
                                <input
                                    type="text"
                                    required
                                    value={registrationForm.degreeProgram}
                                    onChange={(e) =>
                                        setRegistrationForm({
                                            ...registrationForm,
                                            degreeProgram: e.target.value
                                        })
                                    }
                                />
                            </div>
                            <div className="form-group">
                                <label>Year</label>
                                <select
                                    required
                                    value={registrationForm.year}
                                    onChange={(e) =>
                                        setRegistrationForm({ ...registrationForm, year: e.target.value })
                                    }
                                >
                                    <option value="">Select year</option>
                                    <option value="1">Year 1</option>
                                    <option value="2">Year 2</option>
                                    <option value="3">Year 3</option>
                                    <option value="4">Year 4</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Reason for joining</label>
                                <textarea
                                    rows="3"
                                    required
                                    value={registrationForm.reason}
                                    onChange={(e) =>
                                        setRegistrationForm({ ...registrationForm, reason: e.target.value })
                                    }
                                />
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => setShowRegisterModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="submit-btn">Submit Registration</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            <style jsx>{`
                .clubs-container {
                    padding: 30px 40px;
                    font-family: 'Inter', sans-serif;
                }

                @media (max-width: 1024px) {
                    .clubs-container {
                        padding: 20px;
                    }
                }

                .clubs-header-section {
                    margin-bottom: 30px;
                }

                .filters-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 20px;
                }

                .search-box-premium {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(10px);
                    border: 1px solid #e2e8f0;
                    border-radius: 30px;
                    display: flex;
                    align-items: center;
                    padding: 8px 16px;
                    gap: 10px;
                    flex: 1;
                    max-width: 400px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
                    transition: all 0.3s ease;
                }

                .search-box-premium:focus-within {
                    background: white;
                    border-color: #4f6ef7;
                }

                .status-tabs {
                    display: flex;
                    gap: 12px;
                    background: white;
                    padding: 6px;
                    border-radius: 30px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
                }

                .status-pill {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    border: none;
                    background: transparent;
                    border-radius: 20px;
                    font-weight: 600;
                    font-size: 0.9rem;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .status-pill.active.teaching {
                    background: #4f6ef7;
                    color: white;
                }

                .status-pill.active.enrolled {
                    background: #1e293b;
                    color: white;
                }

                .create-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background-color: #4f6ef7;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 0.95rem;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(79, 110, 247, 0.2);
                }

                .clubs-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 24px;
                }

                .club-card {
                    background: white;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
                    display: flex;
                    flex-direction: column;
                    height: 400px;
                    transition: transform 0.2s;
                }

                .card-image-wrapper {
                    position: relative;
                    height: 200px;
                    width: 100%;
                }

                .card-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .card-category-badge {
                    position: absolute;
                    top: 12px;
                    left: 12px;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(4px);
                    padding: 6px 12px;
                    border-radius: 20px;
                    color: white;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .card-content {
                    padding: 20px;
                    flex: 1;
                }

                .card-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin-bottom: 8px;
                }

                .card-description {
                    color: #64748b;
                    font-size: 0.9rem;
                    line-height: 1.5;
                }

                .card-footer {
                    padding: 16px 20px;
                    border-top: 1px solid #f8fafc;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 8px;
                }

                .footer-icons {
                    display: flex;
                    gap: 16px;
                    color: #94a3b8;
                }

                .icon-club {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .icon-text {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #64748b;
                }

                .status-badge {
                    font-size: 0.75rem;
                    font-weight: 700;
                    padding: 4px 10px;
                    border-radius: 12px;
                    text-transform: uppercase;
                }

                .status-badge.owner {
                    background: #dcfce7;
                    color: #166534;
                }

                .status-badge.member {
                    background: #e0f2fe;
                    color: #075985;
                }

                .status-badge.pending {
                    background: #fef3c7;
                    color: #92400e;
                }

                .status-badge.rejected {
                    background: #fee2e2;
                    color: #991b1b;
                }

                .register-btn {
                    border: none;
                    background: #2563eb;
                    color: white;
                    border-radius: 999px;
                    padding: 8px 14px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    cursor: pointer;
                }

                .join-link {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    color: #4f6ef7;
                    font-size: 0.85rem;
                    font-weight: 600;
                }

                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                }

                .modal-content {
                    background: white;
                    padding: 32px;
                    border-radius: 24px;
                    width: 100%;
                    max-width: 550px;
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
                    max-height: 90vh;
                    overflow-y: auto;
                }

                .form-group {
                    margin-bottom: 20px;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: #1e293b;
                }

                .form-group input,
                .form-group textarea,
                .form-select,
                .form-group select {
                    width: 100%;
                    padding: 12px 16px;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    font-size: 1rem;
                }

                .image-preview {
                    margin-top: 12px;
                    height: 150px;
                    border-radius: 12px;
                    overflow: hidden;
                }

                .image-preview img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    margin-top: 30px;
                }

                .cancel-btn {
                    background: #f1f5f9;
                    color: #475569;
                    padding: 12px 24px;
                    border-radius: 12px;
                    border: none;
                    font-weight: 600;
                    cursor: pointer;
                }

                .submit-btn {
                    background: #4f6ef7;
                    color: white;
                    padding: 12px 24px;
                    border-radius: 12px;
                    border: none;
                    font-weight: 600;
                    cursor: pointer;
                }

                .submit-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
};

export default Clubs;

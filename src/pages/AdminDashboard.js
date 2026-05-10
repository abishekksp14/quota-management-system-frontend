import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, updateUserQuota, getReports, getAllRequests, updateRequestStatus } from '../services/api';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [requests, setRequests] = useState([]);
  const [quotaInputs, setQuotaInputs] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchData();
    // Also fetch requests count for badge
    fetchRequestsCount();
  }, [activeTab]);

  const fetchRequestsCount = async () => {
    try {
      const response = await getAllRequests();
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const response = await getAllUsers();
        setUsers(response.data);
        const inputs = {};
        response.data.forEach(u => {
          inputs[u._id] = u.quotaLimit;
        });
        setQuotaInputs(inputs);
      } else if (activeTab === 'requests') {
        const response = await getAllRequests();
        setRequests(response.data);
      } else {
        const response = await getReports();
        setReports(response.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'Failed to fetch data. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleQuotaChange = (userId, value) => {
    setQuotaInputs({ ...quotaInputs, [userId]: value });
  };

  const handleUpdateQuota = async (userId) => {
    setMessage({ type: '', text: '' });
    try {
      const response = await updateUserQuota(userId, parseInt(quotaInputs[userId]));
      setMessage({ type: 'success', text: response.data.message });
      fetchData();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update quota' 
      });
    }
  };

  const handleStatusUpdate = async (requestId, status) => {
    setMessage({ type: '', text: '' });
    try {
      const response = await updateRequestStatus(requestId, status);
      setMessage({ type: 'success', text: response.data.message });
      fetchData();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update request status' 
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  return (
    <div className="dashboard fade-in">
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="logo">
            <i className="fas fa-shield-alt"></i>
          </div>
          <h1>Admin Console</h1>
        </div>
        <div className="navbar-right">
          <div className="user-info">
            <div className="user-avatar">
              <i className="fas fa-user-shield"></i>
            </div>
            <div className="user-details">
              <span className="name">{user.name}</span>
              <span className="user-role">{user.role}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-danger btn-small">
            <i className="fas fa-sign-out-alt"></i>
            Logout
          </button>
        </div>
      </nav>

      <div className="container">
        {message.text && (
          <div className={message.type === 'error' ? 'error-message' : 'success-message'}>
            <i className={message.type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-check-circle'}></i>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <i className="fas fa-users"></i>
            Manage Users
          </button>
          <button 
            className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <i className="fas fa-tasks"></i>
            Requests
            {pendingCount > 0 && <span className="badge">{pendingCount}</span>}
          </button>
          <button 
            className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <i className="fas fa-chart-bar"></i>
            Usage Reports
          </button>
        </div>

        {loading ? (
          <div className="loading">
            <i className="fas fa-circle-notch fa-spin"></i>
            <span>Loading...</span>
          </div>
        ) : (
          <>
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="card">
                <div className="card-header">
                  <i className="fas fa-users-cog"></i>
                  <h3>User Management</h3>
                </div>
                <div className="card-body">
                  {users.length === 0 ? (
                    <div className="no-data">
                      <i className="fas fa-user-slash"></i>
                      <p>No users registered yet.</p>
                    </div>
                  ) : (
                    <div className="table-wrapper">
                      <table className="user-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Quota Limit</th>
                            <th>Used</th>
                            <th>Remaining</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((u) => (
                            <tr key={u._id}>
                              <td>{u.name}</td>
                              <td>{u.email}</td>
                              <td>
                                <input
                                  type="number"
                                  className="quota-input"
                                  value={quotaInputs[u._id] || 0}
                                  onChange={(e) => handleQuotaChange(u._id, e.target.value)}
                                  min="0"
                                />
                              </td>
                              <td>{u.quotaUsed}</td>
                              <td>{u.quotaLimit - u.quotaUsed}</td>
                              <td>
                                <button 
                                  className="btn btn-success btn-small"
                                  onClick={() => handleUpdateQuota(u._id)}
                                >
                                  <i className="fas fa-save"></i>
                                  Update
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Requests Tab */}
            {activeTab === 'requests' && (
              <div className="card">
                <div className="card-header">
                  <i className="fas fa-clipboard-list"></i>
                  <h3>All Requests</h3>
                </div>
                <div className="card-body">
                  {requests.length === 0 ? (
                    <div className="no-data">
                      <i className="fas fa-inbox"></i>
                      <p>No requests submitted yet.</p>
                    </div>
                  ) : (
                    <div className="table-wrapper">
                      <table className="user-table">
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>Title</th>
                            <th>Description</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {requests.map((req) => (
                            <tr key={req._id}>
                              <td>
                                <div className="user-cell">
                                  <strong>{req.user?.name || 'Unknown'}</strong>
                                  <small>{req.user?.email || ''}</small>
                                </div>
                              </td>
                              <td>{req.title}</td>
                              <td className="desc-cell">{req.description}</td>
                              <td className="date-cell">{formatDate(req.createdAt)}</td>
                              <td>
                                <span className={`status ${req.status.toLowerCase()}`}>
                                  {req.status}
                                </span>
                              </td>
                              <td>
                                <div className="action-buttons">
                                  {req.status === 'PENDING' ? (
                                    <>
                                      <button 
                                        className="btn btn-success btn-small"
                                        onClick={() => handleStatusUpdate(req._id, 'APPROVED')}
                                        title="Approve"
                                      >
                                        <i className="fas fa-check"></i>
                                        Approve
                                      </button>
                                      <button 
                                        className="btn btn-danger btn-small"
                                        onClick={() => handleStatusUpdate(req._id, 'REJECTED')}
                                        title="Reject"
                                      >
                                        <i className="fas fa-times"></i>
                                        Reject
                                      </button>
                                    </>
                                  ) : (
                                    <button 
                                      className="btn btn-secondary btn-small"
                                      onClick={() => handleStatusUpdate(req._id, 'PENDING')}
                                      title="Reset to Pending"
                                    >
                                      <i className="fas fa-undo"></i>
                                      Reset
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="card">
                <div className="card-header">
                  <i className="fas fa-file-alt"></i>
                  <h3>Usage Reports</h3>
                </div>
                <div className="card-body">
                  {reports.length === 0 ? (
                    <div className="no-data">
                      <i className="fas fa-chart-line"></i>
                      <p>No usage data available yet.</p>
                    </div>
                  ) : (
                    <div>
                      {reports.map((report) => (
                        <div key={report.userId} className="report-card">
                          <div className="report-header">
                            <div className="report-avatar">
                              <i className="fas fa-user"></i>
                            </div>
                            <div className="report-user">
                              <h4>{report.name}</h4>
                              <span className="email">{report.email}</span>
                            </div>
                          </div>
                          <div className="report-stats">
                            <div className="report-stat">
                              Quota Limit: <span>{report.quotaLimit}</span>
                            </div>
                            <div className="report-stat">
                              Used: <span>{report.quotaUsed}</span>
                            </div>
                            <div className="report-stat">
                              Remaining: <span>{report.remaining}</span>
                            </div>
                            <div className="report-stat">
                              Total Requests: <span>{report.totalRequests}</span>
                            </div>
                          </div>
                          {report.recentRequests.length > 0 && (
                            <div className="recent-requests">
                              <h5>
                                <i className="fas fa-list"></i>
                                Recent Requests
                              </h5>
                              <ul>
                                {report.recentRequests.map((req) => (
                                  <li key={req._id}>
                                    <span><strong>{req.title}</strong></span>
                                    <span className={`status ${req.status.toLowerCase()}`}>
                                      {req.status}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;

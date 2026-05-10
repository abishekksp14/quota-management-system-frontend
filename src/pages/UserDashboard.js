import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyQuota, getMyRequests, submitRequest, updateMyRequest, deleteMyRequest } from '../services/api';

function UserDashboard() {
  const [quota, setQuota] = useState({ quotaLimit: 0, quotaUsed: 0, remaining: 0 });
  const [requests, setRequests] = useState([]);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [quotaRes, requestsRes] = await Promise.all([
        getMyQuota(),
        getMyRequests()
      ]);
      setQuota(quotaRes.data);
      setRequests(requestsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setSubmitting(true);

    try {
      if (editingId) {
        // Update existing request
        const response = await updateMyRequest(editingId, formData);
        setMessage({ type: 'success', text: response.data.message });
        setEditingId(null);
      } else {
        // Create new request
        const response = await submitRequest(formData);
        setMessage({ type: 'success', text: response.data.message });
      }
      setFormData({ title: '', description: '' });
      fetchData();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to submit request' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (request) => {
    setEditingId(request._id);
    setFormData({ title: request.title, description: request.description });
    setMessage({ type: '', text: '' });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ title: '', description: '' });
  };

  const handleDelete = async (requestId) => {
    if (!window.confirm('Are you sure you want to delete this request? Your quota will be refunded.')) {
      return;
    }

    try {
      const response = await deleteMyRequest(requestId);
      setMessage({ type: 'success', text: response.data.message });
      fetchData();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to delete request' 
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

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">
          <i className="fas fa-circle-notch fa-spin"></i>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard fade-in">
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="logo">
            <i className="fas fa-chart-pie"></i>
          </div>
          <h1>Quota Management</h1>
        </div>
        <div className="navbar-right">
          <div className="user-info">
            <div className="user-avatar">
              <i className="fas fa-user"></i>
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
        {/* Quota Display */}
        <div className="card">
          <div className="card-header">
            <i className="fas fa-tachometer-alt"></i>
            <h3>Quota Overview</h3>
          </div>
          <div className="card-body">
            <div className="quota-stats">
              <div className="quota-stat total">
                <div className="icon">
                  <i className="fas fa-database"></i>
                </div>
                <div className="quota-stat-content">
                  <div className="number">{quota.quotaLimit}</div>
                  <div className="label">Total Quota</div>
                </div>
              </div>
              <div className="quota-stat used">
                <div className="icon">
                  <i className="fas fa-minus-circle"></i>
                </div>
                <div className="quota-stat-content">
                  <div className="number">{quota.quotaUsed}</div>
                  <div className="label">Used</div>
                </div>
              </div>
              <div className="quota-stat remaining">
                <div className="icon">
                  <i className="fas fa-check-circle"></i>
                </div>
                <div className="quota-stat-content">
                  <div className="number">{quota.remaining}</div>
                  <div className="label">Remaining</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Request Form */}
        <div className="card">
          <div className="card-header">
            <i className={editingId ? "fas fa-edit" : "fas fa-plus-square"}></i>
            <h3>{editingId ? 'Edit Request' : 'Submit New Request'}</h3>
          </div>
          <div className="card-body">
            {message.text && (
              <div className={message.type === 'error' ? 'error-message' : 'success-message'}>
                <i className={message.type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-check-circle'}></i>
                {message.text}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Request Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="Enter request title"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  placeholder="Describe your request in detail"
                  rows="4"
                />
              </div>
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={submitting || (!editingId && quota.remaining <= 0)}
                >
                  {submitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      {editingId ? 'Updating...' : 'Submitting...'}
                    </>
                  ) : editingId ? (
                    <>
                      <i className="fas fa-save"></i>
                      Update Request
                    </>
                  ) : quota.remaining <= 0 ? (
                    <>
                      <i className="fas fa-ban"></i>
                      No Quota Available
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane"></i>
                      Submit Request
                    </>
                  )}
                </button>
                {editingId && (
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={handleCancelEdit}
                    style={{marginLeft: '10px'}}
                  >
                    <i className="fas fa-times"></i>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Request History */}
        <div className="card">
          <div className="card-header">
            <i className="fas fa-history"></i>
            <h3>Request History</h3>
          </div>
          <div className="card-body">
            {requests.length === 0 ? (
              <div className="no-data">
                <i className="fas fa-inbox"></i>
                <p>No requests submitted yet. Create your first request above.</p>
              </div>
            ) : (
              <ul className="request-list">
                {requests.map((request) => (
                  <li key={request._id} className="request-item">
                    <div className="request-content">
                      <h4>{request.title}</h4>
                      <p>{request.description}</p>
                      <div className="request-meta">
                        <span className="request-date">
                          <i className="fas fa-clock"></i>
                          {formatDate(request.createdAt)}
                        </span>
                        <span className={`status ${request.status.toLowerCase()}`}>
                          {request.status}
                        </span>
                      </div>
                    </div>
                    <div className="request-actions">
                      {request.status === 'PENDING' && (
                        <button 
                          className="btn btn-primary btn-small"
                          onClick={() => handleEdit(request)}
                          title="Edit Request"
                        >
                          <i className="fas fa-edit"></i>
                          Edit
                        </button>
                      )}
                      <button 
                        className="btn btn-danger btn-small"
                        onClick={() => handleDelete(request._id)}
                        title="Delete Request"
                      >
                        <i className="fas fa-trash"></i>
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );

}

export default UserDashboard;

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import AdminHeader from "./components/AdminHeader";
import AdminSidebar from "./components/AdminSidebar";
import "./styles/AdminCommunityManage.css";

const API_BASE = "http://localhost:5000/api/community-forum";

const AdminCommunityManage = () => {
  const [discussions, setDiscussions] = useState([]);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const getModal = (id) => {
    const el = document.getElementById(id);
    if (!el || !window.bootstrap) return null;
    return window.bootstrap.Modal.getOrCreateInstance(el);
  };

  const fetchDiscussions = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/admin/all`);
      setDiscussions(res.data || []);
    } catch (error) {
      console.error("Failed to fetch discussions:", error);
      alert("Failed to load discussions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscussions();
  }, []);

  useEffect(() => {
    const modalEl = document.getElementById("viewDiscussionModal");
    if (!modalEl) return;

    const handleHidden = () => {
      setSelectedDiscussion(null);
      document.body.classList.remove("modal-open");
      document.body.style.removeProperty("padding-right");
      document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());
    };

    modalEl.addEventListener("hidden.bs.modal", handleHidden);

    return () => {
      modalEl.removeEventListener("hidden.bs.modal", handleHidden);
    };
  }, []);

  const stats = useMemo(() => {
    const total = discussions.length;
    const visible = discussions.filter((item) => item.isActive).length;
    const hidden = discussions.filter((item) => !item.isActive).length;
    const totalReplies = discussions.reduce(
      (sum, item) => sum + (item.replies?.length || 0),
      0
    );

    return { total, visible, hidden, totalReplies };
  }, [discussions]);

  const filteredDiscussions = useMemo(() => {
    return discussions.filter((item) => {
      const combinedText =
        `${item.name || ""} ${item.title || ""} ${item.content || ""}`.toLowerCase();

      const matchesSearch = combinedText.includes(searchTerm.toLowerCase());

      let matchesFilter = true;
      if (statusFilter === "visible") matchesFilter = item.isActive === true;
      if (statusFilter === "hidden") matchesFilter = item.isActive === false;

      return matchesSearch && matchesFilter;
    });
  }, [discussions, searchTerm, statusFilter]);

  const handleView = (discussion) => {
    setSelectedDiscussion(discussion);
    getModal("viewDiscussionModal")?.show();
  };

  const handleHide = async (discussionId) => {
    try {
      await axios.patch(`${API_BASE}/admin/${discussionId}/hide`);

      const modal = getModal("viewDiscussionModal");
      modal?.hide();

      await fetchDiscussions();

      document.body.classList.remove("modal-open");
      document.body.style.removeProperty("padding-right");
      document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());
    } catch (error) {
      console.error("Failed to hide discussion:", error);
      alert("Failed to hide discussion");
    }
  };

  const handleRestore = async (discussionId) => {
    try {
      await axios.patch(`${API_BASE}/admin/${discussionId}/restore`);

      const modal = getModal("viewDiscussionModal");
      modal?.hide();

      await fetchDiscussions();

      document.body.classList.remove("modal-open");
      document.body.style.removeProperty("padding-right");
      document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());
    } catch (error) {
      console.error("Failed to restore discussion:", error);
      alert("Failed to restore discussion");
    }
  };

  const handleDelete = async (discussionId) => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently remove this discussion?"
    );
    if (!confirmed) return;

    try {
      await axios.delete(`${API_BASE}/${discussionId}`);

      const modal = getModal("viewDiscussionModal");
      modal?.hide();

      await fetchDiscussions();

      document.body.classList.remove("modal-open");
      document.body.style.removeProperty("padding-right");
      document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());
    } catch (error) {
      console.error("Failed to delete discussion:", error);
      alert("Failed to delete discussion");
    }
  };

  return (
    <div className="adcm-layout">
      <AdminHeader />

      <div className="adcm-body">
        <AdminSidebar activeItem="community" />

        <div className="adcm-content">
          <main className="adcm-main">
            <section className="adcm-page-head">
              <div>
                <h1>Manage Community</h1>
                <p>
                  Review discussions, remove harmful replies, and moderate forum activity.
                </p>
              </div>
            </section>

            <section className="adcm-stats-grid">
              <div className="adcm-stat-card">
                <span>Total Discussions</span>
                <strong>{stats.total}</strong>
              </div>

              <div className="adcm-stat-card">
                <span>Visible Discussions</span>
                <strong>{stats.visible}</strong>
              </div>

              <div className="adcm-stat-card">
                <span>Hidden Discussions</span>
                <strong>{stats.hidden}</strong>
              </div>

              <div className="adcm-stat-card">
                <span>Total Replies</span>
                <strong>{stats.totalReplies}</strong>
              </div>
            </section>

            <section className="adcm-toolbar">
              <div className="adcm-search">
                <span className="material-symbols-outlined">search</span>
                <input
                  type="text"
                  placeholder="Search by title, content, or user"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="adcm-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All discussions</option>
                <option value="visible">Visible discussions</option>
                <option value="hidden">Hidden discussions</option>
              </select>
            </section>

            <section className="adcm-table-card">
              {loading ? (
                <div className="adcm-empty-state">Loading community data...</div>
              ) : filteredDiscussions.length === 0 ? (
                <div className="adcm-empty-state">No matching discussions found.</div>
              ) : (
                <div className="table-responsive">
                  <table className="adcm-table">
                    <thead>
                      <tr>
                        <th>Author</th>
                        <th>Title</th>
                        <th>Replies</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredDiscussions.map((discussion) => (
                        <tr key={discussion._id}>
                          <td>{discussion.name}</td>

                          <td>
                            <div className="adcm-title-cell">
                              <strong>{discussion.title || "Untitled discussion"}</strong>
                              <span>
                                {discussion.content?.length > 60
                                  ? `${discussion.content.slice(0, 60)}...`
                                  : discussion.content}
                              </span>
                            </div>
                          </td>

                          <td>{discussion.replies?.length || 0}</td>

                          <td>
                            <span
                              className={`adcm-status-pill ${discussion.isActive ? "visible" : "hidden"
                                }`}
                            >
                              {discussion.isActive ? "Visible" : "Hidden"}
                            </span>
                          </td>

                          <td>
                            {discussion.createdAt
                              ? new Date(discussion.createdAt).toLocaleDateString()
                              : "-"}
                          </td>

                          <td>
                            <div className="adcm-actions">
                              <button
                                className="adcm-btn adcm-btn-view me-2 btn-sm"
                                onClick={() => handleView(discussion)}
                              >
                                View
                              </button>

                              {discussion.isActive ? (
                                <button
                                  className="adcm-btn adcm-btn-hide"
                                  onClick={() => handleHide(discussion._id)}
                                >
                                  Hide
                                </button>
                              ) : (
                                <button
                                  className="adcm-btn adcm-btn-restore"
                                  onClick={() => handleRestore(discussion._id)}
                                >
                                  Restore
                                </button>
                              )}

                              <button
                                className="adcm-btn adcm-btn-delete"
                                onClick={() => handleDelete(discussion._id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </main>
        </div>
      </div>

      <div
        className="modal fade"
        id="viewDiscussionModal"
        tabIndex="-1"
        aria-labelledby="viewDiscussionModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content adcm-modal">
            <div className="modal-header border-0">
              <div>
                <h5 className="modal-title" id="viewDiscussionModalLabel">
                  {selectedDiscussion?.title || "Discussion Details"}
                </h5>
                <p className="adcm-modal-subtitle mb-0">
                  Posted by {selectedDiscussion?.name || "Unknown user"}
                </p>
              </div>

              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>

            <div className="modal-body">
              {selectedDiscussion && (
                <>
                  <div className="adcm-modal-card">
                    <div className="adcm-modal-meta">
                      <span
                        className={`adcm-status-pill ${selectedDiscussion.isActive ? "visible" : "hidden"
                          }`}
                      >
                        {selectedDiscussion.isActive ? "Visible" : "Hidden"}
                      </span>

                      <span className="adcm-modal-date">
                        {selectedDiscussion.createdAt
                          ? new Date(selectedDiscussion.createdAt).toLocaleString()
                          : "-"}
                      </span>
                    </div>

                    <p className="adcm-modal-content">{selectedDiscussion.content}</p>
                  </div>

                  <div className="adcm-replies-section">
                    <div className="adcm-replies-header">
                      <h6>Replies</h6>
                      <span>{selectedDiscussion.replies?.length || 0}</span>
                    </div>

                    {selectedDiscussion.replies?.length > 0 ? (
                      <div className="adcm-replies-list">
                        {selectedDiscussion.replies.map((reply) => (
                          <div key={reply._id} className="adcm-reply-item">
                            <div className="adcm-reply-top">
                              <strong>{reply.name}</strong>
                              <small>
                                {reply.createdAt
                                  ? new Date(reply.createdAt).toLocaleString()
                                  : "-"}
                              </small>
                            </div>
                            <p>{reply.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="adcm-no-replies">No replies for this discussion.</div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer border-0">
              {selectedDiscussion?.isActive ? (
                <button
                  className="adcm-btn adcm-btn-hide"
                  onClick={() => handleHide(selectedDiscussion._id)}
                >
                  Hide Discussion
                </button>
              ) : (
                <button
                  className="adcm-btn adcm-btn-restore"
                  onClick={() => handleRestore(selectedDiscussion._id)}
                >
                  Restore Discussion
                </button>
              )}

              <button
                className="adcm-btn adcm-btn-delete"
                onClick={() => handleDelete(selectedDiscussion?._id)}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCommunityManage;
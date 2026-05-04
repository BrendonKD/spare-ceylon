import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Header from "../components/header";
import "../pages/CommunityForum.css";

const API_BASE = "http://localhost:5000/api/community-forum";

const sizeClasses = ["forum-card--lg", "forum-card--md", "forum-card--sm", "forum-card--md"];

const CommunityForum = () => {
  const [discussions, setDiscussions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);

  const [newDiscussion, setNewDiscussion] = useState({
    name: "",
    title: "",
    content: "",
  });

  const [replyForm, setReplyForm] = useState({
    name: "",
    content: "",
  });

  const fetchDiscussions = async () => {
    try {
      const res = await axios.get(API_BASE);
      setDiscussions(res.data);
    } catch (error) {
      console.error("Error fetching discussions:", error);
    }
  };

  useEffect(() => {
    fetchDiscussions();
  }, []);

  const filteredDiscussions = useMemo(() => {
    return discussions.filter((item) => {
      const text = `${item.title || ""} ${item.content || ""} ${item.name || ""}`.toLowerCase();
      return text.includes(searchTerm.toLowerCase());
    });
  }, [discussions, searchTerm]);

  const handleCreateDiscussion = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API_BASE, newDiscussion);
      setNewDiscussion({ name: "", title: "", content: "" });
      fetchDiscussions();
      window.bootstrap?.Modal.getInstance(document.getElementById("startDiscussionModal"))?.hide();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create discussion");
    }
  };

  const handleAddReply = async (e) => {
    e.preventDefault();
    if (!selectedDiscussion) return;

    try {
      const res = await axios.post(`${API_BASE}/${selectedDiscussion._id}/replies`, replyForm);
      setSelectedDiscussion(res.data);
      setReplyForm({ name: "", content: "" });
      fetchDiscussions();
      window.bootstrap?.Modal.getInstance(document.getElementById("replyModal"))?.hide();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to add reply");
    }
  };

  const openDiscussion = async (discussion) => {
    try {
      const res = await axios.get(`${API_BASE}/${discussion._id}`);
      setSelectedDiscussion(res.data);
      new window.bootstrap.Modal(document.getElementById("discussionModal")).show();
    } catch (error) {
      console.error("Error opening discussion:", error);
    }
  };

  const openReplyModal = () => {
    new window.bootstrap.Modal(document.getElementById("replyModal")).show();
  };

  return (
    <>
      <Header />

      <div className="community-page">
        <div className="community-topbar container-fluid">
          <div>
            <h1 className="community-title">Community Garage</h1>
            <p className="community-subtitle">
              Ask, answer, and discuss spare parts with the Spare Ceylon community.
            </p>
          </div>

          <div className="community-actions">
            <div className="community-search">
              <span className="material-symbols-outlined">search</span>
              <input
                type="text"
                className="form-control"
                placeholder="Search discussions"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button className="btn community-profile-btn" type="button">
              <span className="material-symbols-outlined">account_circle</span>
            </button>
          </div>
        </div>

        <main className="community-canvas">
          <div className="scattered-board">
            {filteredDiscussions.length > 0 ? (
              filteredDiscussions.map((discussion, index) => (
                <article
                  key={discussion._id}
                  className={`forum-card ${sizeClasses[index % sizeClasses.length]}`}
                  onClick={() => openDiscussion(discussion)}
                >
                  <div className="forum-card__meta">
                    <span className="forum-chip">{discussion.name}</span>
                    <span className="forum-time">
                      {new Date(discussion.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {discussion.title && (
                    <h3 className="forum-card__title">{discussion.title}</h3>
                  )}

                  <p className="forum-card__content">{discussion.content}</p>

                  <div className="forum-card__footer">
                    <span className="forum-replies">
                      <span className="material-symbols-outlined">chat_bubble</span>
                      {discussion.replyCount || discussion.replies?.length || 0} replies
                    </span>

                    <button
                      className="btn forum-reply-btn"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDiscussion(discussion);
                      }}
                    >
                      View
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="forum-empty-state">
                <span className="material-symbols-outlined">forum</span>
                <h3>No discussions yet</h3>
                <p>Start the first conversation.</p>
              </div>
            )}
          </div>
        </main>

        <button
          className="btn start-discussion-fab"
          data-bs-toggle="modal"
          data-bs-target="#startDiscussionModal"
          type="button"
        >
          <span className="material-symbols-outlined">add_comment</span>
          <span>Start Discussion</span>
        </button>
      </div>

      {/* Start Discussion Modal */}
      <div className="modal fade" id="startDiscussionModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content forum-modal">
            <div className="modal-header border-0">
              <h5 className="modal-title">Start Discussion</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>

            <form onSubmit={handleCreateDiscussion}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Your Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newDiscussion.name}
                    onChange={(e) => setNewDiscussion({ ...newDiscussion, name: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Title (optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newDiscussion.title}
                    onChange={(e) => setNewDiscussion({ ...newDiscussion, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Content</label>
                  <textarea
                    rows="5"
                    className="form-control"
                    value={newDiscussion.content}
                    onChange={(e) => setNewDiscussion({ ...newDiscussion, content: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer border-0">
                <button type="submit" className="btn forum-primary-btn">Post Discussion</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Discussion View Modal */}
      <div className="modal fade" id="discussionModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
          <div className="modal-content forum-modal">
            <div className="modal-header border-0">
              <div>
                <h5 className="modal-title">{selectedDiscussion?.title || "Discussion"}</h5>
                <p className="forum-modal__subtitle mb-0">
                  Posted by {selectedDiscussion?.name || "Community member"}
                </p>
              </div>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>

            <div className="modal-body">
              {selectedDiscussion && (
                <>
                  <div className="discussion-focus-card">
                    <div className="discussion-focus-card__top">
                      <span className="forum-chip">{selectedDiscussion.name}</span>
                      <span className="forum-time">
                        {new Date(selectedDiscussion.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="discussion-focus-card__content">{selectedDiscussion.content}</p>
                  </div>

                  <div className="replies-section__header">
                    <h6 className="mb-0">Replies</h6>
                    <span>{selectedDiscussion.replies?.length || 0}</span>
                  </div>

                  <div className="replies-list">
                    {selectedDiscussion.replies?.length > 0 ? (
                      selectedDiscussion.replies.map((reply) => (
                        <div className="reply-item" key={reply._id}>
                          <div className="reply-item__head">
                            <span className="reply-author">{reply.name}</span>
                            <span className="reply-date">
                              {new Date(reply.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="reply-content mb-0">{reply.content}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted mb-0">No replies yet.</p>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer border-0">
              <button type="button" className="btn forum-primary-btn" onClick={openReplyModal}>
                Write Reply
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reply Modal */}
      <div className="modal fade" id="replyModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content forum-modal">
            <div className="modal-header border-0">
              <h5 className="modal-title">Write Reply</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>

            <form onSubmit={handleAddReply}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Your Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={replyForm.name}
                    onChange={(e) => setReplyForm({ ...replyForm, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Reply</label>
                  <textarea
                    rows="4"
                    className="form-control"
                    value={replyForm.content}
                    onChange={(e) => setReplyForm({ ...replyForm, content: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer border-0">
                <button type="submit" className="btn forum-primary-btn">Submit Reply</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommunityForum;
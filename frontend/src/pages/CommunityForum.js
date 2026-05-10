import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Header from "../components/header";
import Footer from "../components/Footer";
import "./styles/CommunityForum.css";

const API_BASE = "http://localhost:5000/api/community-forum";

const CommunityForum = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [discussions, setDiscussions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [isLoadingDiscussion, setIsLoadingDiscussion] = useState(false);
  const [showDiscussionModal, setShowDiscussionModal] = useState(false);

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
      setDiscussions(res.data || []);
    } catch (error) {
      console.error("Error fetching discussions:", error);
    }
  };

  const fetchDiscussionById = useCallback(async (discussionId) => {
    if (!discussionId) return null;

    try {
      setIsLoadingDiscussion(true);
      const res = await axios.get(`${API_BASE}/${discussionId}`);
      setSelectedDiscussion(res.data);
      setShowDiscussionModal(true);
      return res.data;
    } catch (error) {
      console.error("Error fetching single discussion:", error);
      setSelectedDiscussion(null);
      return null;
    } finally {
      setIsLoadingDiscussion(false);
    }
  }, []);

  useEffect(() => {
    fetchDiscussions();
  }, []);

  useEffect(() => {
    if (id) {
      fetchDiscussionById(id);
    } else {
      setSelectedDiscussion(null);
      setShowDiscussionModal(false);
    }
  }, [id, fetchDiscussionById]);

  const filteredDiscussions = useMemo(() => {
    return discussions.filter((item) => {
      const text =
        `${item.title || ""} ${item.content || ""} ${item.name || ""}`.toLowerCase();
      return text.includes(searchTerm.toLowerCase());
    });
  }, [discussions, searchTerm]);

  const totalReplies = filteredDiscussions.reduce(
    (sum, item) => sum + (item.replies?.length || 0),
    0
  );

  const handleCreateDiscussion = async (e) => {
    e.preventDefault();

    try {
      await axios.post(API_BASE, newDiscussion);

      setNewDiscussion({
        name: "",
        title: "",
        content: "",
      });

      await fetchDiscussions();

      const modalEl = document.getElementById("startDiscussionModal");
      const modal = window.bootstrap.Modal.getInstance(modalEl);
      modal?.hide();
    } catch (error) {
      console.error("Create discussion error:", error);
      alert(error.response?.data?.message || "Failed to create discussion");
    }
  };

  const handleAddReply = async (e) => {
    e.preventDefault();

    if (!selectedDiscussion?._id) {
      alert("Discussion not found");
      return;
    }

    try {
      await axios.post(`${API_BASE}/${selectedDiscussion._id}/replies`, {
        name: replyForm.name.trim(),
        content: replyForm.content.trim(),
      });

      setReplyForm({
        name: "",
        content: "",
      });

      await fetchDiscussions();
      await fetchDiscussionById(selectedDiscussion._id);
    } catch (error) {
      console.error("Reply error:", error.response?.data || error.message);
      alert(error.response?.data?.message || "Failed to add reply");
    }
  };

  const openDiscussion = (discussionId) => {
    navigate(`/community/${discussionId}`);
  };

  const closeDiscussionModal = () => {
    setShowDiscussionModal(false);
    setSelectedDiscussion(null);
    navigate("/community");
  };

  useEffect(() => {
    const modalElement = document.getElementById("discussionModal");
    if (!modalElement) return;

    const modalInstance = window.bootstrap.Modal.getOrCreateInstance(modalElement);

    if (showDiscussionModal) {
      modalInstance.show();
    } else {
      modalInstance.hide();
    }

    const handleHidden = () => {
      if (window.location.pathname !== "/community") {
        navigate("/community");
      }
    };

    modalElement.addEventListener("hidden.bs.modal", handleHidden);

    return () => {
      modalElement.removeEventListener("hidden.bs.modal", handleHidden);
    };
  }, [showDiscussionModal, navigate]);

  return (
    <>
      <Header />

      <div className="community-premium-page">
        <section className="forum-shell container-fluid">
          <div className="forum-hero forum-hero--video">
            <video className="forum-hero__video" autoPlay muted loop playsInline>
              <source src="/community.mp4" type="video/mp4" />
            </video>

            <div className="forum-hero__overlay"></div>

            <div className="forum-hero__content">
              <span className="forum-kicker">Spare Ceylon Community</span>

              <h1 className="forum-hero__title">
                Ask about fitment, vendors, repairs, and real part experiences.
              </h1>

              <p className="forum-hero__text">
                A clean discussion space for buyers, vendors, and drivers to talk
                about genuine spare parts, sourcing, compatibility, and trusted
                recommendations.
              </p>

              <div className="forum-hero__actions">
                <button
                  className="forum-btn forum-btn--primary"
                  type="button"
                  data-bs-toggle="modal"
                  data-bs-target="#startDiscussionModal"
                >
                  Start Discussion
                </button>

                <div className="forum-search-wrap forum-search-wrap--hero">
                  <span className="material-symbols-outlined">search</span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by title, issue, or member"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="forum-hero__stats">
              <div className="forum-stat-card forum-stat-card--glass">
                <span className="forum-stat-card__label">Discussions</span>
                <strong>{filteredDiscussions.length}</strong>
                <small>Active threads</small>
              </div>

              <div className="forum-stat-card forum-stat-card--glass">
                <span className="forum-stat-card__label">Replies</span>
                <strong>{totalReplies}</strong>
                <small>Responses</small>
              </div>

              <div className="forum-stat-card forum-stat-card--glass">
                <span className="forum-stat-card__label">Focus</span>
                <strong>Fitment</strong>
                <small>OEM & Vendor trust</small>
              </div>
            </div>
          </div>

          <div className="forum-board">
            <div className="forum-board__header">
              <div>
                <h2 className="forum-section-title">Latest conversations</h2>
                <p className="forum-section-subtitle">
                  Open any thread to read the full discussion or add a reply.
                </p>
              </div>

              <button
                className="forum-btn forum-btn--soft"
                type="button"
                data-bs-toggle="modal"
                data-bs-target="#startDiscussionModal"
              >
                New Topic
              </button>
            </div>

            {filteredDiscussions.length > 0 ? (
              <div className="forum-card-grid">
                {filteredDiscussions.map((discussion) => (
                  <article
                    key={discussion._id}
                    className="forum-thread-card"
                    onClick={() => openDiscussion(discussion._id)}
                  >
                    <div className="forum-thread-card__top">
                      <span className="forum-chip">{discussion.name}</span>
                      <span className="forum-meta">
                        {new Date(discussion.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="forum-thread-card__title">
                      {discussion.title || "Discussion"}
                    </h3>

                    <p className="forum-thread-card__content">
                      {discussion.content}
                    </p>

                    <div className="forum-thread-card__footer">
                      <span className="forum-reply-pill">
                        <span className="material-symbols-outlined">chat_bubble</span>
                        {discussion.replyCount || discussion.replies?.length || 0}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="forum-empty-state forum-empty-state--large">
                <span className="material-symbols-outlined">forum</span>
                <h3>No discussions yet</h3>
                <p>
                  Start the first conversation about fitment or vendor experience.
                </p>
                <button
                  className="forum-btn forum-btn--primary"
                  type="button"
                  data-bs-toggle="modal"
                  data-bs-target="#startDiscussionModal"
                >
                  Start Discussion
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      <div
        className="modal fade"
        id="startDiscussionModal"
        tabIndex="-1"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content forum-modal">
            <div className="modal-header border-0">
              <h5 className="modal-title">Start a discussion</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
              ></button>
            </div>

            <form onSubmit={handleCreateDiscussion}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Your name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newDiscussion.name}
                    onChange={(e) =>
                      setNewDiscussion({
                        ...newDiscussion,
                        name: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newDiscussion.title}
                    placeholder="e.g. Best brake pads for Toyota Axio?"
                    onChange={(e) =>
                      setNewDiscussion({
                        ...newDiscussion,
                        title: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Discussion</label>
                  <textarea
                    rows="5"
                    className="form-control"
                    value={newDiscussion.content}
                    placeholder="Describe the issue or part question..."
                    onChange={(e) =>
                      setNewDiscussion({
                        ...newDiscussion,
                        content: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="modal-footer border-0">
                <button
                  type="button"
                  className="forum-btn forum-btn--ghost"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button type="submit" className="forum-btn forum-btn--primary">
                  Publish Discussion
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div
        className="modal fade"
        id="discussionModal"
        tabIndex="-1"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
          <div className="modal-content forum-modal">
            <div className="modal-header border-0">
              <div>
                <h5 className="modal-title">
                  {selectedDiscussion?.title || "Discussion"}
                </h5>
                <p className="forum-modal__subtitle mb-0">
                  Posted by {selectedDiscussion?.name || "Community member"}
                </p>
              </div>

              <button
                type="button"
                className="btn-close"
                onClick={closeDiscussionModal}
              ></button>
            </div>

            <div className="modal-body">
              {isLoadingDiscussion ? (
                <p className="text-muted mb-0">Loading discussion...</p>
              ) : selectedDiscussion ? (
                <>
                  <div className="discussion-focus-card">
                    <p className="discussion-focus-card__content">
                      {selectedDiscussion.content}
                    </p>
                  </div>

                  <div className="replies-section">
                    <div className="replies-section__header">
                      <h6>Replies ({selectedDiscussion.replies?.length || 0})</h6>
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
                        <p className="text-muted mb-0">
                          No replies yet. Be the first to reply.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="forum-inline-reply">
                    <div className="replies-section__header mt-4">
                      <h6>Write a reply</h6>
                    </div>

                    <form onSubmit={handleAddReply}>
                      <div className="mb-3">
                        <label className="form-label">Your name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={replyForm.name}
                          onChange={(e) =>
                            setReplyForm({
                              ...replyForm,
                              name: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Reply</label>
                        <textarea
                          rows="4"
                          className="form-control"
                          value={replyForm.content}
                          onChange={(e) =>
                            setReplyForm({
                              ...replyForm,
                              content: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <div className="modal-footer border-0 px-0 pb-0">
                        <button
                          type="submit"
                          className="forum-btn forum-btn--primary"
                          disabled={!selectedDiscussion?._id}
                        >
                          Submit Reply
                        </button>
                      </div>
                    </form>
                  </div>
                </>
              ) : (
                <p className="text-muted mb-0">Discussion not found.</p>
              )}
            </div>

            <div className="modal-footer border-0">
              <button
                type="button"
                className="forum-btn forum-btn--ghost"
                onClick={closeDiscussionModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default CommunityForum;
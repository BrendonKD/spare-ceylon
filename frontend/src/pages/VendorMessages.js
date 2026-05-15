import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Header from "../components/header";
import VendorSidebar from "../components/VendorSidebar";
import "./styles/VendorMessages.css";

const API = "http://localhost:5000";

const VendorMessages = () => {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const fileInputRef = useRef(null);

  const [vendor, setVendor] = useState({
    full_name: "Loading...",
    email: "...",
    business_name: "",
    logo_url: ""
  });

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({
      headers: { Authorization: `Bearer ${token}` }
    }),
    [token]
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    navigate("/");
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API}/api/auth/profile`, authHeaders);

        if (res.data.role !== "vendor") {
          navigate("/login");
          return;
        }

        setVendor({
          full_name: res.data.full_name,
          email: res.data.email,
          business_name: res.data.business_name || "",
          logo_url: res.data.logo_url
            ? `${API}/${res.data.logo_url.replace(/^\/+/, "")}`
            : ""
        });
      } catch (err) {
        console.error("Vendor profile error:", err.response?.data || err.message);
        navigate("/login");
      }
    };

    fetchProfile();
  }, [token, navigate, authHeaders]);

  const loadConversations = useCallback(async () => {
    try {
      setLoadingList(true);
      const res = await axios.get(`${API}/api/messages/conversations`, authHeaders);
      setConversations(res.data || []);
      return res.data || [];
    } catch (err) {
      console.error("Error loading conversations:", err);
      return [];
    } finally {
      setLoadingList(false);
    }
  }, [authHeaders]);

  const loadMessages = useCallback(
    async (conversationId) => {
      try {
        setLoadingChat(true);
        const res = await axios.get(
          `${API}/api/messages/conversations/${conversationId}`,
          authHeaders
        );
        setMessages(res.data || []);
      } catch (err) {
        console.error("Error loading messages:", err);
      } finally {
        setLoadingChat(false);
      }
    },
    [authHeaders]
  );

  const selectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    navigate(`/vendor/messages/${conversation.customer_id?._id}`);
    await loadMessages(conversation._id);
  };

  useEffect(() => {
    const init = async () => {
      const list = await loadConversations();

      if (customerId) {
        const found = list.find((c) => c.customer_id?._id === customerId);
        if (found) {
          setSelectedConversation(found);
          await loadMessages(found._id);
          return;
        }
      }

      if (list.length > 0) {
        setSelectedConversation(list[0]);
        await loadMessages(list[0]._id);
      }
    };

    if (token) {
      init();
    }
  }, [customerId, token, loadConversations, loadMessages]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const removeSelectedImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImage(null);
    setPreviewUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!text.trim() && !image) || !selectedConversation || sending) return;

    try {
      setSending(true);

      const formData = new FormData();
      formData.append("text", text);
      if (image) {
        formData.append("image", image);
      }

      const res = await axios.post(
        `${API}/api/messages/conversations/${selectedConversation._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      setMessages((prev) => [...prev, res.data]);
      setText("");
      removeSelectedImage();
      await loadConversations();
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="vendor-messages-page">
      <Header />

      <div className="vm-layout">
        <VendorSidebar
          vendor={vendor}
          activeItem="messages"
          onLogout={handleLogout}
        />

        <main className="vm-main">
          <div className="vm-header-block">
            <h5 className="mb-1">Message Center</h5>
            <p className="text-muted mb-0">
              View customer conversations and reply from your vendor dashboard.
            </p>
          </div>

          <div className="vm-shell">
            <aside className="vm-sidebar-panel">
              <div className="vm-panel-header">
                <h5 className="mb-0">Customers</h5>
              </div>

              <div className="vm-conversation-list">
                {loadingList ? (
                  <div className="p-3 text-muted small">Loading conversations...</div>
                ) : conversations.length === 0 ? (
                  <div className="p-3 text-muted small">No customer conversations yet.</div>
                ) : (
                  conversations.map((conv) => {
                    const customer = conv.customer_id;
                    const active = selectedConversation?._id === conv._id;
                    const customerName = customer?.full_name || "Customer";

                    const initials = customerName
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();

                    return (
                      <button
                        key={conv._id}
                        className={`vm-conversation-item ${active ? "active" : ""}`}
                        onClick={() => selectConversation(conv)}
                      >
                        <div className="vm-avatar">{initials || "C"}</div>

                        <div className="vm-conversation-meta">
                          <div className="vm-conversation-name">{customerName}</div>
                          <div className="vm-conversation-preview">
                            {conv.last_message || "Open conversation"}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            <section className="vm-chat-panel">
              {selectedConversation ? (
                <>
                  <div className="vm-chat-header">
                    <h5 className="mb-1">
                      {selectedConversation.customer_id?.full_name || "Customer"}
                    </h5>
                    <div className="small text-muted">
                      {selectedConversation.customer_id?.email || "Customer account"}
                    </div>
                  </div>

                  <div className="vm-thread">
                    {loadingChat ? (
                      <div className="text-muted small">Loading chat...</div>
                    ) : messages.length === 0 ? (
                      <div className="vm-empty">
                        No messages yet in this conversation.
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const mine = msg.sender_role === "vendor";

                        return (
                          <div
                            key={msg._id}
                            className={`vm-message-row ${mine ? "mine" : "theirs"}`}
                          >
                            <div className="vm-message-bubble">
                              {msg.image_url && (
                                <img
                                  src={`${API}${msg.image_url}`}
                                  alt="Chat attachment"
                                  className="vm-chat-image"
                                />
                              )}

                              {msg.text && <div className="vm-message-text">{msg.text}</div>}

                              <div className="vm-message-time">
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <form className="vm-composer" onSubmit={handleSend}>
                    {previewUrl && (
                      <div className="vm-preview-wrap">
                        <img
                          src={previewUrl}
                          alt="Selected preview"
                          className="vm-preview-image"
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={removeSelectedImage}
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    <div className="vm-composer-row">
                      <label className="btn btn-outline-secondary mb-0">
                        Image
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={handleImageChange}
                        />
                      </label>

                      <input
                        type="text"
                        className="form-control"
                        placeholder="Write your reply..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                      />

                      <button className="btn btn-success" type="submit" disabled={sending}>
                        {sending ? "Sending..." : "Send"}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="vm-empty">
                  Select a customer conversation from the left.
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default VendorMessages;
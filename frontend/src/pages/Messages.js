import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Header from "../components/header";
import "./Messages.css";

const API = "http://localhost:5000";

const Messages = () => {
  const navigate = useNavigate();
  const { vendorId } = useParams();

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(() => ({
    headers: { Authorization: `Bearer ${token}` }
  }), [token]);

  const loadConversations = async () => {
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
  };

  const loadMessages = async (conversationId) => {
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
  };

  const selectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    navigate(`/messages/${conversation.vendor_id?._id}`);
    await loadMessages(conversation._id);
  };

  useEffect(() => {
    const init = async () => {
      const list = await loadConversations();

      if (vendorId) {
        try {
          const startRes = await axios.post(
            `${API}/api/messages/conversations/start`,
            { vendorId },
            authHeaders
          );

          const conversationId = startRes.data._id;
          const updatedList = await loadConversations();
          const found = updatedList.find((c) => c._id === conversationId);

          if (found) {
            setSelectedConversation(found);
            await loadMessages(found._id);
          }
        } catch (err) {
          console.error("Error starting conversation:", err);
        }
      } else if (list.length > 0) {
        setSelectedConversation(list[0]);
        await loadMessages(list[0]._id);
      }
    };

    init();
  }, [vendorId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedConversation) return;

    try {
      const res = await axios.post(
        `${API}/api/messages/conversations/${selectedConversation._id}`,
        { text },
        authHeaders
      );

      setMessages((prev) => [...prev, res.data]);
      setText("");
      await loadConversations();
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <div className="messages-page">
      <Header />

      <main className="container-fluid py-4">
        <div className="messages-shell">
          <aside className="messages-sidebar">
            <div className="messages-sidebar-header">
              <h5 className="mb-0">Messages</h5>
            </div>

            <div className="messages-list">
              {loadingList ? (
                <div className="p-3 text-muted small">Loading conversations...</div>
              ) : conversations.length === 0 ? (
                <div className="p-3 text-muted small">No conversations yet.</div>
              ) : (
                conversations.map((conv) => {
                  const vendor = conv.vendor_id;
                  const active = selectedConversation?._id === conv._id;

                  return (
                    <button
                      key={conv._id}
                      className={`messages-list-item ${active ? "active" : ""}`}
                      onClick={() => selectConversation(conv)}
                    >
                      <div className="messages-avatar">
                        {vendor?.logo_url ? (
                          <img src={`${API}${vendor.logo_url}`} alt={vendor.business_name} />
                        ) : (
                          <span className="material-symbols-outlined">storefront</span>
                        )}
                      </div>

                      <div className="messages-meta">
                        <div className="messages-name">{vendor?.business_name || "Vendor"}</div>
                        <div className="messages-preview">
                          {conv.last_message || "Start your conversation"}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className="messages-chat">
            {selectedConversation ? (
              <>
                <div className="messages-chat-header">
                  <div>
                    <h5 className="mb-1">
                      {selectedConversation.vendor_id?.business_name || "Vendor Chat"}
                    </h5>
                    <div className="small text-muted">
                      {selectedConversation.vendor_id?.address || "Sri Lanka"}
                    </div>
                  </div>
                </div>

                <div className="messages-thread">
                  {loadingChat ? (
                    <div className="text-muted small">Loading chat...</div>
                  ) : messages.length === 0 ? (
                    <div className="messages-empty">
                      Say hello and ask about availability, warranty, or delivery.
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const mine = msg.sender_role === "customer";
                      return (
                        <div
                          key={msg._id}
                          className={`message-row ${mine ? "mine" : "theirs"}`}
                        >
                          <div className="message-bubble">
                            {msg.text}
                            <div className="message-time">
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

                <form className="messages-composer" onSubmit={handleSend}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Write your message to the vendor..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <button className="btn btn-success px-4" type="submit">
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div className="messages-placeholder">
                Select a vendor conversation from the left.
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Messages;
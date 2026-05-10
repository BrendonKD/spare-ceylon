const express = require("express");
const router = express.Router();
const Discussion = require("../models/Discussion");

// GET all discussions
router.get("/", async (req, res) => {
  try {
    const discussions = await Discussion.find({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json(discussions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch discussions", error: error.message });
  }
});

// GET latest discussions for homepage highlights section
router.get("/highlights/latest", async (req, res) => {
  try {
    const highlights = await Discussion.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(3)
      .select("title content name createdAt replies");

    res.status(200).json(highlights);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch community highlights",
      error: error.message,
    });
  }
});

// GET single discussion
router.get("/:id", async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);

    if (!discussion || !discussion.isActive) {
      return res.status(404).json({ message: "Discussion not found" });
    }

    res.status(200).json(discussion);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch discussion", error: error.message });
  }
});

// CREATE discussion
router.post("/", async (req, res) => {
  try {
    const { title, content, name, userId } = req.body;

    if (!content || !name) {
      return res.status(400).json({ message: "Name and content are required" });
    }

    const discussion = new Discussion({
      title: title || "",
      content,
      name,
      userId: userId || null,
    });

    await discussion.save();
    res.status(201).json(discussion);
  } catch (error) {
    res.status(500).json({ message: "Failed to create discussion", error: error.message });
  }
});

// ADD reply
router.post("/:id/replies", async (req, res) => {
  try {
    const { content, name, userId } = req.body;

    if (!content || !name) {
      return res.status(400).json({ message: "Name and reply content are required" });
    }

    const discussion = await Discussion.findById(req.params.id);

    if (!discussion || !discussion.isActive) {
      return res.status(404).json({ message: "Discussion not found" });
    }

    discussion.replies.push({
      content,
      name,
      userId: userId || null,
    });

    await discussion.save();
    res.status(201).json(discussion);
  } catch (error) {
    res.status(500).json({ message: "Failed to add reply", error: error.message });
  }
});

// SOFT DELETE discussion
router.delete("/:id", async (req, res) => {
  try {
    const discussion = await Discussion.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!discussion) {
      return res.status(404).json({ message: "Discussion not found" });
    }

    res.status(200).json({ message: "Discussion removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete discussion", error: error.message });
  }
});

//----------------ADMIN MANAGEMENT--------------------------------------

// GET all discussions for admin including hidden
router.get("/admin/all", async (req, res) => {
  try {
    const discussions = await Discussion.find().sort({ createdAt: -1 });
    res.status(200).json(discussions);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch admin discussions",
      error: error.message,
    });
  }
});

// GET single discussion for admin including hidden
router.get("/admin/:id", async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({ message: "Discussion not found" });
    }

    res.status(200).json(discussion);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch admin discussion",
      error: error.message,
    });
  }
});

// HIDE discussion
router.patch("/admin/:id/hide", async (req, res) => {
  try {
    const discussion = await Discussion.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { returnDocument: "after" }
    );

    if (!discussion) {
      return res.status(404).json({ message: "Discussion not found" });
    }

    res.status(200).json({
      message: "Discussion hidden successfully",
      discussion,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to hide discussion",
      error: error.message,
    });
  }
});

// RESTORE discussion
router.patch("/admin/:id/restore", async (req, res) => {
  try {
    const discussion = await Discussion.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { returnDocument: "after" }
    );

    if (!discussion) {
      return res.status(404).json({ message: "Discussion not found" });
    }

    res.status(200).json({
      message: "Discussion restored successfully",
      discussion,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to restore discussion",
      error: error.message,
    });
  }
});

// DELETE reply by admin
router.delete("/admin/:discussionId/replies/:replyId", async (req, res) => {
  try {
    const { discussionId, replyId } = req.params;

    const discussion = await Discussion.findById(discussionId);

    if (!discussion) {
      return res.status(404).json({ message: "Discussion not found" });
    }

    const reply = discussion.replies.id(replyId);

    if (!reply) {
      return res.status(404).json({ message: "Reply not found" });
    }

    reply.deleteOne();
    await discussion.save();

    res.status(200).json({ message: "Reply deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete reply",
      error: error.message,
    });
  }
});

module.exports = router;
const express = require("express");
const router = express.Router();
const Discussion = require("../models/Discussion");

// GET all discussions
router.get("/", async (req, res) => {
  try {
    const discussions = await Discussion.find({ isActive: true })
      .sort({ createdAt: -1 });

    res.status(200).json(discussions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch discussions", error: error.message });
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

module.exports = router;
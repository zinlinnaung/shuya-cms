import React, { useState, useEffect } from "react";
import FavoriteIcon from "@mui/icons-material/Favorite";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Fab,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import dayjs from "dayjs"; // 🔥 NEW
import { LocalizationProvider, DateTimePicker } from "@mui/x-date-pickers"; // 🔥 NEW
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"; // 🔥 NEW
import { Tabs, Tab } from "@mui/material";

const API_URL = "https://shuyaapi.tharapa.ai/api/blog";
const UPLOAD_URL = "https://shuyaapi.tharapa.ai/api/s3/upload";

const buildImageUploadName = (file) => {
  const safeBaseName =
    file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .replace(/^_+|_+$/g, "") || "blog";

  const uniqueId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return `${safeBaseName}-${uniqueId}`;
};

const withCacheBust = (url, version) => {
  if (!url || !version) return url;

  try {
    const imageUrl = new URL(url);
    const cacheVersion = new Date(version).getTime() || version;
    imageUrl.searchParams.set("v", cacheVersion);
    return imageUrl.toString();
  } catch {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}v=${encodeURIComponent(version)}`;
  }
};

const BlogPage = () => {
  const [search, setSearch] = useState("");
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [newBlog, setNewBlog] = useState({
    title: "",
    content: "",
    imageUrl: "",
    scheduledAt: null, // 🔥 NEW
  });
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch blogs
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/all`);
      const data = await res.json();
      setBlogs(data);
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // Convert file to base64
  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  // Upload image
  const uploadImage = async (file) => {
    try {
      const base64 = await toBase64(file);
      const params = new URLSearchParams({
        prefix: "blogs/",
        filename: buildImageUploadName(file),
      });
      const res = await fetch(`${UPLOAD_URL}?${params.toString()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64 }),
      });
      if (!res.ok) throw new Error("Image upload failed");
      const data = await res.json();
      return data.url || data.Location || "";
    } catch (err) {
      console.error("Image upload error:", err);
      return "";
    }
  };

  // Save blog (create or update)
  const handleSaveBlog = async () => {
    if (!newBlog.title || !newBlog.content) return;

    const scheduledAtValue =
      newBlog.scheduledAt && dayjs(newBlog.scheduledAt).isValid()
        ? dayjs(newBlog.scheduledAt).toISOString()
        : null;

    try {
      setSaving(true);

      let imageUrl = newBlog.imageUrl;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl) throw new Error("Failed to upload image");
      }

      // 🔥 Prepare blog data
      const payload = {
        ...newBlog,
        imageUrl,
        scheduledAt: scheduledAtValue,
        isPublished: !scheduledAtValue, // publish immediately if no schedule
      };

      if (editingBlog) {
        await fetch(`${API_URL}/${editingBlog.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      await fetchBlogs();
      setNewBlog({ title: "", content: "", imageUrl: "", scheduledAt: null });
      setImageFile(null);
      setEditingBlog(null);
      setOpenDialog(false);
    } catch (err) {
      console.error("Save blog error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBlog = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      const id = deleteTarget.id;
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      setBlogs(blogs.filter((b) => b.id !== id));
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleEditBlog = (blog) => {
    setEditingBlog(blog);
    setNewBlog({
      title: blog.title,
      content: blog.content,
      imageUrl: blog.imageUrl,
      scheduledAt: blog.scheduledAt ? dayjs(blog.scheduledAt) : null, // 🔥 NEW
    });
    setImageFile(null);
    setOpenDialog(true);
  };

  // const filteredBlogs = blogs.filter((blog) =>
  //   blog.title.toLowerCase().includes(search.toLowerCase()),
  // );
  const filteredBlogs = blogs.filter((blog) => {
    // Search filter
    const matchesSearch = blog.title
      .toLowerCase()
      .includes(search.toLowerCase());

    // Tab filter (0 for published, 1 for scheduled)
    const matchesTab =
      tabValue === 0 ? blog.isPublished === true : blog.isPublished === false;

    return matchesSearch && matchesTab;
  });

  return (
    <Box
      sx={{
        backgroundColor: "#fff0f5",
        minHeight: "86vh",
        p: 3,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h5" sx={{ color: "#d81b60", fontWeight: "bold" }}>
          Blog Management
        </Typography>

        <TextField
          placeholder="Search blog..."
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ backgroundColor: "#fff", borderRadius: "8px", width: "250px" }}
        />
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          TabIndicatorProps={{
            style: { backgroundColor: "#d81b60" },
          }}
        >
          <Tab
            label="Published"
            sx={{ "&.Mui-selected": { color: "#d81b60", fontWeight: "bold" } }}
          />
          <Tab
            label="Scheduled"
            sx={{ "&.Mui-selected": { color: "#d81b60", fontWeight: "bold" } }}
          />
        </Tabs>
      </Box>

      {/* Blog List */}
      <Box flexGrow={1} overflow="auto" maxHeight="calc(80vh)" pr={1}>
        {loading ? (
          <Box display="flex" justifyContent="center" mt={5}>
            <CircularProgress />
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, minmax(0, 1fr))",
              },
              gap: 3,
              alignItems: "stretch",
            }}
          >
            {filteredBlogs.map((blog) => (
              <Box key={blog.id} sx={{ display: "flex", minWidth: 0 }}>
                <Card
                  sx={{
                    borderRadius: "16px",
                    backgroundColor: "#fff",
                    boxShadow: 3,
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    minHeight: "410px",
                    width: "100%",
                  }}
                >
                  <CardMedia
                    component="img"
                    image={withCacheBust(
                      blog.imageUrl,
                      blog.updatedAt || blog.createdAt
                    )}
                    alt={blog.title}
                    sx={{ height: 180, objectFit: "cover", flexShrink: 0 }}
                  />
                  <CardContent
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      flexGrow: 1,
                      minHeight: 0,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        color: "#d81b60",
                        fontWeight: "bold",
                        display: "-webkit-box",
                        lineHeight: 1.25,
                        minHeight: "2.5em",
                        overflow: "hidden",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 2,
                      }}
                    >
                      {blog.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        mt: 1,
                        display: "-webkit-box",
                        minHeight: "2.8em",
                        overflow: "hidden",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 2,
                      }}
                    >
                      {blog.content.substring(0, 60)}...
                    </Typography>

                    {/* 🔥 Show publish/scheduled status */}
                    {/* 🔥 Show publish/scheduled status */}
                    <Box mt={1}>
                      {blog.isPublished ? (
                        <Chip
                          label="Published"
                          color="success"
                          size="small"
                          sx={{ fontSize: "12px" }}
                        />
                      ) : (
                        <Chip
                          label={`Scheduled for ${dayjs(
                            blog.scheduledAt
                          ).format("MMM D, YYYY h:mm A")}`}
                          color="warning"
                          size="small"
                          sx={{
                            fontSize: "12px",
                            maxWidth: "100%",
                            "& .MuiChip-label": {
                              display: "block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            },
                          }}
                        />
                      )}
                    </Box>

                    {/* 🔥 Show Reactions and Bookmarks Counts */}
                    <Box
                      display="flex"
                      alignItems="center"
                      gap={2}
                      mt={1.5}
                      mb={1}
                    >
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <FavoriteIcon
                          sx={{ color: "#ec407a", fontSize: "18px" }}
                        />
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          color="text.secondary"
                        >
                          {blog._count?.BlogReaction || blog.reaction || 0}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <BookmarkIcon
                          sx={{ color: "#757575", fontSize: "18px" }}
                        />
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          color="text.secondary"
                        >
                          {blog._count?.BookMark || 0}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Edit & Delete Buttons */}
                    <Box
                      mt="auto"
                      pt={2}
                      display="flex"
                      justifyContent="space-between"
                    >
                      <Button
                        variant="contained"
                        sx={{
                          backgroundColor: "#ec407a",
                          "&:hover": { backgroundColor: "#d81b60" },
                          fontSize: "12px",
                        }}
                        onClick={() => handleEditBlog(blog)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        sx={{
                          color: "#ec407a",
                          borderColor: "#ec407a",
                          fontSize: "12px",
                          "&:hover": {
                            borderColor: "#d81b60",
                            color: "#d81b60",
                          },
                        }}
                        onClick={() => setDeleteTarget(blog)}
                      >
                        Delete
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Floating Add Blog Button */}
      <Fab
        sx={{
          position: "fixed",
          bottom: 20,
          right: 20,
          backgroundColor: "#ec407a",
          "&:hover": { backgroundColor: "#d81b60" },
        }}
        onClick={() => {
          setEditingBlog(null);
          setNewBlog({
            title: "",
            content: "",
            imageUrl: "",
            scheduledAt: null,
          });
          setImageFile(null);
          setOpenDialog(true);
        }}
      >
        <AddIcon sx={{ color: "#fff" }} />
      </Fab>

      {/* Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: "#d81b60", fontWeight: "bold" }}>
          {editingBlog ? "Edit Blog" : "Add New Blog"}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Title"
            fullWidth
            sx={{ mt: 2 }}
            value={newBlog.title}
            onChange={(e) => setNewBlog({ ...newBlog, title: e.target.value })}
          />
          <TextField
            label="Content"
            fullWidth
            multiline
            rows={4}
            sx={{ mt: 2 }}
            value={newBlog.content}
            onChange={(e) =>
              setNewBlog({ ...newBlog, content: e.target.value })
            }
          />
          <TextField
            label="Image URL (optional if file chosen)"
            fullWidth
            sx={{ mt: 2 }}
            value={newBlog.imageUrl}
            onChange={(e) =>
              setNewBlog({ ...newBlog, imageUrl: e.target.value })
            }
          />

          <Button
            variant="outlined"
            component="label"
            sx={{ mt: 2, color: "#ec407a", borderColor: "#ec407a" }}
          >
            Upload Image
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
            />
          </Button>

          {/* 🔥 Schedule DateTime Picker */}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateTimePicker
              label="Schedule publish time (optional)"
              value={newBlog.scheduledAt}
              onChange={(value) =>
                setNewBlog({ ...newBlog, scheduledAt: value })
              }
              sx={{ mt: 3, width: "100%" }}
            />
          </LocalizationProvider>

          {(imageFile || newBlog.imageUrl) && (
            <Box mt={2}>
              <Typography variant="caption">Preview:</Typography>
              <img
                src={
                  imageFile
                    ? URL.createObjectURL(imageFile)
                    : withCacheBust(
                        newBlog.imageUrl,
                        editingBlog?.updatedAt || editingBlog?.createdAt
                      )
                }
                alt="preview"
                style={{
                  width: "100%",
                  maxHeight: "200px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSaveBlog}
            variant="contained"
            disabled={saving}
            sx={{
              backgroundColor: "#ec407a",
              "&:hover": { backgroundColor: "#d81b60" },
            }}
          >
            {saving ? (
              <CircularProgress size={20} sx={{ color: "#fff" }} />
            ) : editingBlog ? (
              "Update"
            ) : (
              "Add"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ color: "#d81b60", fontWeight: "bold" }}>
          Delete Blog?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete "{deleteTarget?.title}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button disabled={deleting} onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            color="error"
            disabled={deleting}
            variant="contained"
            onClick={handleDeleteBlog}
          >
            {deleting ? <CircularProgress size={20} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BlogPage;

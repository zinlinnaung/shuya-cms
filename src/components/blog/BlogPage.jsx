import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
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

const API_URL = "https://shuyaapi.tharapa.ai/api/blog";
const UPLOAD_URL = "https://shuyaapi.tharapa.ai/api/s3/upload";

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
      const filename = file.name.replace(/\s+/g, "_");
      const res = await fetch(
        `${UPLOAD_URL}?prefix=blogs&filename=${filename}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64 }),
        }
      );
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
        scheduledAt: newBlog.scheduledAt
          ? new Date(newBlog.scheduledAt).toISOString()
          : null,
        isPublished: !newBlog.scheduledAt, // publish immediately if no schedule
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

  const handleDeleteBlog = async (id) => {
    try {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      setBlogs(blogs.filter((b) => b.id !== id));
    } catch (err) {
      console.error(err);
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

  const filteredBlogs = blogs.filter((blog) =>
    blog.title.toLowerCase().includes(search.toLowerCase())
  );

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

      {/* Blog List */}
      <Box flexGrow={1} overflow="auto" maxHeight="calc(80vh)" pr={1}>
        {loading ? (
          <Box display="flex" justifyContent="center" mt={5}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredBlogs.map((blog) => (
              <Grid item xs={12} sm={6} md={4} key={blog.id}>
                <Card
                  sx={{
                    borderRadius: "16px",
                    backgroundColor: "#fff",
                    boxShadow: 3,
                    height: "400px",
                    width: "500px",
                  }}
                >
                  <CardMedia
                    component="img"
                    image={blog.imageUrl}
                    alt={blog.title}
                    sx={{ height: 180, objectFit: "cover" }}
                  />
                  <CardContent>
                    <Typography
                      variant="h6"
                      sx={{ color: "#d81b60", fontWeight: "bold" }}
                    >
                      {blog.title}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {blog.content.substring(0, 60)}...
                    </Typography>

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
                          sx={{ fontSize: "12px" }}
                        />
                      )}
                    </Box>

                    <Box mt={2} display="flex" justifyContent="space-between">
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
                        onClick={() => handleDeleteBlog(blog.id)}
                      >
                        Delete
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
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
                  imageFile ? URL.createObjectURL(imageFile) : newBlog.imageUrl
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
    </Box>
  );
};

export default BlogPage;

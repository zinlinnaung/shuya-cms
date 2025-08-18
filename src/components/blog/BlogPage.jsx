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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

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
  });
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  // Fetch blogs from API
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

  // Convert file to base64 (remove prefix like "data:image/png;base64,")
  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file); // full Data URL
      reader.onload = () => resolve(reader.result); // keep "data:image/png;base64,..." intact
      reader.onerror = (error) => reject(error);
    });

  // Upload image and return URL
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

      // ✅ Ensure we return the correct field
      return data.url || data.Location || "";
    } catch (err) {
      console.error("Image upload error:", err);
      return "";
    }
  };

  // Add or Update blog
  const handleSaveBlog = async () => {
    if (!newBlog.title || !newBlog.content) return;

    try {
      setSaving(true);

      let imageUrl = newBlog.imageUrl;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl) throw new Error("Failed to upload image");
      }

      if (editingBlog) {
        // Update blog
        await fetch(`${API_URL}/${editingBlog.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...newBlog, imageUrl }),
        });
      } else {
        // Create blog
        await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...newBlog, imageUrl }),
        });
      }

      await fetchBlogs();
      setNewBlog({ title: "", content: "", imageUrl: "" });
      setImageFile(null);
      setEditingBlog(null);
      setOpenDialog(false);
    } catch (err) {
      console.error("Save blog error:", err);
    } finally {
      setSaving(false);
    }
  };

  // Delete blog
  const handleDeleteBlog = async (id) => {
    try {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      setBlogs(blogs.filter((blog) => blog.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Open edit dialog
  const handleEditBlog = (blog) => {
    setEditingBlog(blog);
    setNewBlog({
      title: blog.title,
      content: blog.content,
      imageUrl: blog.imageUrl,
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
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5" sx={{ color: "#d81b60", fontWeight: "bold" }}>
          Blog Management
        </Typography>

        <TextField
          placeholder="Search blog..."
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            backgroundColor: "#fff",
            borderRadius: "8px",
            width: "250px",
          }}
        />
      </Box>

      {/* Blog Grid */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          maxHeight: "calc(80vh)",
          pr: 1,
        }}
      >
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
                    width: "500px",
                    height: "400px",
                    backgroundColor: "#ffffff",
                    boxShadow: 3,
                  }}
                >
                  <CardMedia
                    component="img"
                    image={blog.imageUrl}
                    alt={blog.title}
                    sx={{
                      height: 180,
                      width: "100%",
                      objectFit: "cover", // ✅ fills the container and crops if needed
                    }}
                  />

                  <CardContent>
                    <Typography
                      variant="h6"
                      sx={{ color: "#d81b60", fontWeight: "bold" }}
                    >
                      {blog.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#333", mt: 1 }}>
                      {blog.content.substring(0, 60)}...
                    </Typography>
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
          setNewBlog({ title: "", content: "", imageUrl: "" });
          setImageFile(null);
          setOpenDialog(true);
        }}
      >
        <AddIcon sx={{ color: "#fff" }} />
      </Fab>

      {/* Add/Edit Blog Dialog */}
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
            variant="outlined"
            sx={{ mt: 2 }}
            value={newBlog.title}
            onChange={(e) => setNewBlog({ ...newBlog, title: e.target.value })}
          />
          <TextField
            label="Content"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            sx={{ mt: 2 }}
            value={newBlog.content}
            onChange={(e) =>
              setNewBlog({ ...newBlog, content: e.target.value })
            }
          />

          <TextField
            label="Image URL (optional if file chosen)"
            fullWidth
            variant="outlined"
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

          {/* ✅ Preview image if chosen */}
          {(imageFile || newBlog.imageUrl) && (
            <Box mt={2}>
              <Typography variant="caption" sx={{ display: "block", mb: 1 }}>
                Preview:
              </Typography>
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
          <Button onClick={() => setOpenDialog(false)} color="secondary">
            Cancel
          </Button>
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

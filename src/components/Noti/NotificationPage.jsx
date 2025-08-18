import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  CircularProgress,
  CssBaseline,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import axios from "axios";

const API_BASE = "https://shuyaapi.tharapa.ai/api/noti";

const NotificationPage = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [receiver, setReceiver] = useState("all");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Fetch history
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/history`);
      setHistory(res.data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
    setHistoryLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSendNotification = async () => {
    if (!title || !content) {
      setSnackbar({
        open: true,
        message: "Please fill in all fields!",
        severity: "error",
      });
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE}/send-all`, {
        title,
        content,
      });

      setSnackbar({
        open: true,
        message: "Notification sent successfully!",
        severity: "success",
      });

      setTitle("");
      setContent("");
      setReceiver("all");

      // Refresh history after sending
      fetchHistory();
    } catch (error) {
      console.error(error);
      setSnackbar({
        open: true,
        message: "Failed to send notification!",
        severity: "error",
      });
    }
    setLoading(false);
  };

  return (
    <>
      <CssBaseline />
      <Box
        sx={{
          backgroundColor: "#fff0f5", // light pink background
          minHeight: "100vh",
          p: 3,
        }}
      >
        <Typography
          variant="h5"
          gutterBottom
          sx={{ color: "#d81b60", fontWeight: "bold" }}
        >
          Send Notification
        </Typography>

        <Grid container spacing={3}>
          {/* Left side - Form */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                borderRadius: "16px",
                backgroundColor: "#ffffff",
                boxShadow: 3,
              }}
            >
              <CardContent>
                <Typography variant="h6" mb={2} sx={{ color: "#d81b60" }}>
                  Notification Details
                </Typography>
                <TextField
                  fullWidth
                  label="Title"
                  variant="outlined"
                  margin="normal"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <TextField
                  fullWidth
                  label="Content"
                  variant="outlined"
                  multiline
                  rows={4}
                  margin="normal"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                <FormControl fullWidth margin="normal">
                  <InputLabel>Receiver</InputLabel>
                  <Select
                    value={receiver}
                    onChange={(e) => setReceiver(e.target.value)}
                  >
                    <MenuItem value="all">All Users</MenuItem>
                    <MenuItem value="active">Active Users</MenuItem>
                    <MenuItem value="inactive">Inactive Users</MenuItem>
                  </Select>
                </FormControl>

                <Box mt={2} display="flex" justifyContent="flex-end">
                  <Button
                    variant="contained"
                    disabled={loading}
                    onClick={handleSendNotification}
                    sx={{
                      borderRadius: "12px",
                      px: 4,
                      backgroundColor: "#ec407a",
                      "&:hover": { backgroundColor: "#d81b60" },
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      "Send"
                    )}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right side - History */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                borderRadius: "16px",
                backgroundColor: "#ffffff",
                boxShadow: 3,
              }}
            >
              <CardContent>
                <Typography variant="h6" mb={2} sx={{ color: "#d81b60" }}>
                  Notification History
                </Typography>
                {historyLoading ? (
                  <CircularProgress />
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell>Content</TableCell>
                        <TableCell>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {history.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} align="center">
                            No history found
                          </TableCell>
                        </TableRow>
                      ) : (
                        history.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.title}</TableCell>
                            <TableCell>{item.content}</TableCell>
                            <TableCell>
                              {new Date(item.createdAt).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity} variant="filled">
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
};

export default NotificationPage;

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
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import axios from "axios";

// --- Configuration ---
const API_BASE = "https://shuyaapi.tharapa.ai/api/noti";
const HISTORY_LIMIT = 5; // Items per page for History List

const NotificationPage = () => {
  // =============================
  // 1. Notification Form States
  // =============================
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [receiver, setReceiver] = useState("all");
  const [loading, setLoading] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // =============================
  // 2. History & Pagination States
  // =============================
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // =============================
  // 3. Schedule List States
  // =============================
  const [scheduleList, setScheduleList] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // =============================
  // 4. Edit Modal States
  // =============================
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // =============================
  // Fetch Functions
  // =============================
  const fetchHistory = async (page = currentPage) => {
    setHistoryLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/history`, {
        params: {
          page: page,
          limit: HISTORY_LIMIT,
        },
      });
      setHistory(res.data.data);
      setTotalPages(res.data.totalPages);
      setCurrentPage(res.data.page);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
    setHistoryLoading(false);
  };

  const fetchScheduleList = async () => {
    setScheduleLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/schedule`);
      setScheduleList(res.data);
    } catch (err) {
      console.error("Failed to fetch schedule list", err);
    }
    setScheduleLoading(false);
  };

  useEffect(() => {
    fetchHistory(1);
    fetchScheduleList();
  }, []);

  // Handler for pagination control
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    fetchHistory(value);
  };

  // =============================
  // Create or Schedule Notification
  // =============================
  const handleSendNotification = async () => {
    if (!title || !content) {
      setSnackbar({
        open: true,
        message: "Please fill in all fields!",
        severity: "error",
      });
      return;
    }

    if (isScheduled && !scheduledTime) {
      setSnackbar({
        open: true,
        message: "Please choose a schedule time!",
        severity: "error",
      });
      return;
    }

    setLoading(true);
    try {
      if (isScheduled) {
        await axios.post(`${API_BASE}/schedule`, {
          title,
          content,
          receiver,
          date: scheduledTime,
        });
      } else {
        await axios.post(`${API_BASE}/send-all`, {
          title,
          content,
          receiver,
        });
      }

      setSnackbar({
        open: true,
        message: isScheduled
          ? "Notification scheduled successfully!"
          : "Notification sent successfully!",
        severity: "success",
      });

      // Clear form
      setTitle("");
      setContent("");
      setReceiver("all");
      setIsScheduled(false);
      setScheduledTime(null);

      // Refresh lists
      fetchHistory(currentPage);
      fetchScheduleList();
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

  // =============================
  // Edit / Delete Scheduled Notification
  // =============================
  const handleEdit = (item) => {
    setEditItem(item);
    setEditModalOpen(true);
  };

  const handleEditSave = async () => {
    if (!editItem.title || !editItem.content || !editItem.date) {
      setSnackbar({
        open: true,
        message: "All fields are required!",
        severity: "error",
      });
      return;
    }

    try {
      await axios.patch(`${API_BASE}/schedule/${editItem.id}`, editItem);
      setSnackbar({
        open: true,
        message: "Scheduled notification updated successfully!",
        severity: "success",
      });
      setEditModalOpen(false);
      fetchScheduleList();
    } catch (err) {
      console.error("Failed to update", err);
      setSnackbar({
        open: true,
        message: "Failed to update schedule!",
        severity: "error",
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this schedule?"))
      return;
    try {
      await axios.delete(`${API_BASE}/schedule/${id}`);
      setSnackbar({
        open: true,
        message: "Scheduled notification deleted!",
        severity: "success",
      });
      fetchScheduleList();
    } catch (err) {
      console.error("Failed to delete schedule", err);
      setSnackbar({
        open: true,
        message: "Failed to delete schedule!",
        severity: "error",
      });
    }
  };

  // =============================
  // Render
  // =============================
  return (
    <>
      <CssBaseline />
      <Box sx={{ p: 4, backgroundColor: "#f5f7fa", minHeight: "90vh" }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ color: "#1976d2", fontWeight: "600", mb: 4 }}
        >
          <span role="img" aria-label="notification">
            🔔
          </span>{" "}
          Notification Management
        </Typography>

        {/* Main Grid Container for 3-Column Layout (4:4:4) */}
        <Grid container spacing={4}>
          {/* 1. Create Notification Card (Left) */}
          {/* Changed lg={3} to lg={4} to balance the 3-card layout */}
          <Grid item xs={10} maxWidth={"50%"} lg={2}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: "12px",
                p: 2,
                backgroundColor: "#ffffff",
                height: "100%", // Ensures all cards are the same height if content is short
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              }}
            >
              <CardContent>
                <Typography variant="h6" mb={3} sx={{ color: "#1976d2" }}>
                  Create New Notification
                </Typography>

                <TextField
                  fullWidth
                  label="Title"
                  variant="outlined"
                  margin="dense"
                  size="small"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                <TextField
                  fullWidth
                  label="Content"
                  variant="outlined"
                  multiline
                  rows={4}
                  margin="dense"
                  size="small"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />

                <FormControl fullWidth margin="dense" size="small">
                  <InputLabel>Receiver</InputLabel>
                  <Select
                    value={receiver}
                    label="Receiver"
                    onChange={(e) => setReceiver(e.target.value)}
                  >
                    <MenuItem value="all">All Users</MenuItem>
                    <MenuItem value="active">Active Users</MenuItem>
                    <MenuItem value="inactive">Inactive Users</MenuItem>
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Switch
                      checked={isScheduled}
                      onChange={(e) => setIsScheduled(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Schedule Notification"
                  sx={{ mt: 1, mb: 1 }}
                />

                {isScheduled && (
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DateTimePicker
                      label="Schedule Date & Time"
                      value={scheduledTime}
                      onChange={(newValue) => setScheduledTime(newValue)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          margin: "dense",
                          size: "small",
                        },
                      }}
                    />
                  </LocalizationProvider>
                )}

                <Box mt={3} display="flex" justifyContent="flex-end">
                  <Button
                    variant="contained"
                    disabled={loading}
                    onClick={handleSendNotification}
                    sx={{
                      borderRadius: "8px",
                      px: 3,
                      py: 1,
                      minWidth: 120,
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : isScheduled ? (
                      "Schedule"
                    ) : (
                      "Send Now"
                    )}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* 2. Notification History Card (Middle) */}
          <Grid item xs={12} lg={6} width={"45%"}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: "12px",
                p: 2,
                backgroundColor: "#ffffff",
                height: "100%", // Ensures all cards are the same height
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              }}
            >
              <CardContent>
                <Typography variant="h6" mb={2} sx={{ color: "#1976d2" }}>
                  Notification History
                </Typography>
                {historyLoading ? (
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    minHeight={200}
                  >
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    <Table size="medium" sx={{ width: "100%" }}>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: "#f0f8ff" }}>
                          <TableCell sx={{ fontWeight: "bold" }}>
                            Title
                          </TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>
                            Content
                          </TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>
                            Date
                          </TableCell>
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
                            <TableRow key={item.id} hover>
                              <TableCell>{item.title}</TableCell>
                              <TableCell
                                sx={{
                                  maxWidth: 150, // Reduced max width for 4-column space
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {item.content}
                              </TableCell>
                              <TableCell>
                                {new Date(item.createdAt).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                    {/* Pagination Component */}
                    {totalPages > 1 && (
                      <Box mt={3} display="flex" justifyContent="center">
                        <Pagination
                          count={totalPages}
                          page={currentPage}
                          onChange={handlePageChange}
                          color="primary"
                          showFirstButton
                          showLastButton
                        />
                      </Box>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* 3. Scheduled Notifications Card (Right) */}
          <Grid item xs={12} lg={12} sx={{ width: "100%" }}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: "12px",
                p: 2,

                backgroundColor: "#ffffff",
                height: "100%", // Ensures all cards are the same height
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              }}
            >
              <CardContent>
                <Typography variant="h6" mb={2} sx={{ color: "#1976d2" }}>
                  Scheduled Notifications
                </Typography>
                {scheduleLoading ? (
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    minHeight={150}
                  >
                    <CircularProgress />
                  </Box>
                ) : (
                  <Table size="medium">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#f0f8ff" }}>
                        <TableCell sx={{ fontWeight: "bold" }}>Title</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>
                          Receiver
                        </TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>
                          Scheduled Time
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold" }}>
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {scheduleList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            No scheduled notifications
                          </TableCell>
                        </TableRow>
                      ) : (
                        scheduleList.map((item) => (
                          <TableRow key={item.id} hover>
                            <TableCell>{item.title}</TableCell>
                            <TableCell>{item.receiver}</TableCell>
                            <TableCell>
                              {new Date(item.date).toLocaleString()}
                            </TableCell>
                            <TableCell align="right">
                              <Button
                                size="small"
                                variant="outlined"
                                sx={{ mr: 1 }}
                                onClick={() => handleEdit(item)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => handleDelete(item.id)}
                              >
                                Delete
                              </Button>
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

        {/* Edit Modal */}
        <Dialog
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Edit Scheduled Notification</DialogTitle>
          <DialogContent>
            {editItem && (
              <>
                <TextField
                  label="Title"
                  fullWidth
                  margin="normal"
                  value={editItem.title}
                  onChange={(e) =>
                    setEditItem({ ...editItem, title: e.target.value })
                  }
                />
                <TextField
                  label="Content"
                  fullWidth
                  multiline
                  rows={3}
                  margin="normal"
                  value={editItem.content}
                  onChange={(e) =>
                    setEditItem({ ...editItem, content: e.target.value })
                  }
                />
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="Scheduled Time"
                    value={new Date(editItem.date)}
                    onChange={(newValue) =>
                      setEditItem({ ...editItem, date: newValue })
                    }
                    slotProps={{
                      textField: { fullWidth: true, margin: "normal" },
                    }}
                  />
                </LocalizationProvider>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleEditSave}
              variant="contained"
              color="primary"
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>

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

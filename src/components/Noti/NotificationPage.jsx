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
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import axios from "axios";

const API_BASE = "https://shuyaapi.tharapa.ai/api/noti";

const NotificationPage = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [receiver, setReceiver] = useState("all");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [scheduleList, setScheduleList] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Schedule states
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState(null);

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // =============================
  // Fetch Functions
  // =============================
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
    fetchHistory();
    fetchScheduleList();
  }, []);

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
          date: scheduledTime, // ✅ match backend
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

      setTitle("");
      setContent("");
      setReceiver("all");
      setIsScheduled(false);
      setScheduledTime(null);

      fetchHistory();
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
    }
  };

  // =============================
  // Render
  // =============================
  return (
    <>
      <CssBaseline />
      <Box sx={{ backgroundColor: "#fff0f5", minHeight: "100vh", p: 3 }}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{ color: "#d81b60", fontWeight: "bold" }}
        >
          Send Notification
        </Typography>

        <Grid container spacing={3}>
          {/* Form Section */}
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

                <FormControlLabel
                  control={
                    <Switch
                      checked={isScheduled}
                      onChange={(e) => setIsScheduled(e.target.checked)}
                      color="secondary"
                    />
                  }
                  label="Schedule this notification"
                />

                {isScheduled && (
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DateTimePicker
                      label="Schedule Date & Time"
                      value={scheduledTime}
                      onChange={(newValue) => setScheduledTime(newValue)}
                      renderInput={(params) => (
                        <TextField {...params} fullWidth margin="normal" />
                      )}
                    />
                  </LocalizationProvider>
                )}

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
                    ) : isScheduled ? (
                      "Schedule"
                    ) : (
                      "Send"
                    )}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* History Section */}
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

            {/* Scheduled Notifications */}
            <Card
              sx={{
                mt: 3,
                borderRadius: "16px",
                backgroundColor: "#ffffff",
                boxShadow: 3,
              }}
            >
              <CardContent>
                <Typography variant="h6" mb={2} sx={{ color: "#d81b60" }}>
                  Scheduled Notifications
                </Typography>
                {scheduleLoading ? (
                  <CircularProgress />
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell>Scheduled Time</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {scheduleList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} align="center">
                            No scheduled notifications
                          </TableCell>
                        </TableRow>
                      ) : (
                        scheduleList.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.title}</TableCell>
                            <TableCell>
                              {new Date(item.date).toLocaleString()}
                            </TableCell>
                            <TableCell align="right">
                              <Button
                                size="small"
                                onClick={() => handleEdit(item)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="small"
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
                    onChange={
                      (newValue) => setEditItem({ ...editItem, date: newValue }) // <-- use `date`
                    }
                    renderInput={(params) => (
                      <TextField {...params} fullWidth margin="normal" />
                    )}
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
              sx={{ backgroundColor: "#ec407a" }}
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

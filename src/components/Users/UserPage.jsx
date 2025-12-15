import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Avatar,
  Paper,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { DataGrid } from "@mui/x-data-grid";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

export default function UserTable() {
  // --- Data State ---
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Search State ---
  const [searchText, setSearchText] = useState("");
  // apiSearchTerm is the term used in the fetch call (triggered by Search button/Enter)
  const [apiSearchTerm, setApiSearchTerm] = useState("");

  // --- Pagination State ---
  const [paginationModel, setPaginationModel] = useState({
    page: 0, // DataGrid uses 0-based indexing for pages
    pageSize: 10,
  });
  const [rowCount, setRowCount] = useState(0); // Total users in DB (from meta.total)

  // --- Export State ---
  const [exportStartDate, setExportStartDate] = useState(
    dayjs().subtract(7, "day")
  );
  const [exportEndDate, setExportEndDate] = useState(dayjs());
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  // --- Core Fetching Logic (Memoized) ---
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Backend expects 1-based page, so we add 1 to paginationModel.page
    const pageForBackend = paginationModel.page + 1;
    const limit = paginationModel.pageSize;

    // Construct the URL with all parameters
    const queryParams = new URLSearchParams({
      page: pageForBackend.toString(),
      limit: limit.toString(),
      search: apiSearchTerm,
    }).toString();

    // NOTE: Replace this URL with your actual API base URL if different
    const url = `https://shuyaapi.tharapa.ai/api/user?${queryParams}`;

    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);

      const result = await resp.json();

      const usersData = (result.data || []).map((u) => ({
        ...u,
        // Normalize birthDate for display
        birthDate: u.birthDate ? dayjs(u.birthDate).format("YYYY-MM-DD") : "",
      }));

      setUsers(usersData);
      setRowCount(result.meta?.total || 0); // Set total count for the DataGrid
    } catch (err) {
      console.error("Fetch users failed", err);
      setError(err.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [paginationModel, apiSearchTerm]);
  // Refetches when page, limit, or search term changes

  // --- Effects and Handlers ---
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = () => {
    // 1. Update the term that triggers the API call
    setApiSearchTerm(searchText.trim());
    // 2. Important: Reset to page 0 when a new search is performed
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const handleReset = () => {
    setSearchText("");
    setApiSearchTerm("");
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  // --- Export Logic ---
  const handleExport = async () => {
    setExportError(null);
    if (!exportStartDate || !exportEndDate) {
      setExportError("Please select both a start date and an end date.");
      return;
    }

    const start = exportStartDate.format("YYYY-MM-DD");
    const end = exportEndDate.format("YYYY-MM-DD");

    setIsExporting(true);
    try {
      // Hit the new backend endpoint
      const url = `https://shuyaapi.tharapa.ai/api/user/export?start=${start}&end=${end}`;
      const response = await fetch(url);

      if (!response.ok) {
        // Attempt to parse non-OK response for detailed error message
        const text = await response.text();
        throw new Error(
          `Export failed (${response.status}): ${text.slice(0, 100)}...`
        );
      }

      // 1. Get the file contents as a Blob
      const blob = await response.blob();

      // 2. Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `users_export_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="([^"]+)"/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      // 3. Trigger the file download
      const urlObject = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = urlObject;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(urlObject);
    } catch (err) {
      console.error("Export error:", err);
      setExportError(err.message || "Failed to download Excel file.");
    } finally {
      setIsExporting(false);
    }
  };

  // --- DataGrid Columns ---
  const columns = [
    {
      field: "profile",
      headerName: "Avatar",
      width: 80,
      renderCell: (params) =>
        params.value ? (
          <Avatar src={params.value} alt={params.row.name} />
        ) : (
          <Avatar sx={{ bgcolor: "primary.main" }}>
            {params.row.name?.[0]}
          </Avatar>
        ),
      sortable: false,
      filterable: false,
    },
    { field: "id", headerName: "ID", width: 70 },
    { field: "name", headerName: "Name", flex: 1 },
    { field: "phone", headerName: "Phone", flex: 1 },
    {
      field: "birthDate",
      headerName: "Birth Date",
      flex: 1,
    },
    { field: "status", headerName: "Status", flex: 1 },
    { field: "weight", headerName: "Weight (kg)", flex: 1 },
    { field: "flow", headerName: "Flow", flex: 1 },
    { field: "Township", headerName: "Township", flex: 1 },
    { field: "Division", headerName: "Division", flex: 1 },
    { field: "familyPlan", headerName: "Family Plan", flex: 1 },
    {
      field: "is_active",
      headerName: "Active",
      flex: 0.7,
      renderCell: (params) => (
        <Typography color={params.value ? "green" : "red"} fontWeight={600}>
          {params.value ? "Yes" : "No"}
        </Typography>
      ),
    },
  ];

  // --- Render ---
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
        👤 User Management
      </Typography>

      <Paper
        elevation={3}
        sx={{
          p: 3,
          borderRadius: 3,
          backgroundColor: "white",
          mb: 3,
        }}
      >
        {/* Row 1: Search and Reset */}
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 3 }}>
          <TextField
            label="Search users..."
            variant="outlined"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />

          <Button
            variant="contained"
            onClick={handleSearch}
            sx={{ px: 3, borderRadius: 2 }}
          >
            Search
          </Button>

          <Button
            variant="outlined"
            color="secondary"
            onClick={handleReset}
            startIcon={<RefreshIcon />}
            sx={{ px: 3, borderRadius: 2 }}
          >
            Reset
          </Button>
        </Box>

        {/* Row 2: Export */}
        <Typography
          variant="h6"
          sx={{ mb: 1, pt: 1, borderTop: "1px solid #eee" }}
        >
          Download Data
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <DatePicker
            label="Start Date"
            value={exportStartDate}
            onChange={(newValue) => setExportStartDate(newValue)}
            slotProps={{ textField: { fullWidth: true } }}
            maxDate={exportEndDate || dayjs()}
          />
          <DatePicker
            label="End Date"
            value={exportEndDate}
            onChange={(newValue) => setExportEndDate(newValue)}
            slotProps={{ textField: { fullWidth: true } }}
            minDate={exportStartDate}
            maxDate={dayjs()}
          />
          <Button
            variant="contained"
            color="success"
            onClick={handleExport}
            disabled={isExporting}
            startIcon={<FileDownloadIcon />}
            sx={{ px: 3, borderRadius: 2, height: "56px", width: "200px" }}
          >
            {isExporting ? "Downloading..." : "Export"}
          </Button>
        </Box>
        {exportError && (
          <Typography color="error" sx={{ mt: 1 }}>
            Export Error: {exportError}
          </Typography>
        )}
      </Paper>

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          Error fetching data: {error}
        </Typography>
      )}

      {/* Data Grid */}
      <Paper
        elevation={3}
        sx={{
          height: 650,
          width: "100%",
          p: 2,
          borderRadius: 3,
        }}
      >
        <DataGrid
          rows={users}
          columns={columns}
          getRowId={(row) => row.id}
          // Server-side Pagination Props
          paginationMode="server"
          loading={loading}
          rowCount={rowCount}
          pageSizeOptions={[10, 25, 50]}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sx={{
            border: "none",
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#f0f4f8",
              fontWeight: 700,
            },
          }}
        />
      </Paper>
    </Box>
  );
}

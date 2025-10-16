import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  TextField,
  CircularProgress,
} from "@mui/material";

const API_URL = "https://shuyaapi.tharapa.ai/api/open-ads/2";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ChannelAds = () => {
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  // Fetch the existing ad data
  const fetchAd = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      const data = await res.json();
      setAd(data);
    } catch (err) {
      console.error("Error fetching ad:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAd();
  }, []);

  // Convert file to base64
  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  // Handle file change with size validation
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      alert("❌ File size must be below 10 MB.");
      e.target.value = null;
      return;
    }

    setImageFile(file);
  };

  // Save (PATCH) ad
  const handleSaveAd = async () => {
    try {
      setSaving(true);

      let imageBase64 = ad.image;
      if (imageFile) imageBase64 = await toBase64(imageFile);

      const payload = {
        image: imageBase64,
        skipTime: Number(ad.skipTime) || 0,
        link: ad.link || "",
      };

      const res = await fetch(API_URL, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update ad");
      await fetchAd();
      setImageFile(null);
      alert("✅ Ad updated successfully!");
    } catch (err) {
      console.error("Update error:", err);
      alert("❌ Failed to update ad");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !ad) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="70vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        backgroundColor: "#fff0f5",
        minHeight: "86vh",
        p: 3,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 600,
          borderRadius: "16px",
          boxShadow: 3,
          backgroundColor: "#fff",
        }}
      >
        <CardContent>
          <Typography
            variant="h5"
            sx={{ color: "#d81b60", fontWeight: "bold", mb: 3 }}
          >
            Edit Channel Ad
          </Typography>

          {/* Image Preview */}
          {(imageFile || ad.image) && (
            <CardMedia
              component="img"
              image={imageFile ? URL.createObjectURL(imageFile) : ad.image}
              alt="Open Ad"
              sx={{
                height: 250,
                objectFit: "cover",
                borderRadius: "12px",
                mb: 2,
              }}
            />
          )}

          <Button
            variant="outlined"
            component="label"
            sx={{ color: "#ec407a", borderColor: "#ec407a" }}
          >
            Change Image
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleFileChange}
            />
          </Button>

          <TextField
            label="Ad Link"
            fullWidth
            sx={{ mt: 3 }}
            value={ad.link}
            onChange={(e) => setAd({ ...ad, link: e.target.value })}
          />

          <Box mt={4} display="flex" justifyContent="flex-end">
            <Button
              onClick={handleSaveAd}
              variant="contained"
              disabled={saving}
              sx={{
                backgroundColor: "#ec407a",
                "&:hover": { backgroundColor: "#d81b60" },
                px: 4,
              }}
            >
              {saving ? (
                <CircularProgress size={20} sx={{ color: "#fff" }} />
              ) : (
                "Save Changes"
              )}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ChannelAds;

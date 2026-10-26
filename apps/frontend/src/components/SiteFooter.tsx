import { Box, Typography, Stack, Link, IconButton } from "@mui/material";
import {
  Phone as PhoneIcon,
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
} from "@mui/icons-material";

// Mismos datos de contacto que demo.html: teléfono, WhatsApp, ubicación e
// Instagram son reales (confirmados contra el Instagram/Maps del lavadero);
// el email y Facebook quedan como placeholder hasta tener el dato real.
export default function SiteFooter() {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "primary.dark",
        color: "primary.contrastText",
        mt: 6,
      }}
    >
      <Box
        sx={{
          maxWidth: 960,
          mx: "auto",
          px: 2,
          py: 4,
          display: "flex",
          gap: 4,
          flexWrap: "wrap",
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          sx={{ flex: "1 1 220px" }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              bgcolor: "primary.dark",
              border: "2.5px solid",
              borderColor: "primary.contrastText",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            🚛
          </Box>
          <Box>
            <Typography fontWeight={800} color="primary.contrastText">
              Bella Italia
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "rgba(255,255,255,0.7)" }}
            >
              Lavadero de camiones y autos
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ flex: "1 1 180px" }}>
          <Typography
            variant="overline"
            sx={{ color: "rgba(255,255,255,0.7)" }}
            display="block"
            mb={1}
          >
            Contacto
          </Typography>
          <Stack spacing={0.75}>
            <Link
              href="tel:+5493492339614"
              underline="hover"
              variant="body2"
              sx={{ color: "primary.contrastText" }}
            >
              <PhoneIcon
                fontSize="inherit"
                sx={{ verticalAlign: "middle", mr: 0.5 }}
              />
              3492 33-9614
            </Link>
            <Link
              href="https://wa.me/5493492339614"
              target="_blank"
              rel="noopener"
              underline="hover"
              variant="body2"
              sx={{ color: "primary.contrastText" }}
            >
              <WhatsAppIcon
                fontSize="inherit"
                sx={{ verticalAlign: "middle", mr: 0.5 }}
              />
              WhatsApp: 3492 33-9614
            </Link>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)" }}>
              <EmailIcon
                fontSize="inherit"
                sx={{ verticalAlign: "middle", mr: 0.5 }}
              />
              contacto@bellaitalia.com.ar
            </Typography>
          </Stack>
        </Box>

        <Box sx={{ flex: "1 1 220px" }}>
          <Typography
            variant="overline"
            sx={{ color: "rgba(255,255,255,0.7)" }}
            display="block"
            mb={1}
          >
            Ubicación
          </Typography>
          <Link
            href="https://www.google.com/maps/place/Lavadero+Bella+Italia/@-31.2720819,-61.4328073,893m/data=!3m2!1e3!4b1!4m6!3m5!1s0x95caaf3a80e7431b:0x6ff3b844527fe984!8m2!3d-31.2720819!4d-61.4302324!16s%2Fg%2F11zbgspb4f"
            target="_blank"
            rel="noopener"
            underline="hover"
            variant="body2"
            sx={{ color: "primary.contrastText" }}
          >
            <LocationIcon
              fontSize="inherit"
              sx={{ verticalAlign: "middle", mr: 0.5 }}
            />
            Parque Industrial, Bella Italia, Santa Fe
          </Link>
        </Box>

        <Box sx={{ flex: "1 1 160px" }}>
          <Typography
            variant="overline"
            sx={{ color: "rgba(255,255,255,0.7)" }}
            display="block"
            mb={1}
          >
            Seguinos
          </Typography>
          <Stack direction="row" spacing={1}>
            <IconButton
              component="a"
              href="https://wa.me/5493492339614"
              target="_blank"
              rel="noopener"
              aria-label="WhatsApp"
              size="small"
              sx={{
                color: "primary.contrastText",
                border: "1px solid",
                borderColor: "rgba(255,255,255,0.3)",
              }}
            >
              <WhatsAppIcon fontSize="small" />
            </IconButton>
            <IconButton
              component="a"
              href="https://www.instagram.com/lavadero.bellaitalia/"
              target="_blank"
              rel="noopener"
              aria-label="Instagram"
              size="small"
              sx={{
                color: "primary.contrastText",
                border: "1px solid",
                borderColor: "rgba(255,255,255,0.3)",
              }}
            >
              <InstagramIcon fontSize="small" />
            </IconButton>
            <IconButton
              aria-label="Facebook (sin link todavía)"
              size="small"
              disabled
              sx={{
                color: "rgba(255,255,255,0.3)",
                border: "1px solid",
                borderColor: "rgba(255,255,255,0.15)",
              }}
            >
              <FacebookIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>
      </Box>
      <Typography
        variant="caption"
        textAlign="center"
        display="block"
        sx={{
          pb: 2,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          color: "rgba(255,255,255,0.5)",
        }}
      >
        Teléfono, WhatsApp, ubicación e Instagram son reales — falta confirmar
        email y Facebook
      </Typography>
    </Box>
  );
}

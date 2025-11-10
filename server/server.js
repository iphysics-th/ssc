const express = require('express');
const cors = require('cors');
const dbConfig = require("./app/config/db.config");
const fs = require('fs');
const https = require('https');
const http = require('http');
require("dotenv").config();
const cookieParser = require('cookie-parser');
const path = require('path');
const mongoose = require('mongoose');
mongoose.set('strictQuery', true); // or false, depending on your preference

const app = express();

// If behind a proxy in production (nginx), trust it (secure cookies, proto)
if ((process.env.NODE_ENV || 'development') === 'production') {
  app.set('trust proxy', 1);
}

app.use(cookieParser());

const corsOptions = {
  origin: process.env.REACT_APP_FRONTEND_URL, // e.g., https://yourdomain.tld or http://localhost:3000
  credentials: true, // allow sending cookies and auth headers
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // x-www-form-urlencoded

// DB
const db = require("./app/models");
const Role = db.role;

db.mongoose.connect(`mongodb://${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.DB}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log("Successfully connect to MongoDB.");
  initial();
})
.catch(err => {
  console.error("Connection error!!!", err);
  process.exit(1);
});

// Static files with caching
app.use('/', express.static(path.join(__dirname, 'public/slides'), {
  setHeaders: (res, p) => {
    if (p.endsWith(".jpg") || p.endsWith(".png") || p.endsWith(".gif")) {
      res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30 days
    } else {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));
app.use('/', express.static(path.join(__dirname, 'public/slides')));

app.use(express.static('public', {
  setHeaders: (res, p) => {
    if (p.endsWith('.jpg') || p.endsWith('.png') || p.endsWith('.svg') || p.endsWith('.gif')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
    }
  }
}));

// App routes
require("./app/routes/auth.routes")(app);
require("./app/routes/user.routes")(app);
require("./app/routes/lecturer.routes")(app);
require("./app/routes/slide.routes")(app);
require("./app/routes/reservation.routes")(app);
require("./app/routes/subject.routes")(app);
require("./app/routes/admin.routes")(app);
require("./app/routes/reservationRule.routes")(app);
require("./app/routes/setting.routes")(app);



// ---- Start server (HTTPS in prod if USE_HTTPS=true; HTTP otherwise) ----
const PORT = Number(process.env.PORT) || (String(process.env.USE_HTTPS || 'true').toLowerCase() === 'true' ? 5000 : 5050);
const USE_HTTPS = String(process.env.USE_HTTPS || 'true').toLowerCase() === 'true';

if (USE_HTTPS) {
  const keyPath  = process.env.SSL_KEY_PATH  || '/etc/ssl/ssl/private.key';
  const certPath = process.env.SSL_CERT_PATH || '/etc/ssl/ssl/certificate.crt';
  const caPath   = process.env.SSL_CA_PATH; // optional (fullchain)

  console.log('HTTPS requested with:', { keyPath, certPath, caPath: caPath || '(none)', PORT });

  try {
    const credentials = {
      key:  fs.readFileSync(keyPath, 'utf8'),
      cert: fs.readFileSync(certPath, 'utf8'),
    };
    if (caPath && fs.existsSync(caPath)) {
      credentials.ca = fs.readFileSync(caPath, 'utf8');
      console.log('Loaded CA chain from', caPath);
    }
    https.createServer(credentials, app).listen(PORT, () => {
      console.log(`HTTPS Server running on port ${PORT}`);
    }).timeout = 10 * 60 * 1000; // 10 minutes
  } catch (e) {
    console.error('Failed to start HTTPS. Falling back to HTTP.', e.message);
    http.createServer(app).listen(PORT, () => {
      console.log(`HTTP Server running on port ${PORT}`);
    });
  }
} else {
  http.createServer(app).listen(PORT, () => {
    console.log(`HTTP Server running on port ${PORT}`);
  });
}

function initial() {
  Role.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      new Role({ name: "member" }).save(err => err && console.log("error", err));
      new Role({ name: "admin"  }).save(err => err && console.log("error", err));
      console.log("added default roles: 'member', 'admin'");
    }
  });
}

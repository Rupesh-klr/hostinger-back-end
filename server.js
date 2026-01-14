const express = require('express');
const fs = require('fs');
const path = require('path');
const passport = require('passport');
const cookieSession = require('cookie-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const constants = require('./env_constant'); // Import your fallback file

const dotenv = require('dotenv');
// // 1. Load dotenv BEFORE accessing variables
// // Configure dotenv to look in the .build folder
// const dotenv = dotenv.config({ 
//     path: path.join(process.cwd(), '.build', 'config','.env') 
// });

// import dotenv from 'dotenv';

dotenv.config({ path: './.build/config/.env'});

// Set constants with 3-level priority
const KRISHNALEENATWOTWOTWO_PROJECTONE_GOKGOAL_GOOGLE_CLIENT_ID = process.env.KRISHNALEENATWOTWOTWO_PROJECTONE_GOKGOAL_GOOGLE_CLIENT_ID 
    || constants.KRISHNALEENATWOTWOTWO_PROJECTONE_GOKGOAL_GOOGLE_CLIENT_ID 
    || '775388863546-huooskea92qrm42qokb2tama5nqe0521.apps.googleusercontent.com';

const KRISHNALEENATWOTWOTWO_PROJECTONE_GOOGLE_CLIENT_SECRET = process.env.KRISHNALEENATWOTWOTWO_PROJECTONE_GOOGLE_CLIENT_SECRET 
    || constants.KRISHNALEENATWOTWOTWO_PROJECTONE_GOOGLE_CLIENT_SECRET 
    || 'Your_google _client_secert_come_here'; // i can't expose here

const API_COOKIES = process.env.API_COOKIES 
    || constants.API_COOKIES 
    || 'helloWorld';
const GOOGLE_AUTH_URL = '/auth/google'; // Standard path
const GOOGLE_REDIRECT_URL = '/auth/google/callback'; // Must match Google Console

const app = express();
const PORT = process.env.PORT || 3000;

// Logs and Server Setup
console.log('BOOT ENV TEST:', process.env.HELLO || 'HELLO not set');

const logDir = path.join(process.cwd(), 'logs');
const logFileName = 'app.log';
const logFilePath = path.join(logDir, logFileName);

// 2. Ensure the directory exists in the root
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}
// const logFileName = 'app.log';

if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

const formatLog = (level, args) => {
    const timestamp = new Date().toISOString();
    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
    return `[${timestamp}] [${level}] ${message}\n`;
};

const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });
console.log = (...args) => logStream.write(formatLog('INFO', args));
console.error = (...args) => logStream.write(formatLog('ERROR', args));
console.warn = (...args) => logStream.write(formatLog('WARN', args));

app.get('/api/health', (req, res) => {
    console.log(`Logging to ${req.path} Log file not found at ${logFilePath}`);
  res.json({ status: 'ok', NODE_ENV: process.env.NODE_ENV || 'development' });
});

/**
 * Efficiently reads the last N lines of a file without loading the whole file into memory.
 */
function tailFile(filePath, lineCount) {
    const STATS = fs.statSync(filePath);
    const FILE_SIZE = STATS.size;
    const BUFFER_SIZE = 1024 * 64; // Read 64KB chunks
    let fd = fs.openSync(filePath, 'r');
    let lines = '';
    let cursor = FILE_SIZE;

    // Read backwards in chunks until we have enough lines
    while (lines.split('\n').length <= lineCount && cursor > 0) {
        let length = Math.min(BUFFER_SIZE, cursor);
        cursor -= length;
        let buffer = Buffer.alloc(length);
        fs.readSync(fd, buffer, 0, length, cursor);
        lines = buffer.toString('utf8') + lines;
    }

    fs.closeSync(fd);
    return lines.split('\n').slice(-lineCount).join('\n');
}
// 2. The Log Viewer Page
app.get('/lastlog', (req, res) => {

    console.log(`Logging to ${req.path}`);
    const offset = parseInt(req.query.offset) || 500;

    if (!fs.existsSync(logFilePath)) {
        fs.mkdirSync(logDir);
        const logStream_NEW = fs.createWriteStream(logFilePath, { flags: 'a' });
        console.log = (...args) => logStream_NEW.write(formatLog('INFO', args));
        console.error = (...args) => logStream_NEW.write(formatLog('ERROR', args));
        console.warn = (...args) => logStream_NEW.write(formatLog('WARN', args));
        return res.status(404).send(`<h1> Log file not found at ${logFilePath}; No log file found yet. under main directory.</h1>`);
    }

    // Read the file and get last 500 lines
    // const logs = fs.readFileSync(logFilePath, 'utf8').split('\n');
    // const last500 = logs.slice(-500).join('\n');

    // Simple HTML Template with Refresh and Previous buttons
    try {
        // Only the requested lines are processed in memory
        const lastLines = tailFile(logFilePath, offset);

        res.send(`
            <html>
            <head>
                <title>Log Viewer</title>
                <style>
                    body { font-family: monospace; background: #1e1e1e; color: #d4d4d4; padding: 20px; }
                    pre { background: #000; padding: 15px; border-radius: 5px; overflow-x: auto; white-space: pre-wrap; }
                    .controls { margin-bottom: 20px; position: sticky; top: 0; background: #1e1e1e; padding: 10px; }
                    button { padding: 10px 20px; cursor: pointer; background: #007bff; color: white; border: none; border-radius: 3-px; }
                    button:hover { background: #0056b3; }
                </style>
            </head>
                <body style="background:#121212; color:#00ff00; font-family:monospace; padding:20px;">
                <h2>Last ${offset + 500} Log Entries:</h2>
                    <div style="position:sticky; top:0; background:#222; padding:10px; border-bottom:1px solid #444;">
                        <button onclick="location.reload()">🔄 Refresh (Last 500)</button>
                        <button onclick="location.href='?offset=${offset + 500}'">Load More (Older)⬅️ Previous 500 Lines</button>
                    </div>
                    <pre style="white-space: pre-wrap;">${lastLines}</pre>
                     <script>
                    // Auto-scroll to bottom of logs on load
                    window.scrollTo(0, document.body.scrollHeight);
                </script>
                </body>
            </html>
        `);
    } catch (err) {
        res.status(500).send("Error reading logs: " + err.message);
    }
});


// 2. Configure Cookie Session
app.use(cookieSession({
    name: 'session', // Recommendation: name the cookie
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    keys: [API_COOKIES]
}));

// 3. FIX: Manual shim for Passport 0.6 compatibility with cookie-session
// This fixes: "TypeError: req.session.regenerate is not a function"
app.use((req, res, next) => {
    if (req.session && !req.session.regenerate) {
        req.session.regenerate = (cb) => cb();
    }
    if (req.session && !req.session.save) {
        req.session.save = (cb) => cb();
    }
    next();
});

// 4. Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
console.log("Using Client ID:", KRISHNALEENATWOTWOTWO_PROJECTONE_GOKGOAL_GOOGLE_CLIENT_ID.substring(0, 10) + "..."); 
console.log("Using Redirect URL:", GOOGLE_REDIRECT_URL);
console.log("DEBUG: ID length:", KRISHNALEENATWOTWOTWO_PROJECTONE_GOKGOAL_GOOGLE_CLIENT_ID.trim().length);
console.log("DEBUG: Secret length:", KRISHNALEENATWOTWOTWO_PROJECTONE_GOOGLE_CLIENT_SECRET.trim().length);
console.log("DEBUG: ID length:", KRISHNALEENATWOTWOTWO_PROJECTONE_GOKGOAL_GOOGLE_CLIENT_ID);
console.log("DEBUG: Secret length:", KRISHNALEENATWOTWOTWO_PROJECTONE_GOOGLE_CLIENT_SECRET);
console.log("--- Environment Debug ---");
console.log("From process.env:", process.env.KRISHNALEENATWOTWOTWO_PROJECTONE_GOOGLE_CLIENT_SECRET ? "YES" : "NO");
console.log("From constants file:", constants.KRISHNALEENATWOTWOTWO_PROJECTONE_GOOGLE_CLIENT_SECRET ? "YES" : "NO");
console.log("--- START ALL ENVIRONMENT VARIABLES ---");
console.log(JSON.stringify(process.env, null, 2)); 
console.log("--- END ALL ENVIRONMENT VARIABLES ---");

console.log('Secret from env:', KRISHNALEENATWOTWOTWO_PROJECTONE_GOOGLE_CLIENT_SECRET);
console.log('From process.env:', process.env.KRISHNALEENATWOTWOTWO_PROJECTONE_GOOGLE_CLIENT_SECRET ? 'YES' : 'NO');
console.log('From process.env:', process.env.KRISHNALEENATWOTWOTWO_PROJECTONE_GOOGLE_CLIENT_SECRET );
console.log('From process.env:', process.env.KRISHNALEENATWOTWOTWO_PROJECTONE_GOKGOAL_GOOGLE_CLIENT_ID );

console.log('BOOT ENV TEST:', process.env.HELLO || 'HELLO not set');


if (dotenv.error) {
    console.log("[DEBUG] .env file not found or could not be read:", dotenv.message);
} else {
    console.log("[DEBUG] .env file found. Parsed keys:", Object.keys(dotenv));
}
// 5. Configure Google Strategy
passport.use(new GoogleStrategy({
    clientID: KRISHNALEENATWOTWOTWO_PROJECTONE_GOKGOAL_GOOGLE_CLIENT_ID,
    clientSecret: KRISHNALEENATWOTWOTWO_PROJECTONE_GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_REDIRECT_URL,
    proxy: true // Required if you ever deploy to Hostinger/Heroku (HTTPS)
}, (accessToken, refreshToken, profile, done) => {
    // profile contains the Google user data
    return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// 6. Routes
app.get(GOOGLE_AUTH_URL, passport.authenticate('google', {
    scope: ['profile', 'email']
}));

// 2. Add an error-handling middleware for the callback route
app.get(GOOGLE_REDIRECT_URL, 
    (req, res, next) => {
        passport.authenticate('google', (err, user, info) => {
            if (err) {
                console.error("Passport Auth Error:", err);
                console.log("Passport Auth Error:", err);
                console.warn("Passport Auth Error:", err);
                return res.status(500).send(`Auth Failed: ${err.message}`);
            }
            if (!user) {
                console.warn("user not found" );
                console.log("user not found" );
                return res.redirect('/'); // Redirect back home if user not found
            }
            req.logIn(user, (err) => {
                console.warn("user  found" );
                console.log("user found" );
                if (err) { console.warn("user not found err" , err);
                console.log("user not found err" , err); return next(err); }
                return res.redirect('/'); 
            });
        })(req, res, next);
    }
);

app.get('/api/current_user', (req, res) => {
    if (!req.user) {
        return res.status(401).send({ error: 'Not logged in' });
    }
    res.send(req.user);
});


app.post('/auth/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.redirect('/'); // Redirect to home after logout
    });
});


app.get('/', (req, res) => {
    if (req.user) {
        // User is LOGGED IN
        res.send(`
            <h1>Welcome, ${req.user.displayName}</h1>
            <img src="${req.user.photos[0].value}" referrerpolicy="no-referrer" style="border-radius:50%; width:50px;">
            <p>You are signed in as ${req.user.emails[0].value}</p>
            <form action="/auth/logout" method="POST">
                <button type="submit">Logout</button>
            </form>
        `);
    } else {
        // User is NOT LOGGED IN
        res.send(`
            <h1>Home</h1>
            <p>Please sign in to continue.</p>
            <a href="/auth/google" style="padding:10px; background:#4285F4; color:white; text-decoration:none; border-radius:5px;">
                Login with Google
            </a>
        `);
    }
});

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
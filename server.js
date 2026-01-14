const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const passport = require('passport');
const cookieSession = require('cookie-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const jwt = require("jsonwebtoken");

// import cors from 'cors';

const env_constants = require('./env_constant'); // Import your fallback file

const dotenv = require('dotenv');
// // 1. Load dotenv BEFORE accessing variables
// // Configure dotenv to look in the .build folder
// const dotenv = dotenv.config({ 
//     path: path.join(process.cwd(), '.build', 'config','.env') 
// });

// import dotenv from 'dotenv';

dotenv.config({ path: './.build/config/.env' });

// Set env_constants with 3-level priority
const KRISHNALEENATWOTWOTWO_PROJECTONE_GOKGOAL_GOOGLE_CLIENT_ID = process.env.KRISHNALEENATWOTWOTWO_PROJECTONE_GOKGOAL_GOOGLE_CLIENT_ID
    || env_constants.KRISHNALEENATWOTWOTWO_PROJECTONE_GOKGOAL_GOOGLE_CLIENT_ID
    || '775388863546-huooskea92qrm42qokb2tama5nqe0521.apps.googleusercontent.com';

const KRISHNALEENATWOTWOTWO_PROJECTONE_GOOGLE_CLIENT_SECRET = process.env.KRISHNALEENATWOTWOTWO_PROJECTONE_GOOGLE_CLIENT_SECRET
    || env_constants.KRISHNALEENATWOTWOTWO_PROJECTONE_GOOGLE_CLIENT_SECRET
    || 'Your_google _client_secert_come_here'; // i can't expose here

const API_COOKIES = process.env.API_COOKIES
    || env_constants.API_COOKIES
    || 'helloWorld';
const GOOGLE_AUTH_URL = '/auth/google'; // Standard path
const GOOGLE_REDIRECT_URL = '/auth/google/callback'; // Must match Google Console

const app = express();
const PORT = process.env.PORT || 3001;
const allowedOrigins = [
    'http://localhost:3002', // Your local development
    'https://localhost:3002',
    'http://localhost:3001',
    'http://localhost:3000',
    'https://localhost:3001',
    'https://localhost:3000',
    'http://saddlebrown-weasel-463292.hostingersite.com', // Your Hostinger frontend
    'https://saddlebrown-weasel-463292.hostingersite.com' // Your Hostinger frontend
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            return callback(new Error('CORS policy violation'), false);
        }
        return callback(null, true);
    },
    credentials: true, // Required to send/receive cookies and session IDs
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// backend/server.js
// app.use(session({
//     secret: 'your_secret',
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//         // Shared domain for all Hostinger subdomains
//         domain: '.hostingersite.com', 
//         httpOnly: true,
//         // Must be true for Hostinger HTTPS
//         secure: true, 
//         // Required for cross-site cookie sharing
//         sameSite: 'none', 
//         maxAge: 24 * 60 * 60 * 1000 
//     }
// }));

// // 2. Configure Cookie Session
// app.use(cookieSession({
//     name: 'session', // Recommendation: name the cookie
//     maxAge: 24 * 60 * 60 * 1000, // 24 hours
//     keys: [API_COOKIES]
// }));
const sessionConfig = {
    secret: 'your_secret',
    resave: false,
    saveUninitialized: false,
    proxy: true, // Required for Hostinger HTTPS
    cookie: {
        httpOnly: true,
        secure: true,   // Required for cross-site cookies
        sameSite: 'none', // Allows cookie sharing between Hostinger and localhost
        maxAge: 24 * 60 * 60 * 1000
    }
};

// 2. Dynamic Cookie Adjustment Middleware
app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (origin && origin.includes('hostingersite.com')) {
        // Production: Enable cross-subdomain sharing
        sessionConfig.cookie.domain = '.hostingersite.com';
        sessionConfig.cookie.secure = true;
        sessionConfig.cookie.sameSite = 'none';
    } else {
        // Localhost: Remove domain restriction
        delete sessionConfig.cookie.domain;
        sessionConfig.cookie.secure = false; // Local is usually HTTP
        sessionConfig.cookie.sameSite = 'lax';
    }
    next();
});

// 3. Apply Session Middleware
app.use(session(sessionConfig));
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
app.use((req, res, next) => {
    // Allows the popup to stay connected to your frontend
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    // Allows cross-site data sharing
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    next();
});

// 4. Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
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


console.log("Using Client ID:", KRISHNALEENATWOTWOTWO_PROJECTONE_GOKGOAL_GOOGLE_CLIENT_ID.substring(0, 10) + "...");
console.log("Using Redirect URL:", GOOGLE_REDIRECT_URL);
console.log("DEBUG: ID length:", KRISHNALEENATWOTWOTWO_PROJECTONE_GOKGOAL_GOOGLE_CLIENT_ID.trim().length);
console.log("DEBUG: Secret length:", KRISHNALEENATWOTWOTWO_PROJECTONE_GOOGLE_CLIENT_SECRET.trim().length);
console.log("DEBUG: ID length:", KRISHNALEENATWOTWOTWO_PROJECTONE_GOKGOAL_GOOGLE_CLIENT_ID);
console.log("DEBUG: Secret length:", KRISHNALEENATWOTWOTWO_PROJECTONE_GOOGLE_CLIENT_SECRET);
console.log("--- Environment Debug ---");
console.log("From process.env:", process.env.KRISHNALEENATWOTWOTWO_PROJECTONE_GOOGLE_CLIENT_SECRET ? "YES" : "NO");
console.log("From env_constants file:", env_constants.KRISHNALEENATWOTWOTWO_PROJECTONE_GOOGLE_CLIENT_SECRET ? "YES" : "NO");
console.log("--- START ALL ENVIRONMENT VARIABLES ---");
console.log(JSON.stringify(process.env, null, 2));
console.log("--- END ALL ENVIRONMENT VARIABLES ---");

console.log('Secret from env:', KRISHNALEENATWOTWOTWO_PROJECTONE_GOOGLE_CLIENT_SECRET);
console.log('From process.env:', process.env.KRISHNALEENATWOTWOTWO_PROJECTONE_GOOGLE_CLIENT_SECRET ? 'YES' : 'NO');
console.log('From process.env:', process.env.KRISHNALEENATWOTWOTWO_PROJECTONE_GOOGLE_CLIENT_SECRET);
console.log('From process.env:', process.env.KRISHNALEENATWOTWOTWO_PROJECTONE_GOKGOAL_GOOGLE_CLIENT_ID);

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
// app.get(GOOGLE_AUTH_URL, passport.authenticate('google', {
//     scope: ['profile', 'email']
// }));
app.get('/auth/google', (req, res, next) => {
    const origin = req.query.origin || 'http://localhost:3002';
    const callbackendpoint = req.query.callbackendpoint || '/main-portal/local-setup-userdetails';

    const state = JSON.stringify({ origin, callbackendpoint });

    passport.authenticate('google', {
        scope: ['profile', 'email'],
        state: Buffer.from(state).toString('base64'), // Base64 encode for URL safety
        prompt: 'select_account'
    })(req, res, next);
});

// 2. Add an error-handling middleware for the callback route
// app.get(GOOGLE_REDIRECT_URL, 
//     (req, res, next) => {
//         passport.authenticate('google', (err, user, info) => {
//             if (err) {
//                 console.error("Passport Auth Error:", err);
//                 console.log("Passport Auth Error:", err);
//                 console.warn("Passport Auth Error:", err);
//                 return res.status(500).send(`Auth Failed: ${err.message}`);
//             }
//             if (!user) {
//                 console.warn("user not found" );
//                 console.log("user not found" );
//                 return res.redirect('/'); // Redirect back home if user not found
//             }
//             req.logIn(user, (err) => {
//                 console.warn("user  found" );
//                 console.log("user found" );
//                 if (err) { console.warn("user not found err" , err);
//                 console.log("user not found err" , err); return next(err); }
//                 return res.redirect('/'); 
//             });
//         })(req, res, next);
//     }
// );
app.get('/auth/google/callback', (req, res, next) => {

    let stateParams = { origin: 'http://localhost:3002', callbackendpoint: '/' };
    try {
        const decodedState = JSON.parse(Buffer.from(req.query.state, 'base64').toString());
        stateParams = decodedState;
    } catch (e) {
        console.error("State decode failed:", e);
    }

    const token = jwt.sign(
        {
            id: req?.user?.id,
            email: req?.user?.emails?.[0]?.value
        },
        API_COOKIES,
        { expiresIn: "24h" }
    );
    console.log("User authenticated:", JSON.stringify(req.user, null, 2));
    console.log(`User authenticated: ${stateParams.origin}---${stateParams.callbackendpoint}`);

    passport.authenticate('google', (err, user) => {
        if (err || !user) return res.status(500).send("Token Exchange Failed");

        req.logIn(user, (loginErr) => {
            if (loginErr) return next(loginErr);

            // const token = "YOUR_JWT_TOKEN"; // Generate your JWT here
            const { origin, callbackendpoint } = stateParams;

            const userPayload = JSON.stringify({
                id: user.id,
                displayName: user.displayName,
                name: user.name?.givenName || user.displayName,
                email: user.emails?.[0]?.value,
                photo: user.photos?.[0]?.value,
                rawData: user
            });

            const targetOrigin = "${origin}${callbackendpoint}";

            // 2. Construct the Redirect URL for your new component
            const setupUrl = new URL(origin + callbackendpoint);
            setupUrl.searchParams.set('jwttoken', token);
            setupUrl.searchParams.set('authkey', API_COOKIES);
            setupUrl.searchParams.set('googleauth', true);
            setupUrl.searchParams.set('userauthdata', JSON.stringify(userPayload));
            res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Authentication Successful</title>
    <style>
        body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f4f7f6; }
        .loader { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 2s linear infinite; margin-bottom: 20px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .container { text-align: center; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <div class="container">
        <div class="loader"></div>
        <h2>Authentication Successful</h2>
        <p>Finalizing your setup, please wait...</p>
    </div>

    <script>
        (function() {
            'use strict';
            
            // 1. Data passed from Backend
            const userData = ${JSON.stringify(user)};
            const jwtToken = "${token}";
            const targetOrigin = "${origin}"; 
            const callbackPath = "${callbackendpoint}"; // Should be /main-portal/local-setup-userdetails

            // 2. Prepare Payload for URL
            const userPayload = {
                id: userData.id,
                displayName: userData.displayName,
                name: userData.name?.givenName || userData.displayName,
                email: userData.emails?.[0]?.value,
                photo: userData.photos?.[0]?.value
            };

            // 3. Construct Redirect URL
            const setupUrl = new URL(targetOrigin + callbackPath);
            setupUrl.searchParams.set('jwttoken', jwtToken);
            setupUrl.searchParams.set('authkey', 'helloWorld');
            setupUrl.searchParams.set('googleauth', 'true');
            setupUrl.searchParams.set('userauthdata', JSON.stringify(userPayload));

            const finalUrl = setupUrl.toString();

            // 4. Execution Flow
            if (window.opener && !window.opener.closed) {
                // Fix: Added proper targetOrigin string to postMessage
                window.opener.postMessage({ 
                    type: "AUTH_SUCCESS", 
                    user: userPayload 
                }, targetOrigin);
                
                // Redirect parent window and close popup
                window.opener.location.href = finalUrl;
                window.close();
            } else {
                // Fallback: Redirect the current window
                window.location.href = finalUrl;
            }
        })();
    </script>
</body>
</html>
            `);
        });
    })(req, res, next);
});
/*

                <script>
                    if (window.opener) {
                        window.opener.postMessage({
                            type: "AUTH_SUCCESS",
                            user: ${JSON.stringify(user)}
                        }, "${origin}");
                        window.close();
                    } else {
                        // Fallback if opener is lost
                        window.location.href = "${origin}${callbackendpoint}";
                    }
                </script>
*/
// app.get('/auth/google/callback', (req, res, next) => {
//     const origin = req.query.state || 'https://saddlebrown-weasel-463292.hostingersite.com';
// console.log("Origin received in callback:", origin);    
// console.log("User authenticated:", req.user);

//     passport.authenticate('google', (err, user) => {
//         if (err) return res.status(500).send("Token Exchange Failed");
//         res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
//     // Allows loading resources from different origins
//     res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
//         res.cookie('session_id', req.sessionID, {
//         domain: '.hostingersite.com', // Allows sharing across subdomains
//         httpOnly: true,
//         secure: true,
//         sameSite: 'none'
//     });
//         req.logIn(user, (loginErr) => {
//             if (loginErr) return next(loginErr);

//             // Send the success script back to the frontend origin
//             res.send(`
//                 <script>
//                     window.opener.postMessage({
//                         type: "AUTH_SUCCESS",
//                         user: ${JSON.stringify(user)}
//                     }, "${origin}");
//                     window.close();
//                 </script>
//             `);
//         });
//     })(req, res, next);
// });
// app.get(GOOGLE_REDIRECT_URL, passport.authenticate('google'), (req, res) => {
//     // 1. Set Cross-Domain Cookies (Important for Hostinger domains)
//     // res.cookie('session_id', req.sessionID, {
//     //     domain: '.hostingersite.com', // Allows sharing across subdomains
//     //     httpOnly: true,
//     //     secure: true,
//     //     sameSite: 'none'
//     // });
// const origin = req.query.state || 'https://saddlebrown-weasel-463292.hostingersite.com';
// console.log("Origin received in callback:", origin);    
// console.log("User authenticated:", req.user);

//     passport.authenticate('google', (err, user) => {
//         if (err) return res.status(500).send("Token Exchange Failed");

//         req.logIn(user, (loginErr) => {
//             if (loginErr) return next(loginErr);

//             // Send the success script back to the frontend origin
//             res.send(`
//                 <script>
//                     window.opener.postMessage({
//                         type: "AUTH_SUCCESS",
//                         user: ${JSON.stringify(user)}
//                     }, "${origin}");
//                     window.close();
//                 </script>
//             `);
//         });
//     })(req, res, next);
// });

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
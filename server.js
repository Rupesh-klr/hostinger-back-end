const express = require('express');
const fs = require('fs');
const path = require('path');
const passport = require('passport');
const cookieSession = require('cookie-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const dotenv = require('dotenv');
const constants = require('./env_constant'); // Import your fallback file

const dotenv = require('dotenv');
// 1. Load dotenv BEFORE accessing variables
dotenv.config();

// Set constants with 3-level priority
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID 
    || constants.GOOGLE_CLIENT_ID 
    || '775388863546-huooskea92qrm42qokb2tama5nqe0521.apps.googleusercontent.com';

const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET 
    || constants.GOOGLE_CLIENT_SECRET 
    || 'Your_google _client_secert_come_here'; // i can't expose here

const API_COOKIES = process.env.API_COOKIES 
    || constants.API_COOKIES 
    || 'helloWorld';
const GOOGLE_AUTH_URL = '/auth/google'; // Standard path
const GOOGLE_REDIRECT_URL = '/auth/google/callback'; // Must match Google Console

const app = express();
const PORT = process.env.PORT || 3000;

// Logs and Server Setup
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

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

// 5. Configure Google Strategy
passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
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

app.get(GOOGLE_REDIRECT_URL, 
    passport.authenticate('google', { failureRedirect: '/' }), 
    (req, res) => {
        // Logged in successfully
        res.redirect('/api/current_user'); 
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
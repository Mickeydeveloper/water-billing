require("dotenv").config()
const express = require("express")
const session = require("express-session")
const passport = require("passport")
const GoogleStrategy = require("passport-google-oauth20").Strategy
const path = require("path")

const app = express()

// ===== SESSION =====
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}))

app.use(passport.initialize())
app.use(passport.session())

passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((obj, done) => done(null, obj))

// ===== GOOGLE AUTH =====
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
},
(accessToken, refreshToken, profile, done) => {
  return done(null, profile)
}
))

// ===== STATIC FILES =====
app.use(express.static(path.join(__dirname, "public")))

// ===== ROUTES =====
app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
)

app.get("/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login.html"
  }),
  (req, res) => {
    res.redirect("/dashboard")
  }
)

app.get("/dashboard", (req, res) => {
  if (!req.isAuthenticated()) return res.redirect("/login.html")

  res.send(`
    <h2>Welcome ${req.user.displayName}</h2>
    <img src="${req.user.photos[0].value}" width="100" style="border-radius:50%"/>
    <p>Email: ${req.user.emails[0].value}</p>
    <br>
    <a href="/logout">Logout</a>
  `)
})

app.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/login.html")
  })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log("Server running on port " + PORT))
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
module.exports = (passport) => {
    passport.serializeUser((user, done) => {
        done(null, user);
    });
    passport.deserializeUser((user, done) => {
        done(null, user);
    });
    passport.use(new GoogleStrategy({
            clientID: "ID",
            clientSecret: "SECRET",
            callbackURL: "/chat/g"
        },
        (token, refreshToken, profile, done) => {
            console.log(profile)

            return done(null, {
                profile: profile,
                token: token
            });
        }));
};

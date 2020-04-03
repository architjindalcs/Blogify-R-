const express=require("express");
const app=express();
const bodyParser=require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
const path=require("path");
const publicPath=path.join(__dirname,"public");
const mongoose=require("mongoose");
app.use(express.static(publicPath));
const port=3000 || process.env.PORT;
app.set("view engine","ejs");
const localStrategy=require("passport-local");

//Setting up the passport
const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
app.use(session({
    secret: "SecretHaha",
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize());
app.use(passport.session());
//Passport
mongoose.connect("mongodb://127.0.0.1:27017/blogSiteDB",{useNewUrlParser: true,useUnifiedTopology: true});
const userSchema=new mongoose.Schema({
    name: String,
    username: String,
    city: String,
    password: String,
    profileimg: String,
    rec_req:
    {
        type: Array,
        default: []
    },
    sent_req:
    {
        type: Array,
        default: []
    },
    followers:
    {
        type: Array,
        default: []
    },
    following:
    {
        type: Array,
        default: []
    },
    messages:
    {
        type:Array,
        default: []
    }
});

//Passport
userSchema.plugin(passportLocalMongoose);
//Passport
const User=mongoose.model("User",userSchema);
//Passport
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser())
//Passport
function isLoggedin(req,res,next)
{
    if(req.isAuthenticated())
    {
        return next();
    }
    res.redirect("/");
}
app.get("/",function(req,res)
{
    res.render("homepage");
});
app.get("/signup",function(req,res)
{
    res.render("signup");
});
app.post("/register",function(req,res)
{
    User.find({username: req.body.username},function(err,results)
    {
        console.log(results);
        if(results.length!=0)
        {
            console.log("Error");
            console.log(results);
            res.render("signupfail");
        }
        else
        {
            var newuser=req.body;
            console.log(newuser);
            if(newuser.profileimg==='')
            {
                newuser.profileimg="https://s3.amazonaws.com/whisperinvest-images-prod/default-profile.png";
            }
            var password=newuser.password;
            delete newuser["password"];
            console.log(newuser);
            User.register(newuser,password,function(err,user)
            {
                res.redirect("/");
            })
        }
    })
})
app.post("/login", passport.authenticate("local",
{
    successRedirect: "/profile",
    failureRedirect: "/loginfailed"
}))
app.get("/profile",isLoggedin,function(req,res)  //To be updated..profile homepage show all blogs available
{
    const loggedUser=req.user.username;
    User.findOne({username: loggedUser},function(err,user)
    {   
        res.render("profile");
    })
})
app.get("/loginfailed",function(req,res)
{
    res.render("homepagefail");
})
app.listen(3000,function(){
    console.log("Server has started!!")
})
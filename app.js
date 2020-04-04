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
        // console.log(results);
        if(results.length!=0)
        {
            // console.log("Error");
            // console.log(results);
            res.render("signupfail");
        }
        else
        {
            var newuser=req.body;
            // console.log(newuser);
            if(newuser.profileimg==='')
            {
                newuser.profileimg="https://s3.amazonaws.com/whisperinvest-images-prod/default-profile.png";
            }
            var password=newuser.password;
            delete newuser["password"];
            // console.log(newuser);
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
        res.render("profile",{loggedUser: req.user.username});
    })
})
app.get("/loginfailed",function(req,res)
{
    res.render("homepagefail");
})
app.get("/logout",function(req,res)
{
    req.logout();
    res.redirect("/");
})
app.get("/search",isLoggedin,function(req,res)
{
    const query=req.query.query.toLowerCase();
    // query=query.toLowerCase();
    User.find({},function(err,users)
    {
       var results=[];
       for(var i=0;i<users.length;i++)
        {
            if(users[i].username===req.user.username)
            {
                continue;
            }
            var len=query.length;
            var poss=false;
            var currUsername=users[i].username;
            var currName=users[i].name;
            currUsername=currUsername.toLowerCase();
            currName=currName.toLowerCase();
            for(var k=0;k<=currName.length;k++)
            {
                if(currName.slice(k,k+len)==query)
                {
                    poss=true;
                    break;
                }
            }
            if(poss==true)
            {
                results.push(users[i]);
                continue;
            }
            for(var k=0;k<=currUsername.length;k++)
            {
                if(currUsername.slice(k,k+len)==query)
                {
                    poss=true;
                    break;
                }
            }
            if(poss==true)
            {
                results.push(users[i]);
                continue;
            }

        }
        // console.log(results);
        res.render("searchresults",{results: results,loggedUser: req.user.username,q: query});
    })
})
//Follow Req related routes........................
app.get("/send/:userid",isLoggedin,function(req,res)
{
    var searchFor=req.params.userid;
    User.findOne({username: searchFor},function(err,user){
        var prev=user.rec_req;
        prev.push(req.user.username);
        User.findOneAndUpdate({username: searchFor},{$set:{rec_req: prev}},function(err,user){});
    })
    User.findOne({username: req.user.username},function(err,user){
        var prev=user.sent_req;
        prev.push(req.params.userid);
        User.findOneAndUpdate({username: req.user.username},{$set: {sent_req: prev}},function(err,user){});
        res.redirect("back");
    })
})
app.get("/cancel/:userid",isLoggedin,function(req,res)
{
    User.findOne({username: req.params.userid},function(err,user)
    {
        var prev=user.rec_req;
        var newR=[];
        for(var i=0;i!=prev.length;i++)
        {
            if(prev[i]!=req.user.username)
            {
                newR.push(prev[i]);
            }
        }
        User.findOneAndUpdate({username: req.params.userid},{$set: {rec_req: newR}},function(err,user){});
    })
    User.findOne({username: req.user.username},function(err,user)
    {
        var prev=user.sent_req;
        var newR=[];
        for(var i=0;i!=prev.length;i++)
        {
            if(prev[i]!=req.params.userid)
            {
                newR.push(prev[i]);
            }
        }
        User.findOneAndUpdate({username: req.user.username},{$set: {sent_req: newR}},function(err,user){});
        res.redirect("back");   //Rediredict to a cancellation page...
    })
})
app.get("/delete/:userid",isLoggedin,function(req,res)
{
    User.findOne({username: req.user.username},function(err,user){
        var prev=user.rec_req;
        var newR=[];
        for(var i=0;i<prev.length;i++)
        {
            if(prev[i]!=req.params.userid)
            {
                newR.push(prev[i]);
            }
        }
        User.findOneAndUpdate({username: req.user.username},{$set:{rec_req: newR}},function(err,user){})
    })
    User.findOne({username: req.params.userid},function(err,user)
    {
        var prev=user.sent_req;
        var newR=[];
        for(var i=0;i<prev.length;i++)
        {
            if(prev[i]!=req.user.username)
            {
                newR.push(prev[i]);
            }
        }
        User.findOneAndUpdate({username: req.params.userid},function(err,user){});
        res.redirect("back");
    })
})
app.get("/accept/:userid",function(req,res)
{
    User.findOne({username: req.user.username},function(err,user)
    {
        var prev=user.followers;
        prev.push(req.params.userid);
        var rec_req=user.rec_req;
        var newR=[];
        for(var i=0;i<rec_req.length;i++)
        {
            if(rec_req[i]!=req.params.userid)
            {
                newR.push(rec_req[i]);
            }
        }
        User.findOneAndUpdate({username: req.user.username},{$set:{followers: prev,rec_req: newR}},
            function(err,user){});
    })
    User.findOne({username: req.params.userid},function(err,user)
    {
        var prev=user.following;
        prev.push(req.user.username);
        var sent_req=user.sent_req;
        var newR=[];
        for(var i=0;i<sent_req.length;i++)
        {
            if(sent_req[i]!=req.user.username)
            {
                newR.push(sent_req[i]);
            }
        }
        User.findOneAndUpdate({username: req.params.userid},{$set:{following: prev,sent_req: newR}},
            function(err,user){});
            res.redirect("back");
    })
})
app.get("/requests",function(req,res)
{
    User.findOne({username: req.user.username},function(err,user)
    {
        // console.log(user.rec_req);
        var results=[];
        var recR=user.rec_req;
        User.find({},function(err,users)
        {
            for(var i=0;i<users.length;i++)
            {
                var username=users[i].username;
                
                for(var j=0;j<recR.length;j++)
                {
                   
                    // console.log(recR[j]);
                    if(recR[j]===username)
                    {
                        results.push(users[i]);
                        // console.log(users[i]);
                        break;
                    }
                }
            }
            res.render("requestsrec",{results: results,loggedUser: req.user.username});
            // console.log("Results: ",results);
        })
        // res.send("Welcome...");
        // res.render("requestsrec",{requests: user.rec_req,loggedUser: req.user.username});
    })
    
})
app.get("/sentrequests",isLoggedin,function(req,res)
{
    User.findOne({username: req.user.username},function(err,user)
    {
        var sentR=user.sent_req;
        var results=[];
        User.find({},function(err,users)
        {
            for(var i=0;i<users.length;i++)
            {
                for(var j=0;j<sentR.length;j++)
                {
                    if(sentR[j]==users[i].username)
                    {
                        results.push(users[i]);
                        break;
                    }
       
                }
            }
   
            res.render("sentreq.ejs",{results: results,loggedUser: req.user.username});
        })
      
    })
})
app.get("/manage",isLoggedin,function(req,res)
{
    User.findOne({username: req.user.username},function(err,user)
    {
        var results=[];
        var followers=user.followers;
        User.find({},function(err,users)
        {
            for(var i=0;i<users.length;i++)
            {
                for(var j=0;j<followers.length;j++)
                {
                    if(followers[j]==users[i].username)
                    {
                        results.push(users[i]);
                        break;
                    }
                }
            }
            // console.log("Results,",results);
            res.render("manage",{results: results,loggedUser: req.user.username});
        })
    })
    // res.render("manage.ejs",{loggedUser: req.user.username});
})
app.get("/following",isLoggedin,function(req,res)
{
    User.findOne({username: req.user.username},function(err,user)
    {
        var results=[];
        var following=user.following;
        User.find({},function(err,users)
        {
            for(var i=0;i<users.length;i++)
            {
                for(var j=0;j<following.length;j++)
                {
                    if(following[j]==users[i].username)
                    {
                        results.push(users[i]);
                        break;
                    }
                }
            }
            // console.log("Results,",results);
            res.render("following",{results: results,loggedUser: req.user.username});
        })
    })
})
app.get("/unfollow/:userid",function(req,res)
{
    User.findOne({username: req.user.username},function(err,user){
        var prev=user.following;
        var newR=[];
        for(var i=0;i<prev.length;i++)
        {
            if(prev[i]!=req.params.userid)
            {
                newR.push(prev[i]);
            }
        }
        User.findOneAndUpdate({username: req.user.username},{$set:{following: newR}},function(err,user){});
    })
    User.findOne({username: req.params.userid},function(err,user){
        var prev=user.followers;
        var newR=[];
        for(var i=0;i<prev.length;i++)
        {
            if(prev[i]!=req.user.username)
            {
                newR.push(prev[i]);
            }
        }
        User.findOneAndUpdate({username: req.params.userid},{$set:{followers: newR}},function(err,user){});
        res.redirect("back");
    })
})
app.get("/remove/:userid",function(req,res)
{
    User.findOne({username: req.user.username},function(err,user)
    {
        var followers=user.followers;
        var newR=[];
        for(var i=0;i<followers.length;i++)
        {
            if(followers[i]!=req.params.userid)
            {
                newR.push(followers[i]);
            }
        }
        User.findOneAndUpdate({username: req.user.username},{$set: { followers: newR}},function(err,res){});
    })
    User.findOne({username: req.params.userid},function(err,user)
    {
        var following=user.following;
        var newR=[];
        for(var i=0;i<following.length;i++)
        {
            if(following[i]!=req.user.username)
            {
                newR.push(following[i]);
            }
        }
        User.findOneAndUpdate({username: req.params.userid},{$set:{following: newR}},function(err,user){});
        res.redirect("back");
    })
})
app.listen(3000,function(){
    console.log("Server has started!!")
})
var express = require("express");
var router  = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");

// INDEX - show all campgrounds.
router.get("/", function(req, res){
  var perPage = 8;
  var pageQuery = parseInt(req.query.page);
  var pageNumber = pageQuery ? pageQuery : 1;
  if(req.query.search){
    const regex = new RegExp(escapeRegex(req.query.search), 'gi');
    // Get all campgrounds from DB.
    Campground.find({name: regex}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
      if(err){
        req.flash("error", err.message);
        res.redirect("back");
      } else {
        Campground.count({name: regex}).exec(function (err, count) {
          if (err) {
            req.flash("error", "No campgrounds match that query, please try again.");
            res.redirect("back");
          } else {
            res.render("campgrounds/index", {
              campgrounds: allCampgrounds,
              current: pageNumber,
              pages: Math.ceil(count / perPage),
              search: req.query.search,
              page: "campgrounds"
            });
          }
        });
      }
    });
  } else {
  // get all campgrounds from DB
    Campground.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
      if(err){
        req.flash("error", err.message);
        res.redirect("back");
      } else {
        Campground.count().exec(function (err, count) {
            if (err) {
              req.flash("error", err.message);
              res.redirect("back");
            } else {
              res.render("campgrounds/index", {
                campgrounds: allCampgrounds,
                current: pageNumber,
                pages: Math.ceil(count / perPage),
                search: false,
                page: "campgrounds"
              });
            }
        }); 
      }
    });
  }
});

//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, function(req, res){
  // add author to campground
  req.body.campground.author = {
    id: req.user._id,
    username: req.user.username
  };
  // Create a new campground and save to DB
    Campground.create(req.body.campground, function(err, newlyCreated){
        if(err){
            req.flash('error', err.message);
            return res.redirect('back');
        } else {
            //redirect back to campgrounds page
            res.redirect('/campgrounds/' + newlyCreated.id);
        }
    });
  });

// NEW - show form to create new campground.
router.get("/new", middleware.isLoggedIn, function(req, res){
  res.render("campgrounds/new"); 
});

// SHOW - shows more info about one campground.
router.get("/:id", function(req, res){
  // Find the campground with provided ID.
  Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
    if(err){
      req.flash("error", err.message);
      res.redirect("back");
    } else {
      // Render show template with that campground.
      res.render("campgrounds/show", {campground: foundCampground});
    }
  });
});

// EDIT CAMPGROUND ROUTE.
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
  Campground.findById(req.params.id, function(err, foundCampground){
    if(err){
        req.flash("error", err.message);
        res.redirect("back");
    } else {
        //render show template with that campground
        res.render("campgrounds/edit", {campground: foundCampground});
    }
  });
});

// UPDATE CAMPGROUND ROUTE
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
  Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully updated campground.");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
});

// DESTROY CAMPGROUND ROUTE.
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res){
  Campground.findByIdAndRemove(req.params.id, function(err){
    if(err){
      req.flash("error", err.message);
      res.redirect("/campgrounds");
    } else {
      req.flash("success", "Successfully deleted campground.");
      res.redirect("/campgrounds");
    }
  });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports = router;
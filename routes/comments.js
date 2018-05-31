var express = require("express");
var router  = express.Router({mergeParams: true});
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware");

// Comments NEW.
router.get("/new", middleware.isLoggedIn, function(req, res){
  // Find campground by id.
  Campground.findById(req.params.id, function(err, campground){
    if(err){
      req.flash("error", err.message);
      res.redirect("back");
    } else {
      res.render("comments/new", {campground: campground});
    }
  });
});

// Comments CREATE.
router.post("/", middleware.isLoggedIn, function(req, res){
  // Lookup campground using ID.
  Campground.findById(req.params.id, function(err, campground) {
      if(err){
        req.flash("error", err.message);
        res.redirect("/campgrounds");
      } else {
        // Create new comment.
        Comment.create(req.body.comment, function(err, comment){
          if(err){
            req.flash("error", err.message);
            res.redirect("back");
          } else {
            // Add username and id to comment.
            comment.author.id = req.user._id;
            comment.author.username = req.user.username;
            // Save comment.
            comment.save();
            // Connect new comment to campground.
            campground.comments.push(comment);
            campground.save();
            // Redirect to campground show page.
            req.flash("success", "Successfully added comment");
            res.redirect("/campgrounds/" + campground._id);
          }
        });
      }
  });
});

// COMMENT EDIT ROUTE.
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
  Comment.findById(req.params.comment_id, function(err, foundComment) {
    if(err){
      req.flash("error", err.message);
      res.redirect("back");
    } else {
      res.render("comments/edit", {campground_id: req.params.id, comment: foundComment});
    }
  });
});

// COMMENT UPDATE ROUTE.
router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res){
  Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
    if(err){
      req.flash("error", err.message);
      res.redirect("back");
    } else {
      res.redirect("/campgrounds/" + req.params.id);
    }
  });
});

// COMMENT DESTROY ROUTE.
router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res){
  // findByIdAndRemove.
  Comment.findByIdAndRemove(req.params.comment_id, function(err){
    if(err){
      req.flash("error", err.message);
      res.redirect("back");
    } else {
      req.flash("success", "Successfully deleted comment.");
      res.redirect("/campgrounds/" + req.params.id);
    }
  });
});

module.exports = router;
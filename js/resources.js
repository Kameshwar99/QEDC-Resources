// An example Parse.js Backbone application based on the resource app by
// [Jérôme Gravel-Niquet](http://jgn.me/). This demo uses Parse to persist
// the resource items and provide user authentication and sessions.

$(function() {

  Parse.$ = jQuery;

  // Initialize Parse with your Parse application javascript keys
  Parse.initialize("dn3b6gsVGybivlO34mlF8ajyWVUQL3KXkla1t1Ya", "eq2T1H7nrdzXkrIqojUHdCaHLyEcDHrM5fJBcSaM");

  // Resource Model
  // ----------

  // Our basic Resource model has "Name","Telephone", "Web Site","Address", "City", "State", "Zip", "eMail Address", "Language" and "Description", `content`, `order`, and `done` attributes.
  var Resource = Parse.Object.extend("Resource", {
    // Default attributes for the Resource.
    defaults: {
	  Name : "cc",
	  PhoneNumber : "111-666-9999",
    },

    // Ensure that each resource created has `content`.
    initialize: function() {
      if (!this.get("Name")) {
        this.set({"Name": this.defaults.Name});
		}
	 if (!this.get("PhoneNumber")) {
        this.set({"PhoneNumber": this.defaults.PhoneNumber});	
      }
	 if (!this.get("Name")) {
        this.set({"Name": this.defaults.Name});
		}
     		
    },

  });

  // This is the transient application state, not persisted on Parse
  var AppState = Parse.Object.extend("AppState", {
    defaults: {
      filter: "all"
    }
  });

  // Resource Collection
  // ---------------

  var ResourceList = Parse.Collection.extend({

    // Reference to this collection's model.
    model: Resource,

    // We keep the Resources in sequential order, despite being saved by unordered
    // GUID in the database. This generates the next order number for new items.
    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },

    // Resources are sorted by their original insertion order.
    comparator: function(resource) {
      return resource.get('order');
    }

  });

  // Resource Item View
  // --------------

  // The DOM element for a resource item...
  var ResourceView = Parse.View.extend({

    //... is a list tag.
    tagName:  "li",

    // Cache the template function for a single item.
    template: _.template($('#item-template').html()),

    // The DOM events specific to an item.
    events: {
      //"click .toggle"              : "toggleDone",
      //"dblclick label.resource-content" : "edit",
      "click .resource-destroy"   : "clear",
	  "click .resource-edit"   : "editResource",
      //"keypress .edit"      : "updateOnEnter",
      "blur .edit"          : "close"
    },

    // The ResourceView listens for changes to its model, re-rendering. Since there's
    // a one-to-one correspondence between a Resource and a ResourceView in this
    // app, we set a direct reference on the model for convenience.
    initialize: function() {
      _.bindAll(this, 'render', 'close', 'remove');
      this.model.bind('change', this.render);
      this.model.bind('destroy', this.remove);
    },

    // Re-render the contents of the Resource item.
    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      this.input = this.$('.edit');
      return this;
    },

    // Toggle the `"done"` state of the model.
    toggleDone: function() {
      this.model.toggle();
    },

    // Switch this view into `"editing"` mode, displaying the input field.
    edit: function() {
      $(this.el).addClass("editing");
      this.input.focus();
    },
	
	editResource: function() {
      var form = new FormEntryView();
	    this.undelegateEvents();
        delete this;
		form.setModel(this.model);
    },

    // Close the `"editing"` mode, saving changes to the resource.
    close: function() {
      this.model.save({content: this.input.val()});
      $(this.el).removeClass("editing");
    },

    // If you hit `enter`, we're through editing the item.
    updateOnEnter: function(e) {
      if (e.keyCode == 13) this.close();
    },

    // Remove the item, destroy the model.
    clear: function() {
      this.model.destroy();
    }

  });

  // The Application
  // ---------------

  // The main view that lets a user manage their resource items
  var ManageResourcesView = Parse.View.extend({

    // Our template for the line of statistics at the bottom of the app.
    statsTemplate: _.template($('#stats-template').html()),

    // Delegated events for creating new items, and clearing completed ones.
    events: {
     // "keypress #new-resource":  "createOnEnter",
     // "click #clear-completed": "clearCompleted",
     // "click #toggle-all": "toggleAllComplete",
      "click .log-out": "logOut",
     // "click ul#filters a": "selectFilter",
	  "click #newResource": "showNewResource"
    },

    el: ".content",

    // At initialization we bind to the relevant events on the `Todos`
    // collection, when items are added or changed. Kick things off by
    // loading any preexisting resources that might be saved to Parse.
    initialize: function() {
      var self = this;

      _.bindAll(this, 'addOne', 'addAll', 'addSome', 'render', 'toggleAllComplete', 'logOut', 'createOnEnter', 'showNewResource');

      // Main resource management template
      this.$el.html(_.template($("#manage-resources-template").html()));
      
   //   this.input = this.$("#new-resource");
   //   this.allCheckbox = this.$("#toggle-all")[0];

      // Create our collection of Todos
      this.resources = new ResourceList;

      // Setup the query for the collection to look for resources from the current user
      this.resources.query = new Parse.Query(Resource);
      //this.resources.query.equalTo("user", Parse.User.current());
        
//      this.resources.bind('add',     this.addOne);
//      this.resources.bind('reset',   this.addAll);
//      this.resources.bind('all',     this.render);

      // Fetch all the resource items for this user
      this.resources.fetch({
        success: function(myObject) {
			this.$("#resource-list").html("");
			for(var i=0; i<myObject.length;i++) {
			
				var view = new ResourceView({model: myObject.models[i]});
                this.$("#resource-list").append(view.render().el);
			}
       },
       error: function(myObject, error) {
          alert(error);
       }
     });
    //  this.resources.each(this.addOne);

      state.on("change", this.addAll, this);
    },

    // Logs out the user and shows the login view
    logOut: function(e) {
      Parse.User.logOut();
      new LogInView();
      this.undelegateEvents();
      delete this;
    },

    // Re-rendering the App just means refreshing the statistics -- the rest
    // of the app doesn't change.
    render: function() {
      //var done = this.resources.done().length;
      //var remaining = this.resources.remaining().length;

      this.$('#resource-stats').html(this.statsTemplate({
        total:      this.resources.length,
        //done:       done,
        //remaining:  remaining
      }));

      this.delegateEvents();

      this.allCheckbox.checked = !remaining;
    },

    // Filters the list based on which type of filter is selected
    selectFilter: function(e) {
      var el = $(e.target);
      var filterValue = el.attr("id");
      state.set({filter: filterValue});
      Parse.history.navigate(filterValue);
    },

    filter: function() {
      var filterValue = state.get("filter");
      this.$("ul#filters a").removeClass("selected");
      this.$("ul#filters a#" + filterValue).addClass("selected");
      if (filterValue === "all") {
        this.addAll();
      } else if (filterValue === "completed") {
        this.addSome(function(item) { return item.get('done') });
      } else {
        this.addSome(function(item) { return !item.get('done') });
      }
    },

    // Resets the filters to display all resources
    resetFilters: function() {
      this.$("ul#filters a").removeClass("selected");
      this.$("ul#filters a#all").addClass("selected");
      this.addAll();
    },

    // Add a single resource item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function(resource) {
      var view = new ResourceView({model: resource});
      this.$("#resource-list").append(view.render().el);
    },

    // Add all items in the Todos collection at once.
    addAll: function(collection, filter) {
      this.$("#resource-list").html("");
      this.resources.each(this.addOne);
    },

    // Only adds some resources, based on a filtering function that is passed in
    addSome: function(filter) {
      var self = this;
      this.$("#resource-list").html("");
      this.resources.each(function(item) { self.addOne(item) });
    },

    // If you hit return in the main input field, create new Todo model
    createOnEnter: function(e) {
      var self = this;
      if (e.keyCode != 13) return;

      this.resources.create({
        Name: this.input.val(),
        order:   this.resources.nextOrder(),
        user:    Parse.User.current(),
        ACL:     new Parse.ACL(Parse.User.current())
      });

      this.input.val('');
      this.resetFilters();
    },

    // Clear all done resource items, destroying their models.
    clearCompleted: function() {
      _.each(this.resources.done(), function(resource){ resource.destroy(); });
      return false;
    },

    toggleAllComplete: function () {
      var done = this.allCheckbox.checked;
      //this.resources.each(function (resource) { resource.save({'done': done}); });
    },
	
	showNewResource: function () {
	    
	    new FormEntryView();
	    this.undelegateEvents();
        delete this;
	}
  });
  
  var LogInView = Parse.View.extend({
    events: {
      "submit form.login-form": "logIn",
      "submit form.signup-form": "signUp"
    },

    el: ".content",
    
    initialize: function() {
      _.bindAll(this, "logIn", "signUp");
      this.render();
    },

    logIn: function(e) {
      var self = this;
      var username = this.$("#login-username").val();
      var password = this.$("#login-password").val();
      
      Parse.User.logIn(username, password, {
        success: function(user) {
          new ManageResourcesView();
          self.undelegateEvents();
          delete self;
        },

        error: function(user, error) {
          self.$(".login-form .error").html("Invalid username or password. Please try again.").show();
          this.$(".login-form button").removeAttr("disabled");
        }
      });

      this.$(".login-form button").attr("disabled", "disabled");

      return false;
    },

    signUp: function(e) {
      var self = this;
      var username = this.$("#signup-username").val();
      var password = this.$("#signup-password").val();
      
      Parse.User.signUp(username, password, { ACL: new Parse.ACL() }, {
        success: function(user) {
          new ManageResourcesView();
          self.undelegateEvents();
          delete self;
        },

        error: function(user, error) {
          self.$(".signup-form .error").html(error.message).show();
          this.$(".signup-form button").removeAttr("disabled");
        }
      });

      this.$(".signup-form button").attr("disabled", "disabled");

      return false;
    },

    render: function() {
      this.$el.html(_.template($("#login-template").html()));
      this.delegateEvents();
    }
  });
  
  var FormEntryView = Parse.View.extend({
    events: {
      "submit form.entry-form": "savePressed"
    },
	
	el: ".content",
	
    initialize: function() {
      _.bindAll(this, "savePressed");
	  this.resources = new ResourceList;
      this.render();
	  this.model = null;
    },
	
	savePressed: function(e) {
	
	  var self = this;

	  if(this.model) {
		this.model.set("Name", this.$("#name").val());
		this.model.set("PhoneNumber", this.$("#telephone-number").val());
		this.model.save();
      } else {
	  this.resources.create({
        Name: this.$("#name").val(),
		PhoneNumber: this.$("#telephone-number").val(),
        ACL:     new Parse.ACL(Parse.User.current())
      });
	  }
	  
	  
	   new ManageResourcesView();
       self.undelegateEvents();
       delete self;
	},
	
	setModel: function(model) {
		this.model = model;
		this.$("#name").val(model.get("Name"));
		this.$("#telephone-number").val(model.get("PhoneNumber"));
	},
	
	 render: function() {
      this.$el.html(_.template($("#form-entry-template").html()));
      this.delegateEvents();
    }
   }); 

  // The main view for the app
  var AppView = Parse.View.extend({
    // Instead of generating a new element, bind to the existing skeleton of
    // the App already present in the HTML.
    el: $("#resourceapp"),

    initialize: function() {
      this.render();
    },

    render: function() {
      if (Parse.User.current()) {
        new ManageResourcesView();
      } else {
        new LogInView();
      }
    }
  });

  var AppRouter = Parse.Router.extend({
    routes: {
      "all": "all",
      "active": "active",
      "completed": "completed"
    },

    initialize: function(options) {
    },

    all: function() {
      state.set({ filter: "all" });
    },

    active: function() {
      state.set({ filter: "active" });
    },

    completed: function() {
      state.set({ filter: "completed" });
    }
  });

  var state = new AppState;

  new AppRouter;
  new AppView;
  Parse.history.start();
});

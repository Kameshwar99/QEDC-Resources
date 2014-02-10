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
	  Name: "cc",
	  PhoneNumber: "111-666-9999",
	  Language: "English"
    },

    // Ensure that each resource created has `content`.
    initialize: function() {
      if (!this.get("Name")) {
        this.set({"Name": this.defaults.Name});
		}
	 if (!this.get("PhoneNumber")) {
        this.set({"PhoneNumber": this.defaults.PhoneNumber});	
      }
	 if (!this.get("Language")) {
        this.set({"Language": this.defaults.Language});
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
     "click .log-out": "logOut",
     "click #newResource": "showNewResource"
    },

    el: ".content",

    // At initialization we bind to the relevant events on the `Todos`
    // collection, when items are added or changed. Kick things off by
    // loading any preexisting resources that might be saved to Parse.
    initialize: function() {
      var self = this;

      _.bindAll(this, 'render', 'logOut',  'showNewResource');

      // Main resource management template
      this.$el.html(_.template($("#manage-resources-template").html()));
      
      // Create our collection of Resources
      this.resources = new ResourceList;

      // Setup the query for the collection to look for resources from the current user
      this.resources.query = new Parse.Query(Resource);   

      // Fetch all the resource items for this user
      this.resources.fetch({
        success: function(myObject) {
			this.$("#resource-list").html("");
			for(var i=0; i<myObject.length;i++) {
				var view = new ResourceView({model: myObject.models[i]});
                this.$("#resource-list").append(view.render().el);
			}
       },
       error: function(error) {
          //alert('Error' + error.code);
       }
     });
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
	  
	  if (!this.model){ 
	  this.model = new Resource();
	  }

	  this.model.set("Name", this.$("#name").val());
	  this.model.set("PhoneNumber", this.$("#telephone-number").val());
	  this.model.set("Language",this.getCheckboxString());
	  this.model.set("Website", this.$("#website").val());
	  this.model.set("Twitter", this.$("#twitter").val());
	  this.model.set("Facebook", this.$("#facebook").val());
	  this.model.set("Address", this.$("#address").val());
	  this.model.set("City", this.$("#city").val());
	  this.model.set("State", this.$("#state").val());
	  this.model.set("Zip", this.$("#zip").val());
	  this.model.set("Description", this.$("#description").val());
	  this.model.set("Specialty", this.$("#specialty").val());
	  this.model.save();
	  
	   
       self.undelegateEvents();
       delete self;
	   new ManageResourcesView();
	},
	
	
	getCheckboxString: function(){
	 var checkboxString="";
	 if(this.$("#english-checkbox").is(':checked')){
		checkboxString = "English, ";
	 }
	 if(this.$("#spanish-checkbox").is(':checked')){
		checkboxString = checkboxString + "Spanish, ";
	 }
	 if(this.$("#cantonese-checkbox").is(':checked')){
		checkboxString = checkboxString + "Cantonese, ";
	 }
	 if(this.$("#mandarin-checkbox").is(':checked')){
		checkboxString = checkboxString + "Mandarin";	
	 }
	 return checkboxString;
	 
	 },
	 
	 setCheckboxes: function(checkboxString) {
	  if (checkboxString.indexOf("English") != -1){
	    this.$("#english-checkbox").attr('checked','checked');
	  }
	  if (checkboxString.indexOf("Spanish") != -1){
	    this.$("#spanish-checkbox").attr('checked','checked');
	  }
	  if (checkboxString.indexOf("Mandarin") != -1){
	    this.$("#mandarin-checkbox").attr('checked','checked');
	  }
	  if (checkboxString.indexOf("Cantonese") != -1){
	    this.$("#cantonese-checkbox").attr('checked','checked');
	  }  
	 },
	
	setModel: function(model) {
		this.model = model;
		this.$("#name").val(model.get("Name"));
		this.$("#telephone-number").val(model.get("PhoneNumber"));
		this.setCheckboxes(model.get("Language"));
		this.$("#website").val(model.get("Website"));
		this.$("#twitter").val(model.get("Twitter"));
		this.$("#facebook").val(model.get("Facebook"));
		this.$("#address").val(model.get("Address"));
		this.$("#city").val(model.get("City"));
		this.$("#state").val(model.get("State"));
		this.$("#zip").val(model.get("Zip"));
		this.$("#description").val(model.get("Description"));
		this.$("#specialty").val(model.get("Specialty"));	
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

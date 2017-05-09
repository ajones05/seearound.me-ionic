angular.module('SeeAroundMe', [
    'ionic', 
    'SeeAroundMe.controllers', 
    'SeeAroundMe.services', 
    'SeeAroundMe.directives', 
    'SeeAroundMe.filters', 
    'ngCordova',
    'google.places', 
    'ngSanitize'
])

.run(function($ionicPlatform, $timeout, $state, $rootScope, AppService, $ionicPopup, $ionicHistory, $cordovaStatusbar) {
  $ionicPlatform.ready(function() {
    //First check for internet connection
    if(!AppService.isConnected()){
         AppService.showErrorAlert('No Internet Connection', 'There seems to be a network problem. Please check your internet connection.');
         $state.go('home');
         return;
     }

    if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);
    }
      
    if (window.cordova && window.cordova.plugins.StatusBar) {
        
        $cordovaStatusbar.overlaysWebView(true);
        $cordovaStatusbar.style(0);//Default
    }

    $rootScope.goBack = function(){
      if (!$ionicHistory.goBack())
        window.history.go(-1)
    }

    $rootScope.goToProfile = function(id){
      //console.log('goto profile called with id= ', id);
      AppService.setIsCurrentUserFlag(false);
      AppService.setUserForProfilePage(id)
      .then(function(){
        $state.go('app.userprofile');
      });
    };

    $rootScope.goHome = function(){
      $state.go('app.postmapview')
    }

    $rootScope.currentPosts = null;
    $rootScope.showInputBar = false;
    $rootScope.toggleSearchBar = function(){
      $rootScope.showInputBar = !$rootScope.showInputBar;
    }
    
    var hasData = localStorage.hasOwnProperty('sam_user_data');
    var data = localStorage.getItem('sam_user_data');
    var isAuthenticated = hasData && data && data !== 'undefined' ? true : false;

    if(isAuthenticated){ 
        var userData = JSON.parse(data);
        AppService.setAuthToken(userData.token);
        $state.go('app.postlistview');
        //Login event causes map initialization
       //$timeout(function(){
              //$rootScope.$broadcast('login',{});
        //}, 1000);
    }
    else{
      $state.go('intro');
    }

  });
})

.constant('$ionicLoadingConfig', { template: 'Loading...'})
.constant('API_URL','https://www.seearound.me/mobile')

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider, $httpProvider) {
    // Use x-www-form-urlencoded Content-Type
    $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
    $httpProvider.defaults.transformRequest.unshift(function (data, headersGetter) {
        var key, result = [];

        if (typeof data === "string")
          return data;

        for (key in data) {
          if (data.hasOwnProperty(key))
            result.push(encodeURIComponent(key) + "=" + encodeURIComponent(data[key]));
        }
        return result.join("&");
    });
    
    //Disable swipe back on views
    $ionicConfigProvider.views.swipeBackEnabled(false);    

    $ionicConfigProvider.backButton.previousTitleText(false).text('');
    
    $stateProvider

    .state('app', {
      url: "/app",
      abstract: true,
      templateUrl: "templates/menu.html",
      controller: 'AppCtrl'
    })
    
    .state('intro', {
        url: "/intro",
        templateUrl: "templates/intro/intro.html",
        controller: 'IntroCtrl'
      })
    
    .state('outareaform', {
        url: "/outareaform",
        templateUrl: "templates/intro/outareaform.html",
        controller: 'IntroCtrl'
      })        
    
    .state('home', {
      url: "/home",
      templateUrl: "templates/home.html",
      controller: 'HomeCtrl'
    })
    
    .state('signup', {
        url: "/signup",
        templateUrl: "templates/signup.html",
        controller: 'SignupCtrl'
      })

    .state('signin', {
          url: "/signin",
          templateUrl: "templates/signin.html",
          controller: 'SigninCtrl'
        })
    
    /*
    .state('allowlocation', {
          url: "/allowlocation",
          templateUrl: "templates/allowlocation.html",
          controller: 'LocationCtrl'
        })*/

    .state('app.postlistview', {
        url: "/post/list",
        views: {
          'menuContent': {
            templateUrl: "templates/post/listview.html",
            controller: 'PostListCtrl'
          }
        }
    })

    .state('app.postcomments', {
      url: "/post/comments",
      views: {
        'menuContent': {
          templateUrl: "templates/post/comments.html",
          controller: 'CommentsCtrl'
        }
      }

    })

    .state('app.postmapview', {
        url: "/post/map",
        views: {
          'menuContent': {
            templateUrl: "templates/post/mapview.html",
            controller: 'MapCtrl'
          }
        }
    })
    
    .state('newpostview', {
           url: "/post/newpost/:latitude/:longitude/:address/:from/:street_number/:street_name/:city/:state/:country/:zip",
           templateUrl: "templates/post/add-post.html",
           controller: 'NewPostCtrl'
    })
    
    .state('editpostview', {
           url: "/post/newpost/:latitude/:longitude/:address/:from/:street_number/:street_name/:city/:state/:country/:zip/:Address/:image/:id/:news/:category_id",
           templateUrl: "templates/post/edit-post.html",
           controller: 'EditPostCtrl'
    })    
    
    .state('chooselocation', {
           url: "/post/chooselocation",
           templateUrl: "templates/post/chooselocation.html",
           controller: 'ChooseLocCtrl'
    })        
        
    .state('app.userprofile', {
        url: "/user/profile",
        views: {
          'menuContent': {
            templateUrl: "templates/user/profile.html",
            controller: 'ProfileCtrl'
          }
        }
    })
    
    .state('app.editprofile', {
      url: "/user/edit",
      views:{
        'menuContent':{
          templateUrl: "templates/user/edit_profile.html",
          controller: 'EditProfileCtrl'
        }
      }
    })

    .state('app.userfollowing', {
        url: "/user/following",
        views: {
          'menuContent': {
            templateUrl: "templates/user/following.html",
            controller: 'FollowingCtrl'
          }
        }
    })

    .state('app.usermessages', {
        url: "/user/messages",
        views: {
          'menuContent': {
            templateUrl: "templates/user/messages.html",
            controller: "MessagesCtrl"
          }
        }
    })

    .state('app.userchat', {
      url: "/user/chat/:from",
      views: {
        'menuContent':{
          templateUrl: "templates/user/chat.html",
          controller: "ChatCtrl"
        }
      }
    })

    .state('app.mapforpost', {
      url: "/post/list/map",
      views: {
        'menuContent' : {
          templateUrl: "templates/post/mapforpost.html",
        }
      }
    })
    
    .state('terms', {
      //url: "/terms",
      templateUrl: "templates/terms.html"
    })
    
    .state('privacy', {
      //url: "/privacy",
      templateUrl: "templates/privacy.html"
    })   
    
    .state('app.terms', {
      url: "/terms",
      views:{
        'menuContent':{
          templateUrl: "templates/terms.html"
        }
      }
    })
    
    .state('app.privacy', {
      url: "/privacy",
      views:{
        'menuContent':{
          templateUrl: "templates/privacy.html"
        }
      }
    })   
    
    .state('app.about', {
      url: "/about",
      views:{
        'menuContent':{
          templateUrl: "templates/about.html"
        }
      }
    });
    
    // $urlRouterProvider.otherwise('/app/home');
});

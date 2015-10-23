angular.module('SeeAroundMe', ['ionic', 'SeeAroundMe.controllers', 'SeeAroundMe.services', 'ngCordova'])

.run(function($ionicPlatform, $state, $rootScope, $ionicPopup) {
  $ionicPlatform.ready(function() {
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
    $rootScope.showInputBar = false;
    $rootScope.toggleSearchBar = function(){
        $rootScope.showInputBar = !$rootScope.showInputBar;
    }

  });
})

.constant('$ionicLoadingConfig', { template: 'Loading...'})
.constant('API_URL','http://www.seearound.me/mobile')

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

    $ionicConfigProvider.backButton.previousTitleText(false).text('');
    openFB.init({appId: '755231644585441'});
    $stateProvider

    .state('app', {
      url: "/app",
      abstract: true,
      templateUrl: "templates/menu.html",
      controller: 'AppCtrl'
    })

    .state('app.home', {
      url: "/home",
      views: {
        'menuContent' :{
          templateUrl: "templates/home.html",
          controller: 'HomeCtrl'
        }
      }
    })

    .state('app.signup', {
        url: "/signup",
        views: {
          'menuContent' :{
            templateUrl: "templates/signup.html",
            controller: 'SignupCtrl'
          }
        }
      })

    .state('app.signin', {
          url: "/signin",
          views: {
            'menuContent' :{
              templateUrl: "templates/signin.html",
              controller: 'SigninCtrl'
            }
          }
        })
    
    .state('app.allowlocation', {
          url: "/allowlocation",
          views: {
            'menuContent' :{
              templateUrl: "templates/allowlocation.html",
              controller: 'LocationCtrl'
            }
          }
        })


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
    
    .state('app.editprofile', {
      url: "/edit",
      views:{
        'menuContent':{
          templateUrl: "templates/user/edit_profile.html",
          controller: 'EditProfileCtrl'
        }
      }
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

    .state('app.userfollowing', {
        url: "/user/following",
        views: {
          'menuContent': {
            templateUrl: "templates/user/following.html"
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
      url: "/user/chat",
      views: {
        'menuContent':{
          templateUrl: "templates/user/chat.html",
          controller: "ChatCtrl"
        }
      }
    })
    
    .state('app.terms', {
      url: "/terms",
      views:{
        'menuContent':{
          templateUrl: "templates/terms.html"
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
    
  $urlRouterProvider.otherwise('/app/home');
});

// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('SeeAroundMe', ['ionic', 'SeeAroundMe.controllers'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

  .state('app', {
    url: "/app",
    abstract: true,
    templateUrl: "templates/menu.html",
    controller: 'AppCtrl'
  })

  .state('app.postlistview', {
    url: "/post/list",
    views: {
      'menuContent': {
        templateUrl: "templates/post/listview.html"
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

  .state('app.userprofile', {
    url: "/user/profile",
    views: {
      'menuContent': {
        templateUrl: "templates/user/profile.html"
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
        templateUrl: "templates/user/messages.html"
      }
    }
  })



  // .state('app.browse', {
  //   url: "/browse",
  //   views: {
  //     'menuContent': {
  //       templateUrl: "templates/browse.html"
  //     }
  //   }
  // })
  //   .state('app.playlists', {
  //     url: "/playlists",
  //     views: {
  //       'menuContent': {
  //         templateUrl: "templates/playlists.html",
  //         controller: 'PlaylistsCtrl'
  //       }
  //     }
  //   })
  //
  // .state('app.single', {
  //   url: "/playlists/:playlistId",
  //   views: {
  //     'menuContent': {
  //       templateUrl: "templates/playlist.html",
  //       controller: 'PlaylistCtrl'
  //     }
  //   }
  // });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/post/map');
});

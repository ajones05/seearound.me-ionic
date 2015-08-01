angular.module('SeeAroundMe.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $timeout) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  // Form data for the login modal
  $scope.loginData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    console.log('Doing login', $scope.loginData);

    // Simulate a login delay. Remove this and replace with your login
    // code if using a login system
    $timeout(function() {
      $scope.closeLogin();
    }, 1000);
  };
})

.controller('PlaylistsCtrl', function($scope) {
  $scope.playlists = [
    { title: 'Reggae', id: 1 },
    { title: 'Chill', id: 2 },
    { title: 'Dubstep', id: 3 },
    { title: 'Indie', id: 4 },
    { title: 'Rap', id: 5 },
    { title: 'Cowbell', id: 6 }
  ];
})

.controller('HomeCtrl', function($scope) {
})

.controller('SignupCtrl', function($scope) {
})

.controller('SigninCtrl', function($scope, $state, $ionicLoading, AppService) {

    $scope.formData = {};
    $scope.formData.email = "brandonhere123@gmail.com";
    $scope.formData.password = "dev12345678";

    $scope.doLogin = function () {

        var data = {email:$scope.formData.email, password:$scope.formData.password};

        $ionicLoading.show();
        AppService.login(data)
        .success(function (data) {
            localStorage.setItem('sam_user_id',data.result.id);
            $ionicLoading.hide();
            console.log(JSON.stringify(data));
            $state.go('app.postmapview')
        })
        .error(function (err) {
            $ionicLoading.hide();
            console.warn(JSON.stringify(err));
        });
    };


})

.controller('MapCtrl', function($scope, $stateParams, AppService) {
    $scope.nearbyPosts = {};
    $scope.initialise = function() {
        console.log("In Google.maps.event.addDomListener");
        var bounds = new google.maps.LatLngBounds();

        var mapOptions = {
            // center: myLatlng,
            // zoom: 20,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: true,
            zoomControl: true,
            zoomControlOptions: {
              style: google.maps.ZoomControlStyle.SMALL
            }
        };

        var userId = localStorage.getItem('sam_user_id');


        // console.log(mapOptions);
        var map = new google.maps.Map(document.getElementById("map"), mapOptions);

        var data = {
            "latitude" : 37.8088139,
            "longitude" : -122.2635002,
            "radious" : 0.8,
            "userId" : userId,
            "fromPage" : 0,
            "endPage" : 16
        };
        AppService.getNearbyPosts(data)
        .success(function (data) {
            console.log(JSON.stringify(data, null, 4));
            $scope.nearbyPosts = data.result;
            $scope.nearbyPosts.forEach(function (post) {
                var marker = new google.maps.Marker({
                    position: new google.maps.LatLng(post.latitude, post.longitude),
                    map: map,
                    // title: post.title,
                    icon: './img/pin.png'
                });

                google.maps.event.addListener(marker, 'click', function() {
                    // infowindow.open(map,marker);
                    // $state.go('app.offerdetails', {id: offer.id, type: 'discover'});
                });
            })

        })
        .error(function (err) {
            console.warn(JSON.stringify(err));
        });


        // Show current user position
        navigator.geolocation.getCurrentPosition(function(pos) {
            console.log(pos);
            var position = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);

            // if (DEV_MODE == 'true') {
                position = new google.maps.LatLng(37.8088139, -122.26350020000001);
                console.warn('WARN: Using DEV_MODE position: ' + position);
            // }
            map.setCenter(position);
            var myLocation = new google.maps.Marker({
                position: position,
                map: map,
                // animation: google.maps.Animation.BOUNCE,
                title: "My Location"
            });

            bounds.extend(position);
        });

        // Automatically center the map fitting all markers on the screen
        map.fitBounds(bounds);

        // Override our map zoom level once our fitBounds function runs (Make sure it only runs once)
        var boundsListener = google.maps.event.addListener((map), 'bounds_changed', function(event) {
            this.setZoom(14);
            google.maps.event.removeListener(boundsListener);
        });

        // }); // End of DiscoverService.getAll() promis

        $scope.map = map;
    };

    google.maps.event.addDomListener(document.getElementById("map"), 'load', $scope.initialise());
});

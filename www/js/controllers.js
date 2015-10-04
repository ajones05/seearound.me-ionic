angular.module('SeeAroundMe.controllers', [])

.controller('AppCtrl', function($scope, $rootScope, $state) {
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  $scope.openPostList = function () {
      $rootScope.$broadcast('mapview:openlist');
      $state.go('app.postmapview');
  };

})

.controller('HomeCtrl', function($scope, AppService) {
    ionic.Platform.ready(function() {
        console.warn('*** Device is ready to call geolocation****');
        AppService.getCurrentPosition();
    });
})

.controller('SignupCtrl', function($scope, $state, AppService) {
    console.log('Signup controller called ...');
    $scope.doSignUp = function(user){
        console.log('Signup ...');
        $state.go('app.allowlocation');
    }
})

.controller('SigninCtrl', function($scope, $state, $ionicLoading, $rootScope, AppService, $ionicModal) {

  $scope.formData = {};
  $scope.formData.email = "brandonhere123@gmail.com";
  $scope.formData.password = "dev12345678";

  $scope.doLogin = function () {

    var data = {email:$scope.formData.email, password:$scope.formData.password};

    $ionicLoading.show();
    AppService.login(data)
    .success(function (data) {
       localStorage.setItem('sam_user_data', JSON.stringify(data));
       $ionicLoading.hide();
       // console.log(JSON.stringify(data, null, 4));
       $state.go('app.postmapview');
    })
    .error(function (err) {
      $ionicLoading.hide();
      console.warn(JSON.stringify(err));
    });

  };
})

.controller('LocationCtrl', function($scope, $state, $ionicPopup) {
    $scope.showLocationPopup = function(){
        console.log('showLocationPopup ...');
        
        $ionicPopup.confirm({
            title: '"SeeAround.me" Would Like to Use Your Current Location',
            cancelText: "Don't Allow",
            cancelType: 'button-default',
            okType: 'button-default'
        }).then(function(res) {
         if(res) {
             console.log('Location allowed. Go to map screen ...');
             $state.go('app.postmapview');
         } else {
            console.log('Popup canceled ...');
         }
       });
    }
})

.controller('MapCtrl', function($scope, $state, $stateParams, $ionicModal, $ionicLoading,
    $cordovaImagePicker, $ionicPopup, AppService) {
    $scope.inputRadius = 8;
    $scope.formData = {};
    $scope.fileName = {};

    var location;
    var userId;
    var userData;
    var bounds = new google.maps.LatLngBounds();

    $ionicModal.fromTemplateUrl('templates/post/listview.html', {
        id: '1',
        scope: $scope
    }).then(function(modal) {
        $scope.modal1 = modal;
    });

    $ionicModal.fromTemplateUrl('templates/post/add.html', {
        id: '2',
        scope: $scope
    }).then(function(modal) {
        $scope.modal2 = modal;
    });

    $scope.nearbyPosts = {};

    var outerbounds = [ // covers the (mercator projection) world
        new google.maps.LatLng(85,180),
        new google.maps.LatLng(85,90),
        new google.maps.LatLng(85,0),
        new google.maps.LatLng(85,-90),
        new google.maps.LatLng(85,-180),
        new google.maps.LatLng(0,-180),
        new google.maps.LatLng(-85,-180),
        new google.maps.LatLng(-85,-90),
        new google.maps.LatLng(-85,0),
        new google.maps.LatLng(-85,90),
        new google.maps.LatLng(-85,180),
        new google.maps.LatLng(0,180),
        new google.maps.LatLng(85,180)
    ];


    function drawCircle (point, radius, dir) {
        var d2r = Math.PI / 180;   // degrees to radians
        var r2d = 180 / Math.PI;   // radians to degrees
        var earthsradius = 3963; // 3963 is the radius of the earth in miles
        var points = 32;

        // find the raidus in lat/lon
        var rlat = (radius / earthsradius) * r2d;
        var rlng = rlat / Math.cos(point.lat() * d2r);

        var extp = new Array();
        if (dir==1) {var start=0;var end=points+1} // one extra here makes sure we connect the ends
        else {var start=points+1;var end=0}

        for (var i=start; (dir==1 ? i < end : i > end); i=i+dir) {
            var theta = Math.PI * (i / (points/2));
            ey = point.lng() + (rlng * Math.cos(theta)); // center a + radius x * cos(theta)
            ex = point.lat() + (rlat * Math.sin(theta)); // center b + radius y * sin(theta)
            extp.push(new google.maps.LatLng(ex, ey));
            bounds.extend(extp[extp.length-1]);
        }
        return extp;
    };

    $scope.initialise = function() {
        console.log("In Google.maps.event.addDomListener");

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

        userData = JSON.parse(localStorage.getItem('sam_user_data') || '{}');
        console.warn(JSON.stringify(userData, null, 4));

        userId = userData.result.id;
        $scope.formData.Profile_image = userData.result.Profile_image;
        location = localStorage.getItem('sam_user_location');
        if (!location) {
                location = JSON.parse(location);
                location = {latitude: 37.8088139, longitude: -122.2635002};
                console.warn('WARN: Using DEV_MODE position: ' + location);        
        }

        // console.log(mapOptions);
        var map = new google.maps.Map(document.getElementById("map"), mapOptions);

        var data = {
            "latitude" : location.latitude,// 37.8088139,
            "longitude" : location.longitude,//-122.2635002,
            "radious" : $scope.inputRadius/10,
            "userId" : userId,
            "fromPage" : 0,
            "endPage" : 16
        };

        console.log(JSON.stringify(data));
        AppService.getNearbyPosts(data)
        .success(function (data) {
            // console.log(JSON.stringify(data, null, 4));
            $scope.nearbyPosts = data.result;
            if($scope.nearbyPosts){
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
                });
            }

        })
        .error(function (err) {
            console.warn(JSON.stringify(err));
        });


        // Show current user position
        navigator.geolocation.getCurrentPosition(function(pos) {
            console.log(pos);
            position = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);

            // if (DEV_MODE == 'true') {
                var position = new google.maps.LatLng(37.8088139, -122.26350020000001);
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

        // options for the polygon
        var center = new google.maps.LatLng(location.latitude, location.longitude);
        var populationOptions = {
          strokeColor: '#000000',
          strokeOpacity: 0.1,
          strokeWeight: 1,
          fillColor: '#000000',
          fillOpacity: 0.35,
          map: map,
          paths: [outerbounds,drawCircle(center,0.8,-1)]
        };

    // Add the circle for this city to the map.
    var cityCircle = new google.maps.Polygon(populationOptions);
    // map.fitBounds(bounds);

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

    $scope.showModal = function (id) {
        // $state.go('app.postlistview');
        if(id == 1)
            $scope.modal1.show();
        else if (id == 2)
            $scope.modal2.show();
    };

    $scope.close = function(id) {
        if(id == 1)
            $scope.modal1.hide();
        else if (id == 2)
            $scope.modal2.hide();
    };

    $scope.$on("mapview:openlist", function(event,data) {
        $scope.showModal(1);
    });

    $scope.$on('$destroy', function() {
      console.log('Destroying modals...');
      $scope.modal1.remove();
      $scope.modal2.remove();
    });

    $scope.pickImages = function () {
        var options = {
           maximumImagesCount: 1,
           width: 800,
           height: 800,
           quality: 80
        };

        $cordovaImagePicker.getPictures(options)
            .then(function (results) {
            //   for (var i = 0; i < results.length; i++) {
            //     console.log('Image URI: ' + results[i]);
            //   }
            console.log('Image URI: ' + results[0]);
            $scope.fileName = results[0];
        }, function(error) {
            // error getting photos
            console.log('Error: ' + error);
        });
    }

    $scope.post = function () {
        $ionicLoading.show();

        var data = {
            "news" : $scope.formData.postText,
            "user_id" : userId,
            "latitude" : location.latitude,
            "longitude" : location.longitude,
            "address" : null
        };

        AppService.addNewPost(data)
        .then(function (res) {
            $scope.initialise();
            $ionicLoading.hide();
            $ionicPopup.alert({title: 'New Post', template: 'Status updated'})
            .then(function () {
                $scope.close(2);
            });
        })
        .catch(function (err) {
            console.warn(err);
            $ionicLoading.hide();

        })
        // console.log($scope.formData.postText);
    }
});

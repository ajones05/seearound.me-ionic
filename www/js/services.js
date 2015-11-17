angular.module('SeeAroundMe.services', [])

.factory('AppService', function($http, $q, $cordovaCapture, $cordovaImagePicker, $ionicPopup, API_URL) {

  var userData = JSON.parse(localStorage.getItem('sam_user_data') || '{}');
  var userId = userData.id || 0;

  var currentPostComments = {};
    var service = {
        
        pickImage: function(scope){
            
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
                //console.log('Image URI: ' + results[0]);
                scope.imgUri = results[0];
            }, function(error) {
              // An error occurred. Show a message to the user
                // error
                console.error('Failed to get image. Error: ' + JSON.stringify(error));
            });
        },

        vote: function(newsId, v){
          var url = API_URL + '/post-like';
          var postData = {
            user_id: userId,
            news_id: newsId,
            vote: v
          }
          return $http.post(url, postData)
        },
        
        getImage: function(scope){
            
            var options = { limit: 3 };

            $cordovaCapture.captureImage(options).then(function(imageData) {
                console.log(imageData[0]);
                
                //Set the image
                scope.imgUri = imageData[0].fullPath;                
                
                //Show compose screen (modal)
                scope.showModal(2);
                
            }, function(err) {
              // An error occurred. Show a message to the user
                // error
                console.error('Failed to get image. Error: ' + JSON.stringify(err));
            });
        },
        
        getMessages: function(){
          var  url = API_URL + '/listmessage';
          var params = {
            user_id : userId, 
          }
          return $http.post(url, params);
        },
        
        signUp: function (data) {
            var url = API_URL + '/registration';
            return $http({
                method: 'POST',
                url: url,
                data: data,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            });
        },
        
        login: function (data) {
            var url = API_URL + '/index';
            return $http({
                method: 'POST',
                url: url,
                data: data,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            });
        },
        
        fbLogin: function (data) {
            var url = API_URL + '/fb-login';
            return $http({
                method: 'POST',
                url: url,
                data: data,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            });
        },        

        getNearbyPosts: function (data) {
            var url = API_URL + '/request-nearest';
            return $http({
                method: 'POST',
                url: url,
                data: data,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            });
        },
        
        setCurrentComments: function(post){
          var d = $q.defer();
          currentPostComments.post = post;
          d.resolve();
          return d.promise;
        },

        postComment: function(commentText, userId, newsId){
          var url = API_URL + '/post-comment';
          var params = {
            user_id: userId,
            news_id: newsId,
            comment: commentText
          };
          return $http.post(url, params);
        },

        getCurrentComments: function(){
          var d = $q.defer();
          var url = API_URL + '/get-total-comments';
          var params = {
            news_id: currentPostComments.post.id,
            offset: 0
          }
          $http.post(url, params)
           .success(function(data){
             currentPostComments.comments = data.result;
             d.resolve(currentPostComments);
           })
           .error(function(error){
             console.log('comments fetching failed with error: ', error);
             d.reject(error);
           })
           return d.promise;
        },

        addNewPost: function (data) {
            var url = API_URL + '/addimobinews';
            return $http({
                method: 'POST',
                url: url,
                data: data,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            });
        },
        
        showErrorAlert: function(subTitle, message){
            $ionicPopup.alert({
                 title: 'See Around Me Alert',
                 subTitle: subTitle,
                 template: message
           });
        },
        
        isConnected: function(){
            if(window.Connection) {
                if(navigator.connection.type == Connection.NONE) {
                    return false;
                }
                else{
                    return true;
                }
            }
        }
    };

    return service;
})

.factory('MapService', function($rootScope, $cordovaGeolocation, AppService, ModalService) {
    var service = {
        getCurrentPosition: function (){
            //var deferred = $q.defer();
            console.log('Geolocation Service called...');
            var posOptions = {timeout: 10000, maximumAge:120000, enableHighAccuracy: false};

            $cordovaGeolocation.getCurrentPosition(posOptions)
                .then(function (position) {
                    var lat  = position.coords.latitude;
                    var long = position.coords.longitude;
                    var location = {latitude: lat, longitude: long};
                    var mylocation = JSON.stringify(location);

                    localStorage.setItem('sam_user_location', mylocation);

                    console.log(mylocation);

                    //deferred.resolve(location);

                    // return mylocation;
                }, function(err) {
                    // error
                    console.error('Failed to get current position. Error: ' + JSON.stringify(err));
                    //deferred.reject(err.message);
                    // return err;
                });

                //return deferred.promise;
        },
        
        outerbounds: [ // covers the (mercator projection) world
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
        ],

        drawCircle: function  (point, radius, dir, bounds) {
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
        },
        
        removeMarkers: function(){
            //Loop through all the markers and remove
            for (var i = 0; i < $rootScope.markers.length; i++) {
                $rootScope.markers[i].setMap(null);
            }

            $rootScope.markers = [];
        },
        
        showPosts: function(lat, long) {
        
            var ud = localStorage.getItem('sam_user_data');
            console.log(ud);

            var userData = JSON.parse(ud) || '{}';

            var userId = userData.id || 0;
            console.log('userId: ' + userId);
            
            /*
            var location = JSON.parse(localStorage.getItem('sam_user_location'));
            if (!location) {
                    location = {latitude: 37.8088139, longitude: -122.2660002};
                    console.warn('WARN: Using DEV_MODE position: ' + location);        
            }*/

            var data = {
                "latitude" : lat,// 37.8088139,
                "longitude" : long,//-122.2635002,
                "radious" : $rootScope.inputRadius/10,
                "userId" : userId,
                "fromPage" : 0,
                "endPage" : 16
            };

            //console.log(JSON.stringify(data));
            AppService.getNearbyPosts(data)
            .success(function (response) {
                console.log('Got nearby posts ..............................');
                console.log(JSON.stringify(response));
                if(response.status == 'SUCCESS'){
                    //$scope.nearbyPosts = response.result;
                    if(response.result){
                        response.result.forEach(function (post) {
                            var marker = new google.maps.Marker({
                                position: new google.maps.LatLng(post.latitude, post.longitude),
                                map: $rootScope.map,
                                // title: post.title,
                                icon: {
                                    url:'img/pin-gray.png',
                                    size: new google.maps.Size(18, 25)
                                }
                            });

                            $rootScope.markers.push(marker);
                        });
                     
                         google.maps.event.trigger($rootScope.map,'resize');
                         
                         //Broadcast event to listen in MapController to add click events to markers - can't do it here
                         $rootScope.$broadcast('refreshdone');
                     }
                     
                }
                 else{
                     console.log('Failed to get nearby posts ...');
                 }
            })
            .error(function (err) {
                console.warn(JSON.stringify(err));
            });
        },        
        
        refreshMap: function(){
            var me = this;
            var posOptions = {timeout: 10000, maximumAge:120000, enableHighAccuracy: false};
            $cordovaGeolocation.getCurrentPosition(posOptions)
                .then(function (position) {
                    var lat  = position.coords.latitude;
                    var long = position.coords.longitude;
                
                    var bounds = new google.maps.LatLngBounds();
                    var center = new google.maps.LatLng(lat, long);
                
                    //We'll maintain an array of markers to manage them later in the app
                    $rootScope.markers = [];

                    // Show current user position
                    var myLocation = new google.maps.Marker({
                        position: center,
                        map: $rootScope.map,
                        icon: {
                            url:'img/pin-blue.png',
                            size: new google.maps.Size(22, 30)
                        },
                        // animation: google.maps.Animation.BOUNCE,
                        title: "My Location"
                    });

                    $rootScope.markers.push(myLocation);

                    bounds.extend(center);
                
                    // options for the polygon        
                    var populationOptions = {
                      strokeColor: '#000000',
                      strokeOpacity: 0.1,
                      strokeWeight: 1,
                      fillColor: '#000000',
                      fillOpacity: 0.35,
                      map: $rootScope.map,
                      paths: [me.outerbounds, me.drawCircle(center,0.8,-1, bounds)]
                    };

                    // Add the circle for this city to the map.
                    var cityCircle = new google.maps.Polygon(populationOptions);

                    // Automatically center the map fitting all markers on the screen
                    $rootScope.map.fitBounds(bounds);

                    me.showPosts(lat, long);
                
                }, function(err) {
                    // error
                    console.error('Failed to get current position. Error: ' + JSON.stringify(err));
                    $ionicPopup.alert({
                         title: 'See Around Me Alert',
                         subTitle: 'Current Position',
                         template: 'Failed to get your location. Make sure you are connected to the internet.'
                   });                
            });            
        },
        
        initMap: function(){
                        
            var mapOptions = {
                //center: center,
                // zoom: 20,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                disableDefaultUI: true,
                zoomControl: false//,
                //zoomControlOptions: {
                  //style: google.maps.ZoomControlStyle.SMALL
                //}
            };
            
            // console.log(mapOptions);
            var map = new google.maps.Map(document.getElementById("map"), mapOptions);
            
            // Override our map zoom level once our fitBounds function runs (Make sure it only runs once)
            var boundsListener = google.maps.event.addListener((map), 'bounds_changed',
                function(event) {
                    this.setZoom(14);
                    google.maps.event.removeListener(boundsListener);
            });

            $rootScope.map = map;
        }
    };
    
    return service;
})

.factory('ModalService', function($ionicModal, $rootScope) {
    
    var init = function(tpl, $scope, anim) {

        var promise;
        $scope = $scope || $rootScope.$new();

        promise = $ionicModal.fromTemplateUrl(tpl, {
          scope: $scope,
          animation: anim ? anim : 'slide-in-up'
        }).then(function(modal) {
          $scope.modal = modal;
          return modal;
        });

        $scope.openModal = function() {
           $scope.modal.show();
         };
         $scope.closeModal = function() {
           $scope.modal.hide();
         };
         $scope.$on('$destroy', function() {
           $scope.modal.remove();
         });

        return promise;
      };

      return {
        init: init
      };    
});

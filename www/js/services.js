angular.module('SeeAroundMe.services', [])

.factory('AppService', function($http, $q, $cordovaCapture, $cordovaImagePicker, $ionicPopup, API_URL) {

  var userData = JSON.parse(localStorage.getItem('sam_user_data')) || {};
  var userId = userData.id || 0;
  var conversationUserId = null;
  var isCurrentUser = false;
  var profileUserId = null;

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

        sendMessage: function(otherUserId, subject, message){
          var url = API_URL + '/sendmessage';

          var params = {
            sender_id: userId,
            reciever_id: otherUserId,
            subject: subject,
            message: message
          };

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
        
        getMyPosts: function (data) {
            var url = API_URL + '/myposts';
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
            data.user_id = userId;
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
        },

        setIsCurrentUserFlag: function (flag){
          isCurrentUser = flag;
        },

        getIsCurrentUserFlag: function (){
          return isCurrentUser;
        },

        getFollowing: function(){
          /* 
           * get the list of users the 
           * logged in user is following
           */
          var url = API_URL + '/myfriendlist';
          var data = { user_id: userId};
          return $http.post(url, data);
        },

        getAlerts: function(){
          var url = API_URL + '/notification';
          return $http.post(url, {user_id: userId});
        },

        setUserForProfilePage: function(id){
          /*
           * sets the id for the profile that needs to be fetched in the profile page
           * in the profile controller, a getUserForProfilePage function is called to
           * get the data for this user from the API
           *
           * please set $rootScope.isCurrentUser to false before transitioning to profilePage if
           * this promise returns a success
           *
           * using a promise so that we don't fetch the
           * wrong user later
           */
          var d = $q.defer();
          profileUserId = id;
          d.resolve();
          return d.promise;
        },

        getUserForProfilePage: function(){
          /*
           * see the comment in setUserForProfilePage()
           */
            var url = API_URL + '/getotheruserprofile'

            var params = {
              user_id: userId,
              other_user_id: profileUserId,
            };

            return $http.post(url, params);
        },

        editProfile: function(newData){
          var url = API_URL + '/edit-profile';
          console.log(newData)

          var params = {
            user_id: newData.id,
            name: newData.Name,
            email: newData.Email_id,
            birth_date: newData.Birth_date,
            public_profile: newData.public_profile,
            gender: newData.Gender,
            image: newData.Profile_image,
          }

          return $http.post(url, params);
        },

        setOtherUserId: function(otherUserId){
          conversationUserId = otherUserId;
        },

        getConversation: function(){
          var url = API_URL + '/message-conversation';
          var params = {
            user_id: userId,
            other_user_id: conversationUserId,
            start: 0,
          }
          return $http.post(url, params);
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
        
        showPosts: function(center, searchData) {
            
            var bounds = new google.maps.LatLngBounds();
            
            bounds.extend(center);

            // options for the polygon        
            var populationOptions = {
                  strokeColor: '#000000',
                  strokeOpacity: 0.1,
                  strokeWeight: 1,
                  fillColor: '#000000',
                  fillOpacity: 0.35,
                  map: $rootScope.map,
                  paths: [this.outerbounds, this.drawCircle(center,$rootScope.inputRadius,-1, bounds)]
            };
            
            if($rootScope.cityCircle){//Circle already exists
                //Remove the old circle before adding new one
                $rootScope.cityCircle.setMap(null);
                $rootScope.cityCircle = new google.maps.Polygon(populationOptions);
            }
            else{
                // Add the circle for this city to the map.
                $rootScope.cityCircle = new google.maps.Polygon(populationOptions);                
            }
            
            var ud = localStorage.getItem('sam_user_data');
            console.log(ud);

            var userData = JSON.parse(ud) || '{}';

            var userId = userData.id || 0;
            console.log('userId: ' + userId);
            
            function onSuccess(response){
                console.log('Got nearby posts ..............................');
                //console.log(JSON.stringify(response));
                if(response.status == 'SUCCESS'){
                    if(response.result){
                        // the regex that matches urls in text
                        var urlRegEx = new RegExp(
                            "((ftp|http|https|gopher|mailto|news|nntp|telnet|wais|file|prospero|aim|webcal):(([A-Za-z0-9$_.+!*(),;/?:@&~=-])|%[A-Fa-f0-9]{2}){2,}(#([a-zA-Z0-9][a-zA-Z0-9$_.+!*(),;/?:@&~=%-]*))?([A-Za-z0-9$_+!*();/?:~-]))");

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
                            
                            // transform news text to behave nicely with html
                            // removes links and " characters from post.news
                            post.sanitizedText = post.news.replace(urlRegEx, '').replace(/\"/g, '');
                            
                            post.timeAgo = moment(post.updated_date).fromNow();
                            marker.post = post;
                            
                            $rootScope.markers.push(marker);
                        });
                     
                        //google.maps.event.trigger($rootScope.map,'resize');                         
                         // Automatically center the map fitting all markers on the screen
                        $rootScope.map.fitBounds(bounds);
                        $rootScope.map.setZoom(14);
                        //Broadcast event to listen in MapController to add click events to markers - can't do it here
                        $rootScope.$broadcast('refreshdone');
                     }
                     
                }
                 else{
                     console.log('Failed to get nearby posts ...');
                 }                
            };
            
            //Note the difference of user id param userId and user_id -- the api is incosistent
            if(searchData){                
                var data = {
                    "latitude" : center.lat(),// 37.8088139,
                    "longitude" : center.lng(),//-122.2635002,
                    "radious" : $rootScope.inputRadius,
                    "user_id" : userId,
                    "searchText": searchData.searchTerm,
                    "filter": searchData.filter,
                    "fromPage" : 0
                };
                
                //console.log(JSON.stringify(data));
                AppService.getMyPosts(data)
                .success(function (response) {
                    onSuccess(response);
                })
                .error(function (err) {
                    console.warn(JSON.stringify(err));
                });
            }
            else{            
                var data = {
                    "latitude" : center.lat(),// 37.8088139,
                    "longitude" : center.lng(),//-122.2635002,
                    "radious" : $rootScope.inputRadius,
                    "userId" : userId,
                    "fromPage" : 0
                };
                            
                //console.log(JSON.stringify(data));
                AppService.getNearbyPosts(data)
                .success(function (response) {
                    onSuccess(response);
                })
                .error(function (err) {
                    console.warn(JSON.stringify(err));
                });
            }
        },        
        
        refreshMap: function(searchData){            
            //Remove markers if any
            if($rootScope.markers && $rootScope.markers.length > 0){
                this.removeMarkers();
            }
            
            var me = this;
            var posOptions = {timeout: 10000, maximumAge:120000, enableHighAccuracy: false};
            $cordovaGeolocation.getCurrentPosition(posOptions)
                .then(function (position) {
                    var lat  = position.coords.latitude;//37.8088139
                    var long = position.coords.longitude;//-122.2660002
                                    
                    var center = new google.maps.LatLng(lat, long);
                
                    $rootScope.map.setCenter(center);
                    
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

                    me.showPosts(center, searchData);
                
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
        
        centerMap: function(center){            
            //Remove markers if any
            if($rootScope.markers && $rootScope.markers.length > 0){
                this.removeMarkers();
            }
            
            $rootScope.map.setCenter(center);

            //We'll maintain an array of markers to manage them later in the app
            $rootScope.markers = [];

            this.showPosts(center);            
        },        
        
        initMap: function(){
                        
            var mapOptions = {
                //center: center,
                zoom: 14,
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
            var me = this;
            google.maps.event.addListener((map), 'dragend', 
                function(event) { 
                //console.log('map dragged'); 
                me.centerMap(this.getCenter());
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

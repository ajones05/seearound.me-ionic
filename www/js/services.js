angular.module('SeeAroundMe.services', [])

.factory('AppService', function($http, $q, $rootScope, $cordovaNetwork, $cordovaCamera, $cordovaFileTransfer, $ionicPopup, API_URL) {

  var userData = JSON.parse(localStorage.getItem('sam_user_data')) || {};
  var userId = userData.id || 0;
  var conversationUserId = null;
  //var isCurrentUser = false; --- set it on root scope instead
  var profileUserId = null;
  var currentPostComments = {};
    var service = {
                
        getImage: function(mediaType){
            
            var cameraOptions = {
                quality: 50,
                encodingType: Camera.EncodingType.JPEG,
                destinationType: Camera.DestinationType.FILE_URI,
                saveToPhotoAlbum: false,
                correctOrientation: true,
                targetWidth:400,
                targetHeight: 800
                //cameraDirection: Camera.Direction.FRONT
            };
            
            if(mediaType == 'gallery'){
                cameraOptions.sourceType = Camera.PictureSourceType.PHOTOLIBRARY;
            }
             else{
                cameraOptions.sourceType = Camera.PictureSourceType.CAMERA;
             }
            //console.info(cameraOptions);
            $cordovaCamera.getPicture(cameraOptions)
            .then(function(imgUri){
                console.log('image uri: '+ imgUri);
                $rootScope.imgUri = imgUri;
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
        
        getMessages: function(){
          var  url = API_URL + '/message-conversation';
          var params = {
            user_id : userId, 
          }
          return $http.post(url, params);
        },

        sendMessage: function(otherUserId, subject, message, conversationId){
          var url = API_URL + '/sendmessage';

          var params = {
            sender_id: userId,
            reciever_id: otherUserId,
            subject: subject,
            message: message
          };
            
          if(conversationId){//Conversation is already present
              params.conversation_id = conversationId;
              params.subject = null;
          }
          else if(!subject){//New conversation              
                  params.subject = message;
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

        getCurrentComments: function(post){
          var d = $q.defer();
          var url = API_URL + '/get-total-comments';
          if(post){
              var postId = post.id; 
          }
          else if(currentPostComments.post){
              var postId = currentPostComments.post.id; 
          }
          else{
              var postId = 0;   
          }
          var params = {
            offset: 0,
            news_id: postId
          }
          $http.post(url, params)
           .success(function(data){
             currentPostComments.comments = data.result;
             d.resolve(currentPostComments);
           })
           .error(function(error){
             console.log('comments fetching failed with error: ', error);
             d.reject(error);
           });
           return d.promise;
        },

        addNewPost: function (data) {   
            
            var url = API_URL + '/addimobinews';
            
            var options = {
                fileKey: "image",
                fileName: new Date().getTime() + ".jpg",
                httpMethod: 'POST',
                chunkedMode: false,
                mimeType: "image/jpg",
                params: data
            };
            
            if($rootScope.imgUri){
                return $cordovaFileTransfer.upload(url, $rootScope.imgUri, options, true);
            }
            else{
                return $http.post(url, data);
            }
        },
        
        showErrorAlert: function(subTitle, message){
            $ionicPopup.alert({
                 title: 'See Around Me Alert',
                 subTitle: subTitle,
                 template: message
           });
        },
        
        isConnected: function(){
            
            var isOffline = $cordovaNetwork.isOffline();
            if(isOffline)
                return false;
            else
                return true;
        },

        setIsCurrentUserFlag: function (flag){
          $rootScope.isCurrentUser = flag;
        },

        getIsCurrentUserFlag: function (){
          return $rootScope.isCurrentUser;
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
        
        followUser: function(id){
          var url = API_URL + '/follow';
          var data = { 
              user_id: userId,
              receiver_id: id
          };
          return $http.post(url, data);
        },
        
        unfollowUser: function(id){
          var url = API_URL + '/unfollow';
          var data = { 
              user_id: userId,
              receiver_id: id
          };
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

.factory('MapService', function($http, $q, $rootScope, $ionicPopup, $cordovaGeolocation, AppService, ModalService) {
    var service = {
        showPostMap: function(latitude, longitude){
            //console.log(latitude, longitude);
            //var position = AppService.getCurrentPosition();

            //var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

            if (!latitude) {
                var latLng = new google.maps.LatLng(37.8088139, -122.2660002);
            }else{
              var latLng = new google.maps.LatLng(latitude, longitude);
            }
        

            var mapOptions = {
              center: latLng,
                zoom: 14,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                disableDefaultUI: true,
                zoomControl: false//,
                //zoomControlOptions: {
                  //style: google.maps.ZoomControlStyle.SMALL
                //}
            };

            var map = new google.maps.Map(document.getElementById("post_map"), mapOptions);
        
            var marker = new google.maps.Marker({
                position: latLng,
                map: map,
                icon: {
                    url:'img/pin-blue.png',
                    scaledSize: new google.maps.Size(22, 30)
                },
                // animation: google.maps.Animation.BOUNCE,
                title: "My Location"
            });         
        },
        
        getPlace: function(lat, lng){
            var d = $q.defer();
            var geocoder = new google.maps.Geocoder();
            
            var latlng = new google.maps.LatLng(lat, lng);

            geocoder.geocode({
                'latLng': latlng
              }, function (results, status) {
                if (status === google.maps.GeocoderStatus.OK) {
                  if (results) {
                        d.resolve(results[1]);
                  } else {
                    console.log('No results found');
                      d.resolve(results);
                  }
                } else {
                    console.log('Geocoder failed due to: ' + status);
                    d.reject(status)
                }
              });
            
            return d.promise;
        },
        
        getCurrentPosition: function (){
            
            console.log('Geolocation Service called...');
            var posOptions = {timeout: 30000, maximumAge:0, enableHighAccuracy: false};

             return $cordovaGeolocation.getCurrentPosition(posOptions);
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
                              "((ftp|http|https|gopher|mailto|news|nntp|telnet|wais|file|prospero|aim|webcal):(([A-Za-z0-9$_.+!*(),;/?:@&~=-])|%[A-Fa-f0-9]{2}){2,}(#([a-zA-Z0-9][a-zA-Z0-9$_.+!*(),;/?:@&~=%-]*))?([A-Za-z0-9$_+!*();/?:~-]))"
                           );

                        response.result.forEach(function (post) {
                            var marker = new google.maps.Marker({
                                position: new google.maps.LatLng(post.latitude, post.longitude),
                                map: $rootScope.map,
                                // title: post.title,
                                icon: {
                                    url:'img/pin-gray.png',
                                    scaledSize: new google.maps.Size(18, 25)
                                }
                            });
                            
                            post.first_link = post.news.match(urlRegEx);
                            try{
                              post.first_link = post.news.match(urlRegEx)[0];
                            }catch(ex){}
                            
                            post.timeAgo = moment(post.updated_date).fromNow();
                            marker.post = post;
                            
                            $rootScope.markers.push(marker);
                        });
                        //To use on list view
                        $rootScope.currentPosts = response.result;
                        //console.log('data set in rootscope: ', $rootScope.currentPosts);
                     
                        //google.maps.event.trigger($rootScope.map,'resize');                         
                         // Automatically center the map fitting all markers on the screen
                        //$rootScope.map.fitBounds(bounds);
                        
                        //Broadcast event to listen in MapController to add click events to markers - can't do it here
                        $rootScope.$broadcast('refreshdone');
                     }
                    else{
                        $rootScope.currentPosts = [];
                    }
                     
                }
                 else{
                     console.log('Failed to get nearby posts ...');
                     $rootScope.currentPosts = [];
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
                    $rootScope.isFiltered = true;
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
                    $rootScope.isFiltered = false;
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
            
            $rootScope.map.setCenter($rootScope.currentCenter);

            //We'll maintain an array of markers to manage them later in the app
            $rootScope.markers = [];

            // Show current user position
            var myLocation = new google.maps.Marker({
                position: $rootScope.myCenter,
                map: $rootScope.map,
                icon: {
                    url:'img/pin-blue.png',
                    scaledSize: new google.maps.Size(22, 30)
                },
                // animation: google.maps.Animation.BOUNCE,
                title: "My Location"
            });

            $rootScope.markers.push(myLocation);

            this.showPosts($rootScope.currentCenter, searchData);
        },
        
        resetMap: function(){            
            //Remove markers if any
            if($rootScope.markers && $rootScope.markers.length > 0){
                this.removeMarkers();
            }
            
            $rootScope.map.setCenter($rootScope.myCenter);

            //We'll maintain an array of markers to manage them later in the app
            $rootScope.markers = [];

            // Show current user position
            var myLocation = new google.maps.Marker({
                position: $rootScope.myCenter,
                map: $rootScope.map,
                icon: {
                    url:'img/pin-blue.png',
                    scaledSize: new google.maps.Size(22, 30)
                },
                // animation: google.maps.Animation.BOUNCE,
                title: "My Location"
            });

            $rootScope.markers.push(myLocation);

            this.showPosts($rootScope.myCenter);
        },        
        
        centerMap: function(center){            
            //Remove markers if any
            if($rootScope.markers && $rootScope.markers.length > 0){
                this.removeMarkers();
            }
            else{
                $rootScope.markers = [];
            }
            
            $rootScope.map.setCenter(center);
            
            // Show current user position
            var myLocation = new google.maps.Marker({
                position: $rootScope.myCenter,
                map: $rootScope.map,
                icon: {
                    url:'img/pin-blue.png',
                    scaledSize: new google.maps.Size(22, 30)
                },
                // animation: google.maps.Animation.BOUNCE,
                title: "My Location"
            });

            $rootScope.markers.push(myLocation);
            this.showPosts(center);            
        },        
        
        initMap: function(){
            var me = this;
            var posOptions = {timeout: 30000, maximumAge:0, enableHighAccuracy: false};
            $cordovaGeolocation.getCurrentPosition(posOptions)
                .then(function (position) {
                    var lat  = position.coords.latitude;//37.8088139
                    var long = position.coords.longitude;//-122.2660002
                                    
                    var center = new google.maps.LatLng(lat, long);
                    $rootScope.myCenter = center;
                    $rootScope.currentCenter = center;
                
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
                    /*
                    // Override our map zoom level once our fitBounds function runs (Make sure it only runs once)
                    var boundsListener = google.maps.event.addListener((map), 'bounds_changed',
                        function(event) {
                            this.setZoom(14);
                            google.maps.event.removeListener(boundsListener);
                    });*/

                    google.maps.event.addListener((map), 'dragend', 
                        function(event) { 
                        //console.log('map dragged'); 
                        var c = this.getCenter();
                        $rootScope.currentCenter = c;
                        me.centerMap(c);
                    });

                    $rootScope.map = map;
                
                    //Now add circle and post locations on the map
                    me.refreshMap();
                
                }, function(err) {
                    // error
                    console.error('Failed to get current position. Error: ' + JSON.stringify(err));
                    $ionicPopup.alert({
                         title: 'See Around Me Alert',
                         subTitle: 'Current Location',
                         template: 'Failed to get your location. Make sure you are connected to the internet and allowed gelocation on your devivce.'
                   });                
            });            
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

angular.module('SeeAroundMe.services', [])

.factory('AppService', function($http, $q, $rootScope, $state, $cordovaNetwork, $cordovaCamera, $cordovaFileTransfer, $ionicPopup, $ionicLoading, API_URL) {
    
    var data = localStorage.getItem('sam_user_data');
    if(data && data !== 'undefined')
        var userData = JSON.parse(data);
    else
        var userData = {};
    
    var userId = userData.id || 0;
    var authToken = userData.token;
    var conversationUserId = null;
    var conversation = null;
    var otherUser = null;
    //var isCurrentUser = false; --- set it on root scope instead
    var profileUserId = null;
    var currentPostComments = {};
    var pageNum = 0, commentsPageNum = 0;
    var service = {
        
        getAuthToken: function(){
            return authToken;   
        },
        
        setAuthToken: function(token){
            authToken = token;
        },
        
        imgUri: "",
        
        getImgUri: function(){
            return this.imgUri;
        },
        
        setImgUri: function(imgUri){
            this.imgUri = imgUri;
        },
        
        getImage: function(mediaType){
            
            var cameraOptions = {
                quality: 60,
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
            return $cordovaCamera.getPicture(cameraOptions);            
        },
        
        vote: function(newsId, v){        
          var url = API_URL + '/post-like';
          var postData = {
            token: authToken,
            news_id: newsId,
            vote: v
          }
          return $http.post(url, postData)
        },
        
        getMessages: function(){
          var  url = API_URL + '/message-conversation';
          var params = {              
              token: authToken,
              user_id : userId
          }
          
          return $http.post(url, params);
        },

        sendMessage: function(otherUserId, subject, message, conversationId){
          var url = API_URL + '/sendmessage';

          var params = {
            token: authToken,
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
        
        resetPassword: function(email){
            var url = API_URL + '/reset-password';
            return $http.post(url, { email: email});
        },
        
        submitEmail: function(data){
            var url = 'https://docs.google.com/a/seearound.me/forms/d/1OfimXHi5VzBAT0LxQg84m5m0dwSzrQ24Cm_sHxZiFNE/formResponse';
            return $http({
                method: 'POST',
                url: url,
                dataType: 'xml',
                data: data
            });
        },
        
        signUp: function (data, imgUri) {
            var url = API_URL + '/registration';
            //console.log($rootScope.imgUri);
            if(imgUri && imgUri != " "){
                //console.log('Signup with image ...');
                var options = {
                    fileKey: "image",
                    fileName: new Date().getTime() + ".jpg",
                    httpMethod: 'POST',
                    chunkedMode: false,
                    mimeType: "image/jpg",
                    params: data
                };
                
                return $cordovaFileTransfer.upload(url, imgUri, options, true);
            }
            else{
                //console.log('Signup without image ...');
                return $http({
                    method: 'POST',
                    url: url,
                    data: data,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                });
            }
        },
        
        login: function (data) {
            var url = API_URL + '/login';
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
        
        getPost: function (data) {
            var url = API_URL + '/post';
             /*
                return $http({
                    method: 'POST',
                    url: url,
                    data: data,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                });*/
             return $http.post(url, data);
        },                

        getNearbyPosts: function (data) {
            pageNum = 0;
            
            var url = API_URL + '/request-nearest';
             /*
                return $http({
                    method: 'POST',
                    url: url,
                    data: data,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                });*/
             return $http.post(url, data);
        },
        
        getMyPosts: function (data) {
            pageNum = 0;
            
            var url = API_URL + '/myposts';
            /*
            return $http({
                method: 'POST',
                url: url,
                data: data,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            });*/
            return $http.post(url, data);
        },
        
        getMorePosts: function(){
            
            pageNum = pageNum + 15;
            
            var data = {                
                "latitude" : $rootScope.currentCenter.lat(),
                "longitude" : $rootScope.currentCenter.lng(),
                "radious" : $rootScope.inputRadius,
                "token": authToken,
                "start" : pageNum
            };
            
            var url = API_URL + '/request-nearest';
            
            return $http.post(url, data);                        
        },
        
        addNewPost: function (data, imgUri) {   
            
            var url = API_URL + '/addimobinews';
                        
            if(imgUri && imgUri != ""){
                
                var options = {
                    fileKey: "image",
                    fileName: new Date().getTime() + ".jpg",
                    httpMethod: 'POST',
                    chunkedMode: false,
                    mimeType: "image/jpg",
                    params: data
                };
                
                return $cordovaFileTransfer.upload(url, imgUri, options, true);
            }
            else{
                return $http.post(url, data);
            }
        },
        
        //Check whenther the post link has already been shared or not
        checkPost: function(data){
            var url = API_URL + '/before-save-post';
            
            return $http.post(url, data);           
        },
        
        savePost: function(data, imgUri){
              var url = API_URL + '/save-post';
                        
            if(imgUri.length > 0 && imgUri != $rootScope.oldImage){//Image has been changed
                
                var options = {
                    fileKey: "image",
                    fileName: new Date().getTime() + ".jpg",
                    httpMethod: 'POST',
                    chunkedMode: false,
                    mimeType: "image/jpg",
                    params: data
                };
                
                return $cordovaFileTransfer.upload(url, imgUri, options, true);
            }
            else{
                data.image = $rootScope.oldImage;
                return $http.post(url, data);
            }
        },        
        
        deletePost: function(post){
              var url = API_URL + '/delete-post';
              var params = {
                token: authToken,
                post_id: post.id
              };
              return $http.post(url, params);            
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
            token: authToken,
            news_id: newsId,
            comment: commentText
          };
          return $http.post(url, params);
        },
        
        deleteComment: function(comment){
            
          var url = API_URL + '/delete-comment';
          var params = {
            token: authToken,
            comment_id: comment.id
          };
          return $http.post(url, params);            
        },

        getCurrentComments: function(post){
          commentsPageNum = 0;
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
            start: 0,
            news_id: postId,
            token: authToken
          };
          
          $http.post(url, params)
           .success(function(data){
             currentPostComments.comments = data.result;
             d.resolve(currentPostComments);
           })
           .error(function(error){
             //console.log('comments fetching failed with error: ', error);
             //d.reject(error);
             currentPostComments.comments = [];
             d.resolve(currentPostComments);
           });
           return d.promise;
        },
        
        getMoreComments: function(post){
            commentsPageNum = commentsPageNum + 10;
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
                start: commentsPageNum,
                news_id: postId,
                token: authToken
              };
          
              $http.post(url, params)
               .success(function(data){
                 currentPostComments.comments = data.result;
                 d.resolve(currentPostComments);
               })
               .error(function(error){
                 //console.log('comments fetching failed with error: ', error);
                 d.reject(error);
               });
            
               return d.promise;              
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
          var data = { token: authToken };
          return $http.post(url, data);
        },
        
        followUser: function(id){
          var url = API_URL + '/follow';
          var data = { 
              token: authToken,
              receiver_id: id
          };
          return $http.post(url, data);
        },
        
        unfollowUser: function(id){
          var url = API_URL + '/unfollow';
          var data = { 
              token: authToken,
              receiver_id: id
          };
          return $http.post(url, data);
        },                

        getAlerts: function(){
          var url = API_URL + '/notification';
          return $http.post(url, {token: authToken});
        },
        
        markAlertRead: function(alert){
          var url = API_URL + '/notification-read';
          var me = this;
          $http.post(url, {token: authToken, id: alert.id, type: alert.type}).then(function(res){
              //console.log('Alert marked read ...');
              //console.log(JSON.stringify(res));
              
                me.getAlerts().then(function(res){
                      if(res.data.result){
                          var alerts = res.data.result;
                          var unreadCount = 0;
                          alerts.forEach(function(alert){
                              if(alert.is_read == 0){//If unread
                                  unreadCount++;
                              }

                              var d = alert.created_at.split("-").join("/");
                              alert.created_at = new Date(d);
                          });

                          $rootScope.alerts = alerts;
                          $rootScope.unreadAlerts = unreadCount;
                      }
                      else{
                          $rootScope.alerts = [{message: 'No alerts'}];
                     }
                });             
          });
        }, 
        
        alertActions: function (alert){ 
            //console.log(JSON.stringify(alert));
            var AppService = this;
            //Mark the alert as read
            AppService.markAlertRead(alert);
            
            switch(alert.type.toLowerCase()){
                case 'friend':                  
                  AppService.setIsCurrentUserFlag(false);
                  AppService.setUserForProfilePage(alert.user_id)
                  .then(function(){
                    $state.go('app.userprofile');
                  });
                  break;
                case 'message':
                    
                    AppService.getConvById(alert.conversation_id).then(function(res){
                        
                        AppService.setConv(res.data.conversation);
                        $state.go('app.userchat', {from: 'messages'});
                        
                    });
                    
                  break;
                default: //vote or comment 
                    var post = null;
                    for(var i=0; i < $rootScope.currentPosts.length; i++){
                        if(alert.post_id === $rootScope.currentPosts[i].id){
                            post = $rootScope.currentPosts[i];
                            break;
                        }
                    }

                    if(post){//Post was found in current posts
                        
                        AppService.setCurrentComments(post)
                        .then(function(){
                          $state.go('app.postcomments');
                        });                              
                    }
                    else{//Post was not found
                        $ionicLoading.show({ template: 'Loading post ...'});
                        var data = {
                            token: authToken,
                            user_id: alert.user_id,
                            post_id: alert.post_id
                        };

                        AppService.getPost(data)
                        .then(function(result){
                            $ionicLoading.hide();
                            if(result.data.post){
                                /*
                                var urlRegEx = new RegExp(
                                  "((ftp|http|https|gopher|mailto|news|nntp|telnet|wais|file|prospero|aim|webcal):(([A-Za-z0-9$_.+!*(),;/?:@&~=-])|%[A-Fa-f0-9]{2}){2,}(#([a-zA-Z0-9][a-zA-Z0-9$_.+!*(),;/?:@&~=%-]*))?([A-Za-z0-9$_+!*();/?:~-]))"
                                );                                
                                if(result.data.post.link_url){
                                    result.data.post.news = result.data.post.news.replace(urlRegEx, "");
                                }*/
                                
                                AppService.setCurrentComments(result.data.post)
                                .then(function(){
                                  $state.go('app.postcomments');
                                });  
                            }                            
                        });
                    }
              };
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
              token: authToken,
              other_user_id: profileUserId,
            };

            return $http.post(url, params);
        },

        editProfile: function(data, imgUri){
          var url = API_URL + '/edit-profile';
           data.token = authToken;
            
          //console.log($rootScope.imgUri);
            if(imgUri && !imgUri.startsWith('http') && imgUri != " "){
                //console.log('Edit with image ...');
                var options = {
                    fileKey: "image",
                    fileName: new Date().getTime() + ".jpg",
                    httpMethod: 'POST',
                    chunkedMode: false,
                    mimeType: "image/jpg",
                    params: data
                };
                
                return $cordovaFileTransfer.upload(url, imgUri, options, true);
            }
            else{
                //console.log('Edit without image ...');
                return $http.post(url, data);
            }
        },
         
         getUserById: function(id){
                //console.log('.................... getUserById called ....');
             var url = API_URL + '/getotheruserprofile'
             
             var params = {
                 token: authToken,
                 other_user_id: id
             };

             return $http.post(url, params);
         },

        
        setUserId: function(id){
            userId = id;
        },

        setOtherUserId: function(otherUserId){
          conversationUserId = otherUserId;
        },
        
        getOtherUserId: function(){
            return conversationUserId;
        },
        
        setOtherUser: function(user){
            otherUser = user;  
        },
        
        getOtherUser: function(){
            return otherUser;
        },
        //Get conversations with unread messages in them
        getUnreadConvs: function(){
              var url = API_URL + '/unreadmessages';
              var params = {
                token: authToken,
                start: 0
              };

              return $http.post(url, params);            
        },
        
        //This method returns list of conversation messages
        getConversation: function(id){
          var url = API_URL + '/conversation-message';
          var params = {
            token: authToken,
            id: id,
            start: 0
          };
          
          return $http.post(url, params);
        },
        
        //This method return a single conversation 
        getConvById: function(id){
          var url = API_URL + '/conversation';
          var params = {
            token: authToken,
            id: id
          };
          
          return $http.post(url, params);            
        },
        
        setConv: function(c){
            conversation = c;
        },
        
        getConv: function(){
            return conversation;
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
                //,
                //'location_type': 'ROOFTOP'
              }, function (results, status) {
                if (status === google.maps.GeocoderStatus.OK) {
                  if (results) {
                        d.resolve(results[0]);
                  } else {
                    //console.log('No results found');
                      d.resolve(results);
                  }
                } else {
                    //console.log('Geocoder failed due to: ' + status);
                    d.reject(status)
                }
              });
            
            return d.promise;
        },
        
        getCurrentPosition: function (){
            
            //console.log('Geolocation Service called...');
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
            //Update current center
            $rootScope.currentCenter = center;
            
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
            //console.log(ud);

            var userData = JSON.parse(ud) || '{}';
            var authToken = userData.token || '';
            var userId = userData.id || 0;
            //console.log('userId: ' + userId);
            
            function onSuccess(response){
                
                //console.log(JSON.stringify(response));
                if(response.status == 'SUCCESS'){
                    //console.log('Got nearby posts ..............................');                    
                    if(response.result){
                        /*
                      // the regex that matches urls in text
                      var urlRegEx = new RegExp(
                              "((ftp|http|https|gopher|mailto|news|nntp|telnet|wais|file|prospero|aim|webcal):(([A-Za-z0-9$_.+!*(),;/?:@&~=-])|%[A-Fa-f0-9]{2}){2,}(#([a-zA-Z0-9][a-zA-Z0-9$_.+!*(),;/?:@&~=%-]*))?([A-Za-z0-9$_+!*();/?:~-]))"
                           );*/

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
                            
                            //post.news = post.news.replace(urlRegEx, "");
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
                        if($rootScope.currentPosts.length == 0){
                             AppService.showErrorAlert('No Posts!', 'There are no posts in this area, but you can be the first to post!');
                        }
                        
                        $rootScope.$broadcast('refreshdone');
                     }
                    else{
                        $rootScope.currentPosts = [];
                        if(!$rootScope.block){
                            $rootScope.block = true;// To show the alert only once
                            AppService.showErrorAlert('No Posts!', 'There are no posts in this area, but you can be the first to post!');
                            setTimeout(function(){
                                $rootScope.block = false;//Let it be shown after 10 seconds
                            }, 10000);
                        }

                    }
                     
                }
                 else{
                     //console.log('Failed to get nearby posts ...');
                     $rootScope.currentPosts = [];
                 }                
            };
            
            if(searchData){                
                var data = {
                    "latitude" : center.lat(),// 37.8088139,
                    "longitude" : center.lng(),//-122.2635002,
                    "radious" : $rootScope.inputRadius,
                    "token" : authToken,
                    "searchText": searchData.searchTerm,
                    "filter": searchData.filter,
                    "start" : 0
                };
                
                //console.log(JSON.stringify(data));
                AppService.getMyPosts(data)
                .success(function (response) {
                    $rootScope.isFiltered = true;
                    onSuccess(response);
                })
                .error(function (err) {
                    //console.warn(JSON.stringify(err));
                });
            }
            else{            
                var data = {
                    "latitude" : center.lat(),// 37.8088139,
                    "longitude" : center.lng(),//-122.2635002,
                    "radious" : $rootScope.inputRadius,
                    "token" : authToken,
                    "start" : 0
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
            var mapOptions = {
                //center: center,
                zoom: 13,//Sits well with radius of 1.6
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


            google.maps.event.addListener((map), 'click', 
                function(event) { 
                //console.log('map clicked'); 
                $rootScope.$broadcast('hidemapmodal');
            });

            google.maps.event.addListener((map), 'dragstart', 
                function(event) { 
                //console.log('map dragged'); 
                $rootScope.$broadcast('hidemapmodal');
            });
            
            var me = this;
         
            $rootScope.map = map;

            //Now add circle and post locations on the map
            this.refreshMap();
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
    
    var openMapModal = function($scope) {

        var promise;
        $scope = $scope || $rootScope.$new();

        promise = $ionicModal.fromTemplateUrl('templates/post/mapmodal.html', {
          scope: $scope,
          viewType: 'bottom-sheet',
          backdropClickToClose: false,
          animation: 'slide-in-up'
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
        init: init,
        openMapModal: openMapModal
      };    
});

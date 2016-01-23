angular.module('SeeAroundMe.controllers', [])

.controller('AppCtrl', function($scope, AppService, $rootScope, $state) {
  //$scope.$on('$ionicView.enter', function(e) {
  //});
  
  $scope.User = JSON.parse(localStorage.getItem('sam_user_data')) || {};
    
  $rootScope.isBeforeSignUp = false;

  $scope.openPostList = function () {
      $rootScope.$broadcast('mapview:openlist');
      $state.go('app.postmapview');
  };

  $scope.goToOwnProfile = function(){
    AppService.setIsCurrentUserFlag(true);
    $state.go('app.userprofile');
  };
    
  $scope.signOut = function(){
      //Remove user login id and data
      localStorage.removeItem('sam_user_location');
      localStorage.removeItem('sam_user_data');
      
      //Loop through all the markers and remove
      if($rootScope.markers){
        $rootScope.markers.map(function(marker){
          marker.setMap(null);
        })
      }
      
      $rootScope.markers = [];
      
      $state.go('home');
  }
})

.controller('CommentsCtrl', function($scope, $ionicLoading, AppService, $state, $rootScope) {
  $ionicLoading.show({
    template: 'Fetching Comments..'
  });

  var userData = JSON.parse(localStorage.getItem('sam_user_data' ))|| '{}';
  var userId = userData.id || 0;

  AppService.getCurrentComments()
  .then(function(current){
    console.log('response', current);
    $scope.post = current.post;
    $scope.postComments = current.comments || [];

    try{
      $scope.postComments.map(function(comment){
        comment.timeAgo = moment(comment.commTime).fromNow();
      })
    } catch (err){
      console.log(err);
    }

    $ionicLoading.hide();
  }, function(error){
    $ionicLoading.hide();
    console.warn('error getting comments');
  });

  $scope.postComment = function (commentText){
    console.log('commentText -> ', commentText);
    AppService.postComment(commentText, userId, $scope.post.id)
    .success(function(res){
      console.log('successfully posted the comment');
      console.log('response: ', res);
      $scope.post.comment_count = res.result.totalComments;
      res.result.timeAgo = moment(res.result.commTime).fromNow();
      try{
        // if postComments is empty, can't unshift on it
        // so catch the error and do a Array.push instead.
        // Goal is to add the comment to the top (newest comment)
        $scope.postComments.unshift(res.result);
      }catch(err){
        $scope.postComments.push(res.result);
      }
    })
    .error(function(err){
      console.log('error posting comment -> ', err);
    })
  }

  $scope.openShare = function(text, link){
    window.plugins.socialsharing.share( text, null, null,link);
  }

  $scope.vote = function(newsId , v){
    console.log($scope.post);

    AppService.vote(newsId, v)
    .then(function(response){
      console.log('response->', response)
      if (response.data.reasonfailed){
        console.log('voting failed', response.data.message)
      }else if (response.data.success){
        $scope.post.news_count = response.data.vote;
        $scope.post.isLikedByUser = v +'';
      }
    }, function(err){
      console.log('error upvoting', err)
    })
  }

})

.controller('SignupCtrl', function($scope, $rootScope, $state, AppService) {
    console.log('Signup controller called ...');
    $scope.formData = {};
            
    $scope.doSignUp = function(user){
        console.log('Signup ...');
        if(!AppService.isConnected()){
            AppService.showErrorAlert('No Internet Connection', 'There seems to be a network problem. Please check your internet connection and try again.');
            
            return;
        }
        
        if($scope.formData.password !== $scope.formData.repeatPW){
            AppService.showErrorAlert('Passwrod Mismatch', 'Repeated password does not match the value in password field!');            
            return;
        }
        
        var data = {
            name: $scope.formData.name,
            email: $scope.formData.email, 
            password: $scope.formData.password,
            address:''
        };
        
        $rootScope.userData = data;
        //Ask user to allow location
        $state.go('app.allowlocation'); 
    };
            
    $scope.loginWithFB = function(){
        if(!AppService.isConnected()){
            AppService.showErrorAlert('No Internet Connection', 'There seems to be a network problem. Please check your internet connection and try again.');
        
            return;
        }
    
            openFB.login(function(fbData){
                 //console.log('openFB login callback called ....');
                 //console.log(JSON.stringify(fbData));
                 if(fbData.status == 'connected'){
                     //console.log(fbData.authResponse.token);
                     var data = {token: fbData.authResponse.token};
                     $ionicLoading.show();
                     AppService.fbLogin(data)
                        .success(function (response) {
                                $ionicLoading.hide();
                                 //console.log(JSON.stringify(response));
                                 if(response.status == 'SUCCESS'){
                                    localStorage.setItem('sam_user_data', JSON.stringify(response.result));
                                    $rootScope.isBeforeSignUp = false;
                                    $state.go('app.postmapview');
                                 }
                                 else{
                                    AppService.showErrorAlert('Failed to login!', response.message);
                                 }
                        })
                         .error(function (err) {
                                $ionicLoading.hide();
                                AppService.showErrorAlert('Failed to login!', 'There seems to be a network problem. Please check your internet connection and try again.');
                                console.warn(JSON.stringify(err));
                        });
                }
            },{ scope:'email'});
    };                
    
    $scope.openTerms = function(){
        console.log('openTerms ...');
        $rootScope.isBeforeSignUp = true;
        $state.go('app.terms');
    };
    
    $scope.openPrivacy = function(){
        console.log('openPrivacy ...');
        $rootScope.isBeforeSignUp = true;
        $state.go('app.privacy');
    }            
})

.controller('LocationCtrl', function($scope, $rootScope, $state, $timeout, $ionicPopup, $ionicLoading, AppService) {

    $scope.showLocationPopup = function(){
        console.log('showLocationPopup ...');
        //Get geolocation -- stores in local storage
        AppService.getCurrentPosition();
            
        $ionicPopup.confirm({
            title: '"SeeAround.me" Would Like to Use Your Current Location',
            cancelText: "Don't Allow",
            cancelType: 'button-default',
            okType: 'button-default'
        }).then(function(res) {
         if(res) {
             console.log('Location allowed ...');
            $ionicLoading.show();
             //Get user's location
             //var location = {latitude: 37.8088139, longitude: -122.2660002};
             var userData = $rootScope.userData;
             //console.log(JSON.stringify(userData));
             //Attempt signup after some delay
             $timeout(function(){
                var location = JSON.parse(localStorage.getItem('sam_user_location'));
                if(location){
                    userData.latitude = location.latitude;
                    userData.longitude = location.longitude;
                    //console.log(JSON.stringify(userData));
                    AppService.signUp(userData)
                    .success(function (response) {
                        console.log('SUCCESS ...... got reponse');
                        console.log(JSON.stringify(response));
                        $ionicLoading.hide();
                        if(response.status == 'SUCCESS'){
                            localStorage.setItem('sam_user_data', JSON.stringify(response.result));
                            $rootScope.isBeforeSignUp = false;
                            //$state.go('app.postmapview');
                             AppService.login(userData)
                             .success(function (response) {
                                      $ionicLoading.hide();
                                      if(response.status == 'SUCCESS'){
                                      localStorage.setItem('sam_user_data', JSON.stringify(response.result));
                                      $rootScope.isBeforeSignUp = false;
                                      $state.go('app.postmapview');
                                      }
                                      else{
                                      AppService.showErrorAlert('Failed to login!', response.message);
                                      }
                                      })
                             .error(function (err) {
                                    $ionicLoading.hide();
                                    AppService.showErrorAlert('Failed to login!', 'There seems to be a network problem. Please check your internet connection and try again.'); 
                                    console.warn(JSON.stringify(err));
                                    });
                        }
                        else{
                           AppService.showErrorAlert('Failed to register!', response.message);
                           $state.go('app.signup');
                        }
                    })
                    .error(function (err) {
                        $ionicLoading.hide();
                        AppService.showErrorAlert('Failed to register!', 'There seems to be a network problem. Please check your internet connection and try again.'); 
                        console.warn(JSON.stringify(err));
                        $state.go('app.signup');
                    });
                }
                else{
                    $ionicLoading.hide();
                    AppService.showErrorAlert('Failed to register!', 'Failed to get geo location! Please try again later.');              
                    $state.go('app.signup');
                }
             }, 1000);
         }
       });
    }
})

.controller('ProfileCtrl', function($scope, $rootScope, $state, AppService, $timeout, ModalService, $ionicLoading){
  // isCurrentUser var is set to differentiate the loggedIn user
  // from other users.
  $scope.User = null;
  $scope.$on('$ionicView.enter', function(e) {
    console.log('is the logged in user => ', $rootScope.isCurrentUser);
    $scope.User = null;
    if ($rootScope.isCurrentUser){
      //Must set this
      $scope.isCurrentUser = true;
      $scope.User = JSON.parse(localStorage.getItem('sam_user_data'));
      $timeout(calculateAge(), 50);
    } else{
      //Must set this
      $scope.isCurrentUser = false;
      $ionicLoading.show({
        template: 'Getting user info..'
      });

      AppService.getUserForProfilePage()
      .then(function(res){
        $ionicLoading.hide();
        // if (res.data.status == "FAILED"){
        //   $scope.User = JSON.parse(localStorage.getItem('sam_user_data'));
        //   calculateAge();
        // }else{
        console.log('other user-> ', res.data);
        $scope.User = res.data.result;
        $scope.isFriend = res.data.friends;
        calculateAge();
        // }
      }, function(err){
        console.log(err);
        $ionicLoading.hide();
        AppService.showErrorAlert(
          'Profile',
          'Sorry, there was an error fetching the profile'
        )
      })
    }
  });

  $scope.showNewMessageModal = function(){
    $scope.newMessage = {};

    ModalService.init('templates/new_conversation.html', $scope).then(function(modal) {
      $scope.modal = modal;
      modal.show();
    });
  }

  $scope.closeModal = function(){
    $scope.modal.remove();
  }

  $scope.sendMessage = function(){
    console.log($scope.newMessage, $scope.User);
    $ionicLoading.show();
    AppService
    .sendMessage(
      $scope.User.id,
      $scope.newMessage.subject,
      $scope.newMessage.message
    ).then(function(res){
      // not an error, just to avoid code duplication
      $ionicLoading.hide();
      AppService.showErrorAlert(
        'Success',
        'Message successfully sent to '+ $scope.User.Name
      );
      $scope.modal.remove();
    }, function(error){
      $ionicLoading.hide();
      AppService.showErrorAlert(
        'Sorry',
        'There was an error sending your message'
      )
    })
  }

   // calculate age
   function calculateAge(){
    var today = new Date();
    var birthday = new Date($scope.User.Birth_date);
    $scope.User.Age = today.getFullYear() - birthday.getFullYear();
    var diffMonths = today.getMonth() - birthday.getMonth();
    if (diffMonths < 0 || ( diffMonths === 0 && today.getDate() < birthday.getDate())) {
      $scope.User.Age = $scope.User.Age - 1;
    }
  }
})

.controller('EditProfileCtrl', function($scope, $state, $rootScope, AppService, $ionicLoading){
  $scope.User = JSON.parse(localStorage.getItem('sam_user_data'));
  $scope.User.Birth_date = new Date($scope.User.Birth_date );
  if (!$scope.User.public_profile)
    $scope.User.public_profile = false;

  $scope.newData = angular.copy($scope.User);

  $scope.doEdit = function(){
    $scope.newData.Birth_date = moment($scope.newData.Birth_date).format('DD/MM/YYYY');
    console.log($scope.newData);

    // change true|false value to 0|1
    ($scope.newData.public_profile)? ($scope.newData.public_profile = 1) : ($scope.newData.public_profile = 0);

    $ionicLoading.show({ template: 'Saving changes..'});
    AppService.editProfile($scope.newData)
    .then(function(res){
      console.log(res);
      $ionicLoading.hide();
      $state.go('app.userProfile');
    }, function(error){
      $ionicLoading.hide();
    });
  }
})

.controller('SigninCtrl', function($scope, $rootScope, $state, $ionicLoading, $rootScope, AppService, $ionicModal) {

  $scope.formData = {};
  //$scope.formData.email = "brandonhere123@gmail.com";
  //$scope.formData.password = "dev12345678";


  $scope.doLogin = function () {

    // TODO: uncomment before commiting
    if(!AppService.isConnected()){
         AppService.showErrorAlert('No Internet Connection', 'There seems to be a network problem. Please check your internet connection and try again.');
         return;
     }
      
    var data = {email:$scope.formData.email, password:$scope.formData.password};

    $ionicLoading.show();
    AppService.login(data)
    .success(function (response) {
        $ionicLoading.hide();
        if(response.status == 'SUCCESS'){
          console.log('data -> ', JSON.stringify(response.result));
            localStorage.setItem('sam_user_data', JSON.stringify(response.result));
            $rootScope.isBeforeSignUp = false;
            $state.go('app.postmapview');
            //Fire login event to cause the map to refresh
            $rootScope.$emit('login',{});
        }
        else{
           AppService.showErrorAlert('Failed to login!', response.message);
        }
    })
    .error(function (err) {
        $ionicLoading.hide();
        AppService.showErrorAlert('Failed to login!', 'There was an error during login process. Please contact support with the following information : ' + JSON.stringify(err)); 
        //console.warn(JSON.stringify(err));
    });
  };
    
  $scope.loginWithFB = function(){
        if(!AppService.isConnected()){
            AppService.showErrorAlert('No Internet Connection', 'There seems to be a network problem. Please check your internet connection and try again.');

            return;
        }
      
            openFB.login(function(fbData){
                 //console.log('openFB login callback called ....');
                 //console.log(JSON.stringify(fbData));
                 if(fbData.status == 'connected'){
                     //console.log(fbData.authResponse.token);
                     var data = {token: fbData.authResponse.token};
                     $ionicLoading.show();
                     AppService.fbLogin(data)
                        .success(function (response) {
                                $ionicLoading.hide();
                                 //console.log(JSON.stringify(response));
                                 if(response.status == 'SUCCESS'){
                                    localStorage.setItem('sam_user_data', JSON.stringify(response.result));
                                    $rootScope.isBeforeSignUp = false;
                                    $state.go('app.postmapview');
                                 }
                                 else{
                                    AppService.showErrorAlert('Failed to login!', response.message);
                                 }
                        })
                         .error(function (err) {
                                $ionicLoading.hide();
                                AppService.showErrorAlert('Failed to login!', 'There was an error during login process. Please contact support with the following information : ' + JSON.stringify(err)); 
                                console.warn(JSON.stringify(err));
                        });
                }
            },{ scope:'email'});
  };
})

.controller('FollowingCtrl', function($scope, $ionicLoading, AppService, $state){
})

.controller('MessagesCtrl', function($scope, $ionicLoading, ModalService, AppService, $state){
  $scope.formData = {};
  $scope.imgUri = null;

  $scope.$on('$ionicView.enter', function(e) {
    $ionicLoading.show({
      template: 'Getting Messages..'
    });
    //TODO: handle "no messages" case
    AppService.getMessages()
    .success(function(res){
      $scope.messages = res.result.map(function(m){
        m.formatted_date = moment(m.created).fromNow();
        return m;
      })
      console.log($scope.messages);
      $ionicLoading.hide();
    })
    .error(function(err){
      $ionicLoading.hide();
      console.log('there was an error getting messages');
    })
  });

  //Compose message view modal
  $scope.modal = function() {
    ModalService.init('templates/post/add-post.html', $scope).then(function(modal) {
      modal.show();
    });
  };

  $scope.showCompose = function(){
    $scope.modal();
  };

  $scope.close = function(id) {
    $scope.closeModal();
  };    

  $scope.viewConversation = function(otherUserId){
    AppService.setOtherUserId(otherUserId);
    $state.go('app.userchat')
  }

  // set post button to blue when typing
  $scope.checkInput = function(){
    $scope.textColor = '';
    if ($scope.formData.postText){
      //console.log($scope.formData.postText);
      ($scope.formData.postText.length > 0) ? $scope.textColor = 'blue' : $scope.textColor = 'gray';
    }
  }; 

  //Image selector called from camera icon in compose view
  $scope.pickImages = function () {
    AppService.pickImage($scope);
  };

  $scope.closeImage = function(){
    $scope.imgUri = null;
  };
})

.controller('ChatCtrl', function($scope, $state, AppService){
  $scope.messages = [];
  $scope.Self = JSON.parse(localStorage.getItem('sam_user_data')) || '{}';
  $scope.other_user = {};
  $scope.newMessage = {
    text: '',
    subject: ''
  }

  // fetches messages from API and populates scope vars
  function fetchMessages(){
    AppService.getConversation()
    .then(function(res){
      $scope.messages = res.data.result.reverse();
      $scope.messages.map(function(m){
        m.formatted_date = moment(m.created).format('MMMM Do[ at ]h:mm a');
      })

      // quick hack to get the other user's name
      for (m in $scope.messages){
        if ($scope.messages[m].sender_id !== $scope.Self.id) {
          $scope.other_user.name = $scope.messages[m].Name;
          $scope.other_user.id = $scope.messages[m].sender_id;
          $scope.other_user.profile_image = $scope.messages[m].Profile_image;
          
          // we need the subject to reply to the thread
          $scope.newMessage.subject =  $scope.messages[m].subject;
          break;
        }
      }
    }, function(error){
    })
  }

  $scope.sendMessage = function(){

    // @params: otherUserId, subject, message
    AppService
      .sendMessage(
        $scope.other_user.id,
        $scope.newMessage.subject,
        $scope.newMessage.text
      ).then(function(res){
        $scope.messages.push({
          sender_id: $scope.Self.id,
          message: $scope.newMessage.text,
        })
      }, function(error){
      });
  }

  // fetch messages every time user navigates to this page
  $scope.$on('$ionicView.enter', function(e) {
    fetchMessages();
  });

})

.controller('PostListCtrl', function($scope, $rootScope, $state, $ionicPopup, $ionicPopover, $compile, $timeout,  $ionicLoading, $cordovaGeolocation, AppService, ModalService){
  $scope.formData = {};
  var userData = JSON.parse(localStorage.getItem('sam_user_data')) || '{}';
  $scope.userData = userData;
  var userId = userData.id || 0;

  // the regex that matches urls in text
  var urlRegEx = new RegExp(
          "((ftp|http|https|gopher|mailto|news|nntp|telnet|wais|file|prospero|aim|webcal):(([A-Za-z0-9$_.+!*(),;/?:@&~=-])|%[A-Fa-f0-9]{2}){2,}(#([a-zA-Z0-9][a-zA-Z0-9$_.+!*(),;/?:@&~=%-]*))?([A-Za-z0-9$_+!*();/?:~-]))"
       );

//Get current geo location
    /*
  var location = {
    latitude : parseFloat(userData.latitude),
    longitude: parseFloat(userData.longitude)
  }*/
    
    var posOptions = {timeout: 10000, maximumAge:120000, enableHighAccuracy: false};
    var location = null, data = null;
    $cordovaGeolocation.getCurrentPosition(posOptions)
        .then(function (position) {
            var lat  = position.coords.latitude;
            var long = position.coords.longitude;
            location = {latitude: lat, longitude: long};
        
              data = {
                'latitude': location.latitude,
                'longitude': location.longitude,
                'userId': userId
              }        
            
            //Save for future use
            var mylocation = JSON.stringify(location);
            localStorage.setItem('sam_user_location', mylocation);

            //console.log(mylocation);
        }, function(err) {
                console.error('Failed to get current position. Error: ' + JSON.stringify(err));
              // TODO: cleanup on release
              if (!location){
                  
                  var location = {
                    latitude : $scope.userData.latitude,
                    longitude: $scope.userData.longitude
                  }
                  /*
                location = {
                  latitude: 37.8088139,
                  longitude: -122.266002
                };
                console.warn('Using DEV_MODE location coordinates on ListView');
                */
              }

              data = {
                'latitude': location.latitude,
                'longitude': location.longitude,
                'userId': userId
              }        
        });
    
  $scope.$on('$ionicView.enter', function(e) {
    getPosts ();
  });

  var getPosts  = function (){
    AppService.getNearbyPosts(data)
    .success(function(response){
      $scope.nearbyPosts = response.result;
      console.log(response.result);
      var links = [];

      if($scope.nearbyPosts){
        $scope.nearbyPosts.map(function(post){
          // get the first url from text
          post.first_link = post.news.match(urlRegEx);
          try{
            post.first_link = post.news.match(urlRegEx)[0];
          }catch(ex){}

          // transform news text to behave nicely with html
          // removes links and " characters from post.news
          post.sanitizedText = post.news.replace(urlRegEx, '').replace(/\"/g, '')

          post.timeAgo = moment(post.updated_date).fromNow();
        })
      }
    });

  }


  $rootScope.goToProfile = function(id){
    console.log('goto profile called with id= ', id);
    AppService.setIsCurrentUserFlag(false);
    AppService.setUserForProfilePage(id)
    .then(function(){
      $state.go('app.userprofile');
    })
  };

  $scope.openShare = function(text, link){
    window.plugins.socialsharing.share( text, null, null,link);
  };

  $scope.goToComments = function(post){
    AppService.setCurrentComments(post)
    .then(function(){
      $state.go('app.postcomments');
    })
  };

  $scope.vote = function(newsId , v){
    // pass v => '1' for upvote
    // and v=> '-1' for downvote
    AppService.vote(newsId, v)
    .then(function(response){
      if (response.data.reasonfailed){
        console.log('voting failed', response.data.message)
      }else if (response.data.success){
        $scope.nearbyPosts.map(function(post){
          if (post.id === newsId){
            post.news_count = response.data.vote;
            post.isLikedByUser = v + '';
          }
        })
      }

    }, function(err){
      console.log('error upvoting', err)
    })
  }
    
    $scope.modal2 = function() {
        ModalService.init('templates/post/add-post.html', $scope).then(function(modal) {
            modal.show();
        });
    };

    $scope.showMapForPost = function(latitude, longitude){
      latitude = parseFloat(latitude);
      longitude = parseFloat(longitude);

      ModalService.init('templates/post/mapforpost.html', $scope).then(function(modal){
        modal.show();
        $scope.mapModal = modal;
      }).then(function(){
        $scope.showMap(latitude, longitude);
      });

    };
    
  $scope.showModal = function (id) {
      
    if (id == 4){

        // don't let the user post if there's no text
        if (! $scope.formData.postText) return 

        $scope.close(2);

        $scope.modal4 = function() {
            ModalService.init('templates/post/chooselocation.html', $scope, 'slide-in-right').then(function(modal) {
                modal.show();

            });
        };    

        $scope.modal4();  
        setTimeout(function(){
            $scope.showMap();
        },500);
    }        
    else  
        $scope.modal2();
  };

    $scope.close = function(id) {
        if(id == 1){
          $scope.modal1.hide();            
        }else if(id == 4){
          $scope.closeModal();
          setTimeout(function(){
            $scope.modal.remove();
            $scope.showModal(2);
          },500);
        }else if(id === 'map') {
          $scope.modal.remove();
        }else
          $scope.closeModal();
    };

  $scope.$on('$destroy', function() {
    console.log('Destroying modals...');
    $scope.alertsPopover.close();
    $scope.alertsPopover.remove();
    $scope.selectPopover.remove();
  });
    
    $scope.showMap = function(latitude, longitude){
      console.log(latitude, longitude);
        //var position = AppService.getCurrentPosition();

        //var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        
        if (!latitude) {
            var latLng = new google.maps.LatLng(37.8088139, -122.2660002);
        }else{
          var latLng = new google.maps.LatLng(latitude, longitude);
        }
        

        var mapOptions = {
          center: latLng,
            zoom: 15,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: true,
            zoomControl: false//,
            //zoomControlOptions: {
              //style: google.maps.ZoomControlStyle.SMALL
            //}
        };

        try{
          var map = new google.maps.Map(document.getElementById("cmap"), mapOptions);
        }catch(e){
          var map = new google.maps.Map(document.getElementById("post_map"), mapOptions);
        }
        console.log(latLng);
        
        var marker = new google.maps.Marker({
            position: latLng,
            map: map,
            icon: {
                url:'img/pin-blue.png',
                size: new google.maps.Size(22, 30)
            },
            // animation: google.maps.Animation.BOUNCE,
            title: "My Location"
        }); 
        
        //This is to make possible the click on the button in info window    
        var compiled = $compile('<button ng-click="post()" class="button icon-right ion-chevron-right button-positive">Post from here</button>')($scope);
        
        var infoWindow = new google.maps.InfoWindow({
            content: compiled[0]
        });
        
        var input = document.getElementById('pac-input');
        var autocomplete = new google.maps.places.Autocomplete(input);

        autocomplete.bindTo('bounds', map);

        autocomplete.addListener('place_changed', function() {
          marker.setVisible(false);
          var place = autocomplete.getPlace();
          console.log(place);
          if (!place.geometry) {
            // alert("Autocomplete's returned place contains no geometry");
            return;
          }

          // If the place has a geometry, then present it on a map.
          if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
          } else {
            map.setCenter(place.geometry.location);
            map.setZoom(17);  // Why 17? Because it looks good.
          }
          marker.setIcon(({
            url: 'img/pin-blue.png',
            size: new google.maps.Size(22, 30),
          }));
          marker.setPosition(place.geometry.location);
          marker.setVisible(true);
        });

        // TODO: handle marker drag case
        // TODO: handle getCurrentPosition case

        google.maps.event.addListener(marker, 'click', function() {
            infoWindow.open(map, marker);
            // formatted_address, news = formData.postText, places.geometry.location.latitude, places.geometry.location.longitude,
            var place = autocomplete.getPlace()
            $scope.post({
              'news': $scope.formData.postText,
              'latitude': place.geometry.location.lat(),
              'longitude': place.geometry.location.lng(),
              'address': place.formatted_address,
              'user_id': null,
            });
        });

    };    
    
    $scope.post = function (data) {
        $ionicLoading.show();

        AppService.addNewPost(data)
        .then(function (res) {
            //$scope.initialise();
            $ionicLoading.hide();
            $ionicPopup.alert({title: 'New Post', template: 'Status updated'})
            .then(function () {
                $scope.close(4);
                $scope.modal.remove();
            });
        })
        .catch(function (err) {
            console.warn(err);
            $ionicLoading.hide();
        })
        //console.log($scope.formData.postText);
    };
    
  $scope.gotoMap = function(){
    $state.go('app.postmapview');
  };
    
    //Below is the popover code
    $ionicPopover.fromTemplateUrl('templates/post/alerts.html', {
        scope: $scope
      }).then(function(popover) {
        $scope.alertsPopover = popover;
    });
        
    $scope.showAlerts = function ($event) {
        $scope.alertsPopover.show($event);        
    };
    
    //Below is the select popover code
    $ionicPopover.fromTemplateUrl('templates/post/select.html', {
        scope: $scope
      }).then(function(popover) {
        $scope.selectPopover = popover;
    });
    
    $scope.searchPosts = function(){   
        
        var searchData = {
            "latitude" :  location.latitude,//37.8088139,
            "longitude" : location.longitude, //-122.2635002,
            "radious" : $rootScope.inputRadius,
            "user_id" : userId,
            "searchText": $scope.searchTerm,
            "filter": $scope.selected.value,
            "fromPage" : 0
        };
        
        AppService.getMyPosts(searchData)
            .success(function(data){                
              $scope.nearbyPosts = data.result;
              console.log(data.result);
              $scope.toggleSearch();
              var links = [];

            $scope.nearbyPosts.map(function(post){
                // get the first url from text
                post.first_link = post.news.match(urlRegEx);
                try{
                  post.first_link = post.news.match(urlRegEx)[0];
                }catch(ex){}

                // transform news text to behave nicely with html
                // removes links and " characters from post.news
                post.sanitizedText = post.news.replace(urlRegEx, '').replace(/\"/g, '')

                post.timeAgo = moment(post.updated_date).fromNow();
            });
        });        
    };
    
    $scope.searchTerm = "";
    
    $scope.options = [{
        label:'View all',
        value:''
    },{
        label:'Mine Only',
        value: 0
    },{
        label:'My Interests',
        value: 1
    },{
        label:'Following',
        value: 2
    }];
    
    $scope.selected = $scope.options[0];    
    $scope.showSelect = function($event){
       $scope.selectPopover.show($event);
    };
    
    $scope.setOption = function(option){
        $scope.selected = option;
        $scope.selectPopover.hide();
    };
    
    $scope.toggleSearch = function(){
        
        if($scope.showSearch == true)
            $scope.showSearch = false;
        else
            $scope.showSearch = true;
    };
    
    // set post button to blue when typing
    $scope.checkInput = function(){
      $scope.textColor = '';
      if ($scope.formData.postText){
        //console.log($scope.formData.postText);
        ($scope.formData.postText.length > 0) ? $scope.textColor = 'blue' : $scope.textColor = 'gray';
      }
    } 
    
    $scope.imgUri = null;
    
    $scope.closeImage = function(){
        $scope.imgUri = null;
    };
})

.controller('NewPostCtrl', function($scope, $rootScope, $stateParams, $state, $ionicLoading, AppService){
    
    var ud = localStorage.getItem('sam_user_data');
    //console.log(ud);

    var userData = JSON.parse(ud) || '{}';

    var userId = userData.id || 0;

    $scope.addLocation = "Add location";
    $rootScope.formData = {};
    $scope.showCamBar = false;
    
    $scope.toggleCamBar = function(){
        $scope.showCamBar = !$scope.showCamBar;    
    };
    
    $scope.hideCamBar = function(){
        $scope.showCamBar = false;
    };
    
    $scope.openMedia = function(type){
        AppService.getImage(type);
        $scope.toggleCamBar();
    };
    
    $scope.clearImage = function(){
        $rootScope.imgUri = ""; 
        $scope.showCamBar = false;
    };
    
    $scope.$on('$ionicView.enter', function(e) {
        if($stateParams.address){
            $scope.addLocation = $stateParams.address;
        }
        else{
            $scope.addLocation = "Add location";
        }
        
        if($rootScope.postText){
            $scope.formData.postText = $rootScope.postText;
            $scope.textColor = 'blue';
        }
    });

    
    // set post button to blue when typing
    $scope.checkInput = function(){
      $scope.textColor = '';
      if ($scope.formData.postText){
        //console.log($scope.formData.postText);
        $rootScope.postText =  $scope.formData.postText; 
        ($scope.formData.postText.length > 0) ? $scope.textColor = 'blue' : $scope.textColor = 'gray';
      }
    };

    $scope.postNews = function () {
        $ionicLoading.show({
               template: '<ion-spinner class="spinner-calm"></ion-spinner><br/>Posting ...',
               duration: 20000 //Dismiss after 20 seconds
        });

        var data = {
            "news" : $scope.formData.postText,
            "user_id" : userId,
            "latitude" : $stateParams.latitude,
            "longitude" : $stateParams.longitude,
            "address" : $stateParams.address
        };

        $ionicLoading.show('Posting ...');
        AppService.addNewPost(data).then(
                function(res){
                    console.log('Post Success ...');
                    console.log(JSON.stringify(res));
                    $ionicLoading.hide();
                    $rootScope.postText = '';
                    $state.go('app.postlistview');
                },
                function(error){
                    console.log(JSON.stringify(error));
                },
                function(progress){
                    console.log('Uploaded ' + progress.loaded + ' of ' + progress.total);
                }
            );
    };    
})

.controller('ChooseLocCtrl', function($scope, $rootScope, $state, $cordovaGeolocation, MapService){
    
    $scope.place = {};
    $scope.place.formatted_address = '';
            
    $scope.onChange = function(){
        console.log($scope.place);
        if(angular.isObject($scope.place)){
            $scope.setLocation($scope.place);
        }
    };
    
    $scope.setLocation = function(place){
        // Clear out the old marker.
        if($scope.marker){
            $scope.marker.setMap(null);
            $scope.marker = null;
        }
        
        if(place.geometry){
            var center = new google.maps.LatLng(place.geometry.location.lat(), place.geometry.location.lng());
            // If the place has a geometry, then present it on a map.
            if (place.geometry.viewport) {
              $scope.map.fitBounds(place.geometry.viewport);
            } else {
              $scope.map.setCenter(center);
              $scope.map.setZoom(17);
            }
            
            var marker = new google.maps.Marker({
                position: center,
                map: $scope.map,
                icon: {
                    url:'img/pin-blue.png',
                    size: new google.maps.Size(22, 30)
                }
            }); 
                        
            google.maps.event.addListener(marker, 'click', function() {
                var p = {
                    address: place.formatted_address,
                    latitude: place.geometry.location.lat(),
                    longitude: place.geometry.location.lng() 
                };
                
                $state.go('newpostview', p);
            }); 
            
            $scope.marker = marker;
        }        
    };
    
    $scope.setCurrentLocation = function(){
        $scope.setLocation($scope.myPlace); 
    };

    $scope.clearText = function(){
        $scope.place.formatted_address = '';
    };
    
    $scope.$on('$ionicView.enter', function(e) {
        $scope.showMap();
    });
    
    $scope.showMap = function(){
        var posOptions = {timeout: 10000, maximumAge:120000, enableHighAccuracy: false};

        $cordovaGeolocation.getCurrentPosition(posOptions)
            .then(function (position) {
                var lat  = position.coords.latitude;
                var long = position.coords.longitude;
            
                //Get place from lat, lng
                MapService.getPlace(lat, long).then(
                    function(place){
                        //console.log(JSON.stringify(place));
                        $scope.myPlace = place;
                        //Create map
                        var mapOptions = {
                            zoom: 17,
                            mapTypeId: google.maps.MapTypeId.ROADMAP,
                            disableDefaultUI: true,
                            zoomControl: false
                        };

                        var map = new google.maps.Map(document.getElementById("cmap"), mapOptions);
                        $scope.map = map;

                        google.maps.event.addListener((map), 'dragend',
                            function(event) {
                                var center = this.getCenter();
                                MapService.getPlace(center.lat(), center.lng()).then(
                                    function(place){
                                      $scope.setLocation(place);  
                                });
                        });

                        $scope.setLocation(place);                        
                    }
                );
            }, function(err) {
                // error
                console.error('Failed to get current position. Error: ' + JSON.stringify(err));
                //deferred.reject(err.message);
                // return err;
            });        
    };
})

.controller('MapCtrl', function($scope, $rootScope, $state, $stateParams, $timeout, $ionicLoading, $ionicPopup, $ionicPopover, $cordovaGeolocation, $compile, AppService, MapService, ModalService) {
    
    $rootScope.inputRadius = 0.8;
    $scope.userData = JSON.parse(localStorage.getItem('sam_user_data')) || '{}';
    $scope.onRadiusChange = function(){
        console.log('$scope.circleRadius: ' + $scope.circleRadius);
        $rootScope.inputRadius = $scope.circleRadius;
        //Redraw circle and fetch new post locations
        if(AppService.isConnected()){
            MapService.refreshMap();
        }
        else{
            AppService.showErrorAlert('No Internet Connection', 'There seems to be a network problem. Please check your internet connection and try again.');
        }
    };
    
    $scope.resetMap = function(){
        if(AppService.isConnected()){
            MapService.refreshMap();
        }
        else{
            AppService.showErrorAlert('No Internet Connection', 'There seems to be a network problem. Please check your internet connection and try again.');
        }        
    };
    
    $scope.formData = {};
    $scope.fileName = {};
    $scope.searchTerm = "";

    if(AppService.isConnected()){
        //Make an empty map at the start
        MapService.initMap();

        //Make circle and markers at the start
        MapService.refreshMap();          
    }
    else{
        AppService.showErrorAlert('No Internet Connection', 'There seems to be a network problem. Please check your internet connection and try again.');        
    }    
    
    var ud = localStorage.getItem('sam_user_data');
    console.log(ud);

    var userData = JSON.parse(ud) || '{}';

    var userId = userData.id || 0;

    if(userData.Profile_image)
        $scope.formData.Profile_image = userData.Profile_image;
    else
        $scope.formData.Profile_image = 'img/avatar.png';//Default image
    
    $scope.nearbyPosts = {};

    $scope.showModal = function (id) {
        // $state.go('app.postlistview');
        if(id == 1)
            $scope.modal1.show();
        else if (id == 2){//I think this block is no longer required as add-post screen has become a state
            $scope.modal2 = function() {
                ModalService.init('templates/post/add-post.html', $scope).then(function(modal) {
                    modal.show();
                });
            };
            
            $scope.imgUri = null;
            $scope.modal2();
        }
        else if (id == 3){
            $scope.modal3 = function() {
                ModalService.init('templates/post/mapmodal.html', $scope).then(function(modal) {
                    modal.show();                    
                });
            };    
            
            $scope.modal3();
        }
        else if (id == 4){//This has also become a state so not required
            
            $scope.close(2);

            $scope.modal4 = function() {
                ModalService.init('templates/post/chooselocation.html', $scope, 'slide-in-right').then(function(modal) {
                    modal.show();
                });
            };    
            
            $scope.modal4();  
            //setTimeout(function(){
                //$scope.showMap();
            //},500);
        }        
    };
    
    $scope.viewMode = 'half-view';
    $scope.showMapModalBar = false;


    var fetchComments = function (post) {
      AppService.getCurrentComments(post)
      .then(function(current){
        console.log('response', current);
        $scope.postComments = current.comments || [];
        try{
          $scope.postComments.map(function(comment){
            comment.timeAgo = moment(comment.commTime).fromNow();
          })
        } catch (err){
          console.log(err);
        }

      }, function(error){
        $ionicLoading.hide();
        console.warn('error getting comments');
      });
    }
    
    $scope.showFullView = function(post){
        if(!$scope.showMapModalBar){
          $scope.viewMode = 'full-view';
          $timeout(function(){
            $scope.showMapModalBar = true;
          }, 600);
          fetchComments(post);
        }
    };

    $scope.goToUser = function(post){
      AppService.setUserForProfilePage(post.user_id)
      .then(function(){
        $rootScope.isCurrentUser = false;
        $scope.hideModal(); 
        $state.go('app.userprofile')
      });
    }

    $scope.openShare = function(text, link){
      window.plugins.socialsharing.share( text, null, null,link);
    }

    $scope.vote = function(newsId , v){
      console.log($scope.post);

      AppService.vote(newsId, v)
      .then(function(response){
        console.log('response->', response)
        if (response.data.reasonfailed){
          console.log('voting failed', response.data.message)
        }else if (response.data.success){
          $scope.post.news_count = response.data.vote;
          $scope.post.isLikedByUser = v +'';
        }
      }, function(err){
        console.log('error upvoting', err)
      })
    }

    $scope.swipe = function(direction, thisPost){
      var index = $scope.currentPosts.indexOf(thisPost);

      if(direction === 'left' && index < $scope.currentPosts.length - 1){
        $scope.post = $scope.currentPosts[index+1];
      }else if(index > 0){
        $scope.post = $scope.currentPosts[index-1];
      } 

      fetchComments($scope.post);
    };
    
    $scope.hideModal = function(){
        $scope.postComments = null;
        $scope.viewMode = 'half-view';
        $scope.showMapModalBar = false;
        $scope.closeModal();
    };
    
    $scope.close = function(id) {
        if(id == 1){
            $scope.modal1.hide();            
        }
        if(id == 4){
            $scope.closeModal();
            setTimeout(function(){
                $scope.modal.remove();
                $scope.showModal(2);
            },500);
        }            
        else{
            $scope.closeModal();
            $scope.modal.remove();
        }
    };
            
    $rootScope.$on("refreshdone", function(event, data){     
            $scope.currentPosts = $rootScope.currentPosts;
        
          for (var i = 0; i < $rootScope.markers.length; i++) {
            google.maps.event.addListener($rootScope.markers[i], 'click', function() {
                    $scope.post = this.post;                    
                    $scope.showModal(3);
            });
          }
    });

    $scope.$on("mapview:openlist", function(event,data) {
        $scope.showModal(1);
    });
    
    $scope.$on("hidemapmodal", function(event,data) {
        $scope.close(3);
    });  
    
    $scope.$on('$destroy', function() {
      console.log('Destroying modals...');
      //$scope.modal1.remove();
      $scope.popover.remove();
      $scope.selectPopover.remove();  
    });
        
    //Below is the popover code
    $ionicPopover.fromTemplateUrl('templates/post/alerts.html', {
        scope: $scope
      }).then(function(popover) {
        $scope.popover = popover;
    });

    $rootScope.alertActions = function (type){
      switch(type.toLowerCase()){
        case 'friend':
          $scope.popover.hide();
          $state.go('app.userfollowing');
          break;
        case 'message':
          $scope.popover.hide();
          $state.go('app.usermessages');
          break;
        default:
          $scope.popover.hide();
      }
    }
    
    $scope.showAlerts = function ($event) {
      console.log('showAlerts called ...');
      // $scope.alerts = [
      //   {
      //     user: "Amie Roger",
      //     message: "This is a test message to see how it looks like.",
      //     time: "July 10, 9:15am",
      //     profileImage: "img/eskimo.jpg"
      //   },
      //   {
      //     user: "Amie Roger",
      //     message: " This is a test message. This indeed is a test.",
      //     time: "July 10, 9:15am",
      //     profileImage: "img/eskimo.jpg"
      //   },
      //
      //   {
      //     user: "Amie Roger",
      //     message: "This is a different test message. It is a bit longer. It will tell you how longer messages will look like. That should be enough.",
      //     time: "July 10, 9:15am",
      //     profileImage: "img/eskimo.jpg"
      //   },        
      //   {
      //     user: "Amie Roger",
      //     message: "This is very short.",
      //     time: "July 10, 9:15am",
      //     profileImage: "img/eskimo.jpg"
      //   },
      //
      //   {
      //     user: "Amie Roger",
      //     message: "This is just more than short.",
      //     time: "July 10, 9:15am",
      //     profileImage: "img/eskimo.jpg"
      //   },
      //   {
      //     user: "Amie Roger",
      //     message: "This is a long message but not that long.",
      //     time: "July 10, 9:15am",
      //     profileImage: "img/eskimo.jpg"
      //   }];

        $scope.popover.show($event);        
    };
    
    //Below is the select popover code
    $ionicPopover.fromTemplateUrl('templates/post/select.html', {
        scope: $scope
      }).then(function(popover) {
        $scope.selectPopover = popover;
    });
    
    $scope.searchPosts = function(){                
        MapService.refreshMap({searchTerm: $scope.searchTerm, filter: $scope.selected.value});
        $scope.toggleSearch();
    };
    
    $scope.options = [{
        label:'View all',
        value:''
    },{
        label:'Mine Only',
        value: 0
    },{
        label:'My Interests',
        value: 1
    },{
        label:'Following',
        value: 2
    }];
    
    $scope.selected = $scope.options[0];    
    $scope.showSelect = function($event){
       $scope.selectPopover.show($event);
    };
    
    $scope.setOption = function(option){
        $scope.selected = option;
        $scope.selectPopover.hide();
    };
    
    $scope.toggleSearch = function(){
        
        if($scope.showSearch == true)
            $scope.showSearch = false;
        else
            $scope.showSearch = true;
    };
    
      $scope.openShare = function(text, link){
        window.plugins.socialsharing.share( text, null, null,link);
      };

      $scope.goToComments = function(post){
        $scope.hideModal();
        AppService.setCurrentComments(post)
        .then(function(){
          $state.go('app.postcomments');
        })
      };

    // Load map (refresh) on login
    $rootScope.$on('login', function(event, data) {
        //console.log('login event received ....');
        MapService.refreshMap();
    });

    document.addEventListener("resume", function(e) {//Cordova event
        //console.log('App activated ... Cordova');
        if(AppService.isConnected()){
            MapService.refreshMap();
        }
        else{
            AppService.showErrorAlert('No Internet Connection', 'There seems to be a network problem. Please check your internet connection and try again.');        
        }    
    }, false);    

    // for 'following' page and also refresh map
    $scope.$on('$ionicView.enter', function(e) {
        getFollowers();
        getAlerts();
        //Causes the map to redraw
        google.maps.event.trigger($rootScope.map, 'resize');
    });

    var getAlerts = function(){
      AppService.getAlerts()
      .then(function(res){
        $rootScope.alerts = res.data.result;
        if (!res.data.result){
          $rootScope.alerts = [{
            message: 'No messages'
          }]
        }
      })
    };

    var getFollowers = function (){
      AppService.getFollowing()
      .success(function(data){
        // this should be following and not followers
        // but let's keep it this way for now. :)
        $rootScope.followers = data.result;
        console.log('following', data);
      })
    };

    $scope.showMapForPost = function(latitude, longitude){
      $scope.hideModal(); 
      latitude = parseFloat(latitude);
      longitude = parseFloat(longitude);

      ModalService.init('templates/post/mapforpost.html', $scope).then(function(modal){
        modal.show();
        $scope.mapModal = modal;
      }).then(function(){
        $scope.showMap(latitude, longitude);
      });

    };

    $scope.showMap = function(latitude, longitude){
      console.log(latitude, longitude);
      if (!latitude) {
        var latLng = new google.maps.LatLng(37.8088139, -122.2660002);
      }else{
        var latLng = new google.maps.LatLng(latitude, longitude);
      }
      var mapOptions = {
        center: latLng,
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true,
        zoomControl: false//,
      };
      try{
        var map = new google.maps.Map(document.getElementById("cmap"), mapOptions);
      }catch(e){
        var map = new google.maps.Map(document.getElementById("post_map"), mapOptions);
      }
      console.log(latLng);

      var marker = new google.maps.Marker({
        position: latLng,
        map: map,
        icon: {
          url:'img/pin-blue.png',
          size: new google.maps.Size(22, 30)
        },
        title: "My Location"
      }); 
    };    
})

.directive('focusMe', function($timeout) {
  return {
    link: function(scope, element, attrs) {

      $timeout(function() {
        element[0].focus(); 
      });
    }
  };
});

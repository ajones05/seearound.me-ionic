angular.module('SeeAroundMe.controllers', [])

.controller('AppCtrl', function($scope, AppService, $timeout, $ionicHistory, $ionicLoading, $rootScope, $state) {
    
  $scope.$on('$ionicView.enter', function(e) {
      $scope.User = JSON.parse(localStorage.getItem('sam_user_data'));
  });
      
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
        //It is important to clear cache and history
        $ionicLoading.show({
                template: 'Signing out ...'
        });

      //Remove user login id and data
      localStorage.removeItem('sam_user_location');
      localStorage.removeItem('sam_user_data');
      
      AppService.setUserId(0);
      AppService.setAuthToken(null);
      
      //Facebook logout
      facebookConnectPlugin.logout(function(){
          //console.log('FB logout success ...');
      },
      function(fail){
          //console.log('FB logout error ...');
      });
      
      //Loop through all the markers and remove
      if($rootScope.markers){
        $rootScope.markers.map(function(marker){
          marker.setMap(null);
        })
      }
      
      $rootScope.markers = [];
      
            
        $state.go('home');

        $timeout(function () {
                 $ionicHistory.clearCache();
                 $ionicHistory.clearHistory();
                 $ionicLoading.hide();
        }, 2000);
  };
})

.controller('IntroCtrl', function($scope, $rootScope, $state, $ionicSlideBoxDelegate, MapService, AppService) {
 
  $scope.location = '';
  // Called to navigate to the main app
  $scope.startApp = function() {
    //Check location  
    MapService.getCurrentPosition()
        .then(function(position){
            //Here, we want to check whether the user's current location is within a specified area or not
            var lat  = position.coords.latitude;
            //var lat = 37.8088139;
            var long = position.coords.longitude;
            //var long = -122.2660002;
        
            $rootScope.loc = lat + ',' + long;

            //User's location
            //var location = new google.maps.LatLng(lat, long);
        
        /*
            //The specified area represented by bounds rectangle
            var bounds = new google.maps.LatLngBounds(
                new google.maps.LatLng(37.7169, -122.5004),
                new google.maps.LatLng(37.8948, -122.1261)
            );

            //Returns true if the location is within the area
            var isLocInArea = bounds.contains(location);
        */
            //if(isLocInArea){//Location is within specified area
                //Fine, lets go to the app
                $state.go('home');
            //}
            //else{//Location is outside the specified area
                //Can't allow this user to go inside ... show form
                //$state.go('outareaform');
            //}
        },function(err) {
            // error
            //console.error('Failed to get current position. Error: ' + JSON.stringify(err));
            $ionicPopup.alert({
                 title: 'See Around Me Alert',
                 subTitle: 'Current Location',
                 template: 'Failed to get your location. Make sure you are connected to the internet and allowed gelocation on your devivce.'
            });
        });      
  };
    
  $scope.formData = { email: '' };
              
  $scope.submitEmail = function() {
      
      if($scope.formData.email){
        //Submit email        
        var data = {
            "entry.1" : new Date().getTime(), 
            "entry.364269482" : $scope.formData.email, 
            "entry.1803428188": $rootScope.loc
        };
      
        AppService.submitEmail(data).then(function(res){
            //console.log('Status: ' + res.status);
            if(res.status == 200){
                AppService.showErrorAlert('Email Submitted', 'The email has been submitted successfully. Thanks!');
            }
        });
      }
      else{//Invalid email
          AppService.showErrorAlert('Invalid Email', 'The email you provided is not valid email address. Please try again.');
      }
  };
    
  $scope.next = function() {
    $ionicSlideBoxDelegate.next();
  };
    
  $scope.previous = function() {
    $ionicSlideBoxDelegate.previous();
  };

  // Called each time the slide changes -- index is 0 based
  $scope.slideChanged = function(index) {
    $scope.slideIndex = index;
  };
})

.controller('HomeCtrl', function($scope, $rootScope, $timeout, $state, $ionicLoading, MapService, AppService) {
    
    MapService.getCurrentPosition()
        .then(function (position) {
            var lat  = position.coords.latitude;
            var long = position.coords.longitude;
            var location = {latitude: lat, longitude: long};
            var mylocation = JSON.stringify(location);

            localStorage.setItem('sam_user_location', mylocation);

            //console.log(mylocation);
    });
    
    $scope.loginWithFB = function(){
            //console.log('loginWithFB called ...');
        if(!AppService.isConnected()){
            AppService.showErrorAlert('No Internet Connection', 'There seems to be a network problem. Please check your internet connection and try again.');
        
            return;
        }
        
        // This is the success callback from the login method
        var fbLoginSuccess = function(response) {
            if (!response.authResponse){
              fbLoginError("Cannot find the authResponse");
              return;
            }

            var authResponse = response.authResponse;

             //console.log(authResponse.accessToken);
             var data = {token: authResponse.accessToken};
             //$ionicLoading.show();
             AppService.fbLogin(data)
                .success(function (response) {
                    $ionicLoading.hide();
                     //console.log(JSON.stringify(response));
                     if(response.status == 'SUCCESS'){
                        AppService.setUserId(response.result.id);
                        AppService.setAuthToken(response.result.token);
                        localStorage.setItem('sam_user_data', JSON.stringify(response.result));
                        $rootScope.isBeforeSignUp = false;
                        $state.go('app.postlistview');
                     }
                     else{
                        AppService.showErrorAlert('Failed to login!', response.message);
                     }
             })
             .error(function (err) {
                    $ionicLoading.hide();
                    AppService.showErrorAlert('Failed to login!', 'There seems to be a network problem. Please check your internet connection and try again.');
                    //console.warn(JSON.stringify(err));
            });
        };

          // This is the fail callback from the login method
          var fbLoginError = function(error){
                //console.log('fbLoginError', error);
                $ionicLoading.hide();
          };

         //Now check login status and login if required
            //console.log('Going to call facebookConnectPlugin ...');
         facebookConnectPlugin.getLoginStatus(function(fbData){
              if(fbData.status === 'connected'){
                    // The user is logged in and has authenticated your app, and response.authResponse supplies
                    // the user's ID, a valid access token, a signed request, and the time the access token
                    // and signed request each expire
                    //console.log('getLoginStatus', fbData.status);
                    //console.log('success.authResponse: ' + fbData.authResponse);  

                     //console.log(fbData.authResponse.accessToken);
                     var data = {token: fbData.authResponse.accessToken};
                    $ionicLoading.show({
                            template: 'Logging in...'
                    });
                     AppService.fbLogin(data)
                        .success(function (response) {
                                $ionicLoading.hide();
                                 //console.log(JSON.stringify(response));
                                 if(response.status == 'SUCCESS'){
                                    AppService.setUserId(response.result.id);
                                    AppService.setAuthToken(response.result.token);
                                    localStorage.setItem('sam_user_data', JSON.stringify(response.result));
                                    $rootScope.isBeforeSignUp = false;
                                    $state.go('app.postlistview');
                                 }
                                 else{
                                    AppService.showErrorAlert('Failed to login!', response.message);
                                 }
                        })
                         .error(function (err) {
                                $ionicLoading.hide();
                                AppService.showErrorAlert('Failed to login!', 'There seems to be a network problem. Please check your internet connection and try again.');
                                //console.warn(JSON.stringify(err));
                        });
                  
              } else {
                    // If (fbData.status === 'not_authorized') the user is logged in to Facebook,
                    // but has not authenticated your app
                    // Else the person is not logged into Facebook,
                    // so we're not sure if they are logged into this app or not.

                    //console.log('getLoginStatus', fbData.status);

                    $ionicLoading.show({
                            template: 'Logging in...'
                    });

                    // Ask the permissions you need. You can learn more about
                    // FB permissions here: https://developers.facebook.com/docs/facebook-login/permissions/v2.4
                    facebookConnectPlugin.login(['email'], fbLoginSuccess, fbLoginError);
              }
            });        
    };                    

})

.controller('SignupCtrl', function($scope, $rootScope, $timeout, $state, $ionicLoading, MapService, AppService) {
    //console.log('Signup controller called ...');
    $scope.formData = {};
    $scope.imgUri = '';        
    $scope.doSignUp = function(user){
        //console.log('Signup ...');
        if(!AppService.isConnected()){
            AppService.showErrorAlert('No Internet Connection', 'There seems to be a network problem. Please check your internet connection and try again.');
            
            return;
        }
        
        /*
        if($scope.formData.password !== $scope.formData.repeatPW){
            AppService.showErrorAlert('Passwrod Mismatch', 'Repeated password does not match the value in password field!');            
            return;
        }*/
        
        var data = {
            name: $scope.formData.name,
            email: $scope.formData.email, 
            password: $scope.formData.password,
            street_number: '',
            street_name: '',
            city: '',
            state: '',
            country: '',
            zip: ''            
        };
        
        $rootScope.userData = data;
        
        $scope.prepareToRegister();
    };
    
    $scope.doRegister = function(userData){
        $ionicLoading.show();
        AppService.signUp(userData, $scope.imgUri).then(
                function (res) {
                    //console.log('SUCCESS ...... got reponse');
                    //console.log(JSON.stringify(res));
                    $ionicLoading.hide();
                    if(res.data)
                        var resObj = res.data;
                    else
                        var resObj = JSON.parse(res.response);
                    
                    //console.log(resObj);
                    if(resObj.status == 'SUCCESS'){
                        $rootScope.isBeforeSignUp = false;
                        //Set user thumbnail
                        
                        //$state.go('app.postmapview');
                         AppService.login(userData)
                         .success(function (response) {
                                //console.log(JSON.stringify(response));
                                $ionicLoading.hide();
                                if(response.status == 'SUCCESS'){
                                  AppService.setUserId(response.result.id);
                                  AppService.setAuthToken(response.result.token);
                                    //Set user thumbnail
                                    response.result.Profile_image = resObj.data.thumb;
                                  localStorage.setItem('sam_user_data', JSON.stringify(response.result));
                                  $rootScope.isBeforeSignUp = false;
                                  $state.go('app.postlistview');
                                    //$timeout(function(){
                                          //$rootScope.$broadcast('login',{});
                                    //}, 1000);
                                }
                                else{
                                  AppService.showErrorAlert('Failed to login!', response.message);
                                }
                        })
                         .error(function (err) {
                                $ionicLoading.hide();
                                AppService.showErrorAlert('Failed to login!', 'There seems to be a network problem. Please check your internet connection and try again.'); 
                                //console.warn(JSON.stringify(err));
                        });
                    }
                    else{
                       AppService.showErrorAlert('Failed to register!', resObj.message);
                       //$state.go('signup');
                    }
                },
                function (err) {
                    $ionicLoading.hide();
                    AppService.showErrorAlert('Failed to register!', 'There seems to be a network problem. Please check your internet connection and try again.'); 
                    //console.warn(JSON.stringify(err));
                    //$state.go('signup');
                },
                function(progress){
                    console.log('Uploaded ' + progress.loaded + ' of ' + progress.total);
                }
            ); 
    };

    $scope.prepareToRegister = function(){
        //console.log('prepareToRegister ...');
        //Get geolocation -- stores in local storage
        MapService.getCurrentPosition()
            .then(function (position) {
                var lat  = position.coords.latitude;
                var long = position.coords.longitude;
                var location = {latitude: lat, longitude: long};
                var mylocation = JSON.stringify(location);

                localStorage.setItem('sam_user_location', mylocation);

                //console.log(mylocation);
            
                //Get place from location coordinates
                MapService.getPlace(lat, long).then(function(place){
                    var components = place.address_components;
                    
                    var userData = $rootScope.userData;
                    userData.latitude = lat;
                    userData.longitude = long;
                    //Get address components
                    for (var i = 0; i < components.length; i++) {
                        //console.log(components[i]);
                        switch(components[i].types[0]){
                                
                            case 'street_number':
                                 userData.street_number = components[i].short_name;
                                 break;                                
                            case 'route':
                                 userData.street_name = components[i].long_name;
                                 break;
                            case 'locality':
                                 userData.city = components[i].short_name;
                                 break;
                            case 'administrative_area_level_1':
                                 userData.state = components[i].short_name;
                                 break;
                            case 'country':
                                 userData.country = components[i].short_name;
                                 break;
                            case 'postal_code':
                                 userData.zip = components[i].short_name;
                                 break;                                
                        }
                    }
                    
                    //console.log(JSON.stringify(userData));
                    
                    $scope.doRegister(userData);
                });

            }, function(err) {
                // error
                //console.error('Failed to get current position. Error: ' + JSON.stringify(err));
            });
            
    };    
                
    $scope.openTerms = function(){
        //console.log('openTerms ...');
        $rootScope.isBeforeSignUp = true;
        $state.go('terms');
    };
    
    $scope.openPrivacy = function(){
        //console.log('openPrivacy ...');
        $rootScope.isBeforeSignUp = true;
        $state.go('privacy');
    };
    
    $scope.showCamBar = false;
    
    $scope.toggleCamBar = function(){
        $scope.showCamBar = !$scope.showCamBar;    
    };
    
    $scope.hideCamBar = function(){
        $scope.showCamBar = false;
    }; 
    
    $scope.openMedia = function(type){
        AppService.getImage(type).then(function(imgUri){
            $scope.imgUri = imgUri;
        });
        
        $scope.toggleCamBar();
    };
    
    $scope.clearImage = function(){
        $scope.imgUri = ""; 
        $scope.showCamBar = false;
    };    
})

.controller('SigninCtrl', function($scope, $timeout, $rootScope, $state, $ionicLoading, $ionicPopup, AppService, $ionicModal) {

  $scope.formData = {};
  //$scope.formData.email = "brandonhere123@gmail.com";
  //$scope.formData.password = "dev12345678";


  $scope.doLogin = function () {

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
            //console.log('data -> ', JSON.stringify(response.result));
            AppService.setUserId(response.result.id);
            AppService.setAuthToken(response.result.token);
            localStorage.setItem('sam_user_data', JSON.stringify(response.result));
            $rootScope.isBeforeSignUp = false;
            $state.go('app.postlistview');
            //Fire login event to cause the map to refresh
            //$timeout(function(){
                  //$rootScope.$broadcast('login',{});
            //}, 1000);
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
        
        // This is the success callback from the login method
        var fbLoginSuccess = function(response) {
            if (!response.authResponse){
              fbLoginError("Cannot find the authResponse");
              return;
            }

            var authResponse = response.authResponse;

             //console.log(authResponse.accessToken);
             var data = {token: authResponse.accessToken};
             $ionicLoading.show();
             AppService.fbLogin(data)
                .success(function (response) {
                    $ionicLoading.hide();
                     //console.log(JSON.stringify(response));
                     if(response.status == 'SUCCESS'){
                        AppService.setUserId(response.result.id);
                        AppService.setAuthToken(response.result.token);
                        localStorage.setItem('sam_user_data', JSON.stringify(response.result));
                        $rootScope.isBeforeSignUp = false;
                        $state.go('app.postlistview');
                     }
                     else{
                        AppService.showErrorAlert('Failed to login!', response.message);
                     }
             })
             .error(function (err) {
                    $ionicLoading.hide();
                    AppService.showErrorAlert('Failed to login!', 'There seems to be a network problem. Please check your internet connection and try again.');
                    //console.warn(JSON.stringify(err));
            });
        };

          // This is the fail callback from the login method
          var fbLoginError = function(error){
                //console.log('fbLoginError', error);
                $ionicLoading.hide();
          };

         //Now check login status and login if required
         facebookConnectPlugin.getLoginStatus(function(fbData){
              if(fbData.status === 'connected'){
                    // The user is logged in and has authenticated your app, and response.authResponse supplies
                    // the user's ID, a valid access token, a signed request, and the time the access token
                    // and signed request each expire
                    //console.log('getLoginStatus', fbData.status);
                    //console.log('success.authResponse: ' + fbData.authResponse);  

                     //console.log(fbData.authResponse.token);
                     var data = {token: fbData.authResponse.token};
                     $ionicLoading.show();
                     AppService.fbLogin(data)
                        .success(function (response) {
                                $ionicLoading.hide();
                                 //console.log(JSON.stringify(response));
                                 if(response.status == 'SUCCESS'){
                                    AppService.setUserId(response.result.id);
                                    AppService.setAuthToken(response.result.token);
                                    localStorage.setItem('sam_user_data', JSON.stringify(response.result));
                                    $rootScope.isBeforeSignUp = false;
                                    $state.go('app.postlistview');
                                 }
                                 else{
                                    AppService.showErrorAlert('Failed to login!', response.message);
                                 }
                        })
                         .error(function (err) {
                                $ionicLoading.hide();
                                AppService.showErrorAlert('Failed to login!', 'There seems to be a network problem. Please check your internet connection and try again.');
                                //console.warn(JSON.stringify(err));
                        });
                  
              } else {
                    // If (fbData.status === 'not_authorized') the user is logged in to Facebook,
                    // but has not authenticated your app
                    // Else the person is not logged into Facebook,
                    // so we're not sure if they are logged into this app or not.

                    //console.log('getLoginStatus', fbData.status);

                    $ionicLoading.show({
                            template: 'Logging in...'
                    });

                    // Ask the permissions you need. You can learn more about
                    // FB permissions here: https://developers.facebook.com/docs/facebook-login/permissions/v2.4
                    facebookConnectPlugin.login(['email', 'public_profile'], fbLoginSuccess, fbLoginError);
              }
            });        
    };                    
    
    $scope.resetPW = function(){
        if($scope.formData.email && $scope.formData.email.length > 0){
            
            AppService.resetPassword($scope.formData.email).then(function(){
                //console.log('Email sent ...');
            });
            
            $ionicPopup.alert({
                 title: 'Reset Password',
                 subTitle: 'Forgot your password?',
                 template: 'No worries, you should receive an email with a link to reset your password shortly.'
           });
        }
        else{
            $ionicPopup.prompt({
               title: 'Reset Password',
               template: 'Please enter your email address',
               inputType: 'email',
               inputPlaceholder: 'Email ...'
             }).then(function(email) {
                if(email){
                    AppService.resetPassword(email).then(function(){
                        //console.log('Email sent ...');
                    });

                    $ionicPopup.alert({
                         title: 'Reset Password',
                         template: 'Thanks! You should receive an email with a link to reset your password shortly.'
                   });
                }
                else{
                    $ionicPopup.alert({
                         title: 'Reset Password',
                         template: 'This email does not seem to be a valid email address. Please enter a valid email address.'
                   });                    
                }
             });
        }
    }; 
})

.controller('ProfileCtrl', function($scope, $rootScope, $state, AppService, $timeout, ModalService, $ionicLoading, $ionicHistory){
  // isCurrentUser var is set to differentiate the loggedIn user
  // from other users.
  $scope.User = null;
  $scope.$on('$ionicView.beforeEnter', function(e) {
    //console.log('is the logged in user => ', $rootScope.isCurrentUser);
    $scope.User = null;
    if ($rootScope.isCurrentUser){
      //Must set this
      $scope.isCurrentUser = true;
      $scope.User = JSON.parse(localStorage.getItem('sam_user_data'));
        if($scope.User.Birth_date){
             $timeout(function(){
                      var today = new Date();
                      var dob = $scope.User.Birth_date.replace(/-/g,'/');
                      var birthday = new Date(dob);
                      $scope.User.Birth_date = birthday;
                      $scope.User.Age = today.getFullYear() - birthday.getFullYear();
                      var diffMonths = today.getMonth() - birthday.getMonth();
                      if (diffMonths < 0 || ( diffMonths === 0 && today.getDate() < birthday.getDate())) {
                        $scope.User.Age = $scope.User.Age - 1;
                      }
            }, 200);            
        }
        else{
            $scope.User.Age = '';
        }
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
        //console.log('other user-> ', res.data);
        $scope.User = res.data.result;
        $scope.isFriend = res.data.friends;
        if($scope.User.Birth_date){
             $timeout(function(){
                      var today = new Date();
                      var dob = $scope.User.Birth_date.replace(/-/g,'/');                      
                      var birthday = new Date(dob);
                      $scope.User.Birth_date = birthday;
                      $scope.User.Age = today.getFullYear() - birthday.getFullYear();
                      var diffMonths = today.getMonth() - birthday.getMonth();
                      if (diffMonths < 0 || ( diffMonths === 0 && today.getDate() < birthday.getDate())) {
                        $scope.User.Age = $scope.User.Age - 1;
                      }
            }, 200);            
        }
        else{
            $scope.User.Age = '';
        }
          // }
      }, function(err){
        //console.log(err);
        $ionicLoading.hide();
        AppService.showErrorAlert(
          'Profile',
          'Oops! there was an error loading user profile'
        )
      })
    }
  });
    
  $scope.follow = function(){
      AppService.followUser($scope.User.id).then(function(result){
          if(result.data.status == 'SUCCESS')
            $scope.isFriend = true;
          //console.log(JSON.stringify(result));
      });
  };
    
  $scope.unfollow = function(){
      AppService.unfollowUser($scope.User.id).then(function(result){
          if(result.data.status == 'SUCCESS')
            $scope.isFriend = false;
          //console.log(JSON.stringify(result));
      });      
  };
    
  $scope.showUserPosts = function(){
      
      $rootScope.isFromProfileView = true;
      
      $state.go('app.postmapview');
      
      setTimeout(function(){
            $rootScope.markers.forEach(function(marker){
                  if(marker.post && marker.post.user_id != $scope.User.id){
                      marker.setMap(null);
                  }
            });
      }, 2000);
  };

  $scope.showNewMessageModal = function(user){
    //console.log(JSON.stringify(user));
    AppService.setOtherUser(user);
    $scope.newMessage = {};
    $scope.user = user;
      
    ModalService.init('templates/new_conversation.html', $scope).then(function(modal) {
      $scope.modal = modal;      
      modal.show();
    });
  }

  $scope.closeModal = function(){
    $scope.modal.remove();
  };
    
  // set send message button to blue when typing
  $scope.checkInput = function(){
    $scope.textColor = '';
    if ($scope.newMessage.subject){
      ($scope.newMessage.subject.length > 0) ? $scope.textColor = 'blue' : $scope.textColor = 'gray';
    }
  };         

  $scope.sendMessage = function(){
      if($scope.newMessage.subject.length == 0)
          return;
    //console.log($scope.newMessage, $scope.user);
    $ionicLoading.show({template: 'Sending ...'});
    AppService.sendMessage(
      $scope.user.id,
      $scope.newMessage.subject,
      $scope.newMessage.message
    ).then(function(res){
      $ionicLoading.hide();
      if(res.data.status == 'SUCCESS'){
          
            $state.go('app.userchat', { from: res.data.result.conversation_id });
      }
        
      $scope.modal.remove();        
    }, function(error){
      $ionicLoading.hide();
      AppService.showErrorAlert(
        'Sorry',
        'There was an error sending your message'
      )
    });
  };
    
  $scope.goBack = function(){
      $ionicHistory.goBack();
  };

})

.controller('EditProfileCtrl', function($scope, $state, $rootScope, AppService, $ionicLoading, $ionicPopover){
    
    $scope.$on('$ionicView.enter', function(e) {        
          $scope.User = JSON.parse(localStorage.getItem('sam_user_data'));
        //console.log('$scope.User.Birth_date: ' + $scope.User.Birth_date);
        if($scope.User.Birth_date){
            var dob = moment(new Date($scope.User.Birth_date.replace(/-/g,"/"))).format('MM/DD/YYYY');
            //console.log('dob after format: ' + dob);
            $scope.User.Birth_date = new Date(dob);
            //console.log('$scope.User.Birth_date -- after: ' + $scope.User.Birth_date);
        }
        
        if ($scope.User.public_profile == 1)
                $scope.User.public_profile = true;
        else
                $scope.User.public_profile = false;

        $scope.newData = angular.copy($scope.User);
        
        $scope.imgUri = $scope.User.Profile_image;        
    });
    
  $scope.makePublic = function(){
      console.log('$scope.newData.public_profile: ' + $scope.newData.public_profile);
  };

  $scope.doEdit = function(){
      
    var dob = moment($scope.newData.Birth_date).format('DD-MM-YYYY');
      console.log('dob : ' + dob);
      if($scope.newData.public_profile)
          $scope.newData.public_profile = 1;
      else
          $scope.newData.public_profile = 0;      
    
      var data = {
        name: $scope.newData.Name,
        email: $scope.newData.Email_id,
        birth_date: dob,
        public_profile: $scope.newData.public_profile,
        gender: $scope.newData.Gender,
        interest: $scope.newData.Activities
      };
      
      if($scope.imgUri && $scope.imgUri != 'http://www.seearound.me/uploads/default.jpg' && $scope.imgUri != " "){
          data.image = $scope.imgUri;
      }

    $ionicLoading.show({ template: 'Saving changes..'});
    AppService.editProfile(data, $scope.imgUri)
    .then(function(res){
      //console.log(JSON.stringify(res));
        var dataToSave = angular.copy($scope.newData);
      $ionicLoading.hide();
        
        if($scope.imgUri && !$scope.imgUri.startsWith('http') && $scope.imgUri != " "){//Case when image is uploaded
                  var resObj = JSON.parse(res.response);
                  console.log(resObj);
                    //console.log('DOB: ' + dob);
          try{
                dataToSave.Profile_image = resObj.result.Profile_image;
                dataToSave.Birth_date = resObj.result.Birth_date;
                localStorage.setItem('sam_user_data', JSON.stringify(dataToSave));
                $state.go('app.userprofile');
          }
          catch(err){
            //Do nothing
          }
        }
        else if(res.data.result){//Case without image
              dataToSave.Birth_date = res.data.result.Birth_date;
              localStorage.setItem('sam_user_data', JSON.stringify(dataToSave));
              $state.go('app.userprofile');
        }
          
        $scope.imgUri = "";
             
    }, function(error){
      $ionicLoading.hide();
    });
  };
    
    $scope.setOption = function(option){
        if(option == 0){
            $scope.newData.Gender = 'Male';
            $scope.User.Gender = 'Male';
        }
        else{
            $scope.newData.Gender = 'Female';
            $scope.User.Gender = 'Female';            
        }
        
        $scope.hideSelect();
    };
    
    var template = '<ion-popover-view style="width:190px;height:120px;">'
              +'<ion-content>'
                +'<ion-list>'
                  +'<ion-item>'
                    +'<p class="text" ng-click="setOption(0)"> Male </p>'
                  +'</ion-item>'
                      +'<ion-item>'
                    +'<p class="text" ng-click="setOption(1)"> Female </p>'
                  +'</ion-item>'
                +'</ion-list>'
              +'</ion-content>'
            +'</ion-popover-view>';

  $scope.popover = $ionicPopover.fromTemplate(template, {
    scope: $scope
  });

  $scope.showSelect = function($event) {
    $scope.popover.show($event);
  };
  $scope.hideSelect = function() {
    $scope.popover.hide();
  };
  //Cleanup the popover when we're done with it!
  $scope.$on('$destroy', function() {
    $scope.popover.remove();
  });
    
  //Camera functions
    $scope.showCamBar = false;
    
    $scope.toggleCamBar = function(){
        $scope.showCamBar = !$scope.showCamBar;    
    };
    
    $scope.hideCamBar = function(){
        $scope.showCamBar = false;
    }; 
    
    $scope.openMedia = function(type){
        
        AppService.getImage(type).then(function(imgUri){
            $scope.imgUri = imgUri;
        });
        
        $scope.toggleCamBar();
    };
    
    $scope.clearImage = function(){
        $scope.imgUri = " ";//Space is important otherwise not working 
        $scope.showCamBar = false;
    };        
})

.controller('CommentsCtrl', function($scope, $ionicLoading, $ionicPopup, AppService, ModalService, MapService, $state, $ionicScrollDelegate, $rootScope) {
  $ionicLoading.show({
    template: 'Fetching Comments..'
  });
    
  $scope.postComments = [];

  var userData = JSON.parse(localStorage.getItem('sam_user_data' ))|| '{}';
  var userId = userData.id || 0;
  AppService.setUserId(userId);
    
  AppService.getCurrentComments()
  .then(function(current){
    //console.log('response', current);
    if(current){        
        $scope.post = current.post;
        if($scope.post && $scope.post.user_id == userId){
            $scope.isOwnPost = true;
        }
        else{
            $scope.isOwnPost = false;
        }
         
        if(current.comments){
            $scope.postComments = current.comments.reverse() || [];

            $scope.postComments.map(function(comment){
              //comment.timeAgo = moment(comment.commTime).fromNow();
                if(comment.user_id == userId){
                    comment.isOwnComment = true;
                }
                else{
                    comment.isOwnComment = false;
                }                
            });
            
              if(current.comments.length < 10){
                  $scope.hasMore = false; 
              }
              else{//Presuming there are more
                  $scope.hasMore = true;
              }
        }

        $ionicLoading.hide();
    }
    else{
       $ionicLoading.hide(); 
    }
  }, function(error){
    $ionicLoading.hide();
    //console.warn('error getting comments');
  });
    
  $scope.newComment = {
      text : ''
  }

  $scope.postComment = function (){
    //console.log('commentText -> ', $scope.newComment.text);
      var user = JSON.parse(localStorage.getItem('sam_user_data' ));

    AppService.postComment($scope.newComment.text, user.id, $scope.post.id)
    .then(function(res){
      //console.log('successfully posted the comment');
      //console.log(JSON.stringify(res));
      if(res.data.result){
            $scope.post.comment_count = res.data.result.totalComments;
            res.data.result.timeAgo = moment(res.data.result.commTime).fromNow();
            res.data.result.isOwnComment = true;
            res.data.result.canEdit = true;
            $scope.postComments.push(res.data.result);
        
            $scope.newComment.text = '';
        
            $ionicScrollDelegate.scrollBottom(true);
      }
    });      
  };
    
  $scope.delComment = function(comment) {

        $ionicPopup.confirm({
            title: 'See Around Me Alert',
            template: 'Are you sure you want to delete this comment?',
            cancelText: 'No',
            okText: 'Yes'
       }).then(function(res) {
         if(res) {
            // Search & Destroy comment from list
            $scope.postComments.splice($scope.postComments.indexOf(comment), 1);
            $scope.post.comment_count = $scope.postComments.length;
            // Save list in factory
            AppService.deleteComment(comment).then(function(){
                //console.log('Comment deleted ...');
            });                 
         } 
       });
  }; 
    
    $scope.showImage = function(imageSrc){
          ModalService.init('templates/post/full-image.html', $scope).then(function(modal){
            modal.show();
            $scope.imgModal = modal;
          }).then(function(){
                $scope.imageSrc = imageSrc;
          });      
    };
    
    $scope.closeImageModal = function(){
        $scope.imgModal.remove();
    };

  $scope.showMapForPost = function(post){
      if(post.Address && post.Address.length > 0)
            $scope.address = post.Address;
      else
            $scope.address = 'Not available';
      
      ModalService.init('templates/post/mapforpost.html', $scope).then(function(modal){
        modal.show();
        $scope.mapModal = modal;
      }).then(function(){
        MapService.showPostMap(post.latitude, post.longitude);
      });
  };
    
  $scope.closeMapModal = function(){
      $scope.mapModal.remove();      
  };

    $scope.openShare = function(postId){
        //var sanitizedText = $sanitize(text);
        var link = 'http://www.seearound.me/post/' + postId;
        window.plugins.socialsharing.share( null, null, null,link);
    };
    
    $scope.openLink = function(link){
        
        window.open(link, '_blank', 'location=no');
    };
    
  $scope.hasMore = false;    
    
  $scope.loadMore = function(){
      
        AppService.getMoreComments($scope.post)
        .then(function(response){

            if(response.comments && response.comments.length > 0){
                var comments = response.comments.reverse();
                if(comments.length < 10){
                    $scope.hasMore = false;
                }
                else{//Presuming there should be more
                    $scope.hasMore = true;
                }
                
              comments.map(function(comment){
                    //comment.timeAgo = moment(comment.commTime).fromNow();
                    if(comment.user_id == userId){
                        comment.isOwnComment = true;
                    }
                    else{
                        comment.isOwnComment = false;
                    }                

                    $scope.postComments.unshift(comment);
              });
            }
            else{
                $scope.hasMore = false;
            }
                            
            $scope.$broadcast('scroll.infiniteScrollComplete');            
        });      
  };    
})

.controller('FollowingCtrl', function($scope, $rootScope, AppService, ModalService, $state, $ionicHistory, $ionicLoading){
    
    $scope.$on('$ionicView.enter', function(e) {
          //Fetch list of followings
          $ionicLoading.show();
          AppService.getFollowing().success(function(data){

                $rootScope.followers = data.result;
                $ionicLoading.hide();
          });        
    });
    
  $scope.showNewMessageModal = function(user){      
    $scope.newMessage = {};
      
    AppService.setOtherUser(user);

    ModalService.init('templates/new_conversation.html', $scope).then(function(modal) {
      $scope.modal = modal;
      $scope.user = user;
      modal.show();
    });
  }

  $scope.closeModal = function(){
    $scope.modal.remove();
  };
    
  // set send message button to blue when typing
  $scope.checkInput = function(){
    $scope.textColor = '';
    if ($scope.newMessage.subject){
      //console.log($scope.formData.postText);
      ($scope.newMessage.subject.length > 0) ? $scope.textColor = 'blue' : $scope.textColor = 'gray';
    }
  };     

  $scope.sendMessage = function(){
      if($scope.textColor == 'gray')
          return;
    //console.log($scope.newMessage, $scope.user);
    $ionicLoading.show();
    AppService
    .sendMessage(
      $scope.user.id,
      $scope.newMessage.subject,
      $scope.newMessage.message
    ).then(function(res){
      $ionicLoading.hide();
      if(res.data.status == 'SUCCESS'){
          
            $state.go('app.userchat', { from: res.data.result.conversation_id });
      }
        
      $scope.modal.remove();        
    }, function(error){
      $ionicLoading.hide();
        AppService.showErrorAlert(
        'SeeAroundMe',
        'Oops! Something went wrong! Please try again later.'
       );
    });
  }
      
      $scope.goBack = function(){
          $ionicHistory.goBack();
      };
})

.controller('MessagesCtrl', function($scope, $rootScope, $ionicLoading, ModalService, AppService, $state){
  $scope.formData = {};
  $scope.imgUri = null;
  $scope.conversations = []; 
    
  $scope.$on('$ionicView.enter', function(e) {
    AppService.getMessages()
    .success(function(res){
        if(res.result){
            var me = JSON.parse(localStorage.getItem('sam_user_data'));
            $scope.conversations = res.result.map(function(m){
              
                  if(me.id == m.sender_id){
                        m.name = m.receiverName;
                        m.profileImage = m.receiverImage;  
                  }
                  else{
                       m.name = m.senderName;
                       m.profileImage = m.senderImage; 
                  }              

                //m.formatted_date = moment(m.created).fromNow();
                return m;
          });
        }
        else{
           $scope.conversations = []; 
        }
    })
    .error(function(err){
      //console.log('there was an error getting messages');
    });
  });

  //Compose message view modal
  $scope.modal = function() {
    ModalService.init('templates/post/add-post.html', $scope).then(function(modal) {
      modal.show();
    });
  };

  $scope.goToFollowing = function(){
    //console.log($rootScope)
    $state.go('app.userfollowing')
  }

  $scope.showCompose = function(){
    $scope.modal();
  };

  $scope.close = function(id) {
    $scope.closeModal();
  };    

  $scope.viewConversation = function(c){
            //console.log(JSON.stringify(c));
            AppService.setConv(c);
      /*
            var me = JSON.parse(localStorage.getItem('sam_user_data'));
            if(c.sender_id == me.id){//I am the sender
                AppService.setOtherUserId(c.receiver_id);
                AppService.getUserById(c.receiver_id).then(function(res){
                    //console.log('Got user ...');
                    AppService.setOtherUser(res.data.result);
                });
            }
            else {
                //console.log('otherUserId: ', otherUserId);
                AppService.setOtherUserId(c.sender_id);
                AppService.getUserById(c.sender_id).then(function(res){
                    //console.log('Got user ...');
                    AppService.setOtherUser(res.data.result);
                });
            }*/
            
            $state.go('app.userchat', {from: 'messages'});
  };

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

.controller('ChatCtrl', function($scope, $stateParams, $state, $ionicScrollDelegate, AppService){
  $scope.messages = [];
  $scope.Self = JSON.parse(localStorage.getItem('sam_user_data')) || '{}';
  $scope.other_user = {};
  $scope.newMessage = {
    text: '',
    subject: null,
    conversationId: null
  }
  
  $scope.goBack = function(){
      if($stateParams.from == 'messages')
          $state.go('app.usermessages');
      else
          $state.go('app.postlistview');
  };

  // fetches messages from API and populates scope vars
  function fetchMessages(){
      
    AppService.getConversation($scope.c.id)
    .then(function(res){
          //console.log('Got messages ...');
          //console.log(JSON.stringify(res));
          if(res.data.result)
            $scope.messages = res.data.result.reverse();
          else
            $scope.messages = [];
          //console.log(JSON.stringify($scope.messages));
          $scope.messages.map(function(m){
            m.formatted_date = moment(m.created_at).format('MMMM Do[ at ]h:mm a');
          });

            $scope.newMessage.conversationId =  $scope.c.id;
            $scope.newMessage.subject =  $scope.c.subject;
        
          //Scroll to bottom
          $ionicScrollDelegate.scrollBottom(true);
        }, 
        function(error){
            console.log('Error ...');
        });
  };

  $scope.sendMessage = function(){

    // @params: otherUserId, subject, message, conversationId
    AppService
      .sendMessage(
        $scope.other_user.id,
        $scope.newMessage.subject,
        $scope.newMessage.text,
        $scope.newMessage.conversationId
      ).then(function(res){    
        
        $scope.messages.push({
          id: res.data.result.message_id,
          sender_id: $scope.Self.id,
          body: $scope.newMessage.text,
        });
        
        $scope.newMessage.text = "";
        
        $ionicScrollDelegate.scrollBottom(true);
        
      }, function(error){
      });
  };

  
  $scope.$on('$ionicView.enter', function(e) {
             
          $scope.messages = [];
          $scope.Self = JSON.parse(localStorage.getItem('sam_user_data')) || '{}';
          $scope.newMessage = {
            text: '',
            subject: null,
            conversationId: null
          }
        
          if($stateParams.from == 'messages'){
              $scope.c = AppService.getConv(); 
              if($scope.Self.id == $scope.c.sender_id){
                    $scope.other_user.Name = $scope.c.receiverName;
                    $scope.other_user.Profile_image = $scope.c.receiverImage;  
                    $scope.other_user.id = $scope.c.receiver_id;
              }
              else{
                   $scope.other_user.Name = $scope.c.senderName;
                   $scope.other_user.Profile_image = $scope.c.senderImage;  
                   $scope.other_user.id = $scope.c.sender_id; 
              }              
          }
          else{
              $scope.other_user = AppService.getOtherUser();
              $scope.c = { id: $stateParams.from, subject: 'New conversation'};
          }
                           
           fetchMessages();      
  });

})

.controller('PostListCtrl', function($scope, $rootScope, $state, $ionicGesture, $ionicPopup, $ionicPopover, $compile, $timeout,  $ionicLoading, $cordovaGeolocation, $ionicScrollDelegate, $sanitize, AppService, MapService, ModalService){
    
    $rootScope.postMode = 'new';//Other mode is edit
    $rootScope.inputRadius = 1.6;
    $rootScope.isFiltered = false;

  $scope.formData = {};
  var userData = JSON.parse(localStorage.getItem('sam_user_data')) || {};
  $rootScope.User = userData;
  $rootScope.user = userData;
  $scope.userData = userData;
  var userId = userData.id || 0;
  var authToken = userData.token || '';
  AppService.setUserId(userId);
/*
  // the regex that matches urls in text
  var urlRegEx = new RegExp(
      "((ftp|http|https|gopher|mailto|news|nntp|telnet|wais|file|prospero|aim|webcal):(([A-Za-z0-9$_.+!*(),;/?:@&~=-])|%[A-Fa-f0-9]{2}){2,}(#([a-zA-Z0-9][a-zA-Z0-9$_.+!*(),;/?:@&~=%-]*))?([A-Za-z0-9$_+!*();/?:~-]))"
   );*/
    
     var posOptions = {timeout: 30000, maximumAge:0, enableHighAccuracy: false};
    $cordovaGeolocation.getCurrentPosition(posOptions)
        .then(function (position) {
            var lat  = position.coords.latitude;//37.8088139
            var long = position.coords.longitude;//-122.2660002

            var center = new google.maps.LatLng(lat, long);
            $rootScope.myCenter = center;
            $rootScope.currentCenter = center;
        
              //Get posts initially
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
                    if(response.result){
                        //To use on list view
                        $rootScope.currentPosts = response.result;
                    
                        $scope.nearbyPosts = response.result;
                        /*
                        $scope.nearbyPosts.map(function(post){

                            if(post.link_url){
                                post.news = post.news.replace(urlRegEx, "");
                            }

                            if(post.user_id == userId){
                                post.isOwnPost = true;
                            }
                        });*/
                    }
                })
                .error(function (err) {
                    //console.warn(JSON.stringify(err));
                });

        }, function(err) {
            // error
            //console.error('Failed to get current position. Error: ' + JSON.stringify(err));
            $ionicPopup.alert({
                 title: 'See Around Me Alert',
                 subTitle: 'Current Location',
                 template: 'Failed to get your location. Make sure you are connected to the internet and allowed gelocation on your devivce.'
           });                
    });            
        
  $scope.isSwiping = false; 
  $scope.isShowMorePostsTapped = false;
  $scope.onListSwipe = function(){
      //console.log('Swipping ...');
      $scope.isSwiping = true;
  };
    
  var element = angular.element(document.querySelector('#eventPlaceholder'));
            
    $ionicGesture.on('dragstart', function (event) {
             //console.log('Dragstart caught ...');
             $scope.isSwiping = true;
    }, element);
            
    
    $ionicGesture.on('dragend', function (event) {
          //console.log('Dragend caught ...');
          $scope.isSwiping = false;        
    }, element);
    
  $scope.$on('$ionicView.enter', function(e) {
        $scope.hasMore = true;
        getPosts ();
        $scope.isSwiping = false;
        if($scope.isShowMorePostsTapped){
            $ionicScrollDelegate.scrollTop(true);
            $scope.isShowMorePostsTapped = false;
        }
      
        AppService.getAlerts()
          .then(function(res){
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

  var getPosts  = function (){
    $scope.nearbyPosts = $rootScope.currentPosts || [];
  };
        
  $scope.hasMore = true;    
    
  $scope.loadMore = function(){
      
        AppService.getMorePosts()
            .success(function (response) {
            
                    if(response.result && response.result.length > 0){
                          response.result.map(function(post){

                                //if(post.link_url){
                                    //post.news = post.news.replace(urlRegEx, "");
                                //}                  

                              $scope.nearbyPosts.push(post);
                          });
                    }
                    else{
                        $scope.hasMore = false;
                    }

                    $scope.$broadcast('scroll.infiniteScrollComplete');                        

            })
            .error(function (err) {
                console.warn(JSON.stringify(err));
        }); 
      
        //$scope.isShowMorePostsTapped = true;
  };
    
  $scope.goToNewPost = function(){
        $rootScope.page = 'list';
        $state.go('newpostview');
  };

    
  /*************** Edit Post **********************************/
    
  $scope.showPostBar = false;
    
  $scope.openEdit = function(){
      $scope.showPostBar = true;
  }; 
    
  $scope.cancel = function(){
      $scope.showPostBar = false;
  };    
    
  /*************************************************************/    
    
  $scope.openLink = function(link){
      if(!$scope.isSwiping)
            window.open(link, '_blank', 'location=no');
  };

  $rootScope.goToProfile = function(id){
    //console.log('goto profile called with id= ', id);
    var userData = JSON.parse(localStorage.getItem('sam_user_data')) || {};
    var userId = userData.id || 0;
    AppService.setUserId(userId);
    if(userId == id){
        AppService.setIsCurrentUserFlag(true);
    }
    else{
        AppService.setIsCurrentUserFlag(false);
    }
    
    AppService.setUserForProfilePage(id)
    .then(function(){
      $state.go('app.userprofile');
    });
  };

    $scope.openShare = function(postId){
        //var sanitizedText = $sanitize(text);
        var link = 'http://www.seearound.me/post/' + postId;
        window.plugins.socialsharing.share( null, null, null,link);
    };

  $scope.goToComments = function(post){
    AppService.setCurrentComments(post)
    .then(function(){
      $state.go('app.postcomments');
    })
  };
    
    $scope.showImage = function(imageSrc){
          ModalService.init('templates/post/full-image.html', $scope).then(function(modal){
            modal.show();
            $scope.imgModal = modal;
          }).then(function(){
                $scope.imageSrc = imageSrc;
          });      
    };
    
    $scope.closeImageModal = function(){
        $scope.imgModal.remove();
    };

    $scope.showMapForPost = function(post){
      if(post.Address && post.Address.length > 0)
            $scope.address = post.Address;
      else
            $scope.address = 'Not available';
        
      ModalService.init('templates/post/mapforpost.html', $scope).then(function(modal){
        modal.show();
        $scope.mapModal = modal;
      }).then(function(){
        MapService.showPostMap(post.latitude, post.longitude);
      });

    };
    
    $scope.close = function(id) {
        if(id === 'map') {
          $scope.modal.remove();
        }else
          $scope.closeModal();
    };

  $scope.$on('$destroy', function() {
    //console.log('Destroying modals...');
    if($scope.alertsPopover){
        $scope.alertsPopover.remove();
    }
    if($scope.selectPopover){
        $scope.selectPopover.remove();
    }
  });
        
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
        if(!AppService.isConnected()){
         AppService.showErrorAlert('No Internet Connection', 'There seems to be a network problem. Please check your internet connection and try again.');
         return;
        }
    };
    
    $scope.alertActions = function(alert){
        $scope.alertsPopover.hide();
        AppService.alertActions(alert);
    };
    
    //Below is the select popover code
    $ionicPopover.fromTemplateUrl('templates/post/select.html', {
        scope: $scope
      }).then(function(popover) {
        $scope.selectPopover = popover;
    });
    
    $scope.clearSearch = function(){ 
        $scope.searchTerm = "";    
        $scope.selected = {label: 'Filter', value:''};    

        var data = {
            "latitude" :  $rootScope.currentCenter.lat(),//37.8088139,
            "longitude" : $rootScope.currentCenter.lng(), //-122.2635002,
            "radious" : $rootScope.inputRadius,
            "token" : authToken,
            "fromPage" : 0
        };

        //console.log(JSON.stringify(data));
        AppService.getNearbyPosts(data)
        .success(function (response) {
              $rootScope.isFiltered = false;
              $scope.nearbyPosts = response.result;
              //Save for map view as well
              $rootScope.currentPosts = response.result;
              //console.log(data.result);
              $scope.toggleSearch();
              var links = [];
            /*
            $scope.nearbyPosts.map(function(post){
                post.news = post.news.replace(urlRegEx, "");
            });*/
        })
        .error(function (err) {
            //console.warn(JSON.stringify(err));
        });        
    };    
    
    $scope.searchPosts = function(){   
        
        var searchData = {
            "latitude" :  $rootScope.currentCenter.lat(),//37.8088139,
            "longitude" : $rootScope.currentCenter.lng(), //-122.2635002,
            "radious" : $rootScope.inputRadius,
            "token" : authToken,
            "searchText": $scope.searchTerm,
            "filter": $scope.selected.value,
            "fromPage" : 0
        };
        
        AppService.getMyPosts(searchData)
            .success(function(data){  
              $rootScope.isFiltered = true;
              $scope.nearbyPosts = data.result;
              //Save for map view as well
              $rootScope.currentPosts = data.result;
              //console.log(data.result);
              $scope.toggleSearch();
              var links = [];
            /*
            $scope.nearbyPosts.map(function(post){
                // transform news text to behave nicely with html
                // removes links and " characters from post.news
                //post.sanitizedText = post.news.replace(urlRegEx, '').replace(/\"/g, '')
                
                post.news = post.news.replace(urlRegEx, "");
            });*/
        });        
    };
    
    $scope.searchTerm = "";
    
    $scope.options = [{
        label:'Most interesting',
        value: ''
    },{
        label:'Most recent',
        value: 3
    },{
        label:'My posts',
        value: 0
    },{        
        label:'My interests',
        value: 1
    },{
        label:'Following',
        value: 2
    }];
    
    $scope.selected = {label: 'Filter', value:''};    
    $scope.showSelect = function($event){
       $scope.selectPopover.show($event);
    };
    
    $scope.setOption = function(option){
        $scope.selected = option;
        $scope.selectPopover.hide();
        $scope.searchPosts();
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
    
      $scope.closeMapModal = function(){
          $scope.mapModal.remove();      
      }    
})

.controller('NewPostCtrl', function($scope, $rootScope, $stateParams, $state, $ionicPopup, $ionicHistory, $ionicLoading, AppService, MapService){
    
    $scope.imgUri = "";
    var ud = localStorage.getItem('sam_user_data');
    //console.log(ud);

    var userData = JSON.parse(ud) || '{}';

    var userId = userData.id || 0;
    var authToken = userData.token || '';
    
    AppService.setUserId(userId);

    $scope.addLocation = "        Add location";
    $scope.formData = {};
    $scope.showCamBar = false;
    
    $scope.toggleCamBar = function(){
        $scope.showCamBar = !$scope.showCamBar;    
    };
    
    $scope.hideCamBar = function(){
        $scope.showCamBar = false;
    };
    
    $scope.openMedia = function(type){
        AppService.getImage(type).then(function(imgUri){
                //console.log('image uri: '+ imgUri);
                $scope.imgUri = imgUri;
                if($scope.addLocation !== "        Add location")
                    $scope.textColor = 'blue';
        });
        
        $scope.toggleCamBar();
    };
    
    $scope.clearImage = function(){
        $rootScope.imgUri = '';
        $scope.imgUri = ""; 
        $scope.showCamBar = false;
        
          if (!$scope.formData.postText){

                $scope.textColor = 'gray';
          }        
    };
    
    $scope.selectLocation = function(){
        //Save image uri and text before leaving
        AppService.setImgUri($scope.imgUri);
        $rootScope.postText = $scope.formData.postText;
        $rootScope.postMode = 'new';
        $state.go('chooselocation');
    };
    
    $scope.$on('$ionicView.enter', function(e) {
        
        if($stateParams.from == "selectlocation"){
         
            if($stateParams.address){//Address was selected 
                $scope.addLocation = $stateParams.address;
            }
            else{//cancel on selectlocation
                $scope.addLocation = "        Add location";
            }        
            
            var imageUri = AppService.getImgUri();
            if($rootScope.postText || imageUri != ""){
                $scope.imgUri = imageUri; //Reset saved uri
                AppService.setImgUri("");
                $scope.formData.postText = $rootScope.postText;
                $scope.textColor = 'blue';
            }            
        }        
    });
    
    // set post button to blue when typing
    $scope.checkInput = function(){
      //$rootScope.postText =  $scope.formData.postText;
      $scope.textColor = '';
      if ($scope.addLocation != "        Add location"){
        //console.log($scope.formData.postText);         
        if($scope.formData.postText || $scope.imgUri){
            $scope.textColor = 'blue';
        } 
        else{  
            $scope.textColor = 'gray';
        }
      }
      else{
        $scope.textColor = 'gray';    
      }
    };

    $scope.postNews = function () {
        
        if($scope.textColor == 'gray' || $scope.addLocation == "        Add location")
            return;
        
        function postNews(){
            var data = {
                "body" : $scope.formData.postText,
                "token" : authToken,
                "latitude" : $stateParams.latitude,
                "longitude" : $stateParams.longitude,
                "street_number" : $stateParams.street_number,
                "street_name" : $stateParams.street_name,
                "city" : $stateParams.city,
                "state" : $stateParams.state,
                "country" : $stateParams.country,
                "zip" : $stateParams.zip
            };

            AppService.addNewPost(data, $scope.imgUri).then(
                    function(res){
                        //console.log('Post Success ...');
                        //console.log(JSON.stringify(res));
                        $ionicLoading.hide();
                        $rootScope.postText = '';
                        $rootScope.imgUri = "";
                        $scope.formData.postText = '';
                        $scope.refreshPosts();
                    },
                    function(error){
                        $ionicLoading.hide();
                        //console.log(JSON.stringify(error));
                    },
                    function(progress){
                        //console.log('Uploaded ' + progress.loaded + ' of ' + progress.total);
                    }
                );            
        };
        
        $ionicLoading.show({
               template: '<ion-spinner class="spinner-calm"></ion-spinner><br/>Posting ...',
               duration: 20000 //Dismiss after 20 seconds
        });
        
        AppService.checkPost({ 
            "token" : authToken,
            "body" : $scope.formData.postText
        }).then(function(res){
            if(res.data.link_post_id){//Link is already shared
                $ionicLoading.hide();
                $ionicPopup.confirm({
                    title: 'See Around Me Alert',
                    template: 'The link you are going to post has already been shared. Do you want to post it anyway?',
                    cancelText: 'No',
                    okText: 'Yes'                
               }).then(function(res) {
                 if(res) {
                     postNews();
                 }
                else{
                    $rootScope.postText = '';
                    $scope.formData.postText = '';
                }
               });                
            }
            else{//Link not shared, proceed
                postNews();
            }
        });        
    }; 
    
    $scope.refreshPosts = function(){
        
        if($scope.isFromMapView || $rootScope.page == 'map'){            
            $state.go('app.postmapview');            
        }
        else{
            
            var params = {
                "latitude" : $rootScope.currentCenter.lat(),// 37.8088139,
                "longitude" : $rootScope.currentCenter.lng(),//-122.2635002,
                "radious" : $rootScope.inputRadius,
                "token" : authToken,
                "start" : 0
            };

            //console.log(JSON.stringify(params));
            AppService.getNearbyPosts(params)
            .success(function (response) {

                //console.log(JSON.stringify(response));
                if(response.status == 'SUCCESS'){
                    //console.log('Got nearby posts ..............................');
                    if(response.result){
                        /*
                      // the regex that matches urls in text
                      var urlRegEx = new RegExp(
                              "((ftp|http|https|gopher|mailto|news|nntp|telnet|wais|file|prospero|aim|webcal):(([A-Za-z0-9$_.+!*(),;/?:@&~=-])|%[A-Fa-f0-9]{2}){2,}(#([a-zA-Z0-9][a-zA-Z0-9$_.+!*(),;/?:@&~=%-]*))?([A-Za-z0-9$_+!*();/?:~-]))"
                           );

                        response.result.forEach(function (post) {

                            post.news = post.news.replace(urlRegEx, "");

                        });*/

                        //To use on list view
                        $rootScope.currentPosts = response.result;
                        $state.go('app.postlistview');
                     }

                }
                 else{
                     //console.log('Failed to get nearby posts ...');
                     $rootScope.currentPosts = [];
                 }                
            })
            .error(function (err) {
                //console.warn(JSON.stringify(err));
            });
        }
    };
    
    $scope.goBack = function(){
        $scope.clearImage();
        
        if($stateParams.from == "selectlocation"){//$ionicHistory.goBack() will go to select location screen
            $state.go('app.postlistview');
        }
        else
            $ionicHistory.goBack();
    };    
})

.controller('EditPostCtrl', function($scope, $rootScope, $stateParams, $state, $ionicPopup, $ionicHistory, $ionicLoading, AppService, MapService){
    
    $scope.isFromMapView = false;
    var ud = localStorage.getItem('sam_user_data');
    //console.log(ud);

    var userData = JSON.parse(ud) || '{}';

    var userId = userData.id || 0;
    var authToken = userData.token || '';
    
    AppService.setUserId(userId);

    $scope.addLocation = "        Add location";
    $scope.formData = {};
    $scope.showCamBar = false;
    
    $scope.toggleCamBar = function(){
        $scope.showCamBar = !$scope.showCamBar;    
    };
    
    $scope.hideCamBar = function(){
        $scope.showCamBar = false;
    };
    
    $scope.openMedia = function(type){
        AppService.getImage(type).then(function(imgUri){
                //console.log('image uri: '+ imgUri);
                $scope.imgUri = imgUri;
                if($scope.addLocation !== "        Add location")
                    $scope.textColor = 'blue';
        });
        
        $scope.toggleCamBar();
    };
    
    $scope.clearImage = function(){
        $scope.imgUri = ""; 
        $scope.showCamBar = false;
        
          if (!$scope.formData.postText){

                $scope.textColor = 'gray';
          }        
    };
    
    $scope.selectLocation = function(){
        //Save image uri and text before leaving
        AppService.setImgUri($scope.imgUri);
        $rootScope.postText = $scope.formData.postText;
        $rootScope.address = $scope.addLocation;
        $rootScope.postMode = 'edit';
        $state.go('chooselocation');
    };
    
    $scope.$on('$ionicView.enter', function(e) {
        
        if($stateParams.from == "selectlocation"){
         
            if($stateParams.address){//Address was selected 
                $scope.addLocation = $stateParams.address;
            }
            else{//cancel on selectlocation
                $scope.addLocation = $rootScope.address;
            }        
            
            var imageUri = AppService.getImgUri();
            if($rootScope.postText || imageUri != ""){
                $scope.imgUri = imageUri; //Reset saved uri
                AppService.setImgUri("");
                $scope.formData.postText = $rootScope.postText;
                $scope.textColor = 'blue';
            }            
        }
        else{ //From a post edit
            $scope.formData.postText = $stateParams.news;
            //To check if image has been changed
            $rootScope.oldImage = $stateParams.image;
            $scope.imgUri = $stateParams.image;
            $scope.postId = $stateParams.id;
            $scope.addLocation = $stateParams.Address;

            if($stateParams.from == 'map'){
                $scope.isFromMapView = true;
                //Fire event to hide map modal
                $rootScope.$broadcast('hidemapmodal');
            }
        }
    });
    
    // set post button to blue when typing
    $scope.checkInput = function(){
      //$rootScope.postText =  $scope.formData.postText;
      $scope.textColor = '';
      if ($scope.addLocation != "        Add location"){
        //console.log($scope.formData.postText);         
        if($scope.formData.postText || $scope.imgUri){
            $scope.textColor = 'blue';
        } 
        else{  
            $scope.textColor = 'gray';
        }
      }
      else{
        $scope.textColor = 'gray';    
      }
    };
    
    $scope.savePost = function () {
        
        if($scope.textColor == 'gray' || $scope.addLocation == "        Add location")
            return;
        
        function savePost(){
            var data = {            
                "token" : authToken,
                "post_id" : $scope.postId,
                "body" : $scope.formData.postText,
                "latitude" : $stateParams.latitude,
                "longitude" : $stateParams.longitude,
                "street_number" : $stateParams.street_number,
                "street_name" : $stateParams.street_name,
                "city" : $stateParams.city,
                "state" : $stateParams.state,
                "country" : $stateParams.country,
                "zip" : $stateParams.zip
            };

            if($scope.imgUri.length == 0){
                data.delete_image = 1;
            }

            AppService.savePost(data, $scope.imgUri).then(
                    function(res){
                        //console.log('Post Success ...');
                        //console.log(JSON.stringify(res));
                        $ionicLoading.hide();
                        $rootScope.postText = '';
                        $scope.formData.postText = '';
                        //$scope.goBack();
                        $scope.refreshPosts();
                    },
                    function(error){
                        $ionicLoading.hide();
                        //console.log(JSON.stringify(error));
                        $rootScope.postMode = 'new';
                    },
                    function(progress){
                        //console.log('Uploaded ' + progress.loaded + ' of ' + progress.total);
                    }
            );
            
        };
                
        $ionicLoading.show({
               template: '<ion-spinner class="spinner-calm"></ion-spinner><br/>Saving ...',
               duration: 20000 //Dismiss after 20 seconds
        });
                
        //Comment this out in case you need to open above code
        savePost();
    };
    
    $scope.refreshPosts = function(){
        
        if($scope.isFromMapView || $rootScope.page == 'map'){            
            $state.go('app.postmapview');            
        }
        else{
            
            var params = {
                "latitude" : $rootScope.currentCenter.lat(),// 37.8088139,
                "longitude" : $rootScope.currentCenter.lng(),//-122.2635002,
                "radious" : $rootScope.inputRadius,
                "token" : authToken,
                "start" : 0
            };

            //console.log(JSON.stringify(params));
            AppService.getNearbyPosts(params)
            .success(function (response) {

                //console.log(JSON.stringify(response));
                if(response.status == 'SUCCESS'){
                    //console.log('Got nearby posts ..............................');
                    if(response.result){
                        /*
                      // the regex that matches urls in text
                      var urlRegEx = new RegExp(
                              "((ftp|http|https|gopher|mailto|news|nntp|telnet|wais|file|prospero|aim|webcal):(([A-Za-z0-9$_.+!*(),;/?:@&~=-])|%[A-Fa-f0-9]{2}){2,}(#([a-zA-Z0-9][a-zA-Z0-9$_.+!*(),;/?:@&~=%-]*))?([A-Za-z0-9$_+!*();/?:~-]))"
                           );

                        response.result.forEach(function (post) {

                            post.news = post.news.replace(urlRegEx, "");

                        });*/

                        //To use on list view
                        $rootScope.currentPosts = response.result;
                        $state.go('app.postlistview');
                     }

                }
                 else{
                     //console.log('Failed to get nearby posts ...');
                     $rootScope.currentPosts = [];
                 }                
            })
            .error(function (err) {
                //console.warn(JSON.stringify(err));
            });
        }
    };
    
    $scope.goBack = function(){
        $scope.clearImage();
        
        if($scope.isFromMapView){
            $state.go('app.postmapview');
            //Fire event to show map modal
            $rootScope.$broadcast('showmapmodal');
        }
        else if($stateParams.from == "selectlocation"){//$ionicHistory.goBack() will go to select location screen
            $state.go('app.postlistview');
        }
        else
            $ionicHistory.goBack();
    };    
})

.controller('ChooseLocCtrl', function($scope, $rootScope, $timeout, $state, $cordovaGeolocation, MapService){
    
    $scope.place = {};
    $scope.place.formatted_address = '';
            
    $scope.onChange = function(){
        //console.log($scope.place);
        if(angular.isObject($scope.place)){
            $scope.setPlace($scope.place);
        }
    };
    
    $scope.setPlace = function(place){
        if(place.geometry){
            var center = new google.maps.LatLng(place.geometry.location.lat(), place.geometry.location.lng());
            $scope.center = center;
            // If the place has a geometry, then present it on a map.
            if (place.geometry.viewport) {
              $scope.map.fitBounds(place.geometry.viewport);
            } else {
              $scope.map.setCenter(center);
              $scope.map.setZoom(14);
            }            
        }        
    };
    
    $scope.pickLocation = function(){
        //Get place from lat, lng
        MapService.getPlace($scope.center.lat(), $scope.center.lng()).then(
            function(place){
                //console.log(JSON.stringify(place));
                var p = {
                    address: place.formatted_address,
                    latitude: place.geometry.location.lat(),
                    longitude: place.geometry.location.lng(),
                    from: "selectlocation"
                };
                
                var components = place.address_components;

                //Get address components
                for (var i = 0; i < components.length; i++) {
                    //console.log(components[i]);
                    switch(components[i].types[0]){

                        case 'street_number':
                             p.street_number = components[i].short_name;
                             break;                                
                        case 'route':
                             p.street_name = components[i].long_name;
                             break;
                        case 'locality':
                             p.city = components[i].short_name;
                             break;
                        case 'administrative_area_level_1':
                             p.state = components[i].short_name;
                             break;
                        case 'country':
                             p.country = components[i].short_name;
                             break;
                        case 'postal_code':
                             p.zip = components[i].short_name;
                             break;                                
                    }
                }
                
                if($rootScope.postMode == 'edit')
                    $state.go('editpostview', p);
                else
                   $state.go('newpostview', p); 
            });
    };
    
    $scope.setLocation = function(center){
        $scope.map.setCenter(center);
        $scope.center = center;
    };
    
    $scope.setCurrentLocation = function(){
        $scope.setLocation($scope.myCenter); 
    };

    $scope.clearText = function(){
        var locationFld = document.getElementById('locFld');
        locationFld.value = "";
        locationFld.focus();
        $scope.place.formatted_address = '';
    };
    
    $scope.cancel = function(){
        
        var p = {
            address: "",
            latitude: "",
            longitude: "",
            from: "selectlocation"
        };

        $state.go('editpostview', p);
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
                var center = new google.maps.LatLng(lat, long);
                $scope.myCenter = center;

                //Create map
                var mapOptions = {
                    zoom: 14,
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                    disableDefaultUI: true,
                    zoomControl: false
                };

                var map = new google.maps.Map(document.getElementById("cmap"), mapOptions);
                $scope.map = map;

                google.maps.event.addListener((map), 'dragend',
                    function(event) {
                        var center = this.getCenter();
                        $scope.setLocation(center);  
                });
            
                google.maps.event.addListener((map), 'click', function(event) {
                    document.getElementById('locFld').blur();
                });
            
                $scope.setLocation(center);  
            
                $timeout(function(){
                   $scope.isInitialized = true;
                }, 500);
            }, function(err) {
                // error
                //console.error('Failed to get current position. Error: ' + JSON.stringify(err));
                //deferred.reject(err.message);
                // return err;
            });        
    };
})

.controller('MapCtrl', function($scope, $rootScope, $state, $stateParams, $timeout, $ionicLoading, $ionicPopup, $ionicPopover, $cordovaGeolocation, $ionicScrollDelegate, $compile, $ionicPlatform, AppService, MapService, ModalService) {
    
    $rootScope.postMode = 'new';//Other mode is edit
    $rootScope.inputRadius = 1.6;
    $scope.circleRadius = 1.6;
    $rootScope.isFiltered = false;
    $scope.userData = JSON.parse(localStorage.getItem('sam_user_data')) || '{}';
    $scope.onRadiusChange = function(){
        //console.log('$scope.circleRadius: ' + $scope.circleRadius);
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
            MapService.resetMap();
        }
        else{
            AppService.showErrorAlert('No Internet Connection', 'There seems to be a network problem. Please check your internet connection and try again.');
        }        
    };
    
    $scope.formData = {};
    $scope.fileName = {};
    $scope.searchTerm = "";
    
    var ud = localStorage.getItem('sam_user_data');
    //console.log(ud);

    var userData = JSON.parse(ud) || '{}';

    var userId = userData.id || 0;
    AppService.setUserId(userId);
    
    if(userData.Profile_image)
        $scope.formData.Profile_image = userData.Profile_image;
    else
        $scope.formData.Profile_image = 'img/avatar.png';//Default image
    
    $scope.nearbyPosts = {};

    $scope.showModal = function (id) {
        // $state.go('app.postlistview');
        if(id == 1)
            $scope.modal1.show();
        else if (id == 3){//Opens map modal half view
            if(!$scope.halfViewModal){
                $scope.modal3 = function() {
                    ModalService.openMapModal($scope).then(function(modal) {
                    modal.show().then(function(){
                        $scope.viewStyle = {
                            top : '60%',
                            '-webkit-transition-property' : 'top',
                            '-webkit-transition-timing-function' : 'ease-in-out',
                            '-webkit-transition-duration' : '0.3s'
                        };
                    });
                        $scope.halfViewModal = modal;
                    });
                };    

                $scope.modal3();
            }
            else{
                $scope.$apply();
            }
        }
    };
    
    //Initially, set map modal to be out of the view so that it can be animated in later
    $scope.viewStyle = {
       top:'100%'
    };
            
    $scope.showMapModalBar = false;

    $scope.hasMore = false;
    $scope.postComments = [];
    
    var fetchComments = function (post) {
      
      AppService.getCurrentComments(post)
      .then(function(current){
        //console.log('response', current);
          if(current && current.comments){
              if(current.comments.length < 10){
                  $scope.hasMore = false; 
              }
              else{//Presuming there are more
                  $scope.hasMore = true;
              }
                $scope.postComments = current.comments.reverse();   
          }
          else{
              $scope.postComments = [];
          }
          
        try{
          $scope.postComments.map(function(comment){
            //comment.timeAgo = moment(comment.commTime).fromNow();
            if(comment.user_id == userId){
                comment.isOwnComment = true;
            }
            else{
                comment.isOwnComment = false;
            }                
          })
        } catch (err){
          //console.log(err);
        }

      }, function(error){
        $ionicLoading.hide();
        //console.warn('error getting comments');
      });
    };
    
      $scope.loadMore = function(){

            AppService.getMoreComments($scope.post)
            .then(function(response){

                if(response.comments && response.comments.length > 0){
                    var comments = response.comments.reverse();
                    if(comments.length < 10){
                        $scope.hasMore = false;
                    }
                    else{//Presuming there are more
                        $scope.hasMore = true;
                    }
                  comments.map(function(comment){
                        //comment.timeAgo = moment(comment.commTime).fromNow();
                        if(comment.user_id == userId){
                            comment.isOwnComment = true;
                        }
                        else{
                            comment.isOwnComment = false;
                        }                
                      
                        $scope.postComments.unshift(comment);
                  });

                }
                else{
                    $scope.hasMore = false;
                }
                
                $scope.$broadcast('scroll.infiniteScrollComplete');                            
            });      
      }; 
    
    
    $scope.newComment = { text: ''};
    
    $scope.postComment = function (){
        //console.log('commentText -> ', $scope.newComment.text);
        AppService.postComment($scope.newComment.text, userId, $scope.post.id)
        .then(function(res){
            $scope.newComment.text = '';
            //console.log('successfully posted the comment');
            //console.log(JSON.stringify(res));
            if(res.data.result){
                $scope.post.comment_count = res.data.result.totalComments;
                res.data.result.timeAgo = moment(res.data.result.commTime).fromNow();
                res.data.result.isOwnComment = true;
                res.data.result.canEdit = true;
                $scope.postComments.push(res.data.result);

                $ionicScrollDelegate.scrollBottom(true);
            }
        });
    };
    
      $scope.delComment = function(comment) {
          
            $ionicPopup.confirm({
                title: 'See Around Me Alert',
                template: 'Are you sure you want to delete this comment?',
                cancelText: 'No',
                okText: 'Yes'                
           }).then(function(res) {
             if(res) {
                // Search & Destroy comment from list
                $scope.postComments.splice($scope.postComments.indexOf(comment), 1);
                $scope.post.comment_count = $scope.postComments.length;
                // Save list in factory
                AppService.deleteComment(comment).then(function(){
                    //console.log('Comment deleted ...');
                });                 
             } 
           });
      };        
    
    $scope.showFullView = function(post){
        if(!$scope.showMapModalBar){
            $scope.showMapModalBar = true;
            $scope.viewStyle = {
                 top : '0',
                 '-webkit-transition-property' : 'top',
                 '-webkit-transition-timing-function' : 'ease-in-out',
                 '-webkit-transition-duration' : '0.4s'
            };
            
            $timeout(function(){
                     fetchComments(post);
            }, 400);
            
        }
    };
            
    $scope.goToUser = function(post){
        
        //console.log('goto profile called with id= ', post.user_id);
        var userData = JSON.parse(localStorage.getItem('sam_user_data')) || {};
        var userId = userData.id || 0;
        if(userId == post.user_id){
            AppService.setIsCurrentUserFlag(true);
        }
        else{
            AppService.setIsCurrentUserFlag(false);
        }

        AppService.setUserForProfilePage(post.user_id)
        .then(function(){
          $scope.hideModal();
          $state.go('app.userprofile');
        });
    }
    
    $scope.openLink = function(link){
        window.open(link, '_blank', 'location=no');
    };    

    $scope.openShare = function(postId){
        //var sanitizedText = $sanitize(text);
        var link = 'http://www.seearound.me/post/' + postId;
        window.plugins.socialsharing.share( null, null, null,link);
    };

    $scope.move = function(direction, thisPost){
        var index = $scope.currentPosts.indexOf(thisPost);

        if(direction === 'up'){
            if(index >= $scope.currentPosts.length - 1){//Last index
                $scope.post = $scope.currentPosts[0];
            }
            else{
                $scope.post = $scope.currentPosts[index+1];
            }            
        }else{//down
            if(index <= 0){
                $scope.post = $scope.currentPosts[$scope.currentPosts.length - 1];//Last post
            }
            else{
                $scope.post = $scope.currentPosts[index-1];
            }                
        } 

        fetchComments($scope.post);
        
        $ionicScrollDelegate.scrollTop(true);
    };
        
    $scope.hideModal = function(){
        
        $scope.viewStyle = {
            top:'100%',
            '-webkit-transition-property' : 'top', 
            '-webkit-transition-timing-function' : 'ease-out',
            '-webkit-transition-duration' : '0.4s'
        };
        
        $timeout(function(){
                 
             $scope.showMapModalBar = false;
                 
             $scope.postComments = null;
                 
             //When modal goes down, change icon back to gray
             if($scope.selectedMarker){
                 $scope.selectedMarker.setIcon({
                       url:'img/pin-gray.png',
                       scaledSize: new google.maps.Size(18, 25)
                });
             }
                 
            if($scope.halfViewModal){
                 $scope.halfViewModal.hide();
                 $scope.halfViewModal = null;
            }
                                  
        }, 400);            
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
            if($scope.modal){
                $scope.closeModal();
                $scope.modal.remove();
            }
        }
    };
    
    //This is for android back button
    $ionicPlatform.on('backbutton', function() {
        //console.log('Android back button was hit ...');
        $scope.hideModal();
    });
     
    $rootScope.$on("refreshdone", function(event, data){     
            $scope.currentPosts = $rootScope.currentPosts;
        
          for (var i = 0; i < $rootScope.markers.length; i++) {
            google.maps.event.addListener($rootScope.markers[i], 'click', function() {
                    //If a marker is already selected, deselect it
                    if($scope.selectedMarker){
                        $scope.selectedMarker.setIcon({
                            url:'img/pin-gray.png',
                            scaledSize: new google.maps.Size(18, 25)
                        });
                    }

                    if(this.post){//It is a post location
                        //Change icon to blue
                        this.setIcon({
                            url:'img/pin-blue.png',
                            scaledSize: new google.maps.Size(22, 30)
                        });
                        
                        $scope.selectedMarker = this;
                        $scope.post = this.post; 
                        
                        $scope.showModal(3);
                    }
                    else{//It is my location
                        var infowindow = new google.maps.InfoWindow({
                            content: 'My Location'
                        });
                        
                        infowindow.open($rootScope.map, this);
                    }
            });
          }
    });
    
    $scope.$on("mapview:openlist", function(event,data) {
        $scope.showModal(1);
    });
    
    $scope.$on("hidemapmodal", function(event,data) {
        $scope.hideModal();
    });
    
    $scope.$on("showmapmodal", function(event,data) {
        $scope.showModal(3);
    });  
    
    $scope.$on('$destroy', function() {
      //console.log('Destroying modals...');
      //$scope.modal1.remove();
        if($scope.popover)
            $scope.popover.remove();
        if($scope.selectPopover)
            $scope.selectPopover.remove();  
    });
        
    //Below is the popover code
    $ionicPopover.fromTemplateUrl('templates/post/alerts.html', {
        scope: $scope
      }).then(function(popover) {
        $scope.alertsPopover = popover;
    });
    
    $scope.alertActions = function(alert){
        $scope.alertsPopover.hide();
        AppService.alertActions(alert);
    };
    
    $scope.showAlerts = function ($event) {
        //console.log('showAlerts called ...');
        $scope.alertsPopover.show($event); 
        if(!AppService.isConnected()){
             AppService.showErrorAlert('No Internet Connection', 'There seems to be a network problem. Please check your internet connection and try again.');
             return;
         }

        //getAlerts($event);               
    };
    
    //Below is the select popover code
    $ionicPopover.fromTemplateUrl('templates/post/select.html', {
        scope: $scope
      }).then(function(popover) {
        $scope.selectPopover = popover;
    });
    
    $scope.clearSearch = function(){    
        $scope.searchTerm = "";    
        $scope.selected = {label: 'Filter', value:''};     
        
        MapService.refreshMap();
        $scope.toggleSearch();
        
        //Wait for a second before re-adding the idle event listener so that idle event on keyboard down goes waste
          setTimeout(function(){
              google.maps.event.addListener(($rootScope.map), 'idle',
                function(event) {
                   //console.log('map idle event fired ....');
                   var c = this.getCenter();
                   if(c){
                        $rootScope.currentCenter = c;
                        MapService.centerMap(c);
                   }
                });          
          }, 1000);        
    };    
    
    $scope.searchPosts = function(){                
        MapService.refreshMap({searchTerm: $scope.searchTerm, filter: $scope.selected.value});
        $scope.toggleSearch();
        //Wait for a second before re-adding the idle event listener so that idle event on keyboard down goes waste
          setTimeout(function(){
              google.maps.event.addListener(($rootScope.map), 'idle',
                function(event) {
                   //console.log('map idle event fired ....');
                   var c = this.getCenter();
                   if(c){
                        $rootScope.currentCenter = c;
                        MapService.centerMap(c);
                   }
                });          
          }, 1000);
    };
    
    $scope.options = [{
        label:'Most interesting',
        value: ''
    },{
        label:'Most recent',
        value: 3
    },{
        label:'My posts',
        value: 0
    },{        
        label:'My interests',
        value: 1
    },{
        label:'Following',
        value: 2
    }];
    
    $scope.selected = {label: 'Filter', value:''};     
    $scope.showSelect = function($event){
       $scope.selectPopover.show($event);
    };
    
    $scope.setOption = function(option){
        $scope.selected = option;
        $scope.selectPopover.hide();
        $scope.searchPosts();
        //Wait for half a second before re-adding the idle event listener so that idle event on keyboard down goes waste
          setTimeout(function(){
              google.maps.event.addListener(($rootScope.map), 'idle',
                function(event) {
                   //console.log('map idle event fired ....');
                   var c = this.getCenter();
                   if(c){
                        $rootScope.currentCenter = c;
                        MapService.centerMap(c);
                   }
                });          
          }, 500);        
    };
    
    $scope.toggleSearch = function(){
        
        if($scope.showSearch == true)
            $scope.showSearch = false;
        else
            $scope.showSearch = true;
    };
    

      $scope.goToComments = function(post){
        $scope.hideModal();
        AppService.setCurrentComments(post)
        .then(function(){
          $state.go('app.postcomments');
        });
      };

    document.addEventListener("resume", function(e) {//Cordova event
        //console.log('App activated ... Cordova');
        if(AppService.isConnected()){
            MapService.refreshMap();
        }
        else{
            AppService.showErrorAlert('No Internet Connection', 'There seems to be a network problem. Please check your internet connection and try again.');        
        }    
    }, false);    

    // for refresh map
    $scope.$on('$ionicView.enter', function(e) {
                
        //Causes the map to redraw
        google.maps.event.trigger($rootScope.map, 'resize');
        
        if($rootScope.map){
            MapService.refreshMap();
            //Add idel event listener
            google.maps.event.addListener(($rootScope.map), 'idle',
            function(event) {
               console.log('map idle event fired ....');
               var c = this.getCenter();
               if(c){
                    $rootScope.currentCenter = c;
                    MapService.centerMap(c);
               }
            });            
        }
    });

    $scope.$on('$ionicView.leave', function(e) {
        $rootScope.isFromProfileView = false;
        //Must remove idle listener as it can cause trouble when fired on other views
        google.maps.event.clearListeners($rootScope.map, 'idle');
        //Show all markers when user has seen filtered ones
        $rootScope.markers.forEach(function(marker){
              marker.setMap($rootScope.map);
        });
    });
    
    var getAlerts = function($event){
        $ionicLoading.show($event); 
      AppService.getAlerts()
      .then(function(res){
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
          $ionicLoading.hide($event); 
      });
    };

  $scope.showMapForPost = function(post){
      if(post.Address && post.Address.length > 0)
            $scope.address = post.Address;
      else
            $scope.address = 'Not available';
      
      ModalService.init('templates/post/mapforpost.html', $scope).then(function(modal){
        modal.show();
        $scope.mapModal = modal;
      }).then(function(){
        MapService.showPostMap(post.latitude, post.longitude);
      });
  };
    
    $scope.showImage = function(imageSrc){
          ModalService.init('templates/post/full-image.html', $scope).then(function(modal){
            modal.show();
            $scope.imgModal = modal;
          }).then(function(){
                $scope.imageSrc = imageSrc;
          });      
    };
    
    $scope.closeImageModal = function(){
        $scope.imgModal.remove();
    };    
    
  $scope.goToNewPost = function(){
        $scope.hideModal();
        $rootScope.page = 'map';
        $state.go('newpostview');
  };
    
  $scope.closeMapModal = function(){
      $scope.mapModal.remove();      
  };
    
  $scope.focusInput = function(){    
      $ionicScrollDelegate.scrollBottom(true);
  };
    
  $scope.onSearchFocus = function(){
      console.log('Search field focussed ...');
      //Must remove idle listener as it can cause trouble
        google.maps.event.clearListeners($rootScope.map, 'idle');
  };
    
  //Initialize map
    if(AppService.isConnected()){
        //Make map at the start
        MapService.initMap();
    }
    else{
        AppService.showErrorAlert('No Internet Connection', 'There seems to be a network problem. Please check your internet connection and try again.');        
    }    
});

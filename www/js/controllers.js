angular.module('SeeAroundMe.controllers', [])

.controller('AppCtrl', function($scope, $rootScope, $state) {
  //$scope.$on('$ionicView.enter', function(e) {
  //});
  
  $scope.User = JSON.parse((localStorage.getItem('sam_user_data')))
    
  $rootScope.isBeforeSignUp = false;

  $scope.openPostList = function () {
      $rootScope.$broadcast('mapview:openlist');
      $state.go('app.postmapview');
  };
    
  $scope.signOut = function(){
      //Remove user login id and data
      localStorage.removeItem('sam_user_location');
      localStorage.removeItem('sam_user_data');
      
      //Loop through all the markers and remove
      for (var i = 0; i < $rootScope.markers.length; i++) {
          $rootScope.markers[i].setMap(null);
      }
      
      $rootScope.markers = [];
      
      $state.go('home');
  }
})

.controller('CommentsCtrl', function($scope, $ionicLoading,  AppService) {
  $ionicLoading.show({
    template: 'Fetching Comments..'
  });

  var userData = JSON.parse(localStorage.getItem('sam_user_data') || '{}');
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
  })

  $scope.postComment = function (commentText){
    console.log('commentText -> ', commentText);
    AppService.postComment(commentText, userId, $scope.post.id)
    .success(function(res){
      console.log('successfully posted the comment');
      console.log('response: ', res);
      $scope.post.comment_count = res.result.totalComments;
      res.result.timeAgo = moment(res.result.commTime).fromNow();
      try{
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
        $scope.post.news_count = response.data.news.news_count;
        $scope.post.isLikedByUser = response.data.news.isLikedByUser;
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

.controller('ProfileCtrl', function($scope, $state){
  $scope.User = JSON.parse((localStorage.getItem('sam_user_data')))
  $scope.User.Age = moment($scope.User.Birth_date).fromNow().split(' ')[0];
  $scope.goBack =function(){
    $state.go('app.postmapview');
  }
})

.controller('EditProfileCtrl', function($scope, $state){
  $scope.goToProfile = function(){
    $state.go('app.userprofile');
  }
})

.controller('SigninCtrl', function($scope, $rootScope, $state, $ionicLoading, $rootScope, AppService, $ionicModal) {

  $scope.formData = {};
  //$scope.formData.email = "brandonhere123@gmail.com";
  //$scope.formData.password = "dev12345678";

  $scope.doLogin = function () {

    // TODO: uncomment before commiting
    // if(!AppService.isConnected()){
    //     AppService.showErrorAlert('No Internet Connection', 'There seems to be a network problem. Please check your internet connection and try again.');
    //
    //     return;
    // }
      
    var data = {email:$scope.formData.email, password:$scope.formData.password};

    $ionicLoading.show();
    AppService.login(data)
    .success(function (response) {
        $ionicLoading.hide();
        if(response.status == 'SUCCESS'){
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
        AppService.showErrorAlert('Failed to login!', 'There seems to be a network problem. Please check your internet connection and try again.'); 
        console.warn(JSON.stringify(err));
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
                                AppService.showErrorAlert('Failed to login!', 'There seems to be a network problem. Please check your internet connection and try again.');
                                console.warn(JSON.stringify(err));
                        });
                }
            },{ scope:'email'});
  };
})

.controller('MessagesCtrl', function($scope, $ionicLoading, ModalService, AppService){
  $ionicLoading.show({
    template: 'Getting Messages..'
  });
  //TODO: handle "no messages" case
  AppService.getMessages()
  .success(function(res){
    console.log('res-> ', res);
    $scope.messages = res.result;
    $ionicLoading.hide();
  })
  .error(function(err){
    console.log('there was an error getting messages');
  })


  $scope.formData = {};

  //Compose message view modal
  $scope.modal = function() {
    ModalService.init('templates/post/add.html', $scope).then(function(modal) {
      modal.show();
    });
  };

  $scope.showCompose = function(){
    //console.log('showCompose called ...');
    $scope.modal();
  };

  $scope.close = function(id) {
    $scope.closeModal();
  };    

  // set post button to blue when typing
  $scope.checkInput = function(){
    $scope.textColor = '';
    if ($scope.formData.postText){
      //console.log($scope.formData.postText);
      ($scope.formData.postText.length > 0) ? $scope.textColor = 'blue' : $scope.textColor = 'gray';
    }
  }; 

  $scope.imgUri = null;

  //Image selector called from camera icon in compose view
  $scope.pickImages = function () {

    AppService.pickImage($scope);
  };

  $scope.closeImage = function(){
    $scope.imgUri = null;
  };
})

.controller('ChatCtrl', function($scope, $state){

})

.controller('PostListCtrl', function($scope, $rootScope, $state, $ionicPopup, $ionicPopover, $compile, $ionicLoading, AppService, ModalService){
  $scope.formData = {};
  var userData = JSON.parse(localStorage.getItem('sam_user_data') || '{}');
  var userId = userData.id || 0;

  // the regex that matches urls in text
  var urlRegEx = new RegExp(
          "((ftp|http|https|gopher|mailto|news|nntp|telnet|wais|file|prospero|aim|webcal):(([A-Za-z0-9$_.+!*(),;/?:@&~=-])|%[A-Fa-f0-9]{2}){2,}(#([a-zA-Z0-9][a-zA-Z0-9$_.+!*(),;/?:@&~=%-]*))?([A-Za-z0-9$_+!*();/?:~-]))"
       );

  var location = {
    latitude : userData.latitude,
    longitude: userData.longitude,
  }

  var data = {
    'latitude': location.latitude,
    'longitude': location.longitude,
    'userId': userId,
  }

  // TODO: cleanup on release
  if (!location){
    location = {
      latitude: 37.8088139,
      longitude: -122.266002
    };
    console.warn('Using DEV_MODE location coordinates on ListView');
  }

  AppService.getNearbyPosts(data)
    .success(function(data){
      $scope.nearbyPosts = data.result;
      console.log(data.result);
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
      })
    })

  $scope.openShare = function(text, link){
    window.plugins.socialsharing.share( text, null, null,link);
  }

  $scope.goToComments = function(post){
    AppService.setCurrentComments(post)
    .then(function(){
      $state.go('app.postcomments');
    })
  }

  $scope.vote = function(newsId , v){
    AppService.vote(newsId, v)
    .then(function(response){
      debugger;
      if (response.data.reasonfailed){
        console.log('voting failed', response.data.message)
      }else if (response.data.success){
        $scope.nearbyPosts.map(function(post){
          if (post.id === response.data.news.id){
            post.news_count = response.data.noofvotes_2;
            post.isLikedByUser = response.data.news.isLikedByUser;
          }
        })
      }

    }, function(err){
      console.log('error upvoting', err)
    })
  }
    
    $scope.modal2 = function() {
        ModalService.init('templates/post/add.html', $scope).then(function(modal) {
            modal.show();
        });
    };
    
  $scope.showModal = function (id) {
      
    if (id == 4){

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
        }
        else if(id == 4){
            $scope.closeModal();
            setTimeout(function(){
                $scope.modal.remove();
                $scope.showModal(2);
            },500);
        }            
        else
            $scope.closeModal();
    };

  $scope.$on('$destroy', function() {
    console.log('Destroying modals...');
    $scope.alertsPopover.remove();
    $scope.selectPopover.remove();
  });
    
    $scope.showMap = function(){
        //var position = AppService.getCurrentPosition();

        //var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        
        //if (!position) {
            var latLng = new google.maps.LatLng(37.8088139, -122.2660002);
        //}
        

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

        var map = new google.maps.Map(document.getElementById("cmap"), mapOptions);
        
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
        
        google.maps.event.addListener(marker, 'click', function() {
            
            infoWindow.open(map, marker);
            //$scope.post();
        });

    };    
    
    $scope.post = function () {
        $ionicLoading.show();

        var data = {
            "news" : 'Test',
            "user_id" : '59',
            "latitude" : 37.8088139,
            "longitude" : -122.2660002,
            "address" : null
        };

        AppService.addNewPost(data)
        .then(function (res) {
            //$scope.initialise();
            $ionicLoading.hide();
            $ionicPopup.alert({title: 'New Post', template: 'Status updated'})
            .then(function () {
                $scope.close(4);
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
      console.log('showAlerts called ...');
      $scope.alerts = [
        {
          user: "Amie Roger",
          message: "This is a test message to see how it looks like.",
          time: "July 10, 9:15am",
          profileImage: "img/eskimo.jpg"
        },
        {
          user: "Amie Roger",
          message: " This is a test message. This indeed is a test.",
          time: "July 10, 9:15am",
          profileImage: "img/eskimo.jpg"
        },

        {
          user: "Amie Roger",
          message: "This is a different test message. It is a bit longer. It will tell you how longer messages will look like. That should be enough.",
          time: "July 10, 9:15am",
          profileImage: "img/eskimo.jpg"
        },        
        {
          user: "Amie Roger",
          message: "This is very short.",
          time: "July 10, 9:15am",
          profileImage: "img/eskimo.jpg"
        },

        {
          user: "Amie Roger",
          message: "This is just more than short.",
          time: "July 10, 9:15am",
          profileImage: "img/eskimo.jpg"
        },
        {
          user: "Amie Roger",
          message: "This is a long message but not that long.",
          time: "July 10, 9:15am",
          profileImage: "img/eskimo.jpg"
        }];

        $scope.alertsPopover.show($event);        
    };
    
    //Below is the select popover code
    $ionicPopover.fromTemplateUrl('templates/post/select.html', {
        scope: $scope
      }).then(function(popover) {
        $scope.selectPopover = popover;
    });
    
    $scope.selected = 'View all';
    $scope.options = ['View all', 'One', 'Two'];
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
    
    //Image selector called from camera icon in map view
    $scope.getImages = function () {
        
        AppService.getImage($scope);
    };
    
    //Image selector called from camera icon in compose view
    $scope.pickImages = function () {
        
        AppService.pickImage($scope);
    };
            
    $scope.closeImage = function(){
        $scope.imgUri = null;
    };
})

.controller('MapCtrl', function($scope, $rootScope, $state, $stateParams, $timeout, $ionicLoading, $ionicPopup, $ionicPopover, $cordovaGeolocation, $compile, AppService, MapService, ModalService) {
    
    $rootScope.inputRadius = 8;
    $scope.formData = {};
    $scope.fileName = {};

    if(AppService.isConnected()){
        //Make an empty map at the start
        MapService.initMap();

        //Make circle and markers at the start
        MapService.refreshMap();          
    }
    else{
        AppService.showErrorAlert('No Internet Connection', 'There seems to be a network problem. Please check your internet connection and try again.');        
    }    
    
    var userId;
    var userData;
    var ud = localStorage.getItem('sam_user_data');
    console.log(ud);

    var userData = JSON.parse(ud) || '{}';

    var userId = userData.id || 0;
    console.log('userId: ' + userId);

    if(userData.Profile_image)
        $scope.formData.Profile_image = userData.Profile_image;
    else
        $scope.formData.Profile_image = 'img/avatar.png';//Default image
    
    $scope.nearbyPosts = {};


    //google.maps.event.addDomListener(document.getElementById("map"), 'load', $scope.initialise());
    
    $scope.showMap = function(){
        var location = JSON.parse(localStorage.getItem('sam_user_location'));
        if (!location) {
                location = {latitude: 37.8088139, longitude: -122.2660002};
                console.warn('WARN: Using DEV_MODE position: ' + location);        
        }

        var center = new google.maps.LatLng(location.latitude, location.longitude);
        
        var mapOptions = {
            center: center,
            zoom: 15,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: true,
            zoomControl: false//,
            //zoomControlOptions: {
              //style: google.maps.ZoomControlStyle.SMALL
            //}
        };

        var map = new google.maps.Map(document.getElementById("cmap"), mapOptions);
        
        var marker = new google.maps.Marker({
            position: center,
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
        
        google.maps.event.addListener(marker, 'click', function() {
            
            infoWindow.open(map, marker);
            //$scope.post();
        });
    };

    $scope.showModal = function (id) {
        // $state.go('app.postlistview');
        if(id == 1)
            $scope.modal1.show();
        else if (id == 2){
            $scope.modal2 = function() {
                ModalService.init('templates/post/add.html', $scope).then(function(modal) {
                    modal.show();
                });
            };
            
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
        else if (id == 4){
            
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
    };
    
    $scope.viewMode = 'half-view';
    
    $scope.showFullView = function(){
        $scope.viewMode = 'full-view';
    };
    
    $scope.hideModal = function(){
        $scope.viewMode = 'half-view';
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
          for (var i = 0; i < $rootScope.markers.length; i++) {
            google.maps.event.addListener($rootScope.markers[i], 'click', function() {
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
    
    $scope.imgUri = null;
    
    //Image selector called from camera icon in map view
    $scope.getImages = function () {
        
        AppService.getImage($scope);
    };
    
    //Image selector called from camera icon in compose view
    $scope.pickImages = function () {
        
        AppService.pickImage($scope);
    };
    
    $scope.closeImage = function(){
        $scope.imgUri = null;
    };

    // set post button to blue when typing
    $scope.checkInput = function(){
      $scope.textColor = '';
      if ($scope.formData.postText){
        //console.log($scope.formData.postText);
        ($scope.formData.postText.length > 0) ? $scope.textColor = 'blue' : $scope.textColor = 'gray';
      }
    };

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
        //console.log($scope.formData.postText);
    };
    
    //Below is the popover code
    $ionicPopover.fromTemplateUrl('templates/post/alerts.html', {
        scope: $scope
      }).then(function(popover) {
        $scope.popover = popover;
    });
        
    $scope.showAlerts = function ($event) {
      console.log('showAlerts called ...');
      $scope.alerts = [
        {
          user: "Amie Roger",
          message: "This is a test message to see how it looks like.",
          time: "July 10, 9:15am",
          profileImage: "img/eskimo.jpg"
        },
        {
          user: "Amie Roger",
          message: " This is a test message. This indeed is a test.",
          time: "July 10, 9:15am",
          profileImage: "img/eskimo.jpg"
        },

        {
          user: "Amie Roger",
          message: "This is a different test message. It is a bit longer. It will tell you how longer messages will look like. That should be enough.",
          time: "July 10, 9:15am",
          profileImage: "img/eskimo.jpg"
        },        
        {
          user: "Amie Roger",
          message: "This is very short.",
          time: "July 10, 9:15am",
          profileImage: "img/eskimo.jpg"
        },

        {
          user: "Amie Roger",
          message: "This is just more than short.",
          time: "July 10, 9:15am",
          profileImage: "img/eskimo.jpg"
        },
        {
          user: "Amie Roger",
          message: "This is a long message but not that long.",
          time: "July 10, 9:15am",
          profileImage: "img/eskimo.jpg"
        }];

        $scope.popover.show($event);        
    };
    
    //Below is the select popover code
    $ionicPopover.fromTemplateUrl('templates/post/select.html', {
        scope: $scope
      }).then(function(popover) {
        $scope.selectPopover = popover;
    });
    
    $scope.selected = 'View all';
    $scope.options = ['View all', 'One', 'Two'];
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
    
    // Load map (refresh) on login
    $rootScope.$on('login', function(event, data) {
        //console.log('login event received ....');
        MapService.refreshMap();
    });

    document.addEventListener("resume", function(e) {//Cordova event
        //console.log('App activated ... Cordova');
        if(AppService.isConnected()){
            MapService.removeMarkers();
            MapService.refreshMap();
        }
        else{
            AppService.showErrorAlert('No Internet Connection', 'There seems to be a network problem. Please check your internet connection and try again.');        
        }    
    }, false);    
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

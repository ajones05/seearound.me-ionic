angular.module('SeeAroundMe.services', [])

.factory('AppService', function($http, $q, $cordovaGeolocation, $cordovaCapture, $cordovaImagePicker, API_URL) {

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
        
        getCurrentPosition: function (){
            var deferred = $q.defer();
            console.log('Geolocation Service called...');
            var posOptions = {timeout: 10000, maximumAge:120000, enableHighAccuracy: false};

            $cordovaGeolocation
                .getCurrentPosition(posOptions)
                .then(function (position) {
                    var lat  = position.coords.latitude;
                    var long = position.coords.longitude;
                    var mylocation = JSON.stringify({latitude: lat, longitude: long});

                    localStorage.setItem('sam_user_location', mylocation);

                    console.log(mylocation);

                    deferred.resolve(mylocation);

                    // return mylocation;
                }, function(err) {
                    // error
                    console.error('Failed to get current position. Error: ' + JSON.stringify(err));
                    deferred.reject(err.message);
                    // return err;
                });

                return deferred.promise;
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

        getNearbyPosts: function (data) {
            var url = API_URL + '/request-nearest';
            return $http({
                method: 'POST',
                url: url,
                data: data,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            });
        },

        addNewPost: function (data) {
            var url = API_URL + '/addimobinews';
            return $http({
                method: 'POST',
                url: url,
                data: data,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
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

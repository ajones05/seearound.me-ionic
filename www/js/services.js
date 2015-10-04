angular.module('SeeAroundMe.services', [])

.factory('AppService', function($http, $q, $cordovaGeolocation, API_URL) {

    var service = {
        getCurrentPosition: function () {
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

});

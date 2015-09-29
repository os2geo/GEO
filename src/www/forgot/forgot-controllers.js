(function (window, angular, console) {
    'use strict';
    angular.module('myApp.controllers').controller('forgot', ['$scope', 'auth', '$http', 'md5', '$state', '$rootScope',
        function ($scope, auth, $http, md5, $state, $rootScope) {
            $scope.user = {
                name: ""
            };
            $scope.submit = function () {
                $http.post('/api/fotgot', $scope.user).
                success(function (data, status, headers, config) {

                    $scope.error = false;

                    $state.go("login");

                }).
                error(function (data, status, headers, config) {
                    $scope.data = data;
                    $scope.status = status;
                    $scope.error = true;
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                });
            };
        }
    ]);
})(this, this.angular, this.console);

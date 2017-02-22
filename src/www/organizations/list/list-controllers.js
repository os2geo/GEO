(function (window, angular, console) {
    'use strict';
    angular.module('myApp.controllers').controller('organizations-list', ['$scope', '$rootScope', '$http','$q',
        function ($scope, $rootScope, $http, $q) {
            var getDatabases = function (organization) {
                $http.get('/api/organization/' + organization.id+'/databases').
                success(function (data, status, headers, config) {
                    organization.databases = data.rows.length;
                    organization.size=0;
                    organization.docs=0;
                    var promises = [];
                    for(var i=0;i<data.rows.length;i++){
                        promises.push($http.get('/couchdb/db-'+data.rows[i].id));
                    }
                    $q.all(promises).then(function(data){
                        for(var i=0;i<data.length;i++){
                            organization.docs += data[i].data.doc_count;
                            organization.size += data[i].data.disk_size;
                        }
                    });
                }).
                error(function (data, status, headers, config) {
                    console.log(data);
                });
            };
            var getUsers = function (organization) {
                $http.get('/api/users/' + organization.id).
                success(function (data, status, headers, config) {
                    console.log(data);
                    organization.users = data.rows.length;
                }).
                error(function (data, status, headers, config) {
                    console.log(data);
                });
            };
            
            for (var i = 0; i < $rootScope.profile.user.organizations.length; i++) {
                var organization = $rootScope.profile.user.organizations[i];
                getDatabases(organization);
                getUsers(organization);
            }
        }
    ]);
})(this, this.angular, this.console);
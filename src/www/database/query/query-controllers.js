(function (window, angular, console) {
    'use strict';
    angular.module('myApp.controllers').controller('database-query', ['$scope', '$http', '$stateParams',
        function ($scope, $http, $stateParams) {
            $scope.query = "function(doc) {\n\n\n}";
            $scope.deleteExample = "function(doc) {\n    if(doc.properties.Status==='Udbedres') {\n        return null;\n    }\n}";
            $scope.updateExample = "function(doc) {\n    doc.properties.Status='Udbedres';\n    return doc;\n}";
            $scope.doQuery = function () {
                $scope.warning = null;
                $scope.error = null;
                $scope.success = null;
                var editFunc;
                try {
                    //eval("var editFunc = " + $scope.query);
                    editFunc = new Function('return ' + $scope.query)();

                } catch (e) {
                    $scope.error = e;
                    return;
                }
                $scope.toUpdate = [];
                var deleted = 0
                    , edited = 0
                    , failed = 0;
                $http.get('/couchdb/db-' + $stateParams.database + '/_design/views/_view/data?include_docs=true')
                    .success(function (data, status, headers, config) {
                        var rows = data.rows;
                        rows.forEach(function (row) {
                            var doc = row.doc;
                            try {
                                var clone = angular.extend({}, doc);
                                var updated = editFunc(clone);
                            } catch (e) {
                                failed++; // ignore if it throws on this doc
                                return;
                            }
                            if (updated === null) {
                                doc._deleted = true;
                                $scope.toUpdate.push(doc);
                                deleted++;
                            }
                            else if (updated) {
                                $scope.toUpdate.push(updated);
                                edited++;
                            }
                        });
                        // todo: make template for this
                        $scope.warning = "About to edit " + edited + " docs and delete " + deleted + " docs";
                        if (failed) {
                            $scope.error = "Edit function threw on " + failed + " docs";
                        }
                    })
                    .error(function (data, status, headers, config) {
                        $scope.error = data;
                    });
            };
            $scope.save = function () {
                $scope.warning = null;
                $scope.error = null;
                $scope.success = null;
                $scope.spin = true;
                var data = {
                    docs: $scope.toUpdate
                };
                $http.post('/couchdb/db-' + $stateParams.database + '/_bulk_docs', data)
                    .success(function (data, status, headers, config) {
                        $scope.success = data;
                     })
                    .error(function (data, status, headers, config) {
                        $scope.error = data;
                    })
                    .finally(function(){
                        $scope.spin = false;
                    });                    
            };
            
        }
    ]);
})(this, this.angular, this.console);

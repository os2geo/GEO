(function (window, angular, console) {
    'use strict';
    angular.module('myApp.controllers').controller('database-upload', ['$scope', '$location', '$http', '$stateParams', '$upload', '$state',
        function ($scope, $location, $http, $stateParams, $upload, $state) {
            $scope.success = null;
            $scope.error = null;
            $scope.onFileSelect = function ($files) {
                //$files: an array of files selected, each file has name, size, and type.
                for (var i = 0; i < $files.length; i++) {
                    upload($files[i]);
                }
                /* alternative way of uploading, send the file binary with the file's content-type.
       Could be used to upload files to CouchDB, imgur, etc... html5 FileReader is needed. 
       It could also be used to monitor the progress of a normal http post/put request with large data*/
                // $scope.upload = $upload.http({...})  see 88#issuecomment-31366487 for sample code.
            };
            var upload = function (file) {
                var url = '/api/upload';
                if(file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'){
                    url+='csv'
                }
                $scope.upload = $upload.upload({
                    url: url +'/' + $stateParams.database, //upload.php script, node.js route, or servlet url
                    //method: 'POST' or 'PUT',
                    //headers: {'header-key': 'header-value'},
                    //withCredentials: true,

                    file: file, // or list of files ($files) for html5 only
                    //fileName: 'doc.jpg' or ['1.jpg', '2.jpg', ...] // to modify the name of the file(s)
                    // customize file formData name ('Content-Disposition'), server side file variable name. 
                    //fileFormDataName: myFile, //or a list of names for multiple files (html5). Default is 'file' 
                    // customize how data is added to formData. See #40#issuecomment-28612000 for sample code
                    //formDataAppender: function(formData, key, val){}
                }).progress(function (evt) {
                    $scope.dynamic = parseInt(100.0 * evt.loaded / evt.total);
                }).success(function (data, status, headers, config) {
                    // file is uploaded successfully
                    console.log(data);
                    $scope.success = data;
                }).error(function (data, status, headers, config) {
                    console.log(data);
                    $scope.error = data;
                });
                //.then(success, error, progress); 
                // access or attach event listeners to the underlying XMLHttpRequest.
                //.xhr(function(xhr){xhr.upload.addEventListener(...)})
            };

        }
    ]);
})(this, this.angular, this.console);
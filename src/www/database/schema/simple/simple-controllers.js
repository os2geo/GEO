(function (window, angular, console, tv4) {
    'use strict';
    angular.module('myApp.controllers').controller('schema-simple', ['$rootScope', '$scope', '$http',
        function ($rootScope, $scope, $http) {
            var schema;

            $scope.fields = [];
            $scope.attachments = [];
            $scope.Point = false;
            $scope.LineString = false;
            $scope.Polygon = false;
            $scope.MultiPoint = false;
            $scope.MultiLineString = false;
            $scope.MultiPolygon = false;
            $scope.geometry = [];
            var init = function () {
                if (schema.properties && schema.properties.properties && schema.properties.properties.properties) {
                    for (var key in schema.properties.properties.properties) {
                        var field = schema.properties.properties.properties[key];
                        var required = false;
                        if (schema.properties.properties.required && schema.properties.properties.required.indexOf(key) !== -1) {
                            required = true;
                        }
                        var type = field.type;
                        var types = ["date-time", "email", "hostname", "ipv4", "ipv6", "uri"]
                        if (field.type === "string" && field.format && types.indexOf(field.format) !== -1) {
                            type = field.format;
                        }
                        $scope.fields.push({
                            name: key,
                            key: key,
                            title: field.title,
                            type: type,
                            required: required
                        });
                    }
                }
                if (schema.properties && schema.properties._attachments && schema.properties._attachments.properties) {
                    for (var key in schema.properties._attachments.properties) {
                        if (key.indexOf('tn_') !== 0) {
                            var field = schema.properties._attachments.properties[key];
                            var required = false;
                            if (schema.properties._attachments.required && schema.properties._attachments.required.indexOf(key) !== -1) {
                                required = true;
                            }
                            $scope.attachments.push({
                                name: key,
                                key: key,
                                title: field.title,
                                required: required
                            });
                        }
                    }
                }
                if (schema.properties && schema.properties.geometry && schema.properties.geometry.oneOf) {
                    for (var i = 0; i < schema.properties.geometry.oneOf.length; i++) {
                        var field = schema.properties.geometry.oneOf[i];
                        if (field.title === "Point") {
                            $scope.Point = true;
                        } else if (field.title === "LineString") {
                            $scope.LineString = true;
                        } else if (field.title === "Polygon") {
                            $scope.Polygon = true;
                        } else if (field.title === "MultiPolygon") {
                            $scope.MultiPolygon = true;
                        } else if (field.title === "MultiLineString") {
                            $scope.MultiLineString = true;
                        } else if (field.title === "MultiPoint") {
                            $scope.MultiPoint = true;
                        }
                    }
                }
            };
            if ($scope.$parent && $scope.$parent.schema) {
                schema = $scope.$parent.schema;
                init();
            }
            var basic = function () {
                schema = schema || {};
                schema.$schema = "http://json-schema.org/draft-04/schema#";
                schema.title = "Projekt";
                schema.description = "";
                schema.type = ["object"];
                schema.properties = schema.properties || {};
                schema.properties._id = { "type": "string" };
                schema.properties._rev = { "type": "string" };
                schema.properties._revisions = {
                    "type": "object",
                    "properties": {
                        "start": {
                            "type": "integer"
                        },
                        "ids": {
                            "type": "array"
                        }
                    }
                };
                schema.properties.type = {
                    "enum": ["Feature"]
                };
                schema.properties.geometry = schema.properties.geometry || {};
                schema.properties.geometry.title = "geometry";
                schema.properties.geometry.description = "One geometry as defined by GeoJSON";
                schema.properties.geometry.type = "object";
                schema.properties.geometry.required = ["type", "coordinates"];
                schema.properties.geometry.oneOf = schema.properties.geometry.oneOf || [];
                schema.required = [
                    "properties",
                    "type",
                    "geometry"
                ];
                schema.definitions = {
                    "position": {
                        "description": "A single position",
                        "type": "array",
                        "minItems": 2,
                        "items": [
                            {
                                "type": "number"
                            },
                            {
                                "type": "number"
                            }
                        ],
                        "additionalItems": false
                    },
                    "positionArray": {
                        "description": "An array of positions",
                        "type": "array",
                        "items": {
                            "$ref": "#/definitions/position"
                        }
                    },
                    "lineString": {
                        "description": "An array of two or more positions",
                        "allOf": [
                            {
                                "$ref": "#/definitions/positionArray"
                            },
                            {
                                "minItems": 2
                            }
                        ]
                    },
                    "linearRing": {
                        "description": "An array of four positions where the first equals the last",
                        "allOf": [
                            {
                                "$ref": "#/definitions/positionArray"
                            },
                            {
                                "minItems": 4
                            }
                        ]
                    },
                    "polygon": {
                        "description": "An array of linear rings",
                        "type": "array",
                        "items": {
                            "$ref": "#/definitions/linearRing"
                        }
                    }
                };
            };
            $scope.addAttachment = function () {
                schema.properties._attachments = schema.properties._attachments || {};
                schema.properties._attachments.type = "object";
                schema.properties._attachments.additionalProperties = true;
                schema.properties._attachments.properties = schema.properties._attachments.properties || {};
                var key = "new";
                var i = 1;
                while (schema.properties._attachments.properties.hasOwnProperty(key + i) || schema.properties._attachments.properties.hasOwnProperty('tn_' + key + i)) {
                    i++;
                }
                key = key + i;
                $scope.attachments.push({
                    name: key,
                    key: key,
                    title: "",
                    required: false
                });
                schema.properties._attachments.properties[key] = {
                    title: "",
                    additionalProperties: true,
                    type: "object"
                }
                schema.properties._attachments.properties['tn_' + key] = {
                    title: "",
                    additionalProperties: true,
                    type: "object"
                }
                $scope.$emit('validate');
            };
            $scope.removeAttachment = function (field) {
                field.required = false;
                $scope.attachmentRequiredChanged(field);
                for (var i = 0; i < $scope.attachments.length; i++) {
                    var item = $scope.attachments[i];
                    if (item.name === field.name) {
                        $scope.attachments.splice(i, 1);
                        break;
                    }
                }
                if (schema.properties._attachments.properties.hasOwnProperty(field.name)) {
                    delete schema.properties._attachments.properties[field.name];
                }
                if (schema.properties._attachments.properties.hasOwnProperty('tn_' + field.name)) {
                    delete schema.properties._attachments.properties['tn_' + field.name];
                }
                $scope.$emit('validate');
            };
            $scope.addDataField = function () {
                schema.properties.properties = schema.properties.properties || {};
                schema.properties.properties.type = "object";
                schema.properties.properties.properties = schema.properties.properties.properties || {};
                var key = "new";
                var i = 1;
                while (schema.properties.properties.properties.hasOwnProperty(key + i)) {
                    i++;
                }
                key = key + i;
                $scope.fields.push({
                    name: key,
                    key: key,
                    title: "",
                    type: "string",
                    required: false
                });
                schema.properties.properties.properties[key] = {
                    title: "",
                    type: "string"
                }
                $scope.$emit('validate');
            };
            $scope.removeDataField = function (field) {
                field.required = false;
                $scope.fieldRequiredChanged(field);
                for (var i = 0; i < $scope.fields.length; i++) {
                    var item = $scope.fields[i];
                    if (item.name === field.name) {
                        $scope.fields.splice(i, 1);
                        break;
                    }
                }
                delete schema.properties.properties.properties[field.name];
                $scope.$emit('validate');
            };
            $scope.attachmentRequiredChanged = function (field) {
                if (field.required) {
                    schema.properties._attachments.required = schema.properties._attachments.required || [];
                    schema.properties._attachments.required.push(field.name);
                } else {
                    if (schema.properties._attachments.required) {
                        var index = schema.properties._attachments.required.indexOf(field.name);
                        if (index !== -1) {
                            schema.properties._attachments.required.splice(index, 1);
                            if (schema.properties._attachments.required.length === 0) {
                                delete schema.properties._attachments.required;
                            }
                        }
                    }

                }
                $scope.$emit('validate');
            };
            $scope.fieldRequiredChanged = function (field) {
                if (field.required) {
                    schema.properties.properties.required = schema.properties.properties.required || [];
                    schema.properties.properties.required.push(field.name);
                } else {
                    if (schema.properties.properties.required) {
                        var index = schema.properties.properties.required.indexOf(field.name);
                        if (index !== -1) {
                            schema.properties.properties.required.splice(index, 1);
                            if (schema.properties.properties.required.length === 0) {
                                delete schema.properties.properties.required;
                            }
                        }
                    }
                }
                $scope.$emit('validate');
            };
            $scope.fieldTypeChanged = function (field) {
                if (field.name !== "" && !schema.properties.properties.properties.hasOwnProperty(field.name)) {
                    if (field.type === "string" || field.type === "boolean" || field.type === "integer" || field.type === "number") {
                        schema.properties.properties.properties[field.name].type = field.type;
                        if (schema.properties.properties.properties[field.name].hasOwnProperty("format")) {
                            delete schema.properties.properties.properties[field.name].format;
                        }
                    } else {
                        schema.properties.properties.properties[field.name].type = "string"
                        schema.properties.properties.properties[field.name].format = field.type;
                    }
                    $scope.$emit('validate');
                }
            };
            $scope.attachmentNameChanged = function (field) {
                if (field.name !== "") {
                    if (!schema.properties._attachments.properties.hasOwnProperty(field.name)) {
                        schema.properties._attachments.properties[field.name] = schema.properties._attachments.properties[field.key];
                        delete schema.properties._attachments.properties[field.key];
                        field.key = field.name;

                    }
                    var name = 'tn_' + field.name;
                    var key = 'tn_' + field.key;
                    if (!schema.properties._attachments.properties.hasOwnProperty(name)) {
                        schema.properties._attachments.properties[name] = schema.properties._attachments.properties[key];
                        delete schema.properties._attachments.properties[key];
                    }
                    $scope.$emit('validate');
                }
            };
            $scope.attachmentTitleChanged = function (field) {
                if (field.name !== "") {
                    if (schema.properties._attachments.properties.hasOwnProperty(field.name)) {
                        schema.properties._attachments.properties[field.name].title = field.title;
                    }
                    if (schema.properties._attachments.properties.hasOwnProperty('tn_' + field.name)) {
                        schema.properties._attachments.properties['tn_' + field.name].title = field.title;
                    }
                    $scope.$emit('validate');
                }
            };
            $scope.fieldNameChanged = function (field) {
                if (field.name !== "" && !schema.properties.properties.properties.hasOwnProperty(field.name)) {
                    schema.properties.properties.properties[field.name] = schema.properties.properties.properties[field.key];
                    delete schema.properties.properties.properties[field.key];
                    field.key = field.name;
                    $scope.$emit('validate');
                }
            };
            $scope.fieldTitleChanged = function (field) {
                if (field.name !== "" && schema.properties.properties.properties.hasOwnProperty(field.name)) {
                    schema.properties.properties.properties[field.name].title = field.title;
                    $scope.$emit('validate');
                }
            };
            $scope.pointChanged = function () {
                if (!$scope.Point) {
                    if (schema && schema.properties && schema.properties.geometry && schema.properties.geometry.oneOf) {
                        for (var i = 0; i < schema.properties.geometry.oneOf.length; i++) {
                            var field = schema.properties.geometry.oneOf[i];
                            if (field.title === "Point") {
                                schema.properties.geometry.oneOf.splice(i, 1);
                                break;
                            }
                        }
                    }
                } else {
                    basic();
                    schema.properties.geometry.oneOf.push({
                        "title": "Point",
                        "properties": {
                            "type": {
                                "enum": [
                                    "Point"
                                ]
                            },
                            "coordinates": {
                                "$ref": "#/definitions/position"
                            }
                        }
                    });
                }
                $scope.$emit('validate');
            };
            $scope.polygonChanged = function () {
                if (!$scope.Polygon) {
                    if (schema && schema.properties && schema.properties.geometry && schema.properties.geometry.oneOf) {
                        for (var i = 0; i < schema.properties.geometry.oneOf.length; i++) {
                            var field = schema.properties.geometry.oneOf[i];
                            if (field.title === "Polygon") {
                                schema.properties.geometry.oneOf.splice(i, 1);
                                break;
                            }
                        }
                    }
                } else {
                    basic();
                    schema.properties.geometry.oneOf.push({
                        "title": "Polygon",
                        "properties": {
                            "type": {
                                "enum": [
                                    "Polygon"
                                ]
                            },
                            "coordinates": {
                                "$ref": "#/definitions/polygon"
                            }
                        }
                    });
                }
                $scope.$emit('validate');
            };
            $scope.lineStringChanged = function () {
                if (!$scope.LineString) {
                    if (schema && schema.properties && schema.properties.geometry && schema.properties.geometry.oneOf) {
                        for (var i = 0; i < schema.properties.geometry.oneOf.length; i++) {
                            var field = schema.properties.geometry.oneOf[i];
                            if (field.title === "LineString") {
                                schema.properties.geometry.oneOf.splice(i, 1);
                                break;
                            }
                        }
                    }
                } else {
                    basic();
                    schema.properties.geometry.oneOf.push({
                        "title": "LineString",
                        "properties": {
                            "type": {
                                "enum": [
                                    "LineString"
                                ]
                            },
                            "coordinates": {
                                "$ref": "#/definitions/lineString"
                            }
                        }
                    });
                }
                $scope.$emit('validate');
            };
            $scope.multiPointChanged = function () {
                if (!$scope.MultiPoint) {
                    if (schema && schema.properties && schema.properties.geometry && schema.properties.geometry.oneOf) {
                        for (var i = 0; i < schema.properties.geometry.oneOf.length; i++) {
                            var field = schema.properties.geometry.oneOf[i];
                            if (field.title === "MultiPoint") {
                                schema.properties.geometry.oneOf.splice(i, 1);
                                break;
                            }
                        }
                    }
                } else {
                    basic();
                    schema.properties.geometry.oneOf.push({
                        "title": "MultiPoint",
                        "properties": {
                            "type": {
                                "enum": [
                                    "MultiPoint"
                                ]
                            },
                            "coordinates": {
                                "$ref": "#/definitions/positionArray"
                            }
                        }
                    });
                }
                $scope.$emit('validate');
            };
            $scope.multiLineStringChanged = function () {
                if (!$scope.MultiLineString) {
                    if (schema && schema.properties && schema.properties.geometry && schema.properties.geometry.oneOf) {
                        for (var i = 0; i < schema.properties.geometry.oneOf.length; i++) {
                            var field = schema.properties.geometry.oneOf[i];
                            if (field.title === "MultiLineString") {
                                schema.properties.geometry.oneOf.splice(i, 1);
                                break;
                            }
                        }
                    }
                } else {
                    basic();
                    schema.properties.geometry.oneOf.push({
                        "title": "MultiLineString",
                        "properties": {
                            "type": {
                                "enum": [
                                    "MultiLineString"
                                ]
                            },
                            "coordinates": {
                                "type": "array",
                                "items": {
                                    "$ref": "#/definitions/lineString"
                                }
                            }
                        }
                    });
                }
                $scope.$emit('validate');
            };
            $scope.multiPolygonChanged = function () {
                if (!$scope.MultiPolygon) {
                    if (schema && schema.properties && schema.properties.geometry && schema.properties.geometry.oneOf) {
                        for (var i = 0; i < schema.properties.geometry.oneOf.length; i++) {
                            var field = schema.properties.geometry.oneOf[i];
                            if (field.title === "MultiPolygon") {
                                schema.properties.geometry.oneOf.splice(i, 1);
                                break;
                            }
                        }
                    }
                } else {
                    basic();
                    schema.properties.geometry.oneOf.push({
                        "title": "MultiPolygon",
                        "properties": {
                            "type": {
                                "enum": [
                                    "MultiPolygon"
                                ]
                            },
                            "coordinates": {
                                "type": "array",
                                "items": {
                                    "$ref": "#/definitions/polygon"
                                }
                            }
                        }
                    });
                }
                $scope.$emit('validate');
            };


            $rootScope.$on("schema", function (e, data) {
                schema = data;
                init();
            });
        }
    ]);
})(this, this.angular, this.console, this.tv4);
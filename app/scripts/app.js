'use strict';

/**
 * @ngdoc overview
 * @name movielensApp
 * @description
 * # movielensApp
 *
 * Main module of the application.
 */
angular
    .module('movielensApp', [
        'cb.x2js',
        'ngAnimate',
        'ngCookies',
        'ngResource',
        'ngRoute',
        'ngSanitize',
        'ngTouch',
        'Seldon'

    ])
    .config(function ($routeProvider, $httpProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'views/main.html',
                controller: 'MainCtrl'
            })
            .when('/about', {
                templateUrl: 'views/about.html',
                controller: 'AboutCtrl'
            })
            .when('/users', {
                templateUrl: 'views/users.html',
                controller: 'MainCtrl'
            })
            .otherwise({
                redirectTo: '/'
            });
        /*$httpProvider.defaults.useXDomain = true;
        delete $httpProvider.defaults.headers.common["X-Requested-With"];
        $httpProvider.defaults.headers.common["Accept"] = "application/json";
        $httpProvider.defaults.headers.common["Content-Type"] = "application/json";
        $httpProvider.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
        $httpProvider.defaults.headers.common['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept';
        $httpProvider.defaults.headers.common['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS, PUT';
        $httpProvider.defaults.headers.common['Access-Control-Allow-Credentials'] = true;*/
    });


var seldonAPI = angular.module('Seldon', ['ngResource']);


seldonAPI.factory('Seldon', ['$http','$q', 'x2js',
    function($http, $q, x2js){
        var prefix = "http://";
        var def_host = "54.205.194.231:8084";
        var host = def_host;
        var consumer_key = "ZEFH7RXHR5UE9TC3FR2D";
        var consumer_key2 = 'P7HXTMLB151SBGTNVI3G';
        var consumer_secret = "Y7R93F1I76R5WHRH2JVZ";
        var _access_token;

        var getAccessToken = function() {
            var endpoint = "/token";

            var params = {
                'consumer_key': consumer_key,
                'consumer_secret': consumer_secret,
                'jsonpCallback': 'JSON_CALLBACK'
            };

            var def = $q.defer();


            $http.jsonp(prefix+host+endpoint, {'params':params}).success(function(response) {
                console.log(response);
                _access_token = response.access_token;

                def.resolve(response);
            });
            return def.promise;
        };

        var asyncAPICall = function(endpoint,params) {
            var def = $q.defer();
            console.log(endpoint);
            console.log(params);

            $http.jsonp(prefix+host+endpoint, {'params':params}).success(function(data, status, headers, config) {
                // console.log(headers('Location'));
                def.resolve(data);
            });
            return def.promise;
        };

        var getTwoDigit = function (num) {
            return ('0'+num).slice(-2);
        };

        return {
            setHost: function(ip) {
                host = ip ? ip : def_host;
            },
            getAccessToken: function(){
                return getAccessToken();
            },
            searchItem: function(name){

                var endpoint = "/token";

                var params = {
                    'consumer_key': consumer_key,
                    'consumer_secret': consumer_secret,
                    'jsonpCallback': 'JSON_CALLBACK',
                };

                var def = $q.defer();

                $http.jsonp(prefix+host+endpoint, {'params':params}).success(function(response) {
                    console.log(response);
                    _access_token = response.access_token;

                    return response;
                }).then(function(response) {

                    endpoint = "/items";

                    params = {
                        'oauth_token': _access_token,
                        'consumer_key': consumer_key,
                        'consumer_secret': consumer_secret,
                        'jsonpCallback': 'JSON_CALLBACK',
                        'full': 'true',
                        'name': name
                    };

                    $http.jsonp(prefix+host+endpoint, {'params':params}).success(function(response) {
                        def.resolve(response);
                    });

                });

                return def.promise;

            },
            addUserAction: function(user_id, item_id, type) {

                var endpoint = "/js/action/new";

                var params = {
                    'consumer_key': consumer_key2,
                    // 'consumer_secret': consumer_secret,
                    'type': type,
                    'jsonpCallback': 'JSON_CALLBACK',
                    'user':user_id,
                    'item':item_id,
                    'timestamp': Date.now()
                };

                return asyncAPICall(endpoint,params);

            },
            getRecentItems: function(user_id) {
                var deferred = $q.defer();
                this.getRecentActions(user_id).then(
                    function(resp){
                        var items = [];
                        var acts = resp['list'];

                        var urlCalls = [];
                        var endpoint = "/items/";

                        var params = {
                            'oauth_token': _access_token,
                            'jsonpCallback': 'JSON_CALLBACK',
                            'full': 'true'
                        };

                        angular.forEach(acts, function(act) {
                            urlCalls.push($http.jsonp(prefix+host+endpoint +act['item'],{'params':params}));
                        });
                        $q.all(urlCalls)
                            .then(
                            function(results) {
                                deferred.resolve(results);
                            },
                            function(errors) {
                                deferred.reject(errors);
                            },
                            function(updates) {
                                deferred.update(updates);
                            });

                    },
                    function(error){
                        console.log("ERROR, " + error);
                        return {}
                    }

                );
                return deferred.promise;
            },

            getUser: function(user_id) {
                var endpoint = "https://crossorigin.me/http://api.ahalife.com/user/"+user_id+"?auth-key=15";
                var params = {

                };
                // 'jsonpCallback': 'JSON_CALLBACK'
                var deferred = $q.defer();
                console.log(endpoint);
                console.log(params);

                var config = {
                    headers:  {
                        'Accept': 'application/json;odata=verbose'
                    }
                };

                $http.get(endpoint, config).success(function(data, status, headers, config) {
                    // console.log(headers('Location'));
                    data = x2js.xml_str2json(data);
                    deferred.resolve(data['GetUserResponse']);
                    //console.log(JSON.stringify(data));
                });
                return deferred.promise;
            },

            getRecentActions: function(user_id) {

                var endpoint = "/users/" + user_id + "/actions";
                var params = {
                    'oauth_token': _access_token,
                    // 'consumer_secret': consumer_secret,
                    'jsonpCallback': 'JSON_CALLBACK',
                    'user':user_id,
                    'limit':'50'
                };

                return asyncAPICall(endpoint,params);

            },
            getRecommendations: function(algorithms, user_id, item_id) {

                var endpoint = "/js/recommendations";
                var params = {
                    'consumer_key': consumer_key2,
                    'user': user_id,
                    'attributes': 'name,image,tag_name',
                    // 'consumer_secret': consumer_secret,
                    'jsonpCallback': 'JSON_CALLBACK',
                    'item': item_id, // do we need to include an item?
                    'limit':'20',
                    'algorithms': algorithms,
                };

                return asyncAPICall(endpoint,params);

            },
            getXRecommendations: function(strategy, user_email) {

                var endpoint = "https://crossorigin.me/http://my.ahalife.com/u";
                var today = new Date();
                var params = {
                    's': strategy,
                    'e': user_email,
                    'ejid': today.getFullYear()+''+getTwoDigit(today.getMonth())+''+getTwoDigit(today.getDate()),
                };
                // 'jsonpCallback': 'JSON_CALLBACK'
                var def = $q.defer();
                console.log(endpoint);
                console.log(params);

                $http.get(endpoint, {'params':params}).success(function(data, status, headers, config) {
                    // console.log(headers('Location'));
                    def.resolve({"list": data});
                    console.log(JSON.stringify({"list": data}));
                });

               /* $http({
                    method: 'JSONP',
                    url: endpoint,
                    params: params
                }).
                success(function(data, status, headers, config) {
                    def.resolve({"list": data});
                    console.log(JSON.stringify({"list": data}));
                }).
                error(function(data, status, headers, config) {
                    console.log("error >> "+data);
                    def.reject({});
                });*/
                return def.promise;

            },
            getPioRecommendations: function(strategy, user_id) {
                //var pio = predictionio('XxIaPWJcL8ZVytr8igJCXOAVFRT2fw200zUOOlYW3dMwLfnaUXF8r91FZSAK4eAT');
                //pio.item_recommendations(engine_name, query, callback)
                var endpoint = "http://localhost:8000/queries.json";
                var params = {
                    'user': user_id
                };
                // 'jsonpCallback': 'JSON_CALLBACK'
                var def = $q.defer();
                console.log(endpoint);
                console.log(params);
                $http.post(endpoint, params).success(function(data, status, headers, config) {
                    // console.log(headers('Location'));
                    def.resolve({"list": data.itemScores});
                    console.log(JSON.stringify({"list": data}));
                });

                /* $http({
                 method: 'JSONP',
                 url: endpoint,
                 params: params
                 }).
                 success(function(data, status, headers, config) {
                 def.resolve({"list": data});
                 console.log(JSON.stringify({"list": data}));
                 }).
                 error(function(data, status, headers, config) {
                 console.log("error >> "+data);
                 def.reject({});
                 });*/
                return def.promise;

            },
            addUser: function(user_id) {

                var endpoint = "/js/user/new";

                var params = {
                    'consumer_key': consumer_key2,
                    'user':user_id,
                    'jsonpCallback': 'JSON_CALLBACK'
                };

                return asyncAPICall(endpoint,params);
            }
        }
    }]);


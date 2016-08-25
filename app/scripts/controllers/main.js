'use strict';

/**
 * @ngdoc function
 * @name movielensApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the movielensApp
 */
angular.module('movielensApp')
    .controller('MainCtrl', function ($scope, $http, $resource, $q, Seldon, $cookieStore, $timeout) {

        var INTRO_MESSAGE="Start by searching for a item that you like...";

        $scope.host = "";
        $scope.consumer_key = "tnedddvlho";
        $scope.consumer_secret = "lzufhqbomz";
        $scope.access_token = "5c0rkho6ucmrb6h5qhjb1vo49";
        $scope.leadMessage=INTRO_MESSAGE;
        $scope.info_message="Now you can like some items to build up a profile.";
        $scope.failed_search_message="No matching items found.";
        $scope.failed_rec_message="No recommendations returned for this algorithm. Try liking another item or trying a different algorithm.";
        $scope.defActivated = '';
        $scope.mfActivated = '';
        $scope.simActivated = '';
        $scope.semActivated = '';
        $scope.wordActivated = '';
        $scope.assocActivated = '';
        $scope.topActivated = '';
        $scope.pioActivated = '';
        $scope.x1Activated = '';
        $scope.x2Activated = '';
        $scope.x3Activated = '';
        $scope.recResults='';
        $scope.searchedBefore = false;
        var server_ip = "";
        var user_id = ""; // update the text box
        var user_email = "";
	var EMBEDLY_URL_PREFIX= "<EMBEDLY_HERE>"

        var secondaryLeadMessage = "Add more items to increase the accuracy of the predictions...";
        var generateUUID = function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        };

        var fillInMissingImages = function(data) {
            angular.forEach(data, function(item){
                if(item.data){
                    item = item.data;
                }
                if(item['attributesName'] && !item['attributesName']['image']){
                    item['attributesName']['image'] = 'images/check.gif';
                }

            });
        };

        var rewriteImageUrlForEmbedly = function(data){
            angular.forEach(data, function(item) {
                if (item.data) {
                    item = item.data;
                }
                if (item['attributesName'] && item['attributesName']['image'] && EMBEDLY_URL_PREFIX != '') {
                    item['attributesName']['img_url'] = EMBEDLY_URL_PREFIX + encodeURIComponent(item['attributesName']['image']);
                }
            });
        };


        var getUserId = function() {
            var userIdLocal = $cookieStore.get("userId");
            /*if (!userIdLocal || userIdLocal == ""){
                userIdLocal = generateUUID();
                $cookieStore.put("userId",userIdLocal);
            }*/
            user_id = userIdLocal;
            try {
                user_email = $cookieStore.get("userEmail");
            } catch (e) {
                console.log("Got an error!",e);
            }
            $scope.current_user = user_id;
        };

        var getServerIp = function() {
            var serverIpLocal = $cookieStore.get("serverIp");
            server_ip = serverIpLocal;
            $scope.current_server = server_ip;
            Seldon.setHost(server_ip);
        };

        var setServerIp = function(serverIp) {
            $cookieStore.put("serverIp",serverIp);
            Seldon.setHost(server_ip);
        };

        var setUserId = function(userId) {
            $cookieStore.put("userId",userId);
        };

        var setUserEmail = function(userEmail) {
            $cookieStore.put("userEmail",userEmail);
        };

        var getAccessToken = function() {
            Seldon.getAccessToken().then(function(response){

                Seldon.getRecentItems(user_id).then(function(items){
                    console.log(items);
                    rewriteImageUrlForEmbedly(items);
                    fillInMissingImages(items);

                    $scope.watched = items;
                    if(items && items.length > 0){
                        jQuery("#watched").show();
                        jQuery("#user-history-algs-section").show();
                        jQuery("#searched-items").show();
                        $scope.leadMessage = secondaryLeadMessage;
                    }
                });

            });
        };

        $scope.changeServer = function() {
            server_ip = $scope.current_server; //user[0];
            //user_email = user[1];
            setServerIp(server_ip);
            console.log("new ip: " + server_ip);
            $scope.success_message = "Changed the server to " + server_ip;
        };

        $scope.changeUser = function() {
            $scope.items = null;
            $scope.search_title = null;
            //var user = $scope.current_user.split(":");
            user_id = $scope.current_user; //user[0];
            //user_email = user[1];
            setUserId(user_id);
            $timeout(function () {
                Seldon.getUser(user_id).then(function (user) {
                    user_email = user.profile.email;
                    setUserEmail(user_email);
                })
            },200);
            getAccessToken();
            console.log("new user: " + user_id);
            $scope.success_message = "Changed the active user to " + user_id;

            $scope.getOrderedActions();
            $scope.getRecentActions();
        };

        $scope.resetUser = function() {
            $scope.current_user = $scope.items =  $scope.search_title = null;
            $scope.recResults = 'no-display';
            $scope.watched = [];
            $scope.leadMessage=INTRO_MESSAGE;
            //jQuery('#watched').hide();
            //jQuery("#user-history-algs-section").hide();
            //jQuery("#searched-items").hide();
            $cookieStore.remove("userId");
            $cookieStore.remove("userEmail");
            //getUserId();
            //getUserEmail();
            // Make sure the user is created
            //Seldon.addUser(user_id).then(function(response){});
        };

        $scope.searchItems = function() {

            Seldon.searchItem($scope.search_movie).then(function(items){
                console.log(items);
                rewriteImageUrlForEmbedly(items.list);
                fillInMissingImages(items.list);
                $scope.items = items;
		        //$scope.recAlert = 'no-display'
                if(items && items.list.length > 0) {
                    $scope.searchAlert = 'no-display';
                    jQuery("#searched-items").show();
                    if ($scope.searchedBefore) {
                        $scope.infoAlert = 'no-display'
                    } else {
                        $scope.searchedBefore = true;
                        $scope.infoAlert = 'should-display';
                    }
                    $scope.searchResultsClass = 'should-display';
                    //$scope.recsResult = 'no-display'
                    //$scope.deactivateAlgButton();
                    jQuery('html, body').delay(100).animate({
                        scrollTop: jQuery("#searched-items").offset().top
                    }, 300);
                }
		else
		{
                  jQuery("#searched-items").hide();
		  $scope.searchAlert = 'should-display'
		  $scope.infoAlert = 'no-display'
		}
            });

            $scope.search_title = "Search results for \"" + $scope.search_movie+"\"";

            // $http.get('json/searchmovies.json').success(function(data){
            // 	$scope.items = data;
            // 	console.log($scope.items);
            // });

        };

        $scope.addViewAction = function(item_id) {
            console.log(item_id);
            $scope.success_message = "You've added item "+item_id;
            Seldon.addUserAction(user_id, item_id, 1).then(function(response){
                console.log(response);
             console.log("You've viewed item "+item_id);
            })
                .then(function(response) {

                });
        };

        $scope.addCartAction = function(item_id) {
            console.log("item_id: "+item_id);
            $scope.success_message = "You've added item "+item_id;
            Seldon.addUserAction(user_id, item_id, 2).then(function(response){
                console.log(response);
                console.log("You've carted item "+item_id);
            })
                .then(function(response) {

                });
        };

        $scope.addBuyAction = function(item_id) {
            console.log(item_id);
            $scope.success_message = "You've added item "+item_id;
            Seldon.addUserAction(user_id, item_id, 3).then(function(response){
                console.log(response);
                console.log("You've bought item "+item_id);
            })
                .then(function(response) {

                });
        };

        $scope.getRecentActions = function(action) {
            //jQuery("#user-history-algs-section").show();
            jQuery('#watched').show();

            $timeout(function () {
                Seldon.getRecentItems(user_id).then(function (items) {
                    if ($scope.watched.length == 0) {
//                            $scope.likeAddedAlert = 'should-display';
                        $scope.likeAddedAlert = 'no-display';
                        $scope.success_message = "You've added a user action - i.e. told the algorithm you viewed item "+
                            " Now add more items that you like or get recommendations below.";
                    } else {
                        $scope.likeAddedAlert = 'no-display';
                    }
                    //$scope.getRecommendations('recommenders:RECENT_MATRIX_FACTOR,num_recent_actions:1', item_id);
                    //$scope.activateAlgButton('mfActivated');
                    console.log("recent: "+items);
                    rewriteImageUrlForEmbedly(items);
                    fillInMissingImages(items);
                    $scope.watched = items;
                    $scope.leadMessage = secondaryLeadMessage;
                })
            },200);
            console.log(action);
        };

        $scope.getOrderedActions = function(action) {
            //jQuery("#user-history-algs-section").show();
            jQuery('#ordered').show();

            $timeout(function () {
                Seldon.getUser(user_id).then(function (user) {
                    /*if ($scope.watched.length == 0) {
//                            $scope.likeAddedAlert = 'should-display';
                        $scope.likeAddedAlert = 'no-display';
                        $scope.success_message = "You've added a user action - i.e. told the algorithm you ordered item ID " + item_id +
                            " Now add more items that you like or get recommendations below.";
                    } else {
                        $scope.likeAddedAlert = 'no-display';
                    }*/
                    var ordered = [];
                    if(user.orderList) {
                        if (user.orderList instanceof Array) {
                            angular.forEach(user.orderList, function (order) {
                                if (order.orderItemList instanceof Array) {
                                    angular.forEach(order.orderItemList, function (item) {
                                        ordered.push(item);
                                    });
                                } else {
                                    ordered.push(order.orderItemList);
                                }
                            });
                        } else {
                            if (user.orderList.orderItemList instanceof Array) {
                                angular.forEach(user.orderList.orderItemList, function (item) {
                                    ordered.push(item);
                                });
                            } else {
                                ordered.push(user.orderList.orderItemList);
                            }
                        }
                    }

                    /*if(user.orderList) {
                        if(user.orderList.orderItemList instanceof Array) {
                            angular.forEach(user.orderList.orderItemList, function (orderItem) {
                                ordered.push(orderItem);
                            });
                        }else {
                            ordered.push(user.orderList.orderItemList);
                        }
                    }*/
                    //user.orderList ? user.orderList : {};
                    var carted = []; //user.cart ? user.cart.items: {};
                    if(user.cart) {
                        if (user.cart instanceof Array) {
                            angular.forEach(user.cart, function (item) {
                                carted.push(item);
                            });
                        }else{
                            carted.push(user.cart.items);
                        }
                    }
                    /*angular.forEach(user.cart.items, function(item) {
                        ordered.push(item);
                    });*/
                    //$scope.getRecommendations('recommenders:RECENT_MATRIX_FACTOR,num_recent_actions:1', item_id);
                    //$scope.activateAlgButton('mfActivated');
                    console.log("ordered: "+ordered);
                    //rewriteImageUrlForEmbedly(items);
                    //fillInMissingImages(items);
                    $scope.ordered = ordered;
                    $scope.carted = carted;
                    //$scope.leadMessage = secondaryLeadMessage;
                })
            },200);
            console.log(action);
        };

        $scope.getSimilarItems = function(items) {
            console.log(item);
        };

        $scope.getSemanticVectorsItem = function(item) {
            console.log(item);
        };

        $scope.getSemanticVectorsRecentItems = function(items) {
            console.log(items);
        };

        $scope.activateAlgButton = function(name){
            $scope.defActivated = '';
            $scope.mfActivated = '';
            $scope.simActivated = '';
            $scope.semActivated = '';
            $scope.wordActivated = '';
            $scope.assocActivated = '';
            $scope.topActivated = '';
            $scope.pioActivated = '';
            $scope.x1Activated = '';
            $scope.x2Activated = '';
            $scope.x3Activated = '';
            $scope[name] = 'active'
        };

        $scope.deactivateAlgButton = function(){
            $scope.mfActivated = '';
            $scope.simActivated = '';
            $scope.semActivated = '';
            $scope.wordActivated = '';
            $scope.assocActivated = '';
            $scope.topActivated = '';
            $scope.pioActivated = '';
            $scope.x1Activated = '';
            $scope.x2Activated = '';
            $scope.x3Activated = '';
        };

        $scope.getRecommendations = function(algorithms, item_id) {

            // var algorithsm = {
            //   'SIMILAR'
            // }

            $scope.isCollapsed = false;

            $scope.items = null;
            $scope.search_title = "Recommendations using " + algorithms;

            if(item_id == undefined) {
                item_id = "";
            } else {
                $scope.search_title += " and item " + item_id;
            }

            if(algorithms == undefined) {
                algorithms = "";
            }

            console.log(algorithms);
            console.log(item_id);

            Seldon.getRecommendations(algorithms, user_id, item_id).then(function(items){
                console.log(items);
                jQuery("#searched-items").show();
                $scope.searchAlert = 'no-display'
                $scope.searchResultsClass = 'no-display';
                $scope.infoAlert = 'no-display';
                if(items && items.list.length > 0) 
		{
		    $scope.recAlert = 'no-display'
                    rewriteImageUrlForEmbedly(items.list);
                    fillInMissingImages(items.list);
                    $scope.items = items;
                    $scope.recResults = 'should-display'
		}
		else
		{
		    $scope.recAlert = 'should-display'
		}
                /*jQuery('html, body').delay(100).animate({
                    scrollTop: jQuery("#user-history-algs-section").offset().top
                }, 300);*/
            });
        };
        $scope.getPioRecommendations = function(strategy) {
            $scope.search_title = "Recommendations using existing algos";

            Seldon.getPioRecommendations(strategy, user_email).then(function(items){
                console.log('strategy'+strategy);
                jQuery("#searched-items").show();
                $scope.searchAlert = 'no-display'
                $scope.searchResultsClass = 'no-display';
                $scope.infoAlert = 'no-display';
                console.log("items: "+JSON.stringify(items));
                if(items && items.list.length > 0)
                {
                    $scope.recAlert = 'no-display'
                    rewriteImageUrlForEmbedly(items.list);
                    fillInMissingImages(items.list);
                    $scope.items = items;
                    $scope.recResults = 'should-display'
                }
                else
                {
                    $scope.recAlert = 'should-display'
                }
                /*jQuery('html, body').delay(100).animate({
                 scrollTop: jQuery("#user-history-algs-section").offset().top
                 }, 300);*/
            });
        };
        $scope.getXRecommendations = function(strategy) {
            $scope.search_title = "Recommendations using existing algos";

            Seldon.getXRecommendations(strategy, user_email).then(function(items){
                console.log('strategy'+strategy);
                jQuery("#searched-items").show();
                $scope.searchAlert = 'no-display'
                $scope.searchResultsClass = 'no-display';
                $scope.infoAlert = 'no-display';
                console.log("items: "+JSON.stringify(items));
                if(items && items.list.length > 0)
                {
                    $scope.recAlert = 'no-display'
                    rewriteImageUrlForEmbedly(items.list);
                    fillInMissingImages(items.list);
                    $scope.items = items;
                    $scope.recResults = 'should-display'
                }
                else
                {
                    $scope.recAlert = 'should-display'
                }
                /*jQuery('html, body').delay(100).animate({
                 scrollTop: jQuery("#user-history-algs-section").offset().top
                 }, 300);*/
            });
        };
        if(!getUserId()) {
            $scope.changeUser();
        }
        getUserId();
        getServerIp();
        // Make sure the user is created
        Seldon.addUser(user_id).then(function(response){
            getAccessToken();
            $("#item-search-box").keyup(function() {
                var empty = $("#item-search-box").val() == "";
                jQuery("#item-search-button").prop('disabled', empty);

            });
        });
        function unused(data) {
            $scope.items = data;
            console.log($scope.items);
        }

        $scope.init= function(){
            jQuery("#user-history-algs-section").show();
            jQuery("#searched-items").show();
            $scope.activateAlgButton('defActivated');
            $scope.getRecommendations('');
            $scope.getOrderedActions();
        }
        $scope.init();

    });

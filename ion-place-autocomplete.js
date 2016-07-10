window.placeTools = angular.module('ion-place-tools', []);
placeTools.directive('ionGooglePlace', [
        '$ionicTemplateLoader',
        '$ionicPlatform',
        '$q',
        '$timeout',
        '$rootScope',
        '$document',
        function($ionicTemplateLoader, $ionicPlatform, $q, $timeout, $rootScope, $document) {
            return {
                require: '?ngModel',
                restrict: 'E',
                templateUrl: 'src/ionGooglePlaceTemplate.html',
                replace: true,
                scope: {
                    searchQuery: '=ngModel',
                    locationChanged: '&',
                    radius: '='
                },
                link: function(scope, element, attrs, ngModel){
                    scope.dropDownActive = false;
                    var service = new google.maps.places.AutocompleteService();
                    var searchEventTimeout = undefined;
                    var latLng = null;

                    navigator.geolocation.getCurrentPosition(function (position){
                        latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                    });

                    var searchInputElement = angular.element(element.find('input'));

                    scope.selectLocation = function(location){
                        scope.dropDownActive = false; ///scope.searchQuery = location.description;
                        if( scope.locationChanged ) scope.locationChanged()(location);
                    };
                    scope.radius = scope.radius || 1500000;

                    scope.locations = [];

                    scope.$watch('searchQuery', function(query){
                        ///if (!query)  query = '';
                        scope.dropDownActive = (query && query.length >= 3 && scope.locations.length);

                        if( searchEventTimeout ) $timeout.cancel(searchEventTimeout);

                        searchEventTimeout = $timeout(function() {
                            if( !query ) return;
                            if( query.length < 3 )
                            {
                                scope.locations = [];
                                return;
                            }
                            var req = {};
                            req.input = query;
                            ///https://developers.google.com/places/supported_types?hl=ru
                            /*
                             Уфа, комсомольская 2
                            */
                            req.types = ['(cities)'];
                            ///req.types = ['(regions)'];
                            ///req.types = ['address'];
                            ///req.types = ['geocode'];
                            req.componentRestrictions = {country: 'ru'};
                            if( latLng )
                            {
                                req.location = latLng;
                                req.radius = scope.radius;
                            }
                            service.getQueryPredictions(req, function(predictions, status){
                                if( status == google.maps.places.PlacesServiceStatus.OK )
                                {
                                    scope.locations = predictions;
                                    scope.$apply(); /// $digest not working
                                }
                            });
                        }, 350); /// we're throttling the input by 350ms to be nice to google's API
                    });

                    var onClick = function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        scope.dropDownActive = true;
                        searchInputElement[0].focus();
                        setTimeout(function(){
                            searchInputElement[0].focus();
                            scope.$digest();
                        },0);
                    };

                    var onCancel = function(e){
                        setTimeout(function () {
                            scope.dropDownActive = false;
                            scope.$digest();
                        }, 200);
                    };

                    element.find('input').bind('click', onClick);
                    element.find('input').bind('blur', onCancel);
                    element.find('input').bind('touchend', onClick);


                    if( attrs.placeholder ) element.find('input').attr('placeholder', attrs.placeholder);
                }
            };
        }
    ]);

// Add flexibility to template directive
var template = '' +
    '<div class="item ion-place-tools-autocomplete" scroll="true" overflow-scroll="true">' +
        '<div class="row padding item-icon-right">' +
            ///'<i class="item-no-wrap ion-place-tools-point-text">От</i>' +
            '<input type="text" autocomplete="off" ng:model="searchQuery">' +
            '<i class="button-icon icon ion-close-round" ng:click="searchQuery=\'\'"></i>' +
        '</div>' +
        '<div class="ion-place-tools-autocomplete-dropdown" ng:show="dropDownActive">' +
            '<ion-list>' +
            '<ion-item ng-repeat="location in locations" ng:click="selectLocation(location)" class="item-text-wrap">' +
            '{{location.description}}' +
            '</ion-item>' +
            '</ion-list>' +
        '</div>' +
    '</div>';
placeTools.run(["$templateCache", function($templateCache) {$templateCache.put("src/ionGooglePlaceTemplate.html",template);}]);

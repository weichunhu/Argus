'use strict';
/*global angular:false */

angular.module('argus.directives.controls.tagkName', [])
.directive('agTagkName', ['CONFIG', '$routeParams', 'SearchService', function(CONFIG, $routeParams, SearchService) {
	return {
		restrict: 'EA',
		scope: {
			controlValue: '@default',
			elemId: '@id',
			cssName: '@class',
			style: '@style',
			size: '@size',
		},
		controller: function($scope) {
			var lastParams;
			var noMorePages = false;
			$scope.ctrlVal = $scope.controlValue;

			for (var prop in $routeParams) {
				if (prop == 'tagk') {
					$scope.ctrlVal = $routeParams[prop];
				}
				$scope[prop] = $routeParams[prop];
			}
			// get a list of scope, metric, tagk, tagv, namespace (controlName)

			$scope.searchMetrics = function(value, category) {
			// TODO: move param processing to search service
				noMorePages = false;
				var defaultParams = {
					namespace: '*',
					scope: '*',
					metric: '*',
					tagk: '*',
					tagv: '*',
					limit: 25,
					page: 1,
					type: 'scope'
				};

				var newParams = angular.copy(defaultParams);

				// update params with values in $scope if they exist
				newParams.scope = ($routeParams.scope && $routeParams.scope !== 'undefined') ? $routeParams.scope : '*';
				newParams.tagv = ($routeParams.tagv && $routeParams.tagv !== 'undefined') ? $routeParams.tagv : '*';
				newParams.metric = ($routeParams.metric && $routeParams.metric !== 'undefined') ? $routeParams.metric: '*';
				newParams.namespace = ($routeParams.namespace && $routeParams.namespace !== 'undefined') ? $routeParams.namespace : '*';
				newParams.tagk = (value) ? value : '*';
				newParams.type = category ? category : 'scope';

				if(category) {
					if(category === 'scope') {
						newParams.scope = newParams.scope + '*';
					} else if(category === 'metric') {
						newParams.metric = newParams.metric + '*';
					} else if(category === 'tagk') {
						newParams.limit = 10;
						newParams.tagk = newParams.tagk + '*';
					} else if(category === 'tagv') {
						newParams.tagv = newParams.tagv + '*';
					} else if(category === 'namespace') {
						newParams.namespace = newParams.namespace + '*';
					}
				} else {
					newParams.scope = newParams.scope + '*';
				}

				lastParams = newParams;
				// end TODO
				//return a promise for template but later assign the data to the variable
				var result = SearchService.search(newParams)
					.then(function(response) {
						if(response.data.length < newParams.limit){
							noMorePages = true;
						}
						return response.data;
					});
				return result;
			};

			$scope.loadMore = function(matches, loadingAttr){
				if(noMorePages) return;

				lastParams.page = lastParams.page + 1;
				eval('$scope.'+loadingAttr +'= true;');
				SearchService.search(lastParams)
					.then(function(response) {
						if(response.data.length < lastParams.limit){
							noMorePages = true;
						}
						response.data.forEach(function(name){
							matches.push({
								model: name
							});
						});
						eval('$scope.'+loadingAttr +'= false;');

					}, function(){
						eval('$scope.'+loadingAttr +'= false;');
					});

			};
		},
		require: '^agDashboard',
		template:
		'<label>Tag key</label><span ng-if="noTagkResults" class="error"> &nbsp; No results</span>'+
		'<input id="{{elemId}}"  type="text" class="{{cssName}}" size="{{size}}" style="{{style}}"'+
		'type="text" class="form-control" placeholder="Tag key" autocomplete="off" ng-model="ctrlVal"'+
		'ng-class="{\'loading\': (loadingTagk) ? true : false, \'cancel\': (noTagkResults) ? true : false}"'+
		'typeahead-min-length="0"'+
		'typeahead-wait-ms="250"'+
		'typeahead-no-results="noTagkResults"'+
		'typeahead-loading="loadingTagk"'+
		'uib-typeahead="result for result in searchMetrics($viewValue, \'tagk\')"'+
		'typeahead-popup-template-url="tagkTemplate.html"'+
		'ng-disabled="isSearchMetricDisabled()"'+
		'/>'+
		'<script type="text/ng-template" id="tagkTemplate.html">'+
				'<ul class="dropdown-menu viewMetricsUl"'+
						'ng-show="isOpen() && !moveInProgress"'+
						'ng-style="{top: position().top+\'px\', left: position().left+\'px\'}"'+
						'role="listbox" aria-hidden="false"'+
						'ag-infinite-scroll="scope.$parent.$parent.loadMore(scope.matches, \'loadingTagk\')"'+
				'>'+
						'<li class="uib-typeahead-match" ng-repeat="match in matches track by $index"'+
								'ng-class="{active: isActive($index) }"'+
								'ng-mouseenter="selectActive($index)"'+
								'ng-click="selectMatch($index)"'+
								'id="{{::match.id}}">'+
								'<a class="autoComplete">'+
										'<span ng-bind-html="match.model | uibTypeaheadHighlight:query"></span>'+
								'</a>'+
						'</li>'+
				'</ul>'+
		'</script>',
		
		link: function(scope, element, attributes, dashboardCtrl) {
			dashboardCtrl.updateControl('tagk', scope.ctrlVal, 'agTagkName');
			scope.$watch('ctrlVal', function(newValue){
				dashboardCtrl.updateControl('tagk', newValue, 'agTagkName', true);
			});
		}
	};
}]);

aleph.controller('CollectionsEntitiesCtrl', ['$scope', '$http', '$timeout', '$anchorScroll', 'Collection', 'Entity', 'data', 'metadata', 'collection', 'alerts', 'Authz', 'Alert', 'Title',
    function($scope, $http, $timeout, $anchorScroll, Collection, Entity, data, metadata, collection, alerts, Authz, Alert, Title) {

  $scope.collection = collection;
  $scope.authz = Authz;
  $scope.sortOptions = {
    score: 'Relevancy',
    alphabet: 'Alphabet',
    doc_count: 'Documents matched'
  };

  $scope.submitSearch = function(form) {
    $scope.query.set('q', $scope.query.state.q);
  };

  $scope.loadOffset = function(offset) {
    $scope.query.set('offset', offset);
    $anchorScroll();
  };

  $scope.getReconciliationUrl = function() {
    var url = metadata.app.url + 'api/freebase/reconcile';
    if (metadata.session.logged_in) {
      url += '?api_key=' + metadata.session.api_key;
    }
    return url;
  };

  $scope.hasAlert = function(entity) {
    return Alert.check({entity_id: entity.id});
  };

  $scope.toggleAlert = function(entity) {
    return Alert.toggle({entity_id: entity.id});
  };

  $scope.editEntity = function($event, entity) {
    $event.stopPropagation();
    Entity.edit(entity.id).then(function() {
      $timeout(function() {
        reloadSearch();
      }, 500);
    });
  };

  $scope.getSelection = function() {
    var selection = [];
    for (var i in $scope.result.results) {
      var entity = $scope.result.results[i];
      if (entity.selected) {
        selection.push(entity);
      }
    }
    return selection;
  };

  $scope.canDelete = function() {
    return $scope.getSelection().length > 0;
  };

  $scope.canMerge = function() {
    return $scope.getSelection().length > 1;
  };

  $scope.deleteSelection = function($event) {
    Entity.deleteMany($scope.getSelection()).then(function() {
      $timeout(function() {
        reloadSearch();
      }, 500);
    });
  };

  $scope.mergeSelection = function($event) {
    Entity.merge($scope.getSelection()).then(function() {
      $timeout(function() {
        reloadSearch();
      }, 500);
    });
  };

  $scope.$on('$routeUpdate', function() {
    reloadSearch();
  });

  var reloadSearch = function() {
    Entity.searchCollection(collection.id).then(function(data) {
      updateSearch(data);
    });
  };

  var updateSearch = function(data) {
    $scope.jurisdictionFacet = data.query.sortFacet(data.result.facets.jurisdiction_code.values,
                                                    'filter:jurisdiction_code');
    $scope.schemaFacet = data.query.sortFacet(data.result.facets.$schema.values,
                                              'filter:$schema');
    $scope.result = data.result;
    $scope.query = data.query;
    
    if (data.query.getQ()) {
      Title.set("Browse for '" + data.query.getQ() + "'", "collections");
    } else {
      Title.set("Browse entities", "collections");  
    }
  };

  updateSearch(data);

}]);

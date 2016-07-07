app.controller('FacilitiesController', ['$scope', 'Flash', '$location', '$firebaseAuth', '$firebaseObject', 
	'$firebaseArray', function($scope, Flash, $location, $firebaseAuth, $firebaseObject, $firebaseArray){
	
	$scope.auth = $firebaseAuth();
	
	$scope.auth.$onAuthStateChanged(function(firebaseUser) {
		$scope.firebaseUser = firebaseUser;
		if ($scope.firebaseUser === null) {
			$location.path('/login');
		}
	});
	
	var ref = firebase.database().ref().child("Facility");
	$scope.facilitiesList = $firebaseArray(ref);
	
	$scope.dropdownItemSelected = function(item) {
		$scope.selectedItem = item;	
	};
	
	$scope.addFacility = function() {
		console.log($scope.facilitiesList);
	};
	
}]);
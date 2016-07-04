app.controller('ProjectsController', ['$scope', 'Flash', '$location', '$firebaseAuth', 
	function($scope, Flash, $location, $firebaseAuth){
	
	$scope.auth = $firebaseAuth();
	
	$scope.auth.$onAuthStateChanged(function(firebaseUser) {
		$scope.firebaseUser = firebaseUser;
		if ($scope.firebaseUser === null) {
			$location.path('/login');
		}
	});
	
	$scope.sortByList = ['Id', 'Name', 'Last Inspection', 'Defects'];
	$scope.selectedItem = 'Id';
	
	$scope.dropdownItemSelected = function(item) {
		$scope.selectedItem = item;	
	}
	
}]);
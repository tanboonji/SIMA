app.controller('ProjectsController', ['$scope', 'Flash', '$location', '$firebaseAuth', '$firebaseObject', 
	'$firebaseArray', function($scope, Flash, $location, $firebaseAuth, $firebaseObject, $firebaseArray){
	
	$scope.auth = $firebaseAuth();
	
	$scope.auth.$onAuthStateChanged(function(firebaseUser) {
		$scope.firebaseUser = firebaseUser;
		if ($scope.firebaseUser === null) {
			$location.path('/login');
		}
	});
	
	var ref = firebase.database().ref().child("project");
	$scope.projectsList = $firebaseArray(ref);
	
	$scope.sortByList = ['Id', 'Name', 'Last Inspection', 'Defects'];
	$scope.sortByItem = 'Id';
	
	$scope.sortByItemSelected = function(itemSelected) {
		$scope.sortByItem = itemSelected;
	};
	
	$scope.goToAddProject = function() {
		$location.path('/add-project');
	};
	
}]);
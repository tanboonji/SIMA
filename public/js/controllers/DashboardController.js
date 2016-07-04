app.controller('DashboardController', ['$scope', 'Flash', '$location', '$firebaseAuth', 
	function($scope, Flash, $location, $firebaseAuth){
	
	$scope.auth = $firebaseAuth();
	
	$scope.auth.$onAuthStateChanged(function(firebaseUser) {
		$scope.firebaseUser = firebaseUser;
		if ($scope.firebaseUser == null) {
			$location.path('/login');
		}
	});
	
}]);
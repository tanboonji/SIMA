app.controller('LogoutController', ['$scope', '$location', '$firebaseAuth', 
	function($scope, $location, $firebaseAuth){
	
	$scope.auth = $firebaseAuth();
	
	$scope.auth.$signOut();
	
	$scope.auth.$onAuthStateChanged(function(firebaseUser) {
		$scope.firebaseUser = firebaseUser;
		if ($scope.firebaseUser === null) {
			$location.path('/login');
		}
	});
	
}]);
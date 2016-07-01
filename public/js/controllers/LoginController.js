app.controller('LoginController', ['$scope', 'Flash', '$location', '$firebaseAuth',
	function($scope, Flash, $location, $firebaseAuth){
	
	$scope.auth = $firebaseAuth();
	
	$scope.login = function() {
		$scope.auth.$signInWithEmailAndPassword($scope.login.email, $scope.login.password).then(function(firebaseUser) {
			console.log("Signed in as:", firebaseUser.uid);
			$scope.firebaseUser = firebaseUser;
		}).catch(function(error) {
			$scope.firebaseUser = null;
			console.error("Authentication failed:", error);
			var message = '';
			if (error.code == 'auth/invalid-email') {
				
			} else if (error.code == 'auth/user-not-found') {
				
			} else if (error.code == 'auth/wrong-password') {
				
			} else if (error.code == 'auth/too-many-requests') {
				
			} else {
				
			}
			Flash.clear();
    		Flash.create('danger', error.code, 5000);
		});
	};

	function onAuthStateChanged() {
		$scope.auth.$onAuthStateChanged(function(firebaseUser) {
			$scope.firebaseUser = firebaseUser;
			if ($scope.firebaseUser != null) {
				$location.path('/dashboard');
			}
		});
	};
	
}]);
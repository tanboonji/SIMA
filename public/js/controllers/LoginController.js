app.controller('LoginController', ['$scope', 'Flash', '$location', '$firebaseAuth', 
	function($scope, Flash, $location, $firebaseAuth){
	
	$scope.auth = $firebaseAuth();
	
	$scope.auth.$onAuthStateChanged(function(firebaseUser) {
		$scope.firebaseUser = firebaseUser;
		if ($scope.firebaseUser !== null) {
			$location.path('/dashboard');
		}
	});
	
	$scope.login = function() {
		$scope.auth.$signInWithEmailAndPassword($scope.login.email, $scope.login.password).then(function(firebaseUser) {
			console.log("Signed in as:", firebaseUser.uid);
			$scope.firebaseUser = firebaseUser;
		}).catch(function(error) {
			$scope.firebaseUser = null;
			console.error("Authentication failed:", error);
			var message = '';
			switch (error.code) {
				case 'auth/invalid-email':
					
					break;
				case 'auth/user-not-found':
					break;
				case 'auth/wrong-password':
					break;
				case 'auth/too-many-requests':
					break;
				default:
					break;
			}
			if ($scope.flashId != null) {
				Flash.dismiss($scope.flashId);
			}
    		$scope.flashId = Flash.create('danger', error.code, 20000);
		});
	};
	
	$scope.forgetPassword = function() {
		
	};
	
}]);
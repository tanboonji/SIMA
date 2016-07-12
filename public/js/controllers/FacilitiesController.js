app.controller('FacilitiesController', ['$scope', 'Flash', '$location', '$firebaseAuth', '$firebaseObject', 
	'$firebaseArray', 'Upload', '$timeout', function($scope, Flash, $location, $firebaseAuth, $firebaseObject, 
	$firebaseArray, Upload, $timeout){
	
	$scope.auth = $firebaseAuth();
	
	$scope.auth.$onAuthStateChanged(function(firebaseUser) {
		$scope.firebaseUser = firebaseUser;
		if ($scope.firebaseUser === null) {
			$location.path('/login');
		}
	});
	
	var ref = firebase.database().ref().child("facility");
	$scope.facilitiesList = $firebaseArray(ref);
	
	$scope.goToAddFacility = function() {
		$location.path('/add-facility');
	};
	
	$scope.storageRef = firebase.storage().ref();
	$scope.facilitiesRef = $scope.storageRef.child('facilities');
	
	$scope.addFacility = function() {
		var file = $scope.photo;
		var uploadTask = $scope.facilitiesRef.child($scope.name).put(file);
		
		uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED,
			function(snapshot) {
				var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
				$scope.photoProgress = 'Upload is ' + progress + '% done';
				
				switch (snapshot.state) {
					case firebase.storage.TaskState.PAUSED:
						$scope.photoStatus = 'Upload is paused';
						break;
					case firebase.storage.TaskState.RUNNING:
						$scope.photoStatus = 'Upload is running';
						break;
				}
  			}, function(error) {
  				switch (error.code) {
    				case 'storage/unauthorized':
      					$scope.photoStatus = 'User does not have permission to access the object';
      					break;
					case 'storage/canceled':
      					$scope.photoStatus = 'User canceled the upload';
     					break;
					case 'storage/unknown':
      					$scope.photoStatus = 'Unknown error occurred';
     			 		break;
				}
			}, function() {
				$scope.downloadURL = uploadTask.snapshot.downloadURL;
		});
	};
	
	$scope.categoryCount = 0;
	var newQuestion = {name:"", id:0, no:"a", type:"MCQ"};
	var newCategory = {name:"", id:0, no:1, questionCount:0, question:[newQuestion]};
	$scope.checklist = [];
	$scope.checklist.push(newCategory);
	
	$scope.addCategory = function() {
		$scope.categoryCount++;
		var newQuestion = {name:"", id:0, no:"a", type:"MCQ"};
		var newCategory = {name:"", id:$scope.categoryCount, no:$scope.categoryCount+1,
			questionCount:0, question:[newQuestion]};
		$scope.checklist.push(newCategory);
	};
	
	$scope.addQuestion = function(category) {
		category.questionCount++;
		var questionNo = 'abcdefghijklmnopqrstuvwxyz'[category.questionCount];
		var newQuestion = {name:"", id:category.questionCount, no:questionNo, type:"MCQ"};
		category.question.push(newQuestion);
	};
	
	$scope.deleteCategory = function(category) {
		$scope.categoryCount--;
		var index = $scope.checklist.indexOf(category);
		$scope.checklist.splice(index, 1);
		
		for(index; index < $scope.checklist.length; index++) {
			$scope.checklist[index].id = index;
			$scope.checklist[index].no = index+1;
		}
	};
	
	$scope.deleteQuestion = function(category,question) {
		category.questionCount--;
		var index = category.question.indexOf(question);
		category.question.splice(index, 1);
		
		for(index; index < category.question.length; index++) {
			var questionNo = 'abcdefghijklmnopqrstuvwxyz'[index];
			category.question[index].id = index;
			category.question[index].no = questionNo;
		}
	};
	
}]);
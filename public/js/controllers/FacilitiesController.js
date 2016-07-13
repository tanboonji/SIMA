app.controller('FacilitiesController', ['$scope', '$location', '$firebaseAuth', '$firebaseObject', 
	'$firebaseArray', function($scope, $location, $firebaseAuth, $firebaseObject, $firebaseArray){
	
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
	$scope.facilitiesRef = $scope.storageRef.child('facility');
	
	$scope.addFacility = function() {
		
		$scope.questionAdded = [];
		$scope.categoryAdded = [];
		
		firebase.database().ref('count').once('value').then(function (snapshot, error) {
			if (snapshot.val().questionCount !== null && snapshot.val().categoryCount !== null) {
				
				$scope.questionAlphabet = snapshot.val().questionCount.alphabet;
				$scope.categoryAlphabet = snapshot.val().categoryCount.alphabet;
				$scope.facilityAlphabet = snapshot.val().facilityCount.alphabet;
				$scope.questionCount = snapshot.val().questionCount.count;
				$scope.categoryCount = snapshot.val().categoryCount.count;
				$scope.facilityCount = snapshot.val().facilityCount.count;
				
				$scope.facilityCount++;
				
				angular.forEach($scope.checklist, function(categoryValue, key) {
					$scope.categoryCount++;
                    $scope.categoryAdded.push($scope.categoryAlphabet + $scope.categoryCount);
  					angular.forEach(categoryValue.question, function(questionValue, key) {
						$scope.questionCount++;
                        $scope.questionAdded.push($scope.questionAlphabet + $scope.questionCount);
						firebase.database().ref('question/' + $scope.questionAlphabet + $scope.questionCount).set({
                        	name: questionValue.name,
                        	ID: $scope.questionAlphabet + $scope.questionCount,
                        	type: questionValue.type
                      	}).then(function() {
							firebase.database().ref('count/questionCount').set({
								count: $scope.questionCount,
								alphabet: $scope.questionAlphabet
							});
                   		}).catch(function(error) {
							if (error.code === "PERMISSION_DENIED") {
								$.notify({
									message: "auth/no-access-permission" /* edit */
								},{
									placement: {
										from: "top",
										align: "center"
									},
									type: "danger",
									timer: 5000,
									newest_on_top: true
								});
							}
                        });
					});
					
					var questionList = "{";
					for (var i = 0; i < $scope.questionAdded.length; i++) {
						questionList += $scope.questionAdded[i];
						if (i !== ($scope.questionAdded.length - 1)) {
							questionList += ",";
						}
					}
					questionList += "}";
					$scope.questionAdded = [];
					
					firebase.database().ref('category/' + $scope.categoryAlphabet + $scope.categoryCount).set({
                        name: categoryValue.name,
                        ID: $scope.categoryAlphabet + $scope.categoryCount,
                        question: questionList
                    }).then(function() {
						firebase.database().ref('count/categoryCount').set({
							count: $scope.categoryCount,
							alphabet: $scope.categoryAlphabet
						});
                   	}).catch(function(error) {
						console.log(error);
						if (error.code === "PERMISSION_DENIED") {
							$.notify({
								message: "auth/no-access-permission" /* edit */
							},{
								placement: {
									from: "top",
									align: "center"
								},
								type: "danger",
								timer: 5000,
								newest_on_top: true
							});
						}
                    });
				});
				
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
				
						var categoryList = "{";
						for (var i = 0; i < $scope.categoryAdded.length; i++) {
							categoryList += $scope.categoryAdded[i];
							if (i !== ($scope.categoryAdded.length - 1)) {
								categoryList += ",";
							}
						}
						categoryList += "}";
						
						firebase.database().ref('facility/' + $scope.facilityAlphabet + $scope.facilityCount).set({
							name: $scope.name,
							ID: $scope.facilityAlphabet + $scope.facilityCount,
							photoURL: $scope.downloadURL,
							category: categoryList
						}).then(function() {
							firebase.database().ref('count/facilityCount').set({
								count: $scope.facilityCount,
								alphabet: $scope.facilityAlphabet
							});
						}).catch(function(error) {
							console.log(error);
							if (error.code === "PERMISSION_DENIED") {
								$.notify({
									message: "auth/no-access-permission" /* edit */
								},{
									placement: {
										from: "top",
										align: "center"
									},
									type: "danger",
									timer: 5000,
									newest_on_top: true
								});
							}
						});
				});
			} else {
				$.notify({
					message: "auth/count-does-not-exist" /* edit */
				},{
					placement: {
						from: "top",
						align: "center"
					},
					type: "danger",
					timer: 5000,
					newest_on_top: true
				});
			}
		}).catch(function(error) {
            if (error.code === "PERMISSION_DENIED") {
				$.notify({
					message: "auth/no-access-permission" /* edit */
				},{
					placement: {
						from: "top",
						align: "center"
					},
					type: "danger",
					timer: 5000,
					newest_on_top: true
				});
            }
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
		if ($scope.categoryCount === 0) {
			
		} else {
			$scope.categoryCount--;
			var index = $scope.checklist.indexOf(category);
			$scope.checklist.splice(index, 1);
			
			for(index; index < $scope.checklist.length; index++) {
				$scope.checklist[index].id = index;
				$scope.checklist[index].no = index+1;
			}
		}
	};
	
	$scope.deleteQuestion = function(category,question) {
		if (category.questionCount === 0) {
			
		} else {
			category.questionCount--;
			var index = category.question.indexOf(question);
			category.question.splice(index, 1);
			
			for(index; index < category.question.length; index++) {
				var questionNo = 'abcdefghijklmnopqrstuvwxyz'[index];
				category.question[index].id = index;
				category.question[index].no = questionNo;
			}
		}
	};
	
}]);
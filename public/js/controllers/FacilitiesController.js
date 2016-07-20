app.controller('FacilitiesController', ['$routeParams', '$scope', '$location', '$firebaseAuth', '$firebaseObject', 
    '$firebaseArray', function($routeParams, $scope, $location, $firebaseAuth, $firebaseObject, $firebaseArray){
    
    /***** General *****/
        
    $scope.notify = function(message, type) {
        $.notify({
            message: message
        },{
            placement: {
                from: "top",
                align: "center"
            },
            type: type,
            timer: 5000,
            newest_on_top: true
        });
    }; //end of notify()
    
    $scope.auth = $firebaseAuth();
    
    $scope.auth.$onAuthStateChanged(function(firebaseUser) {
        $scope.firebaseUser = firebaseUser;
        if ($scope.firebaseUser === null) {
            $location.path('/login');
        }
    }); //end of $scope.auth.$onAuthStateChanged()
        
    $scope.goToAddFacility = function() {
        $location.path('/add-facility').search("facilityID",null);
    }; //end of $scope.goToAddFacility()
        
    $scope.goToFacilities = function() {
        $location.path('/facilities').search("facilityID",null);
    }; //end of $scope.goToFacilities()
    
    $scope.goToEditFacility = function() {
        $location.path("/edit-facility").search("facilityID",$scope.facility.ID);
    }; //end of $scope.goToEditFacility()
        
    /***** Checklist *****/
        
    $scope.categoryCount = 0;
    var newQuestion = {name:"", formID:0, no:"a", type:"MCQ"};
    var newCategory = {name:"", formID:0, no:1, questionCount:0, question:[newQuestion]};
    $scope.checklist = [];
    $scope.checklist.push(newCategory);
        
    $scope.addEmptyCategory = function() {
        $scope.categoryCount++;
        var newCategory = {questionCount:-1, question:[]};
        $scope.checklist.push(newCategory);
    }; //end of $scope.addCategory()
        
    $scope.addEmptyQuestion = function() {
        $scope.checklist[$scope.categoryCount].questionCount++;
        var questionNo = 'abcdefghijklmnopqrstuvwxyz'[$scope.checklist[$scope.categoryCount].questionCount];
        var newQuestion = {formID:$scope.checklist[$scope.categoryCount].questionCount, no:questionNo};
        $scope.checklist[$scope.categoryCount].question.push(newQuestion);
    }; //end of $scope.addQuestion()
    
    $scope.addCategory = function() {
        $scope.categoryCount++;
        var newQuestion = {name:"", formID:0, no:"a", type:"MCQ"};
        var newCategory = {name:"", formID:$scope.categoryCount, no:$scope.categoryCount+1,
            questionCount:0, question:[newQuestion]};
        $scope.checklist.push(newCategory);
    }; //end of $scope.addCategory()
    
    $scope.addQuestion = function(category) {
        category.questionCount++;
        var questionNo = 'abcdefghijklmnopqrstuvwxyz'[category.questionCount];
        var newQuestion = {name:"", formID:category.questionCount, no:questionNo, type:"MCQ"};
        category.question.push(newQuestion);
    }; //end of $scope.addQuestion()
    
    $scope.deleteCategory = function(category) {
        if ($scope.categoryCount !== 0) {
            $scope.categoryCount--;
            var index = $scope.checklist.indexOf(category);
            $scope.checklist.splice(index, 1);
            
            for(index; index < $scope.checklist.length; index++) {
                $scope.checklist[index].formID = index;
                $scope.checklist[index].no = index+1;
            }
        }
    }; //end of $scope.deleteCategory()
    
    $scope.deleteQuestion = function(category,question) {
        if (category.questionCount !== 0) {
            category.questionCount--;
            var index = category.question.indexOf(question);
            category.question.splice(index, 1);
            
            for(index; index < category.question.length; index++) {
                var questionNo = 'abcdefghijklmnopqrstuvwxyz'[index];
                category.question[index].formID = index;
                category.question[index].no = questionNo;
            }
        }
    }; //end of $scope.deleteQuestion()
    
    /***** List *****/
	
    var ref = firebase.database().ref().child("facility");
    $scope.facilitiesList = $firebaseArray(ref);
    
    $scope.storageRef = firebase.storage().ref();
    $scope.facilitiesRef = $scope.storageRef.child('facility');

    /***** Add *****/
    
    $scope.addFacility = function() {
        
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
                    
                    firebase.database().ref('category/' + $scope.categoryAlphabet + $scope.categoryCount).set({
                        name: categoryValue.name,
                        ID: $scope.categoryAlphabet + $scope.categoryCount
                    }).then(function() {
                        firebase.database().ref('count/categoryCount').set({
                            count: $scope.categoryCount,
                            alphabet: $scope.categoryAlphabet
                        });
                    }).catch(function(error) {
                        console.log(error);
                        if (error.code === "PERMISSION_DENIED") {
							$scope.notify("auth/no-access-permission", "danger"); /* edit */
                        }
                    });
                    
                    angular.forEach(categoryValue.question, function(questionValue, key) {
                        $scope.questionCount++;
                        firebase.database().ref('category/' + $scope.categoryAlphabet + $scope.categoryCount + '/question/' + 
                            $scope.questionAlphabet + $scope.questionCount).set({
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
                                $scope.notify("auth/no-access-permission","danger"); /* edit */
                            }
                        });
                    });
                });
                
                var file = $scope.photo;
                var filename = $scope.facilityAlphabet + $scope.facilityCount + " " + $scope.name;
                var uploadTask = $scope.facilitiesRef.child(filename).put(file);
                
                uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, function(snapshot) {
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
                    
                    firebase.database().ref('facility/' + $scope.facilityAlphabet + $scope.facilityCount).set({
                        name: $scope.name,
                        ID: $scope.facilityAlphabet + $scope.facilityCount,
                        photoURL: $scope.downloadURL
                    }).then(function() {
                        firebase.database().ref('count/facilityCount').set({
                            count: $scope.facilityCount,
                            alphabet: $scope.facilityAlphabet
                        });
                        
                        angular.forEach($scope.categoryAdded, function(categoryValue, key) {
                            firebase.database().ref('facility/' + $scope.facilityAlphabet + $scope.facilityCount + '/category/')
                                .push(categoryValue)
                                .then(function() {
                                //nothing
                            }).catch(function(error) {
                                if (error.code === "PERMISSION_DENIED") {
                                    $scope.notify("auth/no-access-permission","danger"); /* edit */
                                }
                            });
                        });
                    }).catch(function(error) {
                        console.log(error);
                        if (error.code === "PERMISSION_DENIED") {
                            $scope.notify("auth/no-access-permission", "danger"); /* edit */
                        }
                    });
                });
            } else {
                $scope.notify("auth/count-does-not-exist", "danger"); /* edit */
            }
        }).catch(function(error) {
            if (error.code === "PERMISSION_DENIED") {
                $scope.notify("auth/no-access-permission", "danger"); /* edit */
            }
        });
        
    }; //end of $scope.addFacility()
    
    /***** View *****/
        
    $scope.overlay = false;
    
    $scope.closeOverlay = function() {
        $scope.overlay = false;
    }; //end of $scope.closeOverlay()
        
    $scope.viewFacility = function(facility) {
        $scope.overlay = true;
        $scope.facility = facility;
        $scope.checklist = [];
        $scope.categoryCount = -1;
        
        angular.forEach($scope.facility.category, function(categoryID, key) {
            firebase.database().ref("category/" + categoryID).once("value").then(function(snapshot) {
                if (snapshot.val() != null) {
                    $scope.addEmptyCategory();
                    $scope.checklist[$scope.categoryCount].name = snapshot.val().name;
                    $scope.checklist[$scope.categoryCount].ID = snapshot.val().ID;
                    $scope.checklist[$scope.categoryCount].no = $scope.categoryCount+1;
                    $scope.checklist[$scope.categoryCount].formID = $scope.categoryCount;

                    angular.forEach(snapshot.val().question, function(questionValue, key) {
                        $scope.addEmptyQuestion();
                        var questionCount = $scope.checklist[$scope.categoryCount].questionCount;
                        $scope.checklist[$scope.categoryCount].question[questionCount].name = questionValue.name;
                        $scope.checklist[$scope.categoryCount].question[questionCount].ID = questionValue.ID;
                        $scope.checklist[$scope.categoryCount].question[questionCount].type = questionValue.type;
                        $scope.$apply();
                    });
                    
                } else {
                    $scope.notify("category-not-found","danger"); /* edit */
                }
            }).catch(function(error) {
                if (error.code === "PERMISSION_DENIED") {
                    $scope.notify("auth/no-access-permission", "danger"); /* edit */
                }
            }); //end of firebase.database().ref()
        }); //end of angular.forEach()
    }; //end of $scope.viewFacility()
        
    /***** Edit *****/
    
    if ($routeParams.facilityID !== undefined) {
        $scope.facilityID = $routeParams.facilityID;
        firebase.database().ref("facility/" + $scope.facilityID).once("value").then(function(snapshot) {
            if (snapshot.val() != null) {
                $scope.facility = snapshot.val();
                $scope.photoURL = $scope.facility.photoURL;
                $scope.checklist = [];
                $scope.categoryCount = -1;
                
                angular.forEach($scope.facility.category, function(categoryID, key) {
                    firebase.database().ref("category/" + categoryID).once("value").then(function(snapshot) {
                        if (snapshot.val() != null) {
                            $scope.addEmptyCategory();
                            $scope.checklist[$scope.categoryCount].name = snapshot.val().name;
                            $scope.checklist[$scope.categoryCount].ID = snapshot.val().ID;
                            $scope.checklist[$scope.categoryCount].no = $scope.categoryCount+1;
                            $scope.checklist[$scope.categoryCount].formID = $scope.categoryCount;

                            angular.forEach(snapshot.val().question, function(questionValue, key) {
                                $scope.addEmptyQuestion();
                                var questionCount = $scope.checklist[$scope.categoryCount].questionCount;
                                $scope.checklist[$scope.categoryCount].question[questionCount].name = questionValue.name;
                                $scope.checklist[$scope.categoryCount].question[questionCount].ID = questionValue.ID;
                                $scope.checklist[$scope.categoryCount].question[questionCount].type = questionValue.type;
                                $scope.$apply();
                            });

                        } else {
                            $scope.notify("category-not-found","danger"); /* edit */
                        }
                    }).catch(function(error) {
                        if (error.code === "PERMISSION_DENIED") {
                            $scope.notify("auth/no-access-permission", "danger"); /* edit */
                        }
                    }); //end of firebase.database().ref()
                }); //end of angular.forEach()
                
                $scope.$apply();
            } else {
                $scope.notify("facility-not-found","danger"); /* edit */
            }
        }).catch(function(error) {
            if (error.code === "PERMISSION_DENIED") {
                $scope.notify("auth/no-access-permission", "danger"); /* edit */
            }
        }); //end of firebase.database().ref()
    }; //end of if()
        
    $scope.saveFacility = function() {
        console.log($scope.facility);
        if ($scope.facility.photoURL !== $scope.photoURL)
            console.log("false");
        else
            console.log("true");
        console.log($scope.checklist);
    };
        
}]);
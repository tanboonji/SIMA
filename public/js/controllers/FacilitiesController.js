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
        } else {
            firebase.database().ref("staff/" + $scope.firebaseUser.uid).once("value").then(function(snapshot) {
                if (snapshot.val() !== null) {
                    $scope.user = snapshot.val();
                    $scope.user.name = $scope.user.name.toUpperCase();
                    $scope.$apply();
                } else {
                    firebase.database().ref("adminstaff/" + $scope.firebaseUser.uid).once("value").then(function(snapshot) {
                        if (snapshot.val() !== null) {
                            $scope.user = snapshot.val();
                            $scope.user.name = $scope.user.name.toUpperCase();
                            $scope.$apply();
                        } else {
                            $scope.notify("user-not-found","danger"); /* edit */
                        } //end of if()
                    }).catch(function(error) {
                        if (error.code === "PERMISSION_DENIED") {
                            $scope.notify("auth/no-access-permission", "danger"); /* edit */
                        }
                    }); //end of firebase.database().ref()
                } //end of if()
            }).catch(function(error) {
                if (error.code === "PERMISSION_DENIED") {
                    $scope.notify("auth/no-access-permission", "danger"); /* edit */
                }
            }); //end of firebase.database().ref()
        }
    }); //end of $scope.auth.$onAuthStateChanged()
        
    $scope.storageRef = firebase.storage().ref();
    $scope.facilitiesRef = $scope.storageRef.child('facility');
        
    $scope.logout = function() {
        $scope.auth.$signOut();
    }
        
    $scope.goToAddFacility = function() {
        $location.path('/add-facility').search("facilityID",null);
    }; //end of $scope.goToAddFacility()
        
    $scope.goToFacilities = function() {
        $location.path('/facilities').search("facilityID",null);
    }; //end of $scope.goToFacilities()
    
    $scope.goToEditFacility = function() {
        if ($scope.facilityID !== undefined) {
            $location.path("/edit-facility").search("facilityID",$scope.facilityID);
        } else {
            $location.path("/edit-facility").search("facilityID",$scope.facility.ID);
        }
    }; //end of $scope.goToEditFacility()
        
    $scope.goToNewFacility = function() {
        $scope.name = undefined;
        $scope.photo = undefined;
        $scope.categoryCount = 0;
        var newQuestion = {name:"", formID:0, no:"a", type:"MCQ"};
        var newCategory = {name:"", formID:0, no:1, questionCount:0, question:[newQuestion]};
        $scope.checklist = [];
        $scope.checklist.push(newCategory);
        $scope.buttonChange = false;
        $scope.photoStatus = undefined;
        $scope.photoProgress = undefined;
    }; //end of $scope.goToNewFacility()
        
    $scope.buttonChange = false;
        
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
        
    $scope.addEditCategory = function() {
        $scope.categoryCount++;
        var newQuestion = {name:"", formID:0, no:"a", type:"MCQ"};
        var newCategory = {name:"", formID:$scope.categoryCount, no:$scope.categoryCount+1,
            questionCount:0, question:[newQuestion], show:true};
        $scope.checklist.push(newCategory);
    }; //end of $scope.addCategory()
        
    $scope.removeCategory = function(category) {
        if ($scope.categoryCount !== 0) {
            category.show = false;
            $scope.categoryCount--;
            
            var count = 0;
            for(var i = 0; i < $scope.checklist.length; i++) {
                if ($scope.checklist[i].show === false) {
                    count++;
                } else {
                    $scope.checklist[i].formID = i-count;
                    $scope.checklist[i].no = i+1-count;
                }
            }
        }
    }; //end of $scope.removeCategory()
    
    /***** List *****/
    
    $scope.refreshFacilityList = function() {
        firebase.database().ref('facility').once('value').then(function (snapshot, error) {
            $scope.facilitiesList = Object.values(snapshot.val());
            angular.forEach($scope.facilitiesList, function(facilityValue, key) {
                if (facilityValue.deletedAt !== undefined) {
                    facilityValue.deleted = true;
                }
            }); //end of angular.forEach()
            $scope.$apply();
        }).catch(function(error) {
            if (error.code === "PERMISSION_DENIED") {
                $scope.notify("auth/no-access-permission", "danger"); /* edit */
            }
        }); //end of firebase.database().ref()
    }; //end of $scope.refreshFacilityList
    
    $scope.refreshFacilityList();
	
    var ref = firebase.database().ref().child("facility");
    ref.on("child_changed", function() {
        $scope.refreshFacilityList();
    });
    ref.on("child_added", function() {
        $scope.refreshFacilityList();
    });
    ref.on("child_removed", function() {
        $scope.refreshFacilityList();
    });
    
    //$scope.facilitiesList = $firebaseArray(ref);
        
    Date.prototype.dayNow = function () { 
        return ((this.getDate() < 10)?"0":"") + this.getDate() + "/" +(((this.getMonth()+1) < 10)?"0":"") + 
            (this.getMonth()+1) + "/" + this.getFullYear();
    }
    Date.prototype.timeNow = function () {
        return ((this.getHours() < 10)?"0":"") + this.getHours() + ":" + ((this.getMinutes() < 10)?"0":"") + 
            this.getMinutes() + ":" + ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
    }
    
    $scope.deleteFacility = function() {
        $scope.facilityDeleted = true;
        var newDate = new Date();
        var datetime = newDate.dayNow() + " @ " + newDate.timeNow();
        firebase.database().ref('facility/' + $scope.facility.ID + "/deletedAt").set(datetime).then(function() {
            firebase.database().ref('facility/' + $scope.facility.ID + "/deletedBy").set($scope.user.ID).then(function() {
                $scope.notify("Successfully deleted \"" + $scope.facility.name + "\" facility","success");
            }).catch(function(error) {
                console.log(error);
                if (error.code === "PERMISSION_DENIED") {
                    $scope.notify("auth/no-access-permission", "danger"); /* edit */
                }
            }); //end of firebase.database().ref()
        }).catch(function(error) {
            console.log(error);
            if (error.code === "PERMISSION_DENIED") {
                $scope.notify("auth/no-access-permission", "danger"); /* edit */
            }
        }); //end of firebase.database().ref()
    }; //end of $scope.deleteFacility()
        
    $scope.restoreFacility = function() {
        $scope.facilityDeleted = false;
        firebase.database().ref('facility/' + $scope.facility.ID + "/deletedAt").set(null).then(function() {
            $scope.notify("Successfully restored \"" + $scope.facility.name + "\" facility","success");
        }).catch(function(error) {
            console.log(error);
            if (error.code === "PERMISSION_DENIED") {
                $scope.notify("auth/no-access-permission", "danger"); /* edit */
            }
        }); //end of firebase.database().ref()
    }; //end of $scope.restoreFacility()

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
                    }); //end of firebase.database().ref()
                    
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
                        }); //end of firebase.database().ref()
                    }); //end of angular.forEach()
                }); //end of angular.forEach()
                
                var uploadTask = $scope.facilitiesRef.child($scope.facilityAlphabet + $scope.facilityCount).put($scope.photo);
                
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
                            firebase.database().ref('facility/' + $scope.facilityAlphabet + $scope.facilityCount + '/category/' + categoryValue)
                                .set(categoryValue).then(function() {
                                $scope.facilityID = "" + $scope.facilityAlphabet + $scope.facilityCount;
                                $scope.notify("Successfully added \"" + $scope.name + "\" facility","success");
                                $scope.buttonChange = true;
                                $scope.$apply();
                            }).catch(function(error) {
                                if (error.code === "PERMISSION_DENIED") {
                                    $scope.notify("auth/no-access-permission","danger"); /* edit */
                                }
                            });
                        }); //end of angular.forEach()
                    }).catch(function(error) {
                        console.log(error);
                        if (error.code === "PERMISSION_DENIED") {
                            $scope.notify("auth/no-access-permission", "danger"); /* edit */
                        }
                    }); //end of firebase.database().ref()
                }); //end of uploadTask.on()
            } else {
                $scope.notify("auth/count-does-not-exist", "danger"); /* edit */
            } //end of if()
        }).catch(function(error) {
            if (error.code === "PERMISSION_DENIED") {
                $scope.notify("auth/no-access-permission", "danger"); /* edit */
            }
        }); //end of firebase.database().ref()
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
        $scope.facilityDeleted = false;
        
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
                } //end of if()
            }).catch(function(error) {
                if (error.code === "PERMISSION_DENIED") {
                    $scope.notify("auth/no-access-permission", "danger"); /* edit */
                }
            }); //end of firebase.database().ref()
        }); //end of angular.forEach()
    }; //end of $scope.viewFacility()
        
    /***** Edit *****/
        
    $scope.reloadFacility = function() {
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
                            $scope.checklist[$scope.categoryCount].show = true;

                            angular.forEach(snapshot.val().question, function(questionValue, key) {
                                $scope.addEmptyQuestion();
                                var questionCount = $scope.checklist[$scope.categoryCount].questionCount;
                                $scope.checklist[$scope.categoryCount].question[questionCount].name = questionValue.name;
                                $scope.checklist[$scope.categoryCount].question[questionCount].ID = questionValue.ID;
                                $scope.checklist[$scope.categoryCount].question[questionCount].type = questionValue.type;
                                $scope.$apply();
                            }); //end of angular.forEach()
                        } else {
                            $scope.notify("category-not-found","danger"); /* edit */
                        } //end of if()
                    }).catch(function(error) {
                        if (error.code === "PERMISSION_DENIED") {
                            $scope.notify("auth/no-access-permission", "danger"); /* edit */
                        }
                    }); //end of firebase.database().ref()
                }); //end of angular.forEach()
                
                $scope.$apply();
            } else {
                $scope.notify("facility-not-found","danger"); /* edit */
            } //end of if()
        }).catch(function(error) {
            if (error.code === "PERMISSION_DENIED") {
                $scope.notify("auth/no-access-permission", "danger"); /* edit */
            }
        }); //end of firebase.database().ref()
    };
    
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
                            $scope.checklist[$scope.categoryCount].show = true;

                            angular.forEach(snapshot.val().question, function(questionValue, key) {
                                $scope.addEmptyQuestion();
                                var questionCount = $scope.checklist[$scope.categoryCount].questionCount;
                                $scope.checklist[$scope.categoryCount].question[questionCount].name = questionValue.name;
                                $scope.checklist[$scope.categoryCount].question[questionCount].ID = questionValue.ID;
                                $scope.checklist[$scope.categoryCount].question[questionCount].type = questionValue.type;
                                $scope.$apply();
                            }); //end of angular.forEach()
                        } else {
                            $scope.notify("category-not-found","danger"); /* edit */
                        } //end of if()
                    }).catch(function(error) {
                        if (error.code === "PERMISSION_DENIED") {
                            $scope.notify("auth/no-access-permission", "danger"); /* edit */
                        }
                    }); //end of firebase.database().ref()
                }); //end of angular.forEach()
                
                $scope.$apply();
            } else {
                $scope.notify("facility-not-found","danger"); /* edit */
            } //end of if()
        }).catch(function(error) {
            if (error.code === "PERMISSION_DENIED") {
                $scope.notify("auth/no-access-permission", "danger"); /* edit */
            }
        }); //end of firebase.database().ref()
    }; //end of if()
        
    $scope.saveFacility = function() {
        
        $scope.categoryAdded = [];
        
        firebase.database().ref('count').once('value').then(function (snapshot, error) {
            if (snapshot.val().questionCount !== null && snapshot.val().categoryCount !== null) {
                
                $scope.questionAlphabet = snapshot.val().questionCount.alphabet;
                $scope.categoryAlphabet = snapshot.val().categoryCount.alphabet;
                $scope.questionCount = snapshot.val().questionCount.count;
                $scope.categoryCount = snapshot.val().categoryCount.count;
                
                angular.forEach($scope.checklist, function(categoryValue, key) {
                    if (categoryValue.show === false && categoryValue.ID !== undefined) {
                        var categoryRef = firebase.database().ref('category/' + categoryValue.ID);
                        categoryRef.remove().then(function() {
                            //do nothing
                        }).catch(function(error) {
                            console.log(error); /* Edit */
                        }); //categoryRef.remove() //delete category from firebase
                    } else if (categoryValue.show === true) {
                        if (categoryValue.ID !== undefined) {
                            $scope.categoryAdded.push(categoryValue.ID);
                            firebase.database().ref('category/' + categoryValue.ID).set({
                                ID: categoryValue.ID,
                                name: categoryValue.name
                            }).then(function() {
                                //do nothing
                            }).catch(function(error) {
                                console.log(error);
                                if (error.code === "PERMISSION_DENIED") {
                                    $scope.notify("auth/no-access-permission", "danger"); /* edit */
                                }
                            }); //end of firebase.database().ref()
                            
                            var questionRef = firebase.database().ref('category/' + categoryValue.ID + '/question');
                            questionRef.remove().then(function() {
                                //do nothing
                            }).catch(function(error) {
                                console.log(error); /* Edit */
                            }); //categoryRef.remove() //removing existing questions

                            angular.forEach(categoryValue.question, function(questionValue, key) {
                                $scope.questionCount++;
                                firebase.database().ref('category/' + categoryValue.ID + '/question/' + 
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
                                }); //end of firebase.database().ref() //adding question to firebase
                            }); //end of angular.forEach() //looping through question in category
                        } else {
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
                            }); //end of firebase.database().ref()

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
                                }); //end of firebase.database().ref() //adding question to firebase
                            }); //end of angular.forEach() //looping through question in category
                        } //end of if() //check if new or existing category
                    } //end of if() //check if category is deleted
                }); //end of angular.forEach() //looping through category in checklist
                
                if ($scope.facility.photoURL !== $scope.photoURL) {
                    var uploadTask = $scope.facilitiesRef.child($scope.facility.ID).put($scope.facility.photoURL);

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

                        firebase.database().ref('facility/' + $scope.facility.ID).set({
                            ID: $scope.facility.ID,
                            name: $scope.facility.name,
                            photoURL: $scope.downloadURL
                        }).then(function() {
                            var categoryRef = firebase.database().ref('facility/' + $scope.facility.ID + '/category');
                            categoryRef.remove().then(function() {
                                //do nothing
                            }).catch(function(error) {
                                console.log(error); /* Edit */
                            }); //categoryRef.remove() //removing existing questions

                            var error = false;
                            angular.forEach($scope.categoryAdded, function(categoryValue, key) {
                                firebase.database().ref('facility/' + $scope.facility.ID + '/category/' + categoryValue)
                                    .set(categoryValue)
                                .then(function() {
                                    //do nothing
                                }).catch(function(error) {
                                    error = true;
                                    if (error.code === "PERMISSION_DENIED") {
                                        $scope.notify("auth/no-access-permission","danger"); /* edit */
                                    }
                                });
                            }); //end of angular.forEach()
                            if (!error) {
                                $scope.notify("Successfully saved \"" + $scope.facility.name + "\" facility","success");
                                $scope.reloadFacility();
                            }
                        }).catch(function(error) {
                            console.log(error);
                            if (error.code === "PERMISSION_DENIED") {
                                $scope.notify("auth/no-access-permission", "danger"); /* edit */
                            }
                        }); //end of firebase.database().ref()
                    }); //end of uploadTask.on()
                } else {
                    firebase.database().ref('facility/' + $scope.facility.ID).set({
                        ID: $scope.facility.ID,
                        name: $scope.facility.name,
                        photoURL: $scope.facility.photoURL
                    }).then(function() {
                        var error = false;
                        angular.forEach($scope.categoryAdded, function(categoryValue, key) {
                            firebase.database().ref('facility/' + $scope.facility.ID + '/category/' + categoryValue)
                                .set(categoryValue)
                            .then(function() {
                                //do nothing
                            }).catch(function(error) {
                                error = true;
                                if (error.code === "PERMISSION_DENIED") {
                                    $scope.notify("auth/no-access-permission","danger"); /* edit */
                                }
                            });
                        }); //end of angular.forEach()
                        if (!error) {
                            $scope.notify("Successfully saved \"" + $scope.facility.name + "\" facility","success");
                            $scope.reloadFacility();
                        }
                    }).catch(function(error) {
                        console.log(error);
                        if (error.code === "PERMISSION_DENIED") {
                            $scope.notify("auth/no-access-permission", "danger"); /* edit */
                        }
                    }); //end of firebase.database().ref()
                } //end of if() //check if facility image changed
            } else {
                $scope.notify("auth/count-does-not-exist", "danger"); /* edit */
            } //end of if()
        }).catch(function(error) {
            if (error.code === "PERMISSION_DENIED") {
                $scope.notify("auth/no-access-permission", "danger"); /* edit */
            }
        }); //end of firebase.database().ref()
    }; //end of $scope.saveFacility()
        
    $scope.refreshChecklist = function() {
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
                    $scope.checklist[$scope.categoryCount].show = true;
    
                    angular.forEach(snapshot.val().question, function(questionValue, key) {
                        $scope.addEmptyQuestion();
                        var questionCount = $scope.checklist[$scope.categoryCount].questionCount;
                        $scope.checklist[$scope.categoryCount].question[questionCount].name = questionValue.name;
                        $scope.checklist[$scope.categoryCount].question[questionCount].ID = questionValue.ID;
                        $scope.checklist[$scope.categoryCount].question[questionCount].type = questionValue.type;
                        $scope.$apply();
                    }); //end of angular.forEach()
                } else {
                    $scope.notify("category-not-found","danger"); /* edit */
                } //end of if()
            }).catch(function(error) {
                if (error.code === "PERMISSION_DENIED") {
                    $scope.notify("auth/no-access-permission", "danger"); /* edit */
                }
            }); //end of firebase.database().ref()
        }); //end of angular.forEach()
    }; //end of $scope.refreshChecklist()
    
}]);
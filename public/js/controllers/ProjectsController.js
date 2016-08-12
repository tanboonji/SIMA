app.controller('ProjectsController', ['$routeParams', '$scope', '$location', '$firebaseAuth', '$firebaseObject', 
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
	});
        
    $scope.logout = function() {
        $scope.auth.$signOut();
    }
	
	var ref = firebase.database().ref().child("project");
	$scope.projectsList = $firebaseArray(ref);
	
	$scope.sortByList = ['Not Deleted', 'Deleted'];
	$scope.sortByItem = 'Not Deleted';
	
	$scope.sortByItemSelected = function(itemSelected) {
		$scope.sortByItem = itemSelected;
	};
	
	$scope.goToAddProject = function() {
		$location.path('/add-project');
	};
        
    $scope.goToProjects = function() {
        $location.path('/projects');
    }
    
    /***** List *****/
    
    if ($routeParams.add !== undefined) {
        $scope.notify("Successfully added \"" +$routeParams.add + "\" project","success");
    }
        
    if ($routeParams.edit !== undefined) {
        $scope.notify("Successfully saved \"" +$routeParams.edit + "\" project","success");
    }
        
    /***** Magic Suggest *****/
    
    $scope.staffList = [];
        
    firebase.database().ref('staff/').once('value').then(function (snapshot) {

        snapshot.forEach(function(staffValue) {
            $scope.staffList.push("(" + staffValue.val().ID + ") " + staffValue.val().name);
        });
        
        $scope.BUH = $('#magicsuggestBUH').magicSuggest({
            allowFreeEntries: false,
            data: $scope.staffList,
            highlight: false,
            placeholder: "Enter project BUH",
            maxSelection: 1
        });
        $scope.TM = $('#magicsuggestTM').magicSuggest({
            allowFreeEntries: false,
            data: $scope.staffList,
            highlight: false,
            placeholder: "Enter project TM",
            maxSelection: 1
        });
        $scope.CM = $('#magicsuggestCM').magicSuggest({
            allowFreeEntries: false,
            data: $scope.staffList,
            highlight: false,
            placeholder: "Enter project CM",
            maxSelection: 1
        });
    }); //end of firebase.database().ref()
        
    /***** Checklist *****/
    
    $scope.frequencyList = ["Daily","Weekly","Monthly","Quarterly","Yearly"];
        
    $scope.frequencyItemSelected = function(facility, frequency) {
        facility.frequency = frequency;
    }
    
    $scope.addCategory = function(facility) {
        facility.categoryCount++;
        var newQuestion = {name:"", formID:0, no:"a", type:"MCQ"};
        var newCategory = {name:"", formID:facility.categoryCount, no:facility.categoryCount+1,
            questionCount:0, question:[newQuestion]};
        facility.checklist.push(newCategory);
    }; //end of $scope.addCategory()
    
    $scope.addQuestion = function(category) {
        category.questionCount++;
        var questionNo = 'abcdefghijklmnopqrstuvwxyz'[category.questionCount];
        var newQuestion = {name:"", formID:category.questionCount, no:questionNo, type:"MCQ"};
        category.question.push(newQuestion);
    }; //end of $scope.addQuestion()
    
    $scope.deleteCategory = function(facility, category) {
        if (facility.categoryCount !== 0) {
            facility.categoryCount--;
            var index = facility.checklist.indexOf(category);
            facility.checklist.splice(index, 1);
            
            for(index; index < facility.checklist.length; index++) {
                facility.checklist[index].formID = index;
                facility.checklist[index].no = index+1;
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
        
    $scope.deleteFacility = function(facility) {
        console.log(facility.name);
        $scope.facilityList.unshift({name:facility.name});
        var index = $scope.facilityAddedList.indexOf(facility);
        $scope.facilityAddedList.splice(index,1);
    }
    
    $scope.moveFacility = function(facility) {
        $scope.addFacilityToAddedList(facility.name);
        var index = $scope.facilityList.map(function(x) {return x.name}).indexOf(facility.name);
        $scope.facilityList.splice(index,1);
    }
        
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
        
    var dragAndDrop = {
        init: function () {
            this.dragula();
            this.eventListeners();
        },
        eventListeners: function () {
            this.dragula.on('drop', this.dropped.bind(this));
        },
        dragula: function () {
            this.dragula = dragula([document.querySelector('#left'), document.querySelector('#right')],
            {
                revertOnSpill: true,
            });
        },
        dropped: function (el, source, target) {
            if (source.id === "right" && target.id === "left") {
                $scope.addFacilityToAddedList(el.id);
                var index = $scope.facilityList.map(function(x) {return x.name}).indexOf(el.id);
                $scope.facilityList.splice(index,1);
                el.remove();
                $scope.$apply();
            } else if (source.id === "left" && target.id === "right") {
                $scope.facilityList.unshift({name:el.id});
                var index = $scope.facilityAddedList.map(function(x) {return x.name}).indexOf(el.id);
                $scope.facilityAddedList.splice(index,1);
                el.remove();
                $scope.$apply();
            }
        }
    };

    dragAndDrop.init();
        
    /***** Add *****/

    $scope.facilityAddedList = [];
        
    var ref = firebase.database().ref().child("facility");
    
    $scope.refreshFacilityList = function() {
        firebase.database().ref('facility').once('value').then(function (snapshot, error) {
            var tempList = [];
            angular.forEach(snapshot.val(), function(facilityValue, key) {
                var tempFacility = facilityValue;
                tempList.push(facilityValue);
            });
            $scope.facilityList = tempList;
            angular.forEach($scope.facilityList, function(facilityValue, key) {
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
    
    ref.on('value', function() {
        $scope.refreshFacilityList();
    });
        
    $scope.addFacilityToAddedList = function(facilityName) {
        $scope.facilityAddedList.unshift({name:facilityName,frequency:"--Frequency--"});
        
        firebase.database().ref("facility").orderByChild("name").equalTo(facilityName).once("value").then(function(snapshot) {
            if (snapshot.val() != null) {
                angular.forEach(snapshot.val(), function(facilityValue, key) {
                    $scope.facilityAddedList[0].ID = facilityValue.ID;
                    $scope.facilityAddedList[0].category = facilityValue.category;
                });
                $scope.facilityAddedList[0].categoryCount = -1;
                $scope.facilityAddedList[0].checklist = [{questionCount:-1, question:[]}];
                angular.forEach($scope.facilityAddedList[0].category, function(categoryID, key) {
                    firebase.database().ref("category/" + categoryID).once("value").then(function(snapshot) {
                        if (snapshot.val() != null) {
                            $scope.facilityAddedList[0].categoryCount++;
                            var categoryCount = $scope.facilityAddedList[0].categoryCount;
                            $scope.facilityAddedList[0].checklist[categoryCount].name = snapshot.val().name;
                            $scope.facilityAddedList[0].checklist[categoryCount].ID = snapshot.val().ID;
                            $scope.facilityAddedList[0].checklist[categoryCount].no = categoryCount+1;
                            $scope.facilityAddedList[0].checklist[categoryCount].formID = categoryCount;

                            angular.forEach(snapshot.val().question, function(questionValue, key) {
                                $scope.facilityAddedList[0].checklist[categoryCount].question.push({});
                                $scope.facilityAddedList[0].checklist[categoryCount].questionCount++;
                                var questionCount = $scope.facilityAddedList[0].checklist[categoryCount].questionCount;
                                var questionNo = 'abcdefghijklmnopqrstuvwxyz'[questionCount];
                                $scope.facilityAddedList[0].checklist[categoryCount].question[questionCount].formID = questionCount;
                                $scope.facilityAddedList[0].checklist[categoryCount].question[questionCount].no = questionNo;
                                $scope.facilityAddedList[0].checklist[categoryCount].question[questionCount].name = questionValue.name;
                                $scope.facilityAddedList[0].checklist[categoryCount].question[questionCount].ID = questionValue.ID;
                                $scope.facilityAddedList[0].checklist[categoryCount].question[questionCount].type = questionValue.type;
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
            }
        }).catch(function(error) {
            if (error.code === "PERMISSION_DENIED") {
                $scope.notify("auth/no-access-permission", "danger"); /* edit */
            }
        }); //end of firebase.database().ref()
    }; //end of $scope.viewFacility()
    
    $scope.validateProject = function() {
        
        if ($scope.name === undefined) {
            $scope.projectNameEmpty = true;
            $scope.projectAddressEmpty = false;
            $scope.projectBUHEmpty = false;
            $scope.projectTMEmpty = false;
            $scope.projectCMEmpty = false;
            $scope.checklistEmpty = false;
            angular.forEach($scope.facilityAddedList, function(facilityValue, key) {
                facilityValue.error = false;
                angular.forEach(facilityValue.checklist, function(categoryValue, key) {
                    categoryValue.error = false;
                }); //end of angular.forEach()
            }); //end of angular.forEach()
        } else if ($scope.address === undefined) {
            $scope.projectNameEmpty = false;
            $scope.projectAddressEmpty = true;
            $scope.projectBUHEmpty = false;
            $scope.projectTMEmpty = false;
            $scope.projectCMEmpty = false;
            $scope.checklistEmpty = false;
            angular.forEach($scope.facilityAddedList, function(facilityValue, key) {
                facilityValue.error = false;
                angular.forEach(facilityValue.checklist, function(categoryValue, key) {
                    categoryValue.error = false;
                }); //end of angular.forEach()
            }); //end of angular.forEach()
        } else if ($scope.BUH.getValue().length === 0) {
            $scope.projectNameEmpty = false;
            $scope.projectAddressEmpty = false;
            $scope.projectBUHEmpty = true;
            $scope.projectTMEmpty = false;
            $scope.projectCMEmpty = false;
            $scope.checklistEmpty = false;
            angular.forEach($scope.facilityAddedList, function(facilityValue, key) {
                facilityValue.error = false;
                angular.forEach(facilityValue.checklist, function(categoryValue, key) {
                    categoryValue.error = false;
                }); //end of angular.forEach()
            }); //end of angular.forEach()
        } else if ($scope.TM.getValue().length === 0) {
            $scope.projectNameEmpty = false;
            $scope.projectAddressEmpty = false;
            $scope.projectBUHEmpty = false;
            $scope.projectTMEmpty = true;
            $scope.projectCMEmpty = false;
            $scope.checklistEmpty = false;
            angular.forEach($scope.facilityAddedList, function(facilityValue, key) {
                facilityValue.error = false;
                angular.forEach(facilityValue.checklist, function(categoryValue, key) {
                    categoryValue.error = false;
                }); //end of angular.forEach()
            }); //end of angular.forEach()
        } else if ($scope.CM.getValue().length === 0) {
            $scope.projectNameEmpty = false;
            $scope.projectAddressEmpty = false;
            $scope.projectBUHEmpty = false;
            $scope.projectTMEmpty = false;
            $scope.projectCMEmpty = true;
            $scope.checklistEmpty = false;
            angular.forEach($scope.facilityAddedList, function(facilityValue, key) {
                facilityValue.error = false;
                angular.forEach(facilityValue.checklist, function(categoryValue, key) {
                    categoryValue.error = false;
                }); //end of angular.forEach()
            }); //end of angular.forEach()
        } else {
            var error = false;
            $scope.projectNameEmpty = false;
            $scope.projectAddressEmpty = false;
            $scope.projectBUHEmpty = false;
            $scope.projectTMEmpty = false;
            $scope.projectCMEmpty = false;
            $scope.checklistEmpty = false;
            angular.forEach($scope.facilityAddedList, function(facilityValue, key) {
                facilityValue.error = false;
                angular.forEach(facilityValue.checklist, function(categoryValue, key) {
                    categoryValue.error = false;
                }); //end of angular.forEach()
            }); //end of angular.forEach()
            
            angular.forEach($scope.facilityAddedList, function(facilityValue, key) {
                if (!error) {
                    if (facilityValue.frequency === "--Frequency--") {
                        $scope.checklistEmpty = true;
                        facilityValue.error = true;
                        error = true;
                    } else {
                        angular.forEach(facilityValue.checklist, function(categoryValue, key) {
                            if (!error) {
                                if (categoryValue.name === undefined || categoryValue.name === "") {
                                    $scope.checklistEmpty = true;
                                    categoryValue.error = true;
                                    error = true;
                                } else {
                                    angular.forEach(categoryValue.question, function(questionValue, key) {
                                        if (!error) {
                                            if (questionValue.name === undefined || questionValue.name === "") {
                                                $scope.checklistEmpty = true;
                                                categoryValue.error = true;
                                                error = true;
                                            }
                                        }
                                    }); //end of angular.forEach()
                                }
                            }
                        }); //end of angular.forEach()
                    }
                }
            }); //end of angular.forEach()
            
            if (!error) {
                var BUH = $scope.BUH.getValue()[0];
                $scope.BUHName = BUH.substr(8,BUH.length-1);
                $scope.BUHID = BUH.substr(1,5);
                var TM = $scope.TM.getValue()[0];
                $scope.TMName = TM.substr(8,TM.length-1);
                $scope.TMID = TM.substr(1,5);
                var CM = $scope.CM.getValue()[0];
                $scope.CMName = CM.substr(8,CM.length-1);
                $scope.CMID = CM.substr(1,5);
                $scope.addProject();
            }
        } //end of else
    } //end of $scope.validateProject()
        
    $scope.addProject = function() {
        $scope.projectFacilityAdded = [];
        $scope.categoryAdded = [];

        firebase.database().ref('count').once('value').then(function (snapshot, error) {
            if (snapshot.val() !== null) {

                $scope.questionAlphabet = snapshot.val().questionCount.alphabet;
                $scope.categoryAlphabet = snapshot.val().categoryCount.alphabet;
                $scope.projectAlphabet = snapshot.val().projectCount.alphabet;
                $scope.projectFacilityAlphabet = snapshot.val().projectFacilityCount.alphabet;
                $scope.questionCount = snapshot.val().questionCount.count;
                $scope.categoryCount = snapshot.val().categoryCount.count;
                $scope.projectCount = snapshot.val().projectCount.count;
                $scope.projectFacilityCount = snapshot.val().projectFacilityCount.count;

                $scope.projectCount++;
                $scope.projectFacilityCount++;

                angular.forEach($scope.facilityAddedList, function(facilityValue, key) {
                    angular.forEach(facilityValue.checklist, function(categoryValue, key) {
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

                    $scope.projectFacilityCount++;
                    $scope.projectFacilityAdded.push($scope.projectFacilityAlphabet + $scope.projectFacilityCount);

                    firebase.database().ref('projectfacility/' + $scope.projectFacilityAlphabet + $scope.projectFacilityCount).set({
                            frequency: facilityValue.frequency,
                            name: facilityValue.name,
                            ID: $scope.projectFacilityAlphabet + $scope.projectFacilityCount,
                            projectID: $scope.projectAlphabet + $scope.projectCount
                    }).then(function() {
                        firebase.database().ref('count/projectFacilityCount').set({
                            count: $scope.projectFacilityCount,
                            alphabet: $scope.projectFacilityAlphabet
                        });
                    }).catch(function(error) {
                        console.log(error);
                        if (error.code === "PERMISSION_DENIED") {
                            $scope.notify("auth/no-access-permission", "danger"); /* edit */
                        }
                    }); //end of firebase.database().ref() //for projectFacility details

                    angular.forEach($scope.categoryAdded, function(categoryValue, key) {
                        firebase.database().ref('projectfacility/' + $scope.projectFacilityAlphabet + $scope.projectFacilityCount 
                                + '/category/' + categoryValue).set(categoryValue)
                        .then(function() {
                            //do nothing
                        }).catch(function(error) {
                            if (error.code === "PERMISSION_DENIED") {
                                $scope.notify("auth/no-access-permission","danger"); /* edit */
                            }
                        }); //end of firebase.database().ref()
                    }); //end of angular.forEach() //for categoryAdded in each projectFacility
                    $scope.categoryAdded = [];
                }); //end of angular.forEach() //for projectFacility

                if ($scope.MCSTS === undefined)
                    $scope.MCSTS = "";
                
                firebase.database().ref('project/' + $scope.projectAlphabet + $scope.projectCount).set({
                    name: $scope.name,
                    ID: $scope.projectAlphabet + $scope.projectCount,
                    BUH: $scope.BUHID,
                    BUHName: $scope.BUHName,
                    TM: $scope.TMID,
                    TMName: $scope.TMName,
                    CM: $scope.CMID,
                    CMName: $scope.CMName,
                    address: $scope.address,
                    MCSTS: $scope.MCSTS
                }).then(function() {
                    firebase.database().ref('count/projectCount').set({
                        count: $scope.projectCount,
                        alphabet: $scope.projectAlphabet
                    });

                    var error = false;

                    angular.forEach($scope.projectFacilityAdded, function(projectFacilityValue, key) {
                        firebase.database().ref('project/' + $scope.projectAlphabet + $scope.projectCount + 
                            '/projectFacility/' + projectFacilityValue)
                            .set(projectFacilityValue)
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
                        $location.path("/projects").search("add",$scope.name);
                        $route.reload();
                    }

                }).catch(function(error) {
                    console.log(error);
                    if (error.code === "PERMISSION_DENIED") {
                        $scope.notify("auth/no-access-permission", "danger"); /* edit */
                    }
                }); //end of firebase.database().ref
                
            } else {
                $scope.notify("auth/count-does-not-exist", "danger"); /* edit */
            } //end of if()
        }).catch(function(error) {
            if (error.code === "PERMISSION_DENIED") {
                $scope.notify("auth/no-access-permission", "danger"); /* edit */
            }
        }); //end of firebase.database().ref()
    }
    
    /***** Search & Filter *****/
    
    $scope.search = function(p) {
    return (angular.lowercase(p.name).indexOf(angular.lowercase($scope.query) || '') !== -1 ||
            angular.lowercase(p.MCSTS).toString().indexOf(angular.lowercase($scope.query) || '') !== -1 ||
            angular.lowercase(p.BUHName).indexOf(angular.lowercase($scope.query) || '') !== -1 ||
            angular.lowercase(p.TMName).indexOf(angular.lowercase($scope.query) || '') !== -1 ||
            angular.lowercase(p.CMName).indexOf(angular.lowercase($scope.query) || '') !== -1);
    }
    
    $scope.isdeleted = function(p) {
        if ($scope.sortByItem === 'Not Deleted')
            return (!p.deleted);
        else
            return (p.deleted);
    }
    
    /***** View *****/
        
    $scope.overlay = false;
    
    $scope.closeOverlay = function() {
        $scope.overlay = false;
    };
        
    $scope.viewProject = function(project) {
        $scope.overlay = true;
        $scope.project = project;
//        $scope.checklist = [];
//        $scope.categoryCount = -1;
        
        if ($scope.project.deletedAt !== undefined) {
            $scope.projectDeleted = true;
        } else {
            $scope.projectDeleted = false;
        }
        
//        angular.forEach($scope.facility.category, function(categoryID, key) {
//            firebase.database().ref("category/" + categoryID).once("value").then(function(snapshot) {
//                if (snapshot.val() != null) {
//                    $scope.addEmptyCategory();
//                    $scope.checklist[$scope.categoryCount].name = snapshot.val().name;
//                    $scope.checklist[$scope.categoryCount].ID = snapshot.val().ID;
//                    $scope.checklist[$scope.categoryCount].no = $scope.categoryCount+1;
//                    $scope.checklist[$scope.categoryCount].formID = $scope.categoryCount;
//
//                    angular.forEach(snapshot.val().question, function(questionValue, key) {
//                        $scope.addEmptyQuestion();
//                        var questionCount = $scope.checklist[$scope.categoryCount].questionCount;
//                        $scope.checklist[$scope.categoryCount].question[questionCount].name = questionValue.name;
//                        $scope.checklist[$scope.categoryCount].question[questionCount].ID = questionValue.ID;
//                        $scope.checklist[$scope.categoryCount].question[questionCount].type = questionValue.type;
//                        $scope.$apply();
//                    });
//                    
//                } else {
//                    $scope.notify("category-not-found","danger"); /* edit */
//                }
//            }).catch(function(error) {
//                if (error.code === "PERMISSION_DENIED") {
//                    $scope.notify("auth/no-access-permission", "danger"); /* edit */
//                }
//            }); //end of firebase.database().ref()
//        }); //end of angular.forEach()
    }; //end of $scope.viewFacility()
    
}]);
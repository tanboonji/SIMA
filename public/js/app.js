var app = angular.module('myApp', ['ngRoute', 'firebase', 'ngAnimate', 'ngFileUpload']);

app.config(function($routeProvider){
	$routeProvider
		.when('/login', {
			controller: 'LoginController',
			templateUrl: 'views/login.html'
		})
        .when('/login?:forget', {
			controller: 'LoginController',
			templateUrl: 'views/login.html'
		})
		.when('/forget-password', {
			controller: 'LoginController',
			templateUrl: 'views/forget-password.html'
		})
		.when('/dashboard', {
			controller: 'DashboardController',
			templateUrl: 'views/dashboard.html'
		})
		.when('/projects', {
			controller: 'ProjectsController',
			templateUrl: 'views/projects.html'
		})
		.when('/add-project', {
			controller: 'ProjectsController',
			templateUrl: 'views/add-project.html'
		})
		.when('/staff', {
			controller: 'StaffController',
			templateUrl: 'views/staff.html'
		})
		.when('/facilities', {
			controller: 'FacilitiesController',
			templateUrl: 'views/facilities.html'
		})
		.when('/add-facility', {
			controller: 'FacilitiesController',
			templateUrl: 'views/add-facility.html'
		})
		.when('/edit-facility', {
			controller: 'FacilitiesController',
			templateUrl: 'views/edit-facility.html'
		})
		.when('/edit-facility?:facilityID', {
			controller: 'FacilitiesController',
			templateUrl: 'views/edit-facility.html'
		})
		.otherwise({
			redirectTo: '/login'
		});
});

app.constant("firebase_url", "https://kfpam-sima.firebaseio.com");
var app = angular.module('myApp', ['ngRoute', 'firebase', 'ngAnimate', 'ngFileUpload']);

app.config(function($routeProvider){
	$routeProvider
		.when('/login', {
			controller: 'LoginController',
			templateUrl: 'views/login.html'
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
		.when('/facilities?:error&:id', {
			controller: 'FacilitiesController',
			templateUrl: 'views/facilities.html'
		})
		.when('/add-facility', {
			controller: 'FacilitiesController',
			templateUrl: 'views/add-facility.html'
		})
		.when('/edit-facility', {
			controller: 'EditFacilitiesController',
			templateUrl: 'views/edit-facility.html'
		})
		.when('/logout', {
			controller: 'LogoutController',
			templateUrl: 'views/logout.html'
		})
		.otherwise({
			redirectTo: '/login'
		});
});

app.constant("firebase_url", "https://kfpam-sima.firebaseio.com");
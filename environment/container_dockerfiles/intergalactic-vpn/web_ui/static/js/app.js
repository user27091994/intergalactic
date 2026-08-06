var app = angular.module('myApp', ['ngRoute']);

app.config(function($routeProvider) {
  $routeProvider
    .when('/login', {
      templateUrl: '/static/views/login.html',
      controller: 'LoginController'
    })
    .when('/settings', {
      templateUrl: '/static/views/settings.html',
      controller: 'SettingsController'
    })
    .when('/statistics', {
      templateUrl: '/static/views/statistics.html',
      controller: 'StatisticsController'
    })
    .when('/clients', {
      templateUrl: '/static/views/clients.html',
      controller: 'ClientsController'
    })
    .when('/add_client', {
      templateUrl: '/static/views/add_client.html',
      controller: 'AddClientController'
    })
    .otherwise({
      templateUrl: '/static/views/main.html',
      controller: 'MainController'
    });
});

app.controller('LoginController', function($scope, $rootScope, $http, $location) {
  $scope.user = {};
  $scope.login = function() {
    $http.post('/api/login', $scope.user)
      .then(function(response) {
        if(response.data.success) {
          // Set shared login status immediately
          $rootScope.isLoggedIn = true;
          $location.path('/add_client');
        } else {
          $scope.error = response.data.message;
        }
      }, function(error) {
        $scope.error = error.data.message || "Login failed";
      });
  };
});


app.controller('MainController', function($scope, $http, $location) {
//  $http.get('/api/user').then(function(response) {
//    if(!response.data.user) {
//      $location.path('/login');
//    } else {
//      $scope.username = response.data.user;
//    }
//  });
});


// TopBarController for fixed top navigation with logout functionality
app.controller('TopBarController', function($scope, $rootScope, $http, $location) {
  // Initialize isLoggedIn from $rootScope
  $scope.isLoggedIn = $rootScope.isLoggedIn || false;

  // Watch for changes in $rootScope.isLoggedIn and update local scope
  $rootScope.$watch('isLoggedIn', function(newValue) {
    $scope.isLoggedIn = newValue;
  });

  // Check the user session on controller load
  $http.get('/api/user').then(function(response) {
    if (response.data.user) {
      $rootScope.isLoggedIn = true;
    } else {
      $rootScope.isLoggedIn = false;
    }
  }, function(error) {
    $rootScope.isLoggedIn = false;
  });

  $scope.logout = function() {
    $http.get('/api/logout').then(function(response) {
      $rootScope.isLoggedIn = false;
      $location.path('/login');
    }, function(error) {
      console.error("Logout error:", error);
    });
  };
});



app.controller('StatisticsController', function($scope, $http, $interval) {
  // Default refresh period (milliseconds)
  $scope.refreshPeriod = 5000;
  $scope.statistics = {};
  $scope.error = '';

  // Function to load statistics from the backend
  function loadStatistics() {
    $http.get('/api/statistics').then(function(response) {
      if (response.data.success) {
        $scope.statistics = response.data.statistics;
        $scope.error = '';
      } else {
        $scope.error = response.data.message;
      }
    }, function(error) {
      $scope.error = error.data.message || "Failed to load statistics";
    });
  }

  // Initial load
  loadStatistics();

  // Set up periodic refresh
  var refreshInterval = $interval(loadStatistics, $scope.refreshPeriod);

  // Function to manually refresh statistics
  $scope.refresh = function() {
    loadStatistics();
  };

  // Allow changing the refresh period dynamically
  $scope.updateRefreshPeriod = function() {
    if (refreshInterval) {
      $interval.cancel(refreshInterval);
    }
    refreshInterval = $interval(loadStatistics, $scope.refreshPeriod);
  };

  // Cancel the interval when the controller is destroyed
  $scope.$on('$destroy', function() {
    if (refreshInterval) {
      $interval.cancel(refreshInterval);
    }
  });
});


app.controller('ClientsController', function($scope, $http, $interval) {
  // Default refresh period (in milliseconds)
  $scope.refreshPeriod = 5000;
  $scope.clients = [];
  $scope.error = '';

  // Function to load connected clients from the backend
  function loadClients() {
    $http.get('/api/clients').then(function(response) {
      if (response.data.success) {
        $scope.clients = response.data.clients;
        $scope.error = '';
      } else {
        $scope.error = response.data.message;
      }
    }, function(error) {
      $scope.error = error.data.message || "Failed to load clients";
    });
  }

  // Initial load
  loadClients();

  // Set up periodic refresh using $interval
  var refreshInterval = $interval(loadClients, $scope.refreshPeriod);

  // Manual refresh function
  $scope.refresh = function() {
    loadClients();
  };

  // Update refresh period dynamically
  $scope.updateRefreshPeriod = function() {
    if (refreshInterval) {
      $interval.cancel(refreshInterval);
    }
    refreshInterval = $interval(loadClients, $scope.refreshPeriod);
  };

  // Cancel the interval when the controller is destroyed
  $scope.$on('$destroy', function() {
    if (refreshInterval) {
      $interval.cancel(refreshInterval);
    }
  });
});


app.controller('AddClientController', function($scope, $http, $location) {
  $http.get('/api/user').then(function(response) {
    if(!response.data.user) {
      $location.path('/login');
    } else {
      $scope.username = response.data.user;
    }
  });

  $scope.clientName = "";
  $scope.error = "";
  $scope.message = "";

  $scope.addClient = function() {
    if (!$scope.clientName) {
      $scope.error = "Client name is required.";
      return;
    }

    $http.post('/api/add_client', { client_name: $scope.clientName }, { responseType: 'arraybuffer' })
      .then(function(response) {
        // Create a Blob from the response data
        var blob = new Blob([response.data], { type: response.headers('Content-Type') });
        // Extract filename from the Content-Disposition header if provided
        var disposition = response.headers('Content-Disposition') || "";

        if (disposition && disposition.indexOf("filename=") !== -1) {
          var filename = disposition.split("filename=")[1].trim().replace(/"/g, '');
        } else {
            var filename = filenameMatch ? filenameMatch[1] : "download.txt";
        }

        // Create a temporary link element to trigger download
        var link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        $scope.error = "";
        $scope.message = "Client added successfully; file download should begin.";
      }, function(error) {
        // Display error message in red
        $scope.error = (error.data && error.data.message) || "Failed to add client.";
        $scope.message = "";
        if (error.status === 401) {
          $location.path('/login');
        }
      });
  };
});

'use strict'; 
let app = angular.module('appSPG', ['ui.router', 'ui.bootstrap'])

app.constant('settings', {
	baseservice: 'https://api.spotify.com/v1/',
	clientId: 'feb48bf632e846b88e881da5fbd28822'
})

app.config(['$stateProvider', '$urlRouterProvider', '$locationProvider', ($stateProvider, $urlRouterProvider, $locationProvider) => {
	$stateProvider
	.state('home', {
		url: '/',
		templateUrl: 'app/modules/home/home.html',
		controller:   'HomeCtrl'
	})
	$locationProvider.html5Mode(true)
}]);
( () => {
	app.controller('HomeCtrl', homeCtrl)
	homeCtrl.$inject = ['$scope', '$state', 'HomeServices', '$q', '$sce']
		

	function homeCtrl($scope, $state, HomeServices, $q, $sce){

		$scope.searchParams = ''
		$scope.artistsId = []
		$scope.albumsIDs = []
		$scope.tracksIDs = []
		$scope.baseUrl = 'https://embed.spotify.com/?theme=white&uri=spotify:trackset:MyPlayList:'
		$scope.showPlaylist = false
		$scope.iframeUrl = {url: ''}
		$scope.search = () => {
			let artists = $scope.searchParams.split(",")
			let Ids = artists.map( artistName => HomeServices.getArtist(artistName).then( response => {
					$scope.artistsId.push(response.artists.items[0].id)
			}))	
			return $q.all(Ids).then( response => {
				$scope.getAlbums()
			})
		}

		$scope.getAlbums = () => {
			let Albums = $scope.artistsId.map( artistsAlbums => HomeServices.getArtistsAlbums(artistsAlbums).then( response => {
						$scope.albumsIDs.push(response.items)

			}))
			return $q.all(Albums).then( response => {
				$scope.getTracks($scope.albumsIDs.reduce((prev, curr) => [...prev,...curr], []))
				// console.log($scope.albumsIDs.reduce((prev, curr) => [...prev,...curr], []))
			})
		}

		$scope.getTracks = (data) => {
			let Tracks = data.map(tracksId => HomeServices.getAlbumTracks(tracksId.id).then( response => {
						$scope.tracksIDs.push(response.items)
			}))
			return $q.all(Tracks).then( response => {
				$scope.getSonsgs($scope.tracksIDs.reduce((prev, curr) => [...prev,...curr], []))
				// console.log($scope.tracksIDs.reduce((prev, curr) => [...prev,...curr], []))
			})
		}

		$scope.getSonsgs = (data) => {
			let Songs = data.map(songsId => songsId.id)
			let randomTracks= $scope.getRandomTracks(50, Songs)
			$scope.createPlayList(randomTracks)
		}

		$scope.getRandomTracks = (num, tracks) => {
			const randomResult = []
			for (var i = 0; i < num; i++) {
				randomResult.push(tracks[Math.floor(Math.random() * tracks.length)])
			}
			return randomResult
		}

		$scope.createPlayList = data => {

			let song = data.join(',')
			 $scope.showPlaylist = true
			 $scope.iframeUrl.url = $scope.baseUrl + song
			 console.log($scope.iframeUrl.url)

		}
		
		$scope.trustSrc = (src) => {
    		return $sce.trustAsResourceUrl(src);
  		}
	}
})();
( () => {
	app.service('HomeServices', homeServices)
	homeServices.$inject = ['$http', 'settings']

	function homeServices($http, settings) {
		let url = 'https://api.spotify.com/v1/'
		
		this.getArtist = param => {
			let urlGetID = url +'search?q='+ param + '&type=artist'	
			return $http.get(urlGetID).then( response => {
				return response.data
			})
		}
		this.getArtistsAlbums = param => {
			let urlGetAlbums = url + 'artists/' + param + '/albums'
			return $http.get(urlGetAlbums).then( response => {
				return response.data
			})
		}
		this.getAlbumTracks = params => {
			let urlGetTracks = url + 'albums/' + params + '/tracks'
			return $http.get(urlGetTracks).then( response =>{
				return response.data
			})
		}

	} 
})();
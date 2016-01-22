var app = angular.module('ceece-simon', []);

app.controller('SimonCtrl', ['$scope', '$timeout', '$window', function($scope, $timeout, window){

	$scope.__on = false;
	$scope.__restrict = false;
	$scope.__pattern = [];
	$scope.__answer = [];
	$scope.__pushingAt = null;
	$scope.__playerPhase = false;

	$scope.powerSwitch = function() {
		$scope.__on = !$scope.__on;
	};

	$scope.isOn = function () {
		return $scope.__on;
	};

	$scope.displayPattern = function(index) {
		if (!$scope.isOn())
			return;
		index = index || 0;
		$scope.__playerPhase = false
		$scope.__pushingAt = $scope.__pattern[index];
		$scope.audio.play($scope.__pushingAt);
		$timeout(function(){
			$scope.__pushingAt = null;
			$scope.audio.stop();
			$timeout(function(){
				if ($scope.__pattern[index + 1])
					$scope.displayPattern(index + 1);
				else
					$scope.__playerPhase = true;
			}, 500);
		}, 500);
	};

	$scope.isPushingAt = function(number) {
		return number == $scope.__pushingAt;
	}

	$scope.restart = function() {
		if ($scope.isOn()) {
			$timeout(function(){
				$scope.reset();
				$scope.generatePattern();
				$scope.displayPattern();
			}, 500);
		}
	}

	$scope.generatePattern = function() {
		$scope.__pattern.push( Math.floor((Math.random() * 4) + 1) );
	};

	$scope.isPlayerPhase = function() {
		return $scope.__playerPhase && $scope.isOn();
	};

	$scope.pushOn = function(number) {
		if ($scope.isOn() && $scope.isPlayerPhase()) {
			$scope.__answer.push(number);
			$scope.__pushingAt = number;
			if ( $scope.isAnswerWrong() ) {
				$scope.audio.playError();
			} else {
				$scope.audio.play(number);
			}
		}
	};

	$scope.release = function() {
		$scope.audio.stop();
		if ($scope.isOn() && $scope.isPlayerPhase()) {
			$scope.__pushingAt = null;

			if ( $scope.isAnswerWrong() || $scope.isAnswerRight() ) {
				$scope.__playerPhase = false;
				$timeout(function(){
					if ( $scope.isAnswerWrong() ) {
						if( $scope.isRestrict() ) {
							$scope.restart();
						} else {
							$scope.resetAnswer();
							$scope.displayPattern();
						}
					} else if ($scope.isAnswerRight()) {
						$scope.resetAnswer();
						$scope.generatePattern();
						$scope.displayPattern();
					}
				}, 1000);
			}
				
		}
	};

	$scope.isAnswerOkey = function() {
		var checkings = $scope.__answer.map(function(number, index) {
			return number == $scope.__pattern[index];
		});
		if (checkings.length)
			return checkings.reduce(function(a,b) { return a && b });
		else
			return true;
	}

	$scope.isAnswerWrong = function() {
		return !$scope.isAnswerOkey();
	};

	$scope.isAnswerRight = function() {
		return $scope.isAnswerOkey() && $scope.__answer.length == $scope.__pattern.length
	};

	$scope.resetAnswer = function() {
		$scope.__answer = [];
	}

	$scope.restrictSwitch = function() {
		if ($scope.isOn())
			$scope.__restrict = ! $scope.__restrict;
	};

	$scope.isRestrict = function() {
		return $scope.isOn() ? $scope.__restrict : false;
	};

	$scope.resetPattern = function() {
		$scope.__pattern = [];
	};

	$scope.count = function() {
		return $scope.isOn() ? $scope.__pattern.length : '';
	};

	$scope.reset = function() {
		$scope.resetPattern();
		$scope.resetAnswer();
	};

	var AudioContext = window.AudioContext || window.webkitAudioContext || false;
	
	if (AudioContext) {

		var audioCtx = new AudioContext();

		if(audioCtx.createOscillator && audioCtx.createGain) {
			var frequencies = [165, 262, 294, 330, 349];

			var oscillators = frequencies.map(function(frequency) {
				oscillator = audioCtx.createOscillator();
				oscillator.type = 'sine';
				oscillator.frequency.value = frequency;
				oscillator.start();
				return oscillator;
			});

			var nodes = oscillators.map(function(oscillator) {
				var node = audioCtx.createGain();
				node.gain.value = 0;
				node.connect(audioCtx.destination);
				oscillator.connect(node);
				return node;
			});

		}
		
	}

	$scope.audio = {
		playError: function() {
			this.play(0);
		},
		play: function(number) {
			if (AudioContext)
				nodes[number].gain.linearRampToValueAtTime(1, audioCtx.currentTime);
		},
		stop: function() {
			if (AudioContext)
				nodes.forEach(function(node) {
					node.gain.linearRampToValueAtTime(0, audioCtx.currentTime);
				});
		}
	};

	$scope.$watch('__on', function(on) {
		if (!on) {
			$scope.reset();
		}
	});
}]);